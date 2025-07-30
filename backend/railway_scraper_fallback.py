#!/usr/bin/env python3
"""
Railway Fallback Scraper - Simple requests-based scraper for when Chrome fails
"""

import os
import sys
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import certifi

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

def simple_api_scrape():
    """Try to scrape using simple requests to the dining API"""
    try:
        # Try common dining hall API endpoints
        api_urls = [
            "https://dineoncampus.com/api/v1/menus",
            "https://api.dineoncampus.com/v1/menus",
            "https://dineoncampus.com/utah/api/menu",
        ]
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        for url in api_urls:
            try:
                logger.info(f"Trying API endpoint: {url}")
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    logger.info(f"Successfully got response from {url}")
                    # Try to parse as JSON first
                    try:
                        data = response.json()
                        if data:
                            logger.info(f"Got JSON data: {len(str(data))} characters")
                            return data
                    except:
                        # Try to parse as HTML
                        soup = BeautifulSoup(response.text, 'html.parser')
                        if soup.find('div', class_='menu-item') or soup.find('div', class_='dining-hall'):
                            logger.info("Found menu content in HTML response")
                            return {"html_content": response.text, "url": url}
                        
            except Exception as e:
                logger.warning(f"Failed to fetch {url}: {e}")
                continue
        
        logger.warning("No API endpoints returned usable data")
        return None
        
    except Exception as e:
        logger.error(f"Simple API scrape failed: {e}")
        return None

def fallback_scrape():
    """Fallback scraping method when Chrome fails"""
    logger.info("=== Railway Fallback Scraper Started ===")
    
    # Load environment variables
    load_dotenv()
    mongodb_uri = os.getenv("MONGODB_URI")
    
    if not mongodb_uri:
        logger.error("MONGODB_URI not found in environment variables")
        return False
    
    try:
        # Try simple API scraping first
        api_data = simple_api_scrape()
        
        if api_data:
            # Connect to MongoDB
            client = MongoClient(mongodb_uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
            db = client["nutritionapp"]
            collection = db["scraper_fallback"]
            
            # Store the fallback data with timestamp
            fallback_record = {
                "timestamp": datetime.now(),
                "date": datetime.now().date().isoformat(),
                "method": "fallback_api",
                "data": api_data,
                "status": "partial_success"
            }
            
            result = collection.insert_one(fallback_record)
            logger.info(f"Stored fallback data with ID: {result.inserted_id}")
            
            client.close()
            return True
        else:
            logger.warning("No fallback data could be obtained")
            return False
            
    except Exception as e:
        logger.error(f"Fallback scrape failed: {e}")
        return False

if __name__ == "__main__":
    success = fallback_scrape()
    sys.exit(0 if success else 1)