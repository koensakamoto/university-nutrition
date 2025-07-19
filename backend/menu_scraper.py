



# import time
# import datetime
# import random
# import json
# import uuid
# import logging
# import traceback
# import re
# import os
# from typing import Dict, List, Optional, Any
# from contextlib import contextmanager

# # Selenium imports
# from selenium import webdriver
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# from selenium.webdriver.common.action_chains import ActionChains
# from selenium.webdriver.chrome.service import Service
# from selenium.webdriver.chrome.options import Options
# from selenium.common.exceptions import (
#     NoSuchElementException, 
#     TimeoutException, 
#     WebDriverException,
#     ElementNotInteractableException,
#     StaleElementReferenceException
# )
# try:
#     import undetected_chromedriver as uc
#     UC_AVAILABLE = True
# except ImportError:
#     UC_AVAILABLE = False

# # Other imports
# import requests
# from bs4 import BeautifulSoup
# from bs4.element import NavigableString
# import certifi
# from dotenv import load_dotenv
# from pymongo.mongo_client import MongoClient
# from pymongo.server_api import ServerApi
# from sentence_transformers import SentenceTransformer
# from fake_useragent import UserAgent


# class DiningHallScraper:
#     """A robust web scraper for dining hall menu data with headless mode support."""
    
#     def __init__(self, target_url: str, mongodb_uri: Optional[str] = None, max_retries: int = 3, headless: bool = False):
#         self.target_url = target_url
#         self.mongodb_uri = mongodb_uri or os.getenv("MONGODB_URI")
#         self.max_retries = max_retries
#         self.headless = headless
#         self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
#         # Ensure directories exist
#         os.makedirs("debug_screenshots", exist_ok=True)
#         os.makedirs("logs", exist_ok=True)
        
#         # Configure logging
#         self._setup_logging()
        
#         # Dietary icons mapping
#         self.dietary_icons = {
#             "/img/icon_vegan.png": "Vegan",
#             "/img/icon_vegetarian.png": "Vegetarian",
#             "/img/icon_protein.png": "Good Source of Protein",
#             "/img/howgood-climate-friendly-new.png": "Climate Friendly"
#         }
        
#         # Nutrient key mappings for standardization
#         self.nutrient_key_renames = {
#             "saturated_fat_+_trans_fat": "saturated_and_trans_fat",
#             "vitamin_a_re": "vitamin_a",
#             "calories_from_fat": "calories_from_fat",
#         }
        
#         # Timeouts and delays
#         self.DEFAULT_TIMEOUT = 15 if headless else 10
#         self.MODAL_TIMEOUT = 8 if headless else 5
#         self.MIN_WAIT = 1.0 if headless else 0.5
#         self.MAX_WAIT = 3.0 if headless else 2.0
        
#         # Track failed items to avoid infinite loops
#         self.failed_items = set()
    
#     def _setup_logging(self):
#         """Configure logging with both file and console output."""
#         logging.basicConfig(
#             level=logging.INFO,
#             format="%(asctime)s [%(levelname)s] %(message)s",
#             handlers=[
#                 logging.FileHandler("logs/scraper.log", mode="w"),
#                 logging.StreamHandler()
#             ]
#         )
#         self.logger = logging.getLogger(__name__)
    
#     def human_wait(self, min_sec: float = None, max_sec: float = None):
#         """Simulate human-like waiting times."""
#         min_sec = min_sec or self.MIN_WAIT
#         max_sec = max_sec or self.MAX_WAIT
#         time.sleep(random.uniform(min_sec, max_sec))
    
#     def take_screenshot(self, filename: str):
#         """Take a screenshot for debugging."""
#         try:
#             if hasattr(self, 'driver') and self.driver:
#                 screenshot_path = f"debug_screenshots/{filename}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
#                 self.driver.save_screenshot(screenshot_path)
#                 self.logger.info(f"Screenshot saved: {screenshot_path}")
#         except Exception as e:
#             self.logger.warning(f"Failed to take screenshot: {e}")
    
#     def setup_driver(self) -> webdriver.Chrome:
#         """Set up Chrome driver with proper headless support."""
#         for attempt in range(self.max_retries):
#             try:
#                 self.logger.info(f"Setting up driver (attempt {attempt + 1}, headless={self.headless})")
                
#                 if self.headless:
#                     # Use standard Chrome driver for headless mode
#                     return self._setup_standard_chrome()
#                 else:
#                     # Use undetected Chrome for non-headless mode
#                     return self._setup_undetected_chrome()
                    
#             except Exception as e:
#                 self.logger.warning(f"Driver setup failed (attempt {attempt+1}): {e}")
#                 time.sleep(3)
        
#         raise RuntimeError(f"Failed to initialize Chrome driver after {self.max_retries} attempts.")
    
#     def _setup_standard_chrome(self) -> webdriver.Chrome:
#         """Set up standard Chrome driver for headless mode."""
#         ua = UserAgent()
#         user_agent = ua.random
        
#         options = Options()
        
#         # Headless configuration
#         if self.headless:
#             options.add_argument('--headless=new')  # Use new headless mode
#             options.add_argument('--disable-gpu')
#             options.add_argument('--no-sandbox')
#             options.add_argument('--disable-dev-shm-usage')
        
#         # Common options
#         options.add_argument(f'--user-agent={user_agent}')
#         options.add_argument('--window-size=1920,1080')
#         options.add_argument('--disable-blink-features=AutomationControlled')
#         options.add_argument('--disable-web-security')
#         options.add_argument('--disable-features=VizDisplayCompositor')
#         options.add_argument('--disable-extensions')
#         options.add_argument('--disable-plugins')
#         options.add_argument('--disable-images')  # Speed up loading
        
#         # Additional headless-specific options
#         if self.headless:
#             options.add_argument('--disable-background-timer-throttling')
#             options.add_argument('--disable-backgrounding-occluded-windows')
#             options.add_argument('--disable-renderer-backgrounding')
#             options.add_argument('--disable-background-networking')
        
#         # Experimental options
#         options.add_experimental_option("excludeSwitches", ["enable-automation"])
#         options.add_experimental_option('useAutomationExtension', False)
        
#         driver = webdriver.Chrome(options=options)
        
#         # Set timeouts
#         driver.implicitly_wait(10)
#         driver.set_page_load_timeout(60)
        
#         # Apply stealth features if not headless
#         if not self.headless:
#             self._apply_stealth_features(driver)
        
#         return driver
    
#     def _setup_undetected_chrome(self) -> webdriver.Chrome:
#         """Set up undetected Chrome driver for non-headless mode."""
#         if not UC_AVAILABLE:
#             self.logger.warning("undetected-chromedriver not available, falling back to standard Chrome")
#             return self._setup_standard_chrome()
        
#         ua = UserAgent()
#         user_agent = ua.random
        
#         options = uc.ChromeOptions()
#         options.add_argument('--disable-blink-features=AutomationControlled')
#         options.add_argument(f'--user-agent={user_agent}')
#         options.add_argument('--no-sandbox')
#         options.add_argument('--disable-dev-shm-usage')
#         options.add_argument('--window-size=1920,1080')
#         options.add_argument('--disable-gpu')
#         options.add_argument('--disable-web-security')
#         options.add_argument('--disable-features=VizDisplayCompositor')
        
#         driver = uc.Chrome(options=options)
#         driver.set_window_size(1920, 1080)
#         driver.implicitly_wait(5)
        
#         # Apply stealth features
#         self._apply_stealth_features(driver)
#         return driver
    
#     def _apply_stealth_features(self, driver: webdriver.Chrome):
#         """Apply additional stealth features to the driver."""
#         try:
#             # Check if window is still available
#             driver.current_url  # This will throw if window is closed
            
#             driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")
#             driver.execute_script("Object.defineProperty(navigator, 'deviceMemory', {get: () => 8})")
#             driver.execute_script("Object.defineProperty(navigator, 'hardwareConcurrency', {get: () => 4})")
            
#         except Exception as e:
#             self.logger.warning(f"Failed to apply stealth features: {e}")
    
#     @contextmanager
#     def modal_context(self, item_name: str):
#         """Context manager for handling modal operations safely."""
#         modal_opened = False
#         try:
#             yield
#             modal_opened = True
#         except Exception as e:
#             self.logger.error(f"Error in modal context for {item_name}: {e}")
#             raise
#         finally:
#             if modal_opened:
#                 self._force_close_modal(item_name)
    
