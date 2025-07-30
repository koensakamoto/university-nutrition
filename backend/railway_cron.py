#!/usr/bin/env python3
"""
Railway Cron Job Script
Handles scheduled menu scraping tasks on Railway platform
"""

import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import your scrapers
try:
    from menu_scraper import DiningHallScraper
    from incremental_scraper import IncrementalMenuScraper
    SCRAPERS_AVAILABLE = True
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import scrapers: {e}")
    SCRAPERS_AVAILABLE = False

# Configure logging for Railway
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def run_main_scraper():
    """Run the main menu scraper"""
    try:
        logger.info("Starting main menu scraper...")
        
        target_url = "https://dineoncampus.com/utah"
        mongodb_uri = os.getenv("MONGODB_URI")
        
        if not mongodb_uri:
            logger.error("MONGODB_URI not found in environment variables")
            return False
            
        scraper = DiningHallScraper(
            target_url=target_url,
            mongodb_uri=mongodb_uri,
            headless=True  # Always headless on Railway
        )
        
        scraped_data = scraper.scrape_all_dining_halls()
        
        if scraped_data and scraped_data.get("dining_halls"):
            # Save to JSON
            foods = scraper.save_to_json(scraped_data)
            
            # Upload to MongoDB
            if foods:
                success = scraper.upload_to_mongodb(foods)
                if success:
                    logger.info(f"Successfully uploaded {len(foods)} foods to MongoDB")
                else:
                    logger.error("Failed to upload foods to MongoDB")
                    return False
            else:
                logger.error("No foods data to upload")
                return False
        else:
            logger.error("No dining halls data scraped - this could indicate anti-bot detection or website changes")
            return False
        
        logger.info("Main menu scraper completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Main scraper failed: {e}")
        return False

def run_incremental_scraper():
    """Run the incremental scraper"""
    try:
        logger.info("Starting incremental scraper...")
        
        target_url = "https://dineoncampus.com/utah"
        mongodb_uri = os.getenv("MONGODB_URI")
        
        if not mongodb_uri:
            logger.error("MONGODB_URI not found in environment variables")
            return False
            
        scraper = IncrementalMenuScraper(
            target_url=target_url,
            mongodb_uri=mongodb_uri,
            headless=True  # Always headless on Railway
        )
        
        scraper.run()
        logger.info("Incremental scraper completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Incremental scraper failed: {e}")
        return False

def main():
    """Main entry point for cron jobs"""
    logger.info(f"Railway cron job started at {datetime.now()}")
    
    # Check if scrapers are available
    if not SCRAPERS_AVAILABLE:
        logger.error("Scrapers not available - cannot run cron job")
        sys.exit(1)
    
    # Get the task type from environment variable
    task_type = os.getenv("CRON_TASK", "main")
    logger.info(f"Running task type: {task_type}")
    
    if task_type == "main":
        success = run_main_scraper()
    elif task_type == "incremental":
        success = run_incremental_scraper()
    else:
        logger.error(f"Unknown task type: {task_type}")
        success = False
    
    if success:
        logger.info("Cron job completed successfully")
        sys.exit(0)
    else:
        logger.error("Cron job failed")
        sys.exit(1)

if __name__ == "__main__":
    main()