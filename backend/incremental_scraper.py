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
TARGET_URL = "https://dineoncampus.com/utah/whats-on-the-menu"
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
        
        if self.foods_collection is None:
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
    
    def get_available_dining_halls(self) -> List[str]:
        """
        Get all available dining halls (same logic as main scraper).
        Returns: [dining_hall_name, ...]
        """
        available_dining_halls = []
        
        try:
            # Initialize temporary scraper just for discovery (same as main scraper)
            temp_scraper = DiningHallScraper(self.target_url, None, 1, headless=self.headless)
            temp_scraper.driver = temp_scraper.setup_driver()
            
            if not temp_scraper.is_driver_alive():
                self.logger.error("Failed to initialize driver for discovery")
                return available_dining_halls
            
            temp_scraper.driver.get(self.target_url)
            temp_scraper.human_wait(2, 4)
            
            # Get dining hall names (EXACT same as main scraper)
            available_dining_halls = temp_scraper._get_dining_hall_names()
            self.logger.info(f"Found {len(available_dining_halls)} dining halls")
            
            # Clean up
            if temp_scraper.driver:
                temp_scraper.driver.quit()
                
        except Exception as e:
            self.logger.error(f"Error getting available dining halls: {e}")
        
        return available_dining_halls
    
    def find_missing_dining_halls(self) -> List[str]:
        """
        Find dining halls that need to be processed (same logic as main scraper).
        Returns: [dining_hall_name, ...]
        """
        self.logger.info("=== ANALYZING MISSING MEALS ===")
        
        # Get existing data per dining hall
        existing_combinations = self.get_existing_data_for_today()
        
        # Get all available dining halls (same as main scraper)
        available_dining_halls = self.get_available_dining_halls()
        
        # For each dining hall, we need to check if we need to process it
        # We'll determine missing meals dynamically when processing each dining hall
        dining_halls_to_process = []
        
        for dining_hall in available_dining_halls:
            existing_meals = existing_combinations.get(dining_hall, set())
            
            if not existing_meals:
                # No existing data for this dining hall, need to process it
                dining_halls_to_process.append(dining_hall)
                self.logger.info(f"MISSING: {dining_hall} - no existing data")
            else:
                # Has existing data, but we need to check if there are missing meals
                # We'll check this dynamically during processing
                dining_halls_to_process.append(dining_hall)
                self.logger.info(f"PARTIAL: {dining_hall} - has {len(existing_meals)} existing meals, will check for missing")
        
        # Summary
        self.logger.info("=== SUMMARY ===")
        self.logger.info(f"Total dining halls available: {len(available_dining_halls)}")
        self.logger.info(f"Dining halls with existing data: {len(existing_combinations)}")
        self.logger.info(f"Dining halls to process: {len(dining_halls_to_process)}")
        
        return dining_halls_to_process
    
    def scrape_missing_dining_halls(self, dining_halls_to_process: List[str]) -> bool:
        """
        Scrape only missing meals from dining halls using main scraper's logic.
        """
        if not dining_halls_to_process:
            self.logger.info("No dining halls to process")
            return True
        
        if self.dry_run:
            self.logger.info("DRY RUN MODE - Would process the following dining halls:")
            for dining_hall in dining_halls_to_process:
                self.logger.info(f"  - {dining_hall}")
            return True
        
        self.logger.info(f"=== STARTING INCREMENTAL SCRAPE ===")
        self.logger.info(f"Processing {len(dining_halls_to_process)} dining halls")
        
        try:
            # Initialize the scraper (same as main scraper)
            self.scraper = DiningHallScraper(
                target_url=self.target_url,
                mongodb_uri=self.mongodb_uri,
                headless=self.headless,
                max_retries=3  # Use same retries as main scraper
            )
            
            # Setup driver with same logic as main scraper
            self.scraper.driver = self.scraper.setup_driver()
            if not self.scraper.is_driver_alive():
                raise RuntimeError("Driver failed to initialize properly")
            
            self.scraper.driver.get(self.target_url)
            self.scraper.human_wait(2, 4)  # Same wait as main scraper
            
            if not self.scraper.is_driver_alive():
                raise RuntimeError("Driver died after loading page")
            
            all_new_foods = []
            
            # Process each dining hall with recovery (EXACT same pattern as main scraper)
            for idx, dining_hall in enumerate(dining_halls_to_process):
                try:
                    self.logger.info(f"Processing dining hall {idx + 1}/{len(dining_halls_to_process)}: {dining_hall}")
                    
                    # Clear failed items for each dining hall
                    self.scraper.failed_items.clear()
                    
                    # Use recovery version (same as main scraper)
                    meals_data = self._process_dining_hall_with_recovery_incremental(dining_hall)
                    
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
                        self.logger.warning(f"✗ No new meals found for {dining_hall}")
                    
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
    
    def _process_dining_hall_with_recovery_incremental(self, dining_hall_name: str) -> List[Dict[str, Any]]:
        """Process dining hall with crash recovery (EXACT same as main scraper but only missing meals)."""
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
                
                # Process the dining hall (same as main scraper logic but skip existing meals)
                return self._process_dining_hall_incremental(dining_hall_name)
                
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
    
    def _process_dining_hall_incremental(self, dining_hall_name: str) -> List[Dict[str, Any]]:
        """Process a dining hall with EXACT same logic as main scraper but skip existing meals."""
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        
        meals_data = []
        
        try:
            # Select dining hall (EXACT same as main scraper)
            if not self.scraper._select_dining_hall(dining_hall_name):
                return meals_data
            
            # Wait for meal tabs to load (EXACT same as main scraper)
            WebDriverWait(self.scraper.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".nav.nav-tabs"))
            )
            
            # Get meal tab names (EXACT same as main scraper)
            meal_tabs = self.scraper._get_meal_tabs()
            
            # Get existing meals for this dining hall
            existing_combinations = self.get_existing_data_for_today()
            existing_meals = existing_combinations.get(dining_hall_name, set())
            
            # Process each meal (EXACT same logic as main scraper)
            for meal_name in meal_tabs:
                try:
                    # Skip if this meal already exists (INCREMENTAL LOGIC)
                    if meal_name in existing_meals:
                        self.logger.info(f"  Skipping {meal_name} - already exists")
                        continue
                    
                    if not self.scraper.is_driver_alive():
                        self.logger.error("Driver died during meal processing")
                        break
                    
                    self.logger.info(f"  Scraping {meal_name}...")
                    
                    # Select meal tab and extract data (EXACT same as main scraper)
                    if self.scraper._select_meal_tab(meal_name):
                        stations_data = self.scraper.extract_menu_data(dining_hall_name, meal_name)
                        
                        if stations_data:
                            meals_data.append({
                                "meal_name": meal_name,
                                "stations": stations_data
                            })
                            
                            # Count total items across all stations
                            total_items = sum(len(station.get('items', [])) for station in stations_data)
                            self.logger.info(f"  ✓ Scraped {total_items} items from {dining_hall_name} - {meal_name}")
                        else:
                            self.logger.warning(f"  ✗ No stations found for {dining_hall_name} - {meal_name}")
                    else:
                        self.logger.error(f"  ✗ Could not select meal tab: {meal_name}")
                
                except Exception as e:
                    self.logger.error(f"  ✗ Error scraping {dining_hall_name} - {meal_name}: {e}")
                    continue
        
        except Exception as e:
            self.logger.error(f"Error processing dining hall {dining_hall_name}: {e}")
        
        return meals_data
    
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
            
            # Get actual meal tabs dynamically (SAME as main scraper)
            actual_meal_tabs = self.scraper._get_meal_tabs()
            
            # Only process meals that both exist on the page AND are in our missing list
            meals_to_process = []
            for meal_name in actual_meal_tabs:
                if meal_name in meals_to_scrape:
                    meals_to_process.append(meal_name)
            
            if not meals_to_process:
                self.logger.warning(f"No matching meals found for {dining_hall_name}. Available: {actual_meal_tabs}, Requested: {meals_to_scrape}")
                return meals_data
                
            # Process each meal that actually exists (EXACT same logic as main scraper)
            for meal_name in meals_to_process:
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
                # Get all available dining halls and treat them as needing processing
                available_dining_halls = self.get_available_dining_halls()
                dining_halls_to_process = available_dining_halls
                self.logger.info(f"Force rescrape: processing all {len(dining_halls_to_process)} dining halls")
            else:
                # Normal incremental logic
                dining_halls_to_process = self.find_missing_dining_halls()
            
            # Scrape missing dining halls
            success = self.scrape_missing_dining_halls(dining_halls_to_process)
            
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