#     def _force_close_modal(self, item_name: str):
#         """Force close any open modals using multiple strategies."""
#         strategies = [
#             # Strategy 1: Click close button
#             lambda: self._close_modal_by_button(),
#             # Strategy 2: Press ESC key
#             lambda: self._close_modal_by_escape(),
#             # Strategy 3: Click backdrop
#             lambda: self._close_modal_by_backdrop(),
#             # Strategy 4: JavaScript force close
#             lambda: self._close_modal_by_js(),
#         ]
        
#         for i, strategy in enumerate(strategies, 1):
#             try:
#                 strategy()
#                 # Wait a bit to see if modal actually closed
#                 WebDriverWait(self.driver, 2).until(
#                     EC.invisibility_of_element_located((By.CLASS_NAME, "modal"))
#                 )
#                 self.logger.debug(f"Modal closed using strategy {i} for {item_name}")
#                 return
#             except TimeoutException:
#                 continue
#             except Exception as e:
#                 self.logger.debug(f"Strategy {i} failed for {item_name}: {e}")
#                 continue
        
#         self.logger.warning(f"Could not close modal for {item_name} - continuing anyway")
    
#     def _close_modal_by_button(self):
#         """Close modal using the close button."""
#         close_button = self.driver.find_element(By.CSS_SELECTOR, "button[aria-label='Close']")
#         close_button.click()
    
#     def _close_modal_by_escape(self):
#         """Close modal using ESC key."""
#         from selenium.webdriver.common.keys import Keys
#         self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    
#     def _close_modal_by_backdrop(self):
#         """Close modal by clicking backdrop."""
#         backdrop = self.driver.find_element(By.CSS_SELECTOR, ".modal-backdrop")
#         backdrop.click()
    
#     def _close_modal_by_js(self):
#         """Close modal using JavaScript."""
#         self.driver.execute_script("""
#             var modals = document.querySelectorAll('.modal');
#             modals.forEach(function(modal) {
#                 modal.style.display = 'none';
#                 modal.classList.remove('show');
#             });
#             var backdrops = document.querySelectorAll('.modal-backdrop');
#             backdrops.forEach(function(backdrop) {
#                 backdrop.remove();
#             });
#         """)
    
#     def safe_click(self, element, element_name: str = "element", timeout: int = 10) -> bool:
#         """Safely click an element with multiple fallback methods and timeout."""
#         methods = [
#             lambda: element.click(),
#             lambda: ActionChains(self.driver).move_to_element(element).pause(0.5).click().perform(),
#             lambda: self.driver.execute_script("arguments[0].click();", element),
#             lambda: self.driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true}));", element)
#         ]
        
#         for i, method in enumerate(methods, 1):
#             try:
#                 # Add timeout for each click attempt
#                 start_time = time.time()
#                 method()
                
#                 # Verify click didn't hang
#                 if time.time() - start_time > timeout:
#                     self.logger.warning(f"Click method {i} timed out for {element_name}")
#                     continue
                
#                 self.logger.debug(f"Successfully clicked {element_name} using method {i}")
#                 return True
                
#             except (ElementNotInteractableException, StaleElementReferenceException) as e:
#                 self.logger.debug(f"Element interaction failed for {element_name} (method {i}): {e}")
#                 continue
#             except Exception as e:
#                 self.logger.debug(f"Click method {i} failed for {element_name}: {e}")
#                 continue
        
#         self.logger.warning(f"All click methods failed for {element_name}")
#         return False
    
#     def is_driver_alive(self) -> bool:
#         """Check if the driver is still alive and responsive."""
#         try:
#             if not hasattr(self, 'driver') or not self.driver:
#                 return False
            
#             # Try to get current URL - this will fail if window is closed
#             self.driver.current_url
#             return True
#         except Exception as e:
#             self.logger.error(f"Driver is not alive: {e}")
#             return False
    
#     def extract_nutrition_details(self, item_name: str) -> Dict[str, Any]:
#         """Extract nutrition details for a menu item with improved error handling."""
#         nutrition_details = {"nutrients": {}, "ingredients": "N/A"}
        
#         # Check if driver is alive
#         if not self.is_driver_alive():
#             self.logger.error(f"Driver not available for {item_name}")
#             return nutrition_details
        
#         # Skip if we've already failed on this item
#         if item_name in self.failed_items:
#             self.logger.debug(f"Skipping {item_name} - previously failed")
#             return nutrition_details
        
#         try:
#             # Build XPath for nutrition button
#             item_name_escaped = self._escape_xpath_text(item_name)
#             xpath_query = f"//strong[normalize-space()={item_name_escaped}]/following::button[contains(@class, 'btn-nutrition')][1]"
            
#             # Wait for and find nutrition button with timeout
#             try:
#                 WebDriverWait(self.driver, self.MODAL_TIMEOUT).until(
#                     EC.element_to_be_clickable((By.XPATH, xpath_query))
#                 )
#             except TimeoutException:
#                 self.logger.warning(f"Nutrition button not found for {item_name}")
#                 return nutrition_details
            
#             buttons = self.driver.find_elements(By.XPATH, xpath_query)
#             if not buttons:
#                 self.logger.warning(f"No nutrition button found for item '{item_name}'")
#                 return nutrition_details
            
#             button = buttons[0]
#             self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'})", button)
#             self.human_wait(0.5, 1.0)
            
#             # Use modal context manager
#             with self.modal_context(item_name):
#                 # Click nutrition button
#                 if not self.safe_click(button, f"nutrition button for {item_name}"):
#                     raise Exception(f"Failed to click nutrition button for {item_name}")
                
#                 self.logger.debug(f"Clicked nutrition button for: {item_name}")
                
#                 # Wait for modal with timeout
#                 try:
#                     WebDriverWait(self.driver, self.MODAL_TIMEOUT).until(
#                         EC.presence_of_element_located((By.CSS_SELECTOR, ".modal-body ul"))
#                     )
#                 except TimeoutException:
#                     raise Exception(f"Modal did not open for {item_name}")
                
#                 nutrition_details = self._extract_modal_data()
#                 self.human_wait(0.3, 0.7)  # Brief pause before closing
            
#         except Exception as e:
#             self.logger.error(f"Error extracting nutrition for '{item_name}': {e}")
#             self.failed_items.add(item_name)
#             nutrition_details["nutrients"] = {"error": str(e)}
            
#             # Take screenshot for debugging (if driver is alive)
#             if self.is_driver_alive():
#                 self.take_screenshot(f"error_{item_name.replace(' ', '_')}")
        
#         return nutrition_details
    
#     def _escape_xpath_text(self, text: str) -> str:
#         """Properly escape text for XPath queries."""
#         if '"' not in text:
#             return f'"{text}"'
#         if "'" not in text:
#             return f"'{text}'"
        
#         # Handle both single and double quotes using concat
#         parts = text.split("'")
#         return "concat(" + ", '\'', ".join([f"'{part}'" for part in parts]) + ")"
    
#     def _extract_modal_data(self) -> Dict[str, Any]:
#         """Extract nutrition data from the modal."""
#         nutrition_details = {"nutrients": {}, "ingredients": "N/A"}
        
#         try:
#             soup = BeautifulSoup(self.driver.page_source, 'html.parser')
#             modal_body = soup.find('div', class_='modal-body')
            
#             if modal_body:
#                 # Extract nutrients
#                 nutrients = {}
#                 ul_tags = modal_body.find_all('ul')
                
#                 for ul in ul_tags:
#                     for li in ul.find_all('li'):
#                         strong_tag = li.find('strong')
#                         if strong_tag:
#                             label = self._clean_nutrient_label(strong_tag.text.strip())
#                             value = self._extract_nutrient_value(strong_tag)
                            
#                             if label and value:
#                                 nutrients[label] = value
                
#                 nutrition_details["nutrients"] = nutrients
                
#                 # Extract ingredients
#                 ingredients = self._extract_ingredients(modal_body)
#                 if ingredients:
#                     nutrition_details["ingredients"] = ingredients
            
#         except Exception as e:
#             self.logger.error(f"Error extracting modal data: {e}")
        
#         return nutrition_details
    
#     def _clean_nutrient_label(self, label: str) -> str:
#         """Clean and standardize nutrient labels."""
#         # Remove parentheses and colons
#         label_clean = re.sub(r'\([^)]*\)', '', label)
#         label_clean = label_clean.replace(':', '').strip()
        
#         # Convert to lowercase with underscores
#         label_clean = label_clean.lower().replace(' ', '_')
#         label_clean = re.sub(r'_and$', '', label_clean)
#         label_clean = re.sub(r'_+', '_', label_clean)
        
#         # Apply renames
#         return self.nutrient_key_renames.get(label_clean, label_clean)
    
