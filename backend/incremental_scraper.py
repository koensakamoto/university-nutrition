#!/usr/bin/env python3
"""
Incremental Menu Scraper - Smart gap-filling scraper

This script checks what dining hall meals have already been scraped for today
and only scrapes the missing ones. Ideal for running later in the day to
catch any meals that weren't available during the initial scrape.

Usage:
    python incremental_scraper.py [--dry-run] [--force-rescrape]
    
Options:
    --dry-run: Show what would be scraped without actually scraping
    --force-rescrape: Re-scrape all meals even if they already exist
"""

import os
import sys
import datetime
import logging
import argparse
from typing import Dict, List, Set, Tuple
from collections import defaultdict

# Import the existing scraper components
from menu_scraper import DiningHallScraper

# Try to import required packages with fallback
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        pass

try:
    from pymongo.mongo_client import MongoClient
    from pymongo.server_api import ServerApi
    import certifi
    MONGODB_AVAILABLE = True
except ImportError:
    print("Warning: MongoDB packages not available. Install with: pip install pymongo certifi")
    MONGODB_AVAILABLE = False


class IncrementalMenuScraper:
    """Smart scraper that only fills gaps in today's menu data."""
    
    def __init__(self, mongodb_uri: str, target_url: str, headless: bool = True, dry_run: bool = False):
        if not MONGODB_AVAILABLE:
            raise RuntimeError("MongoDB packages not available. Please install pymongo and certifi.")
            
        self.mongodb_uri = mongodb_uri
        self.target_url = target_url
        self.headless = headless
        self.dry_run = dry_run
        self.today = datetime.date.today().isoformat()
        
        # Setup logging
        self._setup_logging()
        
        # MongoDB connection
        self.client = MongoClient(mongodb_uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
        self.db = self.client["nutritionapp"]
        self.foods_collection = self.db["foods"]
        
        # Initialize the base scraper (will be created when needed)
        self.scraper = None
        
    def _setup_logging(self):
        """Configure logging for incremental scraper."""
        log_format = "%(asctime)s [%(levelname)s] %(message)s"
        
        # Create logs directory if it doesn't exist
        os.makedirs("logs", exist_ok=True)
        
        # Setup file handler
        file_handler = logging.FileHandler(f"logs/incremental_scraper_{self.today}.log", mode="a")
        file_handler.setFormatter(logging.Formatter(log_format))
        
        # Setup console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(log_format))
        
        # Configure logger
        self.logger = logging.getLogger("incremental_scraper")
        self.logger.setLevel(logging.INFO)
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
        # Prevent duplicate logs
        self.logger.propagate = False
    
    def get_existing_meals(self) -> Dict[str, Set[str]]:
        """
        Get what dining hall meals already exist in the database for today.
        
        Returns:
            Dict mapping dining_hall -> set of meal_names that exist
        """
        try:
            # Query for distinct combinations of dining_hall and meal_name for today
            pipeline = [
                {"$match": {"date": self.today}},
                {"$group": {
                    "_id": {
                        "dining_hall": "$dining_hall",
                        "meal_name": "$meal_name"
                    },
                    "count": {"$sum": 1}
                }},
                {"$group": {
                    "_id": "$_id.dining_hall",
                    "meals": {"$addToSet": "$_id.meal_name"},
                    "total_items": {"$sum": "$count"}
                }}
            ]
            
            existing_data = defaultdict(set)
            total_items = 0
            
            for result in self.foods_collection.aggregate(pipeline):
                dining_hall = result["_id"]
                meals = set(result["meals"])
                items = result["total_items"]
                
                existing_data[dining_hall] = meals
                total_items += items
                
                self.logger.info(f"Found existing data: {dining_hall} - {len(meals)} meals, {items} items")
            
            self.logger.info(f"Total existing data: {len(existing_data)} dining halls, {total_items} items")
            return dict(existing_data)
            
        except Exception as e:
            self.logger.error(f"Error querying existing meals: {e}")
            return {}
    
    def get_available_dining_halls_and_meals(self) -> Dict[str, List[str]]:
        """
        Get all available dining halls and their meals from the website.
        
        Returns:
            Dict mapping dining_hall -> list of available meal_names
        """
        try:
            # Initialize scraper if not already done
            if not self.scraper:
                self.scraper = DiningHallScraper(
                    target_url=self.target_url,
                    mongodb_uri=self.mongodb_uri,
                    headless=self.headless,
                    max_retries=1  # Reduce retries for faster operation
                )
            
            # Setup driver and navigate to the site
            self.scraper.driver = self.scraper.setup_driver()
            if not self.scraper.is_driver_alive():
                raise RuntimeError("Failed to initialize driver")
            
            self.scraper.driver.get(self.target_url)
            self.scraper.human_wait(1, 2)
            
            # Get all dining hall names
            dining_hall_names = self.scraper._get_dining_hall_names()
            if not dining_hall_names:
                raise RuntimeError("No dining halls found on website")
            
            available_data = {}
            
            # Check each dining hall for available meals
            for dining_hall in dining_hall_names:
                try:
                    self.logger.info(f"Checking available meals for: {dining_hall}")
                    
                    # Select the dining hall
                    if not self.scraper._select_dining_hall(dining_hall):
                        self.logger.warning(f"Could not select dining hall: {dining_hall}")
                        continue
                    
                    # Get meal tabs
                    meal_tabs = self.scraper._get_meal_tabs()
                    if meal_tabs:
                        available_data[dining_hall] = meal_tabs
                        self.logger.info(f"  Available meals: {', '.join(meal_tabs)}")
                    else:
                        self.logger.warning(f"  No meals found for {dining_hall}")
                        available_data[dining_hall] = []
                        
                except Exception as e:
                    self.logger.warning(f"Error checking {dining_hall}: {e}")
                    available_data[dining_hall] = []
                    continue
            
            return available_data
            
        except Exception as e:
            self.logger.error(f"Error getting available dining halls and meals: {e}")
            return {}
        finally:
            # Clean up driver
            if self.scraper and self.scraper.driver:
                try:
                    self.scraper.driver.quit()
                except:
                    pass
                self.scraper.driver = None
    
    def find_missing_meals(self) -> List[Tuple[str, str]]:
        """
        Find which dining hall/meal combinations are missing from the database.
        
        Returns:
            List of (dining_hall, meal_name) tuples that need to be scraped
        """
        self.logger.info("=== ANALYZING MISSING MEALS ===")
        
        # Get what's already in the database
        existing_meals = self.get_existing_meals()
        
        # Get what's available on the website
        available_meals = self.get_available_dining_halls_and_meals()
        
        # Find the gaps
        missing_meals = []
        
        for dining_hall, available_meal_list in available_meals.items():
            existing_meal_set = existing_meals.get(dining_hall, set())
            
            for meal in available_meal_list:
                if meal not in existing_meal_set:
                    missing_meals.append((dining_hall, meal))
                    self.logger.info(f"MISSING: {dining_hall} - {meal}")
                else:
                    self.logger.debug(f"EXISTS: {dining_hall} - {meal}")
        
        self.logger.info(f"=== SUMMARY ===")
        self.logger.info(f"Total dining halls checked: {len(available_meals)}")
        self.logger.info(f"Dining halls with existing data: {len(existing_meals)}")
        self.logger.info(f"Missing meal combinations: {len(missing_meals)}")
        
        return missing_meals
    
    def scrape_missing_meals(self, missing_meals: List[Tuple[str, str]], force_rescrape: bool = False) -> bool:
        """
        Scrape only the missing dining hall/meal combinations.
        
        Args:
            missing_meals: List of (dining_hall, meal_name) tuples to scrape
            force_rescrape: If True, scrape even if meals already exist
            
        Returns:
            True if scraping was successful, False otherwise
        """
        if not missing_meals and not force_rescrape:
            self.logger.info("✓ No missing meals found - all data is up to date!")
            return True
        
        if self.dry_run:
            self.logger.info("=== DRY RUN MODE ===")
            self.logger.info("Would scrape the following meals:")
            for dining_hall, meal in missing_meals:
                self.logger.info(f"  - {dining_hall}: {meal}")
            return True
        
        self.logger.info(f"=== STARTING INCREMENTAL SCRAPE ===")
        self.logger.info(f"Scraping {len(missing_meals)} missing meal combinations")
        
        try:
            # Initialize the scraper
            self.scraper = DiningHallScraper(
                target_url=self.target_url,
                mongodb_uri=self.mongodb_uri,
                headless=self.headless,
                max_retries=1  # Reduce retries for faster operation
            )
            
            # Setup driver
            self.scraper.driver = self.scraper.setup_driver()
            if not self.scraper.is_driver_alive():
                raise RuntimeError("Failed to initialize driver")
            
            self.scraper.driver.get(self.target_url)
            self.scraper.human_wait(0.5, 1)  # Reduced initial wait
            
            # Group missing meals by dining hall for efficiency
            meals_by_hall = defaultdict(list)
            for dining_hall, meal in missing_meals:
                meals_by_hall[dining_hall].append(meal)
            
            # Scrape each dining hall's missing meals
            all_new_foods = []
            
            for i, (dining_hall, meals_to_scrape) in enumerate(meals_by_hall.items()):
                try:
                    self.logger.info(f"Processing {dining_hall}: {', '.join(meals_to_scrape)}")
                    
                    # Only navigate back to main page if not the first dining hall
                    if i > 0:
                        self.scraper.driver.get(self.target_url)
                        self.scraper.human_wait(0.3, 0.7)  # Faster navigation wait
                    
                    # Select dining hall
                    if not self.scraper._select_dining_hall(dining_hall):
                        self.logger.error(f"Could not select dining hall: {dining_hall}")
                        continue
                    
                    # Scrape each missing meal for this dining hall
                    for meal in meals_to_scrape:
                        try:
                            self.logger.info(f"  Scraping {meal}...")
                            
                            # Select the meal tab
                            if not self.scraper._select_meal_tab(meal):
                                self.logger.warning(f"  Could not select meal tab: {meal}")
                                continue
                            
                            # Extract menu data for this specific meal
                            menu_items = self.scraper.extract_menu_data(dining_hall, meal)
                            
                            if menu_items:
                                # Convert to the format expected by save_to_json
                                hall_data = {
                                    "name": dining_hall,
                                    "meals": [{
                                        "meal_name": meal,  # Fixed: use "meal_name" not "name"
                                        "stations": [{
                                            "name": "Main Menu",  # Default station name
                                            "items": menu_items
                                        }]
                                    }]
                                }
                                
                                # Convert to foods format and add to collection
                                foods_data = {
                                    "date": self.today,
                                    "dining_halls": [hall_data]
                                }
                                
                                new_foods = self.scraper.save_to_json(foods_data, filename=None)
                                all_new_foods.extend(new_foods)
                                
                                self.logger.info(f"  ✓ Scraped {len(menu_items)} items from {dining_hall} - {meal}")
                            else:
                                self.logger.warning(f"  ✗ No items found for {dining_hall} - {meal}")
                                
                        except Exception as e:
                            self.logger.error(f"  ✗ Error scraping {dining_hall} - {meal}: {e}")
                            continue
                    
                except Exception as e:
                    self.logger.error(f"Error processing dining hall {dining_hall}: {e}")
                    continue
            
            # Upload all new foods to MongoDB
            if all_new_foods:
                self.logger.info(f"Uploading {len(all_new_foods)} new food items to MongoDB...")
                
                # Insert in batches to avoid memory issues
                batch_size = 100
                success_count = 0
                
                for i in range(0, len(all_new_foods), batch_size):
                    batch = all_new_foods[i:i + batch_size]
                    try:
                        result = self.foods_collection.insert_many(batch, ordered=False)
                        success_count += len(result.inserted_ids)
                        self.logger.debug(f"Inserted batch {i//batch_size + 1}: {len(result.inserted_ids)} items")
                    except Exception as e:
                        self.logger.error(f"Error inserting batch {i//batch_size + 1}: {e}")
                
                self.logger.info(f"✓ Successfully uploaded {success_count}/{len(all_new_foods)} food items")
                return success_count > 0
            else:
                self.logger.warning("No new food items were scraped")
                return False
                
        except Exception as e:
            self.logger.error(f"Scraping failed: {e}")
            return False
        finally:
            # Clean up
            if self.scraper and self.scraper.driver:
                try:
                    self.scraper.driver.quit()
                except:
                    pass
    
    def run(self, force_rescrape: bool = False) -> bool:
        """
        Main execution method.
        
        Args:
            force_rescrape: If True, re-scrape all meals even if they exist
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.logger.info("=== INCREMENTAL SCRAPER STARTED ===")
            self.logger.info(f"Date: {self.today}")
            self.logger.info(f"Dry run mode: {self.dry_run}")
            self.logger.info(f"Force rescrape: {force_rescrape}")
            
            # Test MongoDB connection
            self.client.admin.command('ping')
            self.logger.info("✓ MongoDB connection successful")
            
            if force_rescrape:
                # Get all available meals and treat them as "missing"
                available_meals = self.get_available_dining_halls_and_meals()
                missing_meals = []
                for dining_hall, meal_list in available_meals.items():
                    for meal in meal_list:
                        missing_meals.append((dining_hall, meal))
                        
                self.logger.info(f"Force rescrape: treating all {len(missing_meals)} meals as missing")
            else:
                # Find actually missing meals
                missing_meals = self.find_missing_meals()
            
            # Scrape the missing meals
            success = self.scrape_missing_meals(missing_meals, force_rescrape)
            
            if success:
                self.logger.info("=== INCREMENTAL SCRAPER COMPLETED SUCCESSFULLY ===")
            else:
                self.logger.error("=== INCREMENTAL SCRAPER COMPLETED WITH ERRORS ===")
                
            return success
            
        except Exception as e:
            self.logger.error(f"Incremental scraper failed: {e}")
            return False
        finally:
            # Close MongoDB connection
            if hasattr(self, 'client'):
                self.client.close()


def main():
    """Main execution with command line argument parsing."""
    parser = argparse.ArgumentParser(
        description="Incremental menu scraper - only scrapes missing dining hall meals",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python incremental_scraper.py                    # Normal incremental scrape
    python incremental_scraper.py --dry-run         # Show what would be scraped
    python incremental_scraper.py --force-rescrape  # Re-scrape everything
        """
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be scraped without actually scraping"
    )
    
    parser.add_argument(
        "--force-rescrape",
        action="store_true", 
        help="Re-scrape all meals even if they already exist"
    )
    
    parser.add_argument(
        "--headless",
        action="store_true",
        default=True,
        help="Run browser in headless mode (default: True)"
    )
    
    args = parser.parse_args()
    
    # Load environment variables
    load_dotenv()
    
    # Configuration
    TARGET_URL = "https://dineoncampus.com/utah/whats-on-the-menu"
    MONGODB_URI = os.getenv("MONGODB_URI")
    
    if not MONGODB_URI:
        print("Error: MONGODB_URI environment variable not set")
        sys.exit(1)
    
    # Initialize and run the incremental scraper
    scraper = IncrementalMenuScraper(
        mongodb_uri=MONGODB_URI,
        target_url=TARGET_URL,
        headless=args.headless,
        dry_run=args.dry_run
    )
    
    try:
        success = scraper.run(force_rescrape=args.force_rescrape)
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()