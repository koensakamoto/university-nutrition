#!/usr/bin/env python3
"""
Incremental Scraper for Campus Nutrition App

This scraper analyzes what data already exists in MongoDB for today's date
and only scrapes missing meal combinations. It uses the exact same robust
scraping logic as the main scraper but targets only missing data.

Key Features:
- Smart detection of missing meals per dining hall
- Same crash recovery mechanisms as main scraper
- Proper data formatting (individual items, not stations)
- 3-tier retry logic with driver restart
- Comprehensive logging and error handling

Usage:
    python incremental_scraper.py                    # Normal run
    python incremental_scraper.py --dry-run         # Show what would be scraped
    python incremental_scraper.py --force-rescrape  # Rescrape everything
"""

import os
import sys
import datetime
import logging
import argparse
from typing import Dict, List, Set, Tuple, Any
from collections import defaultdict

# Import the existing scraper components
from menu_scraper import DiningHallScraper

# MongoDB imports
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configuration
TARGET_URL = "https://dining.utah.edu/menus/"
MONGODB_URI = os.getenv('MONGODB_URI')
MAX_RETRIES = 3
HEADLESS = True

class IncrementalScraper:
    """
    Scraper that only targets missing meal combinations for today.
    Uses the exact same extraction logic as the main scraper.
    """
    
    def __init__(self, target_url: str, mongodb_uri: str, headless: bool = True, dry_run: bool = False):
        self.target_url = target_url
        self.mongodb_uri = mongodb_uri
        self.headless = headless
        self.dry_run = dry_run
        self.today = datetime.date.today().isoformat()
        
        # Setup logging
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        # Clear any existing handlers
        self.logger.handlers.clear()
        
        # Create formatters
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
        
        # File handler
        file_handler = logging.FileHandler(f"{log_dir}/incremental_scraper_{self.today}.log")
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # Prevent duplicate logs
        self.logger.propagate = False
        
        # MongoDB connection
        self.client = None
        self.db = None
        self.foods_collection = None
        self.scraper = None
        
        # Connect to MongoDB
        if self.mongodb_uri:
            self.client = MongoClient(self.mongodb_uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
            self.db = self.client["nutritionapp"]
            self.foods_collection = self.db["foods"]
    
    def get_existing_data_for_today(self) -> Dict[str, Set[str]]:
        """
        Get existing meal combinations from MongoDB for today.
        Returns: {dining_hall: {meal1, meal2, ...}}
        """
        existing_combinations = defaultdict(set)
        
        if not self.foods_collection:
            return existing_combinations
        
        try:
            # Query for today's data
            cursor = self.foods_collection.find({"date": self.today})
            
            for doc in cursor:
                dining_hall = doc.get("dining_hall")
                meal_name = doc.get("meal_name")
                
                if dining_hall and meal_name:
                    existing_combinations[dining_hall].add(meal_name)
            
            # Log what we found
            total_halls = len(existing_combinations)
            total_items = sum(len(meals) for meals in existing_combinations.values())
            
            if existing_combinations:
                for hall, meals in existing_combinations.items():
                    self.logger.info(f"Found existing data: {hall} - {len(meals)} meals, {self._count_items_for_hall_today(hall)} items")
            
            self.logger.info(f"Total existing data: {total_halls} dining halls, {self._count_total_items_today()} items")
            
        except Exception as e:
            self.logger.error(f"Error querying existing data: {e}")
        
        return existing_combinations
    
    def _count_items_for_hall_today(self, dining_hall: str) -> int:
        """Count total items for a specific dining hall today."""
        try:
            return self.foods_collection.count_documents({
                "date": self.today,
                "dining_hall": dining_hall
            })
        except:
            return 0
    
    def _count_total_items_today(self) -> int:
        """Count total items for today."""
        try:
            return self.foods_collection.count_documents({"date": self.today})
        except:
            return 0
    
    def get_available_dining_halls_and_meals(self) -> Dict[str, List[str]]:
        """
        Get all available dining halls and their meals from the website.
        Returns: {dining_hall: [meal1, meal2, ...]}
        """
        available_meals = {}
        
        try:
            # Initialize temporary scraper just for discovery
            temp_scraper = DiningHallScraper(self.target_url, None, 1, headless=self.headless)
            temp_scraper.driver = temp_scraper.setup_driver()
            
            if not temp_scraper.is_driver_alive():
                self.logger.error("Failed to initialize driver for discovery")
                return available_meals
            
            temp_scraper.driver.get(self.target_url)
            temp_scraper.human_wait(2, 4)
            
            # Get dining hall names
            dining_hall_names = temp_scraper._get_dining_hall_names()
            self.logger.info(f"Found {len(dining_hall_names)} dining halls")
            
            # Check each dining hall for available meals
            for dining_hall in dining_hall_names:
                try:
                    self.logger.info(f"Checking available meals for: {dining_hall}")
                    
                    # Navigate back to main page
                    temp_scraper.driver.get(self.target_url)
                    temp_scraper.human_wait(1, 2)
                    
                    # Select dining hall
                    if temp_scraper._select_dining_hall(dining_hall):
                        # Get meal tabs
                        meal_tabs = temp_scraper._get_meal_tabs()
                        if meal_tabs:
                            available_meals[dining_hall] = meal_tabs
                            self.logger.info(f"  Available meals: {', '.join(meal_tabs)}")
                        else:
                            self.logger.warning(f"  No meal tabs found for {dining_hall}")
                    else:
                        self.logger.warning(f"Could not select dining hall: {dining_hall}")
                        
                except Exception as e:
                    self.logger.error(f"Error selecting dining hall {dining_hall}: {e}")
                    continue
            
            # Clean up
            if temp_scraper.driver:
                temp_scraper.driver.quit()
                
        except Exception as e:
            self.logger.error(f"Error getting available meals: {e}")
        
        return available_meals
    
    def find_missing_meals(self) -> List[Tuple[str, str]]:
        """
        Find missing meal combinations by comparing available vs existing.
        Returns: [(dining_hall, meal), ...]
        """
        self.logger.info("=== ANALYZING MISSING MEALS ===")
        
        # Get existing data
        existing_combinations = self.get_existing_data_for_today()
        
        # Get available meals from website
        available_meals = self.get_available_dining_halls_and_meals()
        
        # Find missing combinations
        missing_combinations = []
        
        for dining_hall, meals in available_meals.items():
            existing_meals = existing_combinations.get(dining_hall, set())
            
            for meal in meals:
                if meal not in existing_meals:
                    missing_combinations.append((dining_hall, meal))
                    self.logger.info(f"MISSING: {dining_hall} - {meal}")
        
        # Summary
        self.logger.info("=== SUMMARY ===")
        self.logger.info(f"Total dining halls checked: {len(available_meals)}")
        self.logger.info(f"Dining halls with existing data: {len(existing_combinations)}")
        self.logger.info(f"Missing meal combinations: {len(missing_combinations)}")
        
        return missing_combinations
    
    def scrape_missing_meals(self, missing_meals: List[Tuple[str, str]]) -> bool:
        """
        Scrape only the missing meal combinations using main scraper's logic.
        """
        if not missing_meals:
            self.logger.info("No missing meals to scrape")
            return True
        
        if self.dry_run:
            self.logger.info("DRY RUN MODE - Would scrape the following meals:")
            for dining_hall, meal in missing_meals:
                self.logger.info(f"  - {dining_hall}: {meal}")
            return True
        
        self.logger.info(f"=== STARTING INCREMENTAL SCRAPE ===")
        self.logger.info(f"Scraping {len(missing_meals)} missing meal combinations")
        
        try:
            # Initialize the scraper (same as main scraper)
            self.scraper = DiningHallScraper(
                target_url=self.target_url,
                mongodb_uri=self.mongodb_uri,
                headless=self.headless,
                max_retries=3  # Use same retries as main scraper
            )
            
            # Group missing meals by dining hall for efficiency
            meals_by_hall = defaultdict(list)
            for dining_hall, meal in missing_meals:
                meals_by_hall[dining_hall].append(meal)
            
            # Setup driver with same logic as main scraper
            self.scraper.driver = self.scraper.setup_driver()
            if not self.scraper.is_driver_alive():
                raise RuntimeError("Driver failed to initialize properly")
            
            self.scraper.driver.get(self.target_url)
            self.scraper.human_wait(2, 4)  # Same wait as main scraper
            
            if not self.scraper.is_driver_alive():
                raise RuntimeError("Driver died after loading page")
            
            all_new_foods = []
            
            # Process each dining hall with recovery (same pattern as main scraper)
            for idx, (dining_hall, meals_to_scrape) in enumerate(meals_by_hall.items()):
                try:
                    self.logger.info(f"Processing dining hall {idx + 1}/{len(meals_by_hall)}: {dining_hall}")
                    
                    # Clear failed items for each dining hall
                    self.scraper.failed_items.clear()
                    
                    # Use recovery version (same as main scraper)
                    meals_data = self._process_dining_hall_with_recovery(dining_hall, meals_to_scrape)
                    
                    if meals_data:
                        # Convert to the format expected by save_to_json
                        hall_data = {
                            "name": dining_hall,
                            "meals": meals_data
                        }
                        
                        # Convert to foods format and add to collection
                        foods_data = {
                            "date": self.today,
                            "dining_halls": [hall_data]
                        }
                        
                        new_foods = self.scraper.save_to_json(foods_data, filename=f"incremental_foods_{self.today}.json")
                        all_new_foods.extend(new_foods)
                        
                        self.logger.info(f"✓ Successfully processed {dining_hall}")
                    else:
                        self.logger.warning(f"✗ No meals found for {dining_hall}")
                    
                except Exception as e:
                    self.logger.error(f"✗ Failed to process {dining_hall}: {e}")
                    
                    # If it's a crash, try to restart for next dining hall (same as main scraper)
                    if self.scraper.is_crash_related_error(str(e)):
                        self.logger.info("Crash detected, restarting for next dining hall...")
                        if not self.scraper.restart_driver():
                            self.logger.error("Could not restart driver, stopping scrape")
                            break
                    
                    # Take screenshot if driver is alive (same as main scraper)
                    if self.scraper.is_driver_alive():
                        self.scraper.take_screenshot(f"error_{dining_hall.replace(' ', '_')}")
                    
                    continue
            
            # Upload all new foods to MongoDB (same as main scraper)
            if all_new_foods:
                self.logger.info(f"Uploading {len(all_new_foods)} new food items to MongoDB...")
                
                # Use the main scraper's upload method instead of custom logic
                success = self.scraper.upload_to_mongodb(all_new_foods)
                
                if success:
                    self.logger.info(f"✓ Successfully uploaded {len(all_new_foods)} food items")
                    return True
                else:
                    self.logger.error("Failed to upload food items to MongoDB")
                    return False
            else:
                self.logger.warning("No new food items were scraped")
                return False
                
        except Exception as e:
            self.logger.error(f"Incremental scraping failed: {e}")
            # Take screenshot if driver is alive (same as main scraper)
            if self.scraper and self.scraper.is_driver_alive():
                self.scraper.take_screenshot("incremental_critical_error")
            return False
        finally:
            # Clean shutdown (same as main scraper)
            if self.scraper and self.scraper.driver:
                try:
                    self.scraper.driver.quit()
                except:
                    pass
                self.logger.info("Driver session closed")
    
    def _process_dining_hall_with_recovery(self, dining_hall_name: str, meals_to_scrape: List[str]) -> List[Dict[str, Any]]:
        """Process dining hall with crash recovery (adapted from main scraper)."""
        max_attempts = 3
        
        for attempt in range(max_attempts):
            try:
                self.logger.info(f"Processing {dining_hall_name} (attempt {attempt + 1})")
                
                # Check driver health before starting
                if not self.scraper.is_driver_alive():
                    self.logger.warning("Driver not alive, restarting...")
                    if not self.scraper.restart_driver():
                        self.logger.error("Could not restart driver")
                        continue  # Try next attempt
                
                # Process the dining hall for specific meals
                return self._process_specific_meals(dining_hall_name, meals_to_scrape)
                
            except Exception as e:
                self.logger.error(f"Attempt {attempt + 1} failed for {dining_hall_name}: {e}")
                
                # If this is a crash-related error, restart driver
                if self.scraper.is_crash_related_error(str(e)):
                    self.logger.info(f"Browser crash detected for {dining_hall_name}, restarting...")
                    if attempt < max_attempts - 1:  # Not the last attempt
                        if self.scraper.restart_driver():
                            self.logger.info("Driver restarted successfully, retrying...")
                            continue
                        else:
                            self.logger.error("Failed to restart driver")
                            break
                else:
                    # Non-crash error, wait a bit and retry
                    if attempt < max_attempts - 1:
                        self.logger.info(f"Non-crash error, waiting before retry...")
                        self.scraper.human_wait(2, 4)
                        continue
        
        self.logger.error(f"All attempts failed for {dining_hall_name}")
        return []
    
    def _process_specific_meals(self, dining_hall_name: str, meals_to_scrape: List[str]) -> List[Dict[str, Any]]:
        """Process specific meals for a dining hall using EXACT same logic as main scraper's _process_dining_hall."""
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        
        meals_data = []
        
        try:
            # Select dining hall (same as main scraper)
            if not self.scraper._select_dining_hall(dining_hall_name):
                return meals_data
            
            # Wait for meal tabs to load (same as main scraper)
            WebDriverWait(self.scraper.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".nav.nav-tabs"))
            )
            
            # Process each specific meal (instead of all meals like main scraper)
            for meal_name in meals_to_scrape:
                try:
                    if not self.scraper.is_driver_alive():
                        self.logger.error("Driver died during meal processing")
                        break
                    
                    self.logger.info(f"  Scraping {meal_name}...")
                    
                    # Select meal tab and extract stations data (EXACT same as main scraper)
                    if self.scraper._select_meal_tab(meal_name):
                        stations_data = self.scraper.extract_menu_data(dining_hall_name, meal_name)
                        
                        if stations_data:
                            meals_data.append({
                                "meal_name": meal_name,
                                "stations": stations_data  # This is the correct structure
                            })
                            
                            # Count total items across all stations
                            total_items = sum(len(station.get('items', [])) for station in stations_data)
                            self.logger.info(f"  ✓ Scraped {total_items} items from {dining_hall_name} - {meal_name}")
                        else:
                            self.logger.warning(f"  ✗ No stations found for {dining_hall_name} - {meal_name}")
            
                except Exception as e:
                    self.logger.error(f"  ✗ Error scraping {dining_hall_name} - {meal_name}: {e}")
                    continue
        
        except Exception as e:
            self.logger.error(f"Error processing dining hall {dining_hall_name}: {e}")
        
        return meals_data
    
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
                # Normal incremental logic
                missing_meals = self.find_missing_meals()
            
            # Scrape missing meals
            success = self.scrape_missing_meals(missing_meals)
            
            if success:
                self.logger.info("=== INCREMENTAL SCRAPER COMPLETED SUCCESSFULLY ===")
                return True
            else:
                self.logger.error("=== INCREMENTAL SCRAPER COMPLETED WITH ERRORS ===")
                return False
                
        except Exception as e:
            self.logger.error(f"Incremental scraper run failed: {e}")
            return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Incremental Campus Nutrition Scraper")
    parser.add_argument("--dry-run", action="store_true", 
                       help="Show what would be scraped without actually scraping")
    parser.add_argument("--force-rescrape", action="store_true",
                       help="Re-scrape all meals even if they already exist")
    parser.add_argument("--headless", action="store_true", default=True,
                       help="Run in headless mode (default: True)")
    parser.add_argument("--no-headless", action="store_false", dest="headless",
                       help="Run in non-headless mode for debugging")
    
    args = parser.parse_args()
    
    # Initialize scraper
    scraper = IncrementalScraper(
        target_url=TARGET_URL,
        mongodb_uri=MONGODB_URI,
        headless=args.headless,
        dry_run=args.dry_run
    )
    
    # Run scraper
    success = scraper.run(force_rescrape=args.force_rescrape)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()