#     def _extract_nutrient_value(self, strong_tag) -> str:
#         """Extract the value following a nutrient label."""
#         texts = []
#         for sibling in strong_tag.next_siblings:
#             if isinstance(sibling, NavigableString):
#                 texts.append(str(sibling))
#             else:
#                 break
#         return ''.join(texts).strip()
    
#     def _extract_ingredients(self, modal_body) -> str:
#         """Extract ingredients from modal body."""
#         made_with_tag = modal_body.find('strong', string=lambda text: text and "Made with:" in text.strip())
#         if made_with_tag:
#             texts = []
#             for sibling in made_with_tag.next_siblings:
#                 if isinstance(sibling, NavigableString):
#                     texts.append(str(sibling))
#                 else:
#                     break
#             return ''.join(texts).strip()
#         return "N/A"
    
#     def extract_menu_data(self, dining_hall_name: str, meal_type: str) -> List[Dict[str, Any]]:
#         """Extract menu data for a specific dining hall and meal type."""
#         if not self.is_driver_alive():
#             self.logger.error("Driver not available for menu extraction")
#             return []
        
#         self.logger.info(f"Extracting menu for {dining_hall_name} - {meal_type}")
        
#         soup = BeautifulSoup(self.driver.page_source, 'html.parser')
#         menu_tables = soup.find_all('table', class_='menu-items')
        
#         stations_data = []
        
#         for idx, table in enumerate(menu_tables):
#             # Get station name
#             caption_tag = table.find('caption')
#             station_name = caption_tag.text.strip() if caption_tag else f"Station {idx + 1}"
            
#             items_in_station = []
#             rows = table.find('tbody').find_all('tr') if table.find('tbody') else []
            
#             for row_idx, row in enumerate(rows):
#                 try:
#                     item_data = self._extract_item_from_row(row)
#                     if item_data:
#                         items_in_station.append(item_data)
#                         self.human_wait(1.0, 2.0)  # Slightly longer wait for headless
                
#                 except Exception as e:
#                     self.logger.error(f"Error processing row {row_idx} in {station_name}: {e}")
#                     continue
            
#             if items_in_station:
#                 stations_data.append({
#                     "name": station_name,
#                     "items": items_in_station
#                 })
        
#         return stations_data
    
#     def _extract_item_from_row(self, row) -> Optional[Dict[str, Any]]:
#         """Extract item data from a table row."""
#         item_td = row.find('td', {'data-label': 'Menu item'})
#         portion_td = row.find('td', {'data-label': 'Portion'})
        
#         if not item_td:
#             return None
        
#         # Extract item name
#         item_name_wrapper = item_td.find('span', class_=lambda x: x and x.startswith('category-items_itemNameWrapper'))
#         if item_name_wrapper:
#             strong_tag = item_name_wrapper.find('strong')
#             item_name = strong_tag.text.strip() if strong_tag else "N/A"
#         else:
#             item_name = "N/A"
        
#         if item_name == "N/A":
#             return None
        
#         # Extract portion size
#         portion_size = "1 serving"  # default
#         if portion_td:
#             portion_div = portion_td.find('div')
#             portion_size = portion_div.text.strip() if portion_div else portion_td.text.strip()
        
#         # Extract dietary labels
#         labels = []
#         for icon_path, preference_name in self.dietary_icons.items():
#             if item_td.find('img', src=icon_path):
#                 labels.append(preference_name)
        
#         # Get nutrition information - with error handling
#         try:
#             nutrition_info = self.extract_nutrition_details(item_name)
#         except Exception as e:
#             self.logger.error(f"Failed to get nutrition for {item_name}: {e}")
#             nutrition_info = {"nutrients": {"error": str(e)}, "ingredients": "N/A"}
        
#         # Process ingredients
#         raw_ingredients = nutrition_info.get("ingredients", "N/A")
#         ingredients_list = []
#         if raw_ingredients and raw_ingredients != "N/A":
#             ingredients_list = [i.strip().replace('^', '') for i in raw_ingredients.split(',') if i.strip()]
        
#         return {
#             "name": item_name,
#             "description": "",
#             "labels": labels,
#             "ingredients": ingredients_list,
#             "portion_size": portion_size,
#             "nutrients": nutrition_info.get("nutrients", {})
#         }
    
#     def scrape_all_dining_halls(self) -> Dict[str, Any]:
#         """Main scraping method for all dining halls with improved error handling."""
#         self.logger.info(f"Starting scrape of {self.target_url} (headless={self.headless})")
        
#         self.driver = None
#         all_dining_hall_data = {
#             "date": datetime.date.today().isoformat(),
#             "dining_halls": []
#         }
        
#         try:
#             self.driver = self.setup_driver()
            
#             # Verify driver is working
#             if not self.is_driver_alive():
#                 raise RuntimeError("Driver failed to initialize properly")
            
#             self.driver.get(self.target_url)
#             self.human_wait(5, 8)
            
#             # Verify page loaded
#             if not self.is_driver_alive():
#                 raise RuntimeError("Driver died after loading page")
            
#             # Get all dining hall names
#             dining_hall_names = self._get_dining_hall_names()
#             if not dining_hall_names:
#                 self.logger.error("No dining halls found")
#                 return all_dining_hall_data
            
#             # Process each dining hall
#             for dining_hall_name in dining_hall_names:
#                 try:
#                     if not self.is_driver_alive():
#                         self.logger.error("Driver died during processing")
#                         break
                    
#                     self.logger.info(f"Processing dining hall: {dining_hall_name}")
                    
#                     # Clear failed items for each dining hall
#                     self.failed_items.clear()
                    
#                     meals_data = self._process_dining_hall(dining_hall_name)
                    
#                     if meals_data:
#                         all_dining_hall_data["dining_halls"].append({
#                             "name": dining_hall_name,
#                             "meals": meals_data
#                         })
#                         self.logger.info(f"Successfully processed {dining_hall_name}")
#                     else:
#                         self.logger.warning(f"No meals found for {dining_hall_name}")
                
#                 except Exception as e:
#                     self.logger.error(f"Failed to process {dining_hall_name}: {e}")
#                     if self.is_driver_alive():
#                         self.take_screenshot(f"error_{dining_hall_name.replace(' ', '_')}")
#                     continue
            
#             self.logger.info("Scraping completed successfully")
#             return all_dining_hall_data
        
#         except Exception as e:
#             self.logger.error(f"Scraping failed: {e}")
#             traceback.print_exc()
#             if self.is_driver_alive():
#                 self.take_screenshot("critical_error")
#             return all_dining_hall_data
        
#         finally:
#             if self.driver:
#                 try:
#                     self.driver.quit()
#                 except:
#                     pass
#                 self.logger.info("Driver session closed")
    
#     def _get_dining_hall_names(self) -> List[str]:
#         """Get list of all available dining halls."""
#         try:
#             dropdown_button = WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
#                 EC.element_to_be_clickable((By.ID, "menu-location-selector__BV_toggle_"))
#             )
            
#             dropdown_button.click()
#             dropdown_menu = WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
#                 EC.visibility_of_element_located((By.CSS_SELECTOR, ".dropdown-menu.show"))
#             )
            
#             # Wait for buttons to load
#             WebDriverWait(dropdown_menu, self.DEFAULT_TIMEOUT).until(
#                 lambda d: len(dropdown_menu.find_elements(By.TAG_NAME, "button")) > 0
#             )
            
#             # Extract dining hall names
#             buttons = dropdown_menu.find_elements(By.TAG_NAME, "button")
#             dining_hall_names = []
#             seen = set()
            
#             for btn in buttons:
#                 name = btn.text.strip()
#                 if name and name not in seen:
#                     dining_hall_names.append(name)
#                     seen.add(name)
            
#             dropdown_button.click()  # Close dropdown
#             self.logger.info(f"Found {len(dining_hall_names)} dining halls")
#             return dining_hall_names
        
#         except Exception as e:
#             self.logger.error(f"Error getting dining hall names: {e}")
#             return []
    
#     def _get_meal_tabs(self) -> List[str]:
#         """Get list of available meal tabs."""
#         try:
#             meal_container = self.driver.find_element(By.CSS_SELECTOR, ".nav.nav-tabs")
#             tab_elements = meal_container.find_elements(By.TAG_NAME, "li")
            
#             meal_names = []
#             for tab in tab_elements:
#                 tab_link = tab.find_element(By.TAG_NAME, "a")
#                 meal_names.append(tab_link.text.strip())
            
#             return meal_names
        
#         except Exception as e:
#             self.logger.error(f"Error getting meal tabs: {e}")
#             return []
    
#     def _select_meal_tab(self, meal_name: str) -> bool:
#         """Select a specific meal tab."""
#         try:
#             tab_button = WebDriverWait(self.driver, 20).until(
#                 EC.element_to_be_clickable((By.XPATH, f"//ul[contains(@class, 'nav-tabs')]/li/a[normalize-space()='{meal_name}']"))
#             )
            
#             if not self.safe_click(tab_button, f"meal tab for {meal_name}"):
#                 return False
            
#             # Wait for content to load
#             WebDriverWait(self.driver, 15).until(
#                 EC.presence_of_element_located((By.CSS_SELECTOR, "table.menu-items tbody tr"))
#             )
            
#             return True
        
#         except Exception as e:
#             self.logger.error(f"Error selecting meal tab {meal_name}: {e}")
#             return False
    
#     def _process_dining_hall(self, dining_hall_name: str) -> List[Dict[str, Any]]:
#         """Process a single dining hall and extract all meal data."""
#         meals_data = []
        
#         try:
#             # Select dining hall
#             if not self._select_dining_hall(dining_hall_name):
#                 return meals_data
            
#             # Wait for meal tabs to load
#             WebDriverWait(self.driver, 20).until(
#                 EC.presence_of_element_located((By.CSS_SELECTOR, ".nav.nav-tabs"))
#             )
            
#             # Get meal tab names
#             meal_tabs = self._get_meal_tabs()
            
#             # Process each meal
#             for meal_name in meal_tabs:
#                 try:
#                     if not self.is_driver_alive():
#                         self.logger.error("Driver died during meal processing")
#                         break
                    
#                     self.logger.info(f"Processing meal: {meal_name}")
                    
#                     if self._select_meal_tab(meal_name):
#                         stations_data = self.extract_menu_data(dining_hall_name, meal_name)
                        
#                         if stations_data:
#                             meals_data.append({
#                                 "meal_name": meal_name,
#                                 "stations": stations_data
#                             })
                
#                 except Exception as e:
#                     self.logger.error(f"Error processing meal {meal_name}: {e}")
#                     continue
        
#         except Exception as e:
#             self.logger.error(f"Error processing dining hall {dining_hall_name}: {e}")
        
#         return meals_data

#     def _select_dining_hall(self, dining_hall_name: str) -> bool:
#         """Select a specific dining hall from the dropdown."""
#         try:
#             dropdown_button = WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
#                 EC.element_to_be_clickable((By.ID, "menu-location-selector__BV_toggle_"))
#             )
            
#             if not self.safe_click(dropdown_button, "dropdown button"):
#                 return False
            
#             dropdown_menu = WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
#                 EC.visibility_of_element_located((By.CSS_SELECTOR, ".dropdown-menu.show"))
#             )
            
#             # Find and click target button
#             target_button = WebDriverWait(dropdown_menu, self.DEFAULT_TIMEOUT).until(
#                 EC.element_to_be_clickable((By.XPATH, f".//button[normalize-space()='{dining_hall_name}']"))
#             )
            
#             if not self.safe_click(target_button, f"dining hall button for {dining_hall_name}"):
#                 return False
            
#             self.human_wait(3, 4)
            
#             # Verify menu tables are present
#             WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
#                 EC.presence_of_element_located((By.CSS_SELECTOR, "table.menu-items"))
#             )
            
#             return True
        
#         except Exception as e:
#             self.logger.error(f"Error selecting dining hall {dining_hall_name}: {e}")
#             return False
    
#     def generate_embedding_text(self, food: Dict[str, Any]) -> str:
#         """Generate text for semantic embedding."""
#         name = food.get("name", "")
#         portion = food.get("portion_size", "")
#         labels = ", ".join(food.get("labels", []))
#         ingredients = ", ".join(food.get("ingredients", []))
#         meal = food.get("meal_name", "")
#         station = food.get("station", "")
#         hall = food.get("dining_hall", "")
        
#         nutrients = food.get("nutrients", {})
#         calories = nutrients.get("calories", "")
#         protein = nutrients.get("protein", "")
#         carbs = nutrients.get("total_carbohydrates", "")
#         fat = nutrients.get("total_fat", "")
        
#         return (
#             f"{name}, {portion}. "
#             f"Labels: {labels}. "
#             f"Ingredients: {ingredients}. "
#             f"Meal: {meal}, Station: {station}, Dining Hall: {hall}. "
#             f"Nutrition: {calories} calories, {protein}g protein, {carbs}g carbs, {fat}g fat."
#         )
    
#     def save_to_json(self, data: Dict[str, Any], filename: str = "foods.json") -> List[Dict[str, Any]]:
#         """Save scraped data to JSON with embeddings."""
#         foods = []
#         date = data.get("date")
        
#         for hall in data.get("dining_halls", []):
#             dining_hall_id = str(uuid.uuid4())
            
#             for meal in hall.get("meals", []):
#                 for station in meal.get("stations", []):
#                     station_id = str(uuid.uuid4())
                    
#                     for item in station.get("items", []):
#                         food_doc = item.copy()
#                         food_doc.update({
#                             "dining_hall": hall["name"],
#                             "dining_hall_id": dining_hall_id,
#                             "meal_name": meal["meal_name"],
#                             "station": station["name"],
#                             "station_id": station_id,
#                             "date": date
#                         })
                        
#                         # Generate embedding
#                         embedding_text = self.generate_embedding_text(food_doc)
#                         food_doc["embedding"] = self.model.encode(embedding_text).tolist()
                        
#                         foods.append(food_doc)
        
#         # Save to file
#         with open(filename, "w") as f:
#             json.dump(foods, f, indent=2)
        
#         self.logger.info(f"Saved {len(foods)} foods to {filename}")
#         return foods
    
#     def upload_to_mongodb(self, foods: List[Dict[str, Any]]) -> bool:
#         """Upload foods data to MongoDB."""
#         if not self.mongodb_uri:
#             self.logger.warning("MongoDB URI not provided")
#             return False
        
#         try:
#             client = MongoClient(self.mongodb_uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
#             db = client["nutritionapp"]
#             collection = db["foods"]
            
#             # Clear existing data for today
#             today = datetime.date.today().isoformat()
#             collection.delete_many({"date": today})
            
#             # Insert new data in batches to avoid memory issues
#             batch_size = 100
#             total_inserted = 0
            
#             for i in range(0, len(foods), batch_size):
#                 batch = foods[i:i + batch_size]
#                 result = collection.insert_many(batch)
#                 total_inserted += len(result.inserted_ids)
#                 self.logger.info(f"Uploaded batch {i//batch_size + 1}: {len(result.inserted_ids)} documents")
            
#             self.logger.info(f"Total uploaded: {total_inserted} documents to MongoDB")
#             return True
        
#         except Exception as e:
#             self.logger.error(f"MongoDB upload failed: {e}")
#             return False


# def main():
#     """Main execution function with improved error handling."""
#     load_dotenv()
    
#     # Configuration
#     TARGET_URL = "https://dineoncampus.com/utah/whats-on-the-menu"
#     MONGODB_URI = os.getenv("MONGODB_URI")
#     MAX_RETRIES = 3
    
#     # Check for headless mode from environment or command line
#     # HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
#     HEADLESS = True
    
#     # Initialize scraper
#     scraper = DiningHallScraper(TARGET_URL, MONGODB_URI, MAX_RETRIES, headless=HEADLESS)
    
#     try:
#         # Test MongoDB connection
#         if MONGODB_URI:
#             client = MongoClient(MONGODB_URI, server_api=ServerApi('1'), tlsCAFile=certifi.where())
#             client.admin.command('ping')
#             scraper.logger.info("MongoDB connection successful")
        
#         # Scrape data
#         scraped_data = scraper.scrape_all_dining_halls()
        
#         if scraped_data.get("dining_halls"):
#             # Save to JSON with embeddings
#             foods = scraper.save_to_json(scraped_data)
            
#             # Upload to MongoDB
#             if MONGODB_URI and foods:
#                 scraper.upload_to_mongodb(foods)
            
#             scraper.logger.info(f"Scraping process completed successfully - {len(foods)} items processed")
#         else:
#             scraper.logger.warning("No data was scraped")
    
#     except KeyboardInterrupt:
#         scraper.logger.info("Scraping interrupted by user")
#     except Exception as e:
#         scraper.logger.error(f"Main execution failed: {e}")
#         traceback.print_exc()


# if __name__ == "__main__":
#     main()

import time
import datetime
import random
import json
import uuid
import logging
import traceback
import re
import os
from typing import Dict, List, Optional, Any
from contextlib import contextmanager

# Selenium imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import (
    NoSuchElementException, 
    TimeoutException, 
    WebDriverException,
    ElementNotInteractableException,
    StaleElementReferenceException
)
try:
    import undetected_chromedriver as uc
    UC_AVAILABLE = True
except ImportError:
    UC_AVAILABLE = False

# Other imports
import requests
from bs4 import BeautifulSoup
from bs4.element import NavigableString
import certifi
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from sentence_transformers import SentenceTransformer
from fake_useragent import UserAgent


class DiningHallScraper:
    """A robust web scraper for dining hall menu data with simple crash recovery."""
    
    def __init__(self, target_url: str, mongodb_uri: Optional[str] = None, max_retries: int = 3, headless: bool = False):
        self.target_url = target_url
        self.mongodb_uri = mongodb_uri or os.getenv("MONGODB_URI")
        self.max_retries = max_retries
        self.headless = headless
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Ensure directories exist
        os.makedirs("debug_screenshots", exist_ok=True)
        os.makedirs("logs", exist_ok=True)
        
        # Configure logging
        self._setup_logging()
        
        # Dietary icons mapping
        self.dietary_icons = {
            "/img/icon_vegan.png": "Vegan",
            "/img/icon_vegetarian.png": "Vegetarian",
            "/img/icon_protein.png": "Good Source of Protein",
            "/img/howgood-climate-friendly-new.png": "Climate Friendly"
        }
        
        # Nutrient key mappings for standardization
        self.nutrient_key_renames = {
            "saturated_fat_+_trans_fat": "saturated_and_trans_fat",
            "vitamin_a_re": "vitamin_a",
            "calories_from_fat": "calories_from_fat",
        }
        
        # Timeouts and delays
        self.DEFAULT_TIMEOUT = 15 if headless else 10
        self.MODAL_TIMEOUT = 8 if headless else 5
        self.MIN_WAIT = 1.0 if headless else 0.5
        self.MAX_WAIT = 3.0 if headless else 2.0
        
        # Track failed items to avoid infinite loops
        self.failed_items = set()
    
    def _setup_logging(self):
        """Configure logging with both file and console output."""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s",
            handlers=[
                logging.FileHandler("logs/scraper.log", mode="w"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def human_wait(self, min_sec: float = None, max_sec: float = None):
        """Simulate human-like waiting times."""
        min_sec = min_sec or self.MIN_WAIT
        max_sec = max_sec or self.MAX_WAIT
        time.sleep(random.uniform(min_sec, max_sec))
    
    def take_screenshot(self, filename: str):
        """Take a screenshot for debugging."""
        try:
            if hasattr(self, 'driver') and self.driver:
                screenshot_path = f"debug_screenshots/{filename}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                self.driver.save_screenshot(screenshot_path)
                self.logger.info(f"Screenshot saved: {screenshot_path}")
        except Exception as e:
            self.logger.warning(f"Failed to take screenshot: {e}")
    
    def setup_driver(self) -> webdriver.Chrome:
        """Set up Chrome driver with proper headless support."""
        for attempt in range(self.max_retries):
            try:
                self.logger.info(f"Setting up driver (attempt {attempt + 1}, headless={self.headless})")
                
                if self.headless:
                    # Use standard Chrome driver for headless mode
                    return self._setup_standard_chrome()
                else:
                    # Use undetected Chrome for non-headless mode
                    return self._setup_undetected_chrome()
                    
            except Exception as e:
                self.logger.warning(f"Driver setup failed (attempt {attempt+1}): {e}")
                time.sleep(3)
        
        raise RuntimeError(f"Failed to initialize Chrome driver after {self.max_retries} attempts.")
    
    def _setup_standard_chrome(self) -> webdriver.Chrome:
        """Set up standard Chrome driver for headless mode."""
        ua = UserAgent()
        user_agent = ua.random
        
        options = Options()
        
        # Headless configuration
        if self.headless:
            options.add_argument('--headless=new')  # Use new headless mode
            options.add_argument('--disable-gpu')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
        
        # Common options
        options.add_argument(f'--user-agent={user_agent}')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-web-security')
        options.add_argument('--disable-features=VizDisplayCompositor')
        options.add_argument('--disable-extensions')
        options.add_argument('--disable-plugins')
        options.add_argument('--disable-images')  # Speed up loading
        
        # Additional headless-specific options
        if self.headless:
            options.add_argument('--disable-background-timer-throttling')
            options.add_argument('--disable-backgrounding-occluded-windows')
            options.add_argument('--disable-renderer-backgrounding')
            options.add_argument('--disable-background-networking')
        
        # Experimental options
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        driver = webdriver.Chrome(options=options)
        
        # Set timeouts
        driver.implicitly_wait(10)
        driver.set_page_load_timeout(60)
        
        # Apply stealth features if not headless
        if not self.headless:
            self._apply_stealth_features(driver)
        
        return driver
    
    def _setup_undetected_chrome(self) -> webdriver.Chrome:
        """Set up undetected Chrome driver for non-headless mode."""
        if not UC_AVAILABLE:
            self.logger.warning("undetected-chromedriver not available, falling back to standard Chrome")
            return self._setup_standard_chrome()
        
        ua = UserAgent()
        user_agent = ua.random
        
        options = uc.ChromeOptions()
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument(f'--user-agent={user_agent}')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-web-security')
        options.add_argument('--disable-features=VizDisplayCompositor')
        
        driver = uc.Chrome(options=options)
        driver.set_window_size(1920, 1080)
        driver.implicitly_wait(5)
        
        # Apply stealth features
        self._apply_stealth_features(driver)
        return driver
    
    def _apply_stealth_features(self, driver: webdriver.Chrome):
        """Apply additional stealth features to the driver."""
        try:
            # Check if window is still available
            driver.current_url  # This will throw if window is closed
            
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")
            driver.execute_script("Object.defineProperty(navigator, 'deviceMemory', {get: () => 8})")
            driver.execute_script("Object.defineProperty(navigator, 'hardwareConcurrency', {get: () => 4})")
            
        except Exception as e:
            self.logger.warning(f"Failed to apply stealth features: {e}")
    
    def restart_driver(self) -> bool:
        """Simple driver restart - clean and fast."""
        try:
            # Clean shutdown of old driver
            if hasattr(self, 'driver') and self.driver:
                try:
                    self.driver.quit()
                except:
                    pass  # Don't care if quit fails
            
            self.logger.info("Restarting browser...")
            
            # Start fresh driver
            self.driver = self.setup_driver()
            
            # Navigate to main page
            self.driver.get(self.target_url)
            self.human_wait(3, 5)
            
            self.logger.info("Browser restart successful")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to restart driver: {e}")
            return False
    
    def is_crash_related_error(self, error_message: str) -> bool:
        """Detect if an error is browser crash related."""
        crash_indicators = [
            "invalid session",
            "disconnected",
            "not connected to devtools", 
            "browser has closed",
            "session deleted",
            "target window already closed",
            "chrome not reachable"
        ]
        
        error_lower = str(error_message).lower()
        return any(indicator in error_lower for indicator in crash_indicators)
    
    @contextmanager
    def modal_context(self, item_name: str):
        """Context manager for handling modal operations safely."""
        modal_opened = False
        try:
            yield
            modal_opened = True
        except Exception as e:
            self.logger.error(f"Error in modal context for {item_name}: {e}")
            raise
        finally:
            if modal_opened:
                self._force_close_modal(item_name)
    
    def _force_close_modal(self, item_name: str):
        """Force close any open modals using multiple strategies."""
        strategies = [
            # Strategy 1: Click close button
            lambda: self._close_modal_by_button(),
            # Strategy 2: Press ESC key
            lambda: self._close_modal_by_escape(),
            # Strategy 3: Click backdrop
            lambda: self._close_modal_by_backdrop(),
            # Strategy 4: JavaScript force close
            lambda: self._close_modal_by_js(),
        ]
        
        for i, strategy in enumerate(strategies, 1):
            try:
                strategy()
                # Wait a bit to see if modal actually closed
                WebDriverWait(self.driver, 2).until(
                    EC.invisibility_of_element_located((By.CLASS_NAME, "modal"))
                )
                self.logger.debug(f"Modal closed using strategy {i} for {item_name}")
                return
            except TimeoutException:
                continue
            except Exception as e:
                self.logger.debug(f"Strategy {i} failed for {item_name}: {e}")
                continue
        
        self.logger.warning(f"Could not close modal for {item_name} - continuing anyway")
    
    def _close_modal_by_button(self):
        """Close modal using the close button."""
        close_button = self.driver.find_element(By.CSS_SELECTOR, "button[aria-label='Close']")
        close_button.click()
    
    def _close_modal_by_escape(self):
        """Close modal using ESC key."""
        from selenium.webdriver.common.keys import Keys
        self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    
    def _close_modal_by_backdrop(self):
        """Close modal by clicking backdrop."""
        backdrop = self.driver.find_element(By.CSS_SELECTOR, ".modal-backdrop")
        backdrop.click()
    
    def _close_modal_by_js(self):
        """Close modal using JavaScript."""
        self.driver.execute_script("""
            var modals = document.querySelectorAll('.modal');
            modals.forEach(function(modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            });
            var backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(function(backdrop) {
                backdrop.remove();
            });
        """)
    
    def safe_click(self, element, element_name: str = "element", timeout: int = 10) -> bool:
        """Safely click an element with multiple fallback methods and timeout."""
        methods = [
            lambda: element.click(),
            lambda: ActionChains(self.driver).move_to_element(element).pause(0.5).click().perform(),
            lambda: self.driver.execute_script("arguments[0].click();", element),
            lambda: self.driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true}));", element)
        ]
        
        for i, method in enumerate(methods, 1):
            try:
                # Add timeout for each click attempt
                start_time = time.time()
                method()
                
                # Verify click didn't hang
                if time.time() - start_time > timeout:
                    self.logger.warning(f"Click method {i} timed out for {element_name}")
                    continue
                
                self.logger.debug(f"Successfully clicked {element_name} using method {i}")
                return True
                
            except (ElementNotInteractableException, StaleElementReferenceException) as e:
                self.logger.debug(f"Element interaction failed for {element_name} (method {i}): {e}")
                continue
            except Exception as e:
                self.logger.debug(f"Click method {i} failed for {element_name}: {e}")
                continue
        
        self.logger.warning(f"All click methods failed for {element_name}")
        return False
    
    def is_driver_alive(self) -> bool:
        """Check if the driver is still alive and responsive."""
        try:
            if not hasattr(self, 'driver') or not self.driver:
                return False
            
            # Try to get current URL - this will fail if window is closed
            self.driver.current_url
            return True
        except Exception as e:
            self.logger.error(f"Driver is not alive: {e}")
            return False
    
    def extract_nutrition_details(self, item_name: str) -> Dict[str, Any]:
        """Extract nutrition details with simple crash recovery."""
        nutrition_details = {"nutrients": {}, "ingredients": "N/A"}
        
        # Skip if previously failed
        if item_name in self.failed_items:
            self.logger.debug(f"Skipping {item_name} - previously failed")
            return nutrition_details
        
        # Quick driver health check
        if not self.is_driver_alive():
            self.logger.warning(f"Driver not alive for {item_name}, marking as skipped")
            nutrition_details["nutrients"] = {"error": "driver_not_alive"}
            return nutrition_details
        
        try:
            # Build XPath for nutrition button
            item_name_escaped = self._escape_xpath_text(item_name)
            xpath_query = f"//strong[normalize-space()={item_name_escaped}]/following::button[contains(@class, 'btn-nutrition')][1]"
            
            # Wait for and find nutrition button
            try:
                WebDriverWait(self.driver, self.MODAL_TIMEOUT).until(
                    EC.element_to_be_clickable((By.XPATH, xpath_query))
                )
            except TimeoutException:
                self.logger.warning(f"Nutrition button not found for {item_name}")
                return nutrition_details
            
            buttons = self.driver.find_elements(By.XPATH, xpath_query)
            if not buttons:
                self.logger.warning(f"No nutrition button found for item '{item_name}'")
                return nutrition_details
            
            button = buttons[0]
            self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'})", button)
            self.human_wait(0.5, 1.0)
            
            # Use modal context manager
            with self.modal_context(item_name):
                # Click nutrition button
                if not self.safe_click(button, f"nutrition button for {item_name}"):
                    raise Exception(f"Failed to click nutrition button for {item_name}")
                
                self.logger.debug(f"Clicked nutrition button for: {item_name}")
                
                # Wait for modal
                try:
                    WebDriverWait(self.driver, self.MODAL_TIMEOUT).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".modal-body ul"))
                    )
                except TimeoutException:
                    raise Exception(f"Modal did not open for {item_name}")
                
                nutrition_details = self._extract_modal_data()
                self.human_wait(0.3, 0.7)
            
            return nutrition_details
            
        except Exception as e:
            self.logger.error(f"Error extracting nutrition for '{item_name}': {e}")
            
            # Check if this is a crash - if so, mark item as failed and continue
            if self.is_crash_related_error(str(e)):
                self.logger.warning(f"Crash detected during {item_name} - will skip and continue")
                nutrition_details["nutrients"] = {"error": "browser_crash"}
            else:
                # Regular error, mark as failed
                nutrition_details["nutrients"] = {"error": str(e)}
            
            self.failed_items.add(item_name)
            
            # Take screenshot if driver still alive
            if self.is_driver_alive():
                self.take_screenshot(f"error_{item_name.replace(' ', '_')}")
            
            return nutrition_details
    
    def _escape_xpath_text(self, text: str) -> str:
        """Properly escape text for XPath queries."""
        if '"' not in text:
            return f'"{text}"'
        if "'" not in text:
            return f"'{text}'"
        
        # Handle both single and double quotes using concat
        parts = text.split("'")
        return "concat(" + ", '\'', ".join([f"'{part}'" for part in parts]) + ")"
    
    def _extract_modal_data(self) -> Dict[str, Any]:
        """Extract nutrition data from the modal."""
        nutrition_details = {"nutrients": {}, "ingredients": "N/A"}
        
        try:
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            modal_body = soup.find('div', class_='modal-body')
            
            if modal_body:
                # Extract nutrients
                nutrients = {}
                ul_tags = modal_body.find_all('ul')
                
                for ul in ul_tags:
                    for li in ul.find_all('li'):
                        strong_tag = li.find('strong')
                        if strong_tag:
                            label = self._clean_nutrient_label(strong_tag.text.strip())
                            value = self._extract_nutrient_value(strong_tag)
                            
                            if label and value:
                                nutrients[label] = value
                
                nutrition_details["nutrients"] = nutrients
                
                # Extract ingredients
                ingredients = self._extract_ingredients(modal_body)
                if ingredients:
                    nutrition_details["ingredients"] = ingredients
            
        except Exception as e:
            self.logger.error(f"Error extracting modal data: {e}")
        
        return nutrition_details
    
    def _clean_nutrient_label(self, label: str) -> str:
        """Clean and standardize nutrient labels."""
        # Remove parentheses and colons
        label_clean = re.sub(r'\([^)]*\)', '', label)
        label_clean = label_clean.replace(':', '').strip()
        
        # Convert to lowercase with underscores
        label_clean = label_clean.lower().replace(' ', '_')
        label_clean = re.sub(r'_and$', '', label_clean)
        label_clean = re.sub(r'_+', '_', label_clean)
        
        # Apply renames
        return self.nutrient_key_renames.get(label_clean, label_clean)
    
    def _extract_nutrient_value(self, strong_tag) -> str:
        """Extract the value following a nutrient label."""
        texts = []
        for sibling in strong_tag.next_siblings:
            if isinstance(sibling, NavigableString):
                texts.append(str(sibling))
            else:
                break
        return ''.join(texts).strip()
    
    def _extract_ingredients(self, modal_body) -> str:
        """Extract ingredients from modal body."""
        made_with_tag = modal_body.find('strong', string=lambda text: text and "Made with:" in text.strip())
        if made_with_tag:
            texts = []
            for sibling in made_with_tag.next_siblings:
                if isinstance(sibling, NavigableString):
                    texts.append(str(sibling))
                else:
                    break
            return ''.join(texts).strip()
        return "N/A"
    
    def extract_menu_data(self, dining_hall_name: str, meal_type: str) -> List[Dict[str, Any]]:
        """Extract menu data with crash detection."""
        if not self.is_driver_alive():
            self.logger.error(f"Driver not available for menu extraction: {dining_hall_name} - {meal_type}")
            return []
        
        self.logger.info(f"Extracting menu for {dining_hall_name} - {meal_type}")
        
        try:
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            menu_tables = soup.find_all('table', class_='menu-items')
            
            stations_data = []
            
            for idx, table in enumerate(menu_tables):
                # Get station name
                caption_tag = table.find('caption')
                station_name = caption_tag.text.strip() if caption_tag else f"Station {idx + 1}"
                
                items_in_station = []
                rows = table.find('tbody').find_all('tr') if table.find('tbody') else []
                
                for row_idx, row in enumerate(rows):
                    try:
                        # Health check every 5 items
                        if row_idx % 5 == 0 and not self.is_driver_alive():
                            self.logger.error(f"Driver died during {station_name} - stopping station processing")
                            break
                        
                        item_data = self._extract_item_from_row(row)
                        if item_data:
                            items_in_station.append(item_data)
                            self.human_wait(0.8, 1.5)  # Reasonable wait time
                    
                    except Exception as e:
                        self.logger.error(f"Error processing row {row_idx} in {station_name}: {e}")
                        
                        # If it's a crash, stop processing this station
                        if self.is_crash_related_error(str(e)):
                            self.logger.warning(f"Crash detected in {station_name}, stopping station")
                            break
                        
                        # Otherwise continue with next item
                        continue
                
                if items_in_station:
                    stations_data.append({
                        "name": station_name,
                        "items": items_in_station
                    })
            
            return stations_data
            
        except Exception as e:
            self.logger.error(f"Error extracting menu data: {e}")
            return []
    
    def _extract_item_from_row(self, row) -> Optional[Dict[str, Any]]:
        """Extract item data from a table row."""
        item_td = row.find('td', {'data-label': 'Menu item'})
        portion_td = row.find('td', {'data-label': 'Portion'})
        
        if not item_td:
            return None
        
        # Extract item name
        item_name_wrapper = item_td.find('span', class_=lambda x: x and x.startswith('category-items_itemNameWrapper'))
        if item_name_wrapper:
            strong_tag = item_name_wrapper.find('strong')
            item_name = strong_tag.text.strip() if strong_tag else "N/A"
        else:
            item_name = "N/A"
        
        if item_name == "N/A":
            return None
        
        # Extract portion size
        portion_size = "1 serving"  # default
        if portion_td:
            portion_div = portion_td.find('div')
            portion_size = portion_div.text.strip() if portion_div else portion_td.text.strip()
        
        # Extract dietary labels
        labels = []
        for icon_path, preference_name in self.dietary_icons.items():
            if item_td.find('img', src=icon_path):
                labels.append(preference_name)
        
        # Get nutrition information - with error handling
        try:
            nutrition_info = self.extract_nutrition_details(item_name)
        except Exception as e:
            self.logger.error(f"Failed to get nutrition for {item_name}: {e}")
            nutrition_info = {"nutrients": {"error": str(e)}, "ingredients": "N/A"}
        
        # Process ingredients
        raw_ingredients = nutrition_info.get("ingredients", "N/A")
        ingredients_list = []
        if raw_ingredients and raw_ingredients != "N/A":
            ingredients_list = [i.strip().replace('^', '') for i in raw_ingredients.split(',') if i.strip()]
        
        return {
            "name": item_name,
            "description": "",
            "labels": labels,
            "ingredients": ingredients_list,
            "portion_size": portion_size,
            "nutrients": nutrition_info.get("nutrients", {})
        }
    
    def _process_dining_hall_with_recovery(self, dining_hall_name: str) -> List[Dict[str, Any]]:
        """Process dining hall with simple crash recovery."""
        max_attempts = 3
        
        for attempt in range(max_attempts):
            try:
                self.logger.info(f"Processing {dining_hall_name} (attempt {attempt + 1})")
                
                # Check driver health before starting
                if not self.is_driver_alive():
                    self.logger.warning("Driver not alive, restarting...")
                    if not self.restart_driver():
                        self.logger.error("Could not restart driver")
                        continue  # Try next attempt
                
                # Process the dining hall
                return self._process_dining_hall(dining_hall_name)
                
            except Exception as e:
                self.logger.error(f"Attempt {attempt + 1} failed for {dining_hall_name}: {e}")
                
                # If this is a crash-related error, restart driver
                if self.is_crash_related_error(str(e)):
                    self.logger.info(f"Browser crash detected for {dining_hall_name}, restarting...")
                    if attempt < max_attempts - 1:  # Not the last attempt
                        if self.restart_driver():
                            self.logger.info("Driver restarted successfully, retrying...")
                            continue
                        else:
                            self.logger.error("Failed to restart driver")
                            break
                else:
                    # Non-crash error, wait a bit and retry
                    if attempt < max_attempts - 1:
                        self.logger.info(f"Non-crash error, waiting before retry...")
                        self.human_wait(2, 4)
                        continue
        
        self.logger.error(f"All attempts failed for {dining_hall_name}")
        return []
    
    def scrape_all_dining_halls(self) -> Dict[str, Any]:
        """Main scraping method with simple crash recovery."""
        self.logger.info(f"Starting scrape of {self.target_url} (headless={self.headless})")
        
        self.driver = None
        all_dining_hall_data = {
            "date": datetime.date.today().isoformat(),
            "dining_halls": []
        }
        
        try:
            # Initial driver setup
            self.driver = self.setup_driver()
            
            if not self.is_driver_alive():
                raise RuntimeError("Driver failed to initialize properly")
            
            self.driver.get(self.target_url)
            self.human_wait(5, 8)
            
            if not self.is_driver_alive():
                raise RuntimeError("Driver died after loading page")
            
            # Get all dining hall names
            dining_hall_names = self._get_dining_hall_names()
            if not dining_hall_names:
                self.logger.error("No dining halls found")
                return all_dining_hall_data
            
            self.logger.info(f"Found {len(dining_hall_names)} dining halls to process")
            
            # Process each dining hall with recovery
            for idx, dining_hall_name in enumerate(dining_hall_names):
                try:
                    self.logger.info(f"Processing dining hall {idx + 1}/{len(dining_hall_names)}: {dining_hall_name}")
                    
                    # Clear failed items for each dining hall
                    self.failed_items.clear()
                    
                    # Use recovery version
                    meals_data = self._process_dining_hall_with_recovery(dining_hall_name)
                    
                    if meals_data:
                        all_dining_hall_data["dining_halls"].append({
                            "name": dining_hall_name,
                            "meals": meals_data
                        })
                        self.logger.info(f"✓ Successfully processed {dining_hall_name}")
                        
                        # Save progress checkpoint
                        self._save_progress_checkpoint(all_dining_hall_data, idx + 1)
                    else:
                        self.logger.warning(f"✗ No meals found for {dining_hall_name}")
                    
                except Exception as e:
                    self.logger.error(f"✗ Failed to process {dining_hall_name}: {e}")
                    
                    # If it's a crash, try to restart for next dining hall
                    if self.is_crash_related_error(str(e)):
                        self.logger.info("Crash detected, restarting for next dining hall...")
                        if not self.restart_driver():
                            self.logger.error("Could not restart driver, stopping scrape")
                            break
                    
                    # Take screenshot if driver is alive
                    if self.is_driver_alive():
                        self.take_screenshot(f"error_{dining_hall_name.replace(' ', '_')}")
                    
                    continue
            
            self.logger.info("Scraping completed successfully")
            return all_dining_hall_data
            
        except Exception as e:
            self.logger.error(f"Scraping failed: {e}")
            traceback.print_exc()
            
            if self.is_driver_alive():
                self.take_screenshot("critical_error")
                
            return all_dining_hall_data
            
        finally:
            # Clean shutdown
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
                self.logger.info("Driver session closed")
    
    def _save_progress_checkpoint(self, data: Dict[str, Any], hall_number: int):
        """Save progress after each dining hall."""
        try:
            filename = f"progress_after_{hall_number}_halls.json"
            with open(filename, "w") as f:
                json.dump(data, f, indent=2)
            
            # Also save a summary
            summary = {
                "completed_halls": len(data["dining_halls"]),
                "total_items": sum(
                    len(item) 
                    for hall in data["dining_halls"] 
                    for meal in hall["meals"] 
                    for station in meal["stations"] 
                    for item in station["items"]
                ),
                "last_completed": data["dining_halls"][-1]["name"] if data["dining_halls"] else None,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            with open("scrape_progress_summary.json", "w") as f:
                json.dump(summary, f, indent=2)
                
            self.logger.info(f"✓ Progress saved: {summary['completed_halls']} halls, {summary['total_items']} items")
            
        except Exception as e:
            self.logger.warning(f"Failed to save progress: {e}")
    
    def _get_dining_hall_names(self) -> List[str]:
        """Get list of all available dining halls."""
        try:
            dropdown_button = WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
                EC.element_to_be_clickable((By.ID, "menu-location-selector__BV_toggle_"))
            )
            
            dropdown_button.click()
            dropdown_menu = WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, ".dropdown-menu.show"))
            )
            
            # Wait for buttons to load
            WebDriverWait(dropdown_menu, self.DEFAULT_TIMEOUT).until(
                lambda d: len(dropdown_menu.find_elements(By.TAG_NAME, "button")) > 0
            )
            
            # Extract dining hall names
            buttons = dropdown_menu.find_elements(By.TAG_NAME, "button")
            dining_hall_names = []
            seen = set()
            
            for btn in buttons:
                name = btn.text.strip()
                if name and name not in seen:
                    dining_hall_names.append(name)
                    seen.add(name)
            
            dropdown_button.click()  # Close dropdown
            self.logger.info(f"Found {len(dining_hall_names)} dining halls")
            return dining_hall_names
        
        except Exception as e:
            self.logger.error(f"Error getting dining hall names: {e}")
            return []
    
    def _process_dining_hall(self, dining_hall_name: str) -> List[Dict[str, Any]]:
        """Process a single dining hall and extract all meal data."""
        meals_data = []
        
        try:
            # Select dining hall
            if not self._select_dining_hall(dining_hall_name):
                return meals_data
            
            # Wait for meal tabs to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".nav.nav-tabs"))
            )
            
            # Get meal tab names
            meal_tabs = self._get_meal_tabs()
            
            # Process each meal
            for meal_name in meal_tabs:
                try:
                    if not self.is_driver_alive():
                        self.logger.error("Driver died during meal processing")
                        break
                    
                    self.logger.info(f"Processing meal: {meal_name}")
                    
                    if self._select_meal_tab(meal_name):
                        stations_data = self.extract_menu_data(dining_hall_name, meal_name)
                        
                        if stations_data:
                            meals_data.append({
                                "meal_name": meal_name,
                                "stations": stations_data
                            })
                
                except Exception as e:
                    self.logger.error(f"Error processing meal {meal_name}: {e}")
                    continue
        
        except Exception as e:
            self.logger.error(f"Error processing dining hall {dining_hall_name}: {e}")
        
        return meals_data
    
    def _select_dining_hall(self, dining_hall_name: str) -> bool:
        """Select a specific dining hall from the dropdown."""
        try:
            dropdown_button = WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
                EC.element_to_be_clickable((By.ID, "menu-location-selector__BV_toggle_"))
            )
            
            if not self.safe_click(dropdown_button, "dropdown button"):
                return False
            
            dropdown_menu = WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, ".dropdown-menu.show"))
            )
            
            # Find and click target button
            target_button = WebDriverWait(dropdown_menu, self.DEFAULT_TIMEOUT).until(
                EC.element_to_be_clickable((By.XPATH, f".//button[normalize-space()='{dining_hall_name}']"))
            )
            
            if not self.safe_click(target_button, f"dining hall button for {dining_hall_name}"):
                return False
            
            self.human_wait(3, 4)
            
            # Verify menu tables are present
            WebDriverWait(self.driver, self.DEFAULT_TIMEOUT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "table.menu-items"))
            )
            
            return True
        
        except Exception as e:
            self.logger.error(f"Error selecting dining hall {dining_hall_name}: {e}")
            return False
    
    def _get_meal_tabs(self) -> List[str]:
        """Get list of available meal tabs."""
        try:
            meal_container = self.driver.find_element(By.CSS_SELECTOR, ".nav.nav-tabs")
            tab_elements = meal_container.find_elements(By.TAG_NAME, "li")
            
            meal_names = []
            for tab in tab_elements:
                tab_link = tab.find_element(By.TAG_NAME, "a")
                meal_names.append(tab_link.text.strip())
            
            return meal_names
        
        except Exception as e:
            self.logger.error(f"Error getting meal tabs: {e}")
            return []
    
    def _select_meal_tab(self, meal_name: str) -> bool:
        """Select a specific meal tab."""
        try:
            tab_button = WebDriverWait(self.driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, f"//ul[contains(@class, 'nav-tabs')]/li/a[normalize-space()='{meal_name}']"))
            )
            
            if not self.safe_click(tab_button, f"meal tab for {meal_name}"):
                return False
            
            # Wait for content to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "table.menu-items tbody tr"))
            )
            
            return True
        
        except Exception as e:
            self.logger.error(f"Error selecting meal tab {meal_name}: {e}")
            return False
    
    def generate_embedding_text(self, food: Dict[str, Any]) -> str:
        """Generate text for semantic embedding."""
        name = food.get("name", "")
        portion = food.get("portion_size", "")
        labels = ", ".join(food.get("labels", []))
        ingredients = ", ".join(food.get("ingredients", []))
        meal = food.get("meal_name", "")
        station = food.get("station", "")
        hall = food.get("dining_hall", "")
        
        nutrients = food.get("nutrients", {})
        calories = nutrients.get("calories", "")
        protein = nutrients.get("protein", "")
        carbs = nutrients.get("total_carbohydrates", "")
        fat = nutrients.get("total_fat", "")
        
        return (
            f"{name}, {portion}. "
            f"Labels: {labels}. "
            f"Ingredients: {ingredients}. "
            f"Meal: {meal}, Station: {station}, Dining Hall: {hall}. "
            f"Nutrition: {calories} calories, {protein}g protein, {carbs}g carbs, {fat}g fat."
        )
    
    def save_to_json(self, data: Dict[str, Any], filename: str = "foods.json") -> List[Dict[str, Any]]:
        """Save scraped data to JSON with embeddings."""
        foods = []
        date = data.get("date")
        
        for hall in data.get("dining_halls", []):
            dining_hall_id = str(uuid.uuid4())
            
            for meal in hall.get("meals", []):
                for station in meal.get("stations", []):
                    station_id = str(uuid.uuid4())
                    
                    for item in station.get("items", []):
                        food_doc = item.copy()
                        food_doc.update({
                            "dining_hall": hall["name"],
                            "dining_hall_id": dining_hall_id,
                            "meal_name": meal["meal_name"],
                            "station": station["name"],
                            "station_id": station_id,
                            "date": date
                        })
                        
                        # Generate embedding
                        embedding_text = self.generate_embedding_text(food_doc)
                        food_doc["embedding"] = self.model.encode(embedding_text).tolist()
                        
                        foods.append(food_doc)
        
        # Save to file
        with open(filename, "w") as f:
            json.dump(foods, f, indent=2)
        
        self.logger.info(f"Saved {len(foods)} foods to {filename}")
        return foods
    
    def upload_to_mongodb(self, foods: List[Dict[str, Any]]) -> bool:
        """Upload foods data to MongoDB."""
        if not self.mongodb_uri:
            self.logger.warning("MongoDB URI not provided")
            return False
        
        try:
            client = MongoClient(self.mongodb_uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
            db = client["nutritionapp"]
            collection = db["foods"]
            
            # Clear existing data for today
            today = datetime.date.today().isoformat()
            collection.delete_many({"date": today})
            
            # Insert new data in batches to avoid memory issues
            batch_size = 100
            total_inserted = 0
            
            for i in range(0, len(foods), batch_size):
                batch = foods[i:i + batch_size]
                result = collection.insert_many(batch)
                total_inserted += len(result.inserted_ids)
                self.logger.info(f"Uploaded batch {i//batch_size + 1}: {len(result.inserted_ids)} documents")
            
            self.logger.info(f"Total uploaded: {total_inserted} documents to MongoDB")
            return True
        
        except Exception as e:
            self.logger.error(f"MongoDB upload failed: {e}")
            return False


def main():
    """Main execution function with improved error handling."""
    load_dotenv()
    
    # Configuration
    TARGET_URL = "https://dineoncampus.com/utah/whats-on-the-menu"
    MONGODB_URI = os.getenv("MONGODB_URI")
    MAX_RETRIES = 3
    
    # Check for headless mode from environment or command line
    # HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
    HEADLESS = True
    
    # Initialize scraper
    scraper = DiningHallScraper(TARGET_URL, MONGODB_URI, MAX_RETRIES, headless=HEADLESS)
    
    try:
        # Test MongoDB connection
        if MONGODB_URI:
            client = MongoClient(MONGODB_URI, server_api=ServerApi('1'), tlsCAFile=certifi.where())
            client.admin.command('ping')
            scraper.logger.info("MongoDB connection successful")
        
        # Scrape data
        scraped_data = scraper.scrape_all_dining_halls()
        
        if scraped_data.get("dining_halls"):
            # Save to JSON with embeddings
            foods = scraper.save_to_json(scraped_data)
            
            # Upload to MongoDB
            if MONGODB_URI and foods:
                scraper.upload_to_mongodb(foods)
            
            scraper.logger.info(f"Scraping process completed successfully - {len(foods)} items processed")
        else:
            scraper.logger.warning("No data was scraped")
    
    except KeyboardInterrupt:
        scraper.logger.info("Scraping interrupted by user")
    except Exception as e:
        scraper.logger.error(f"Main execution failed: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
               

