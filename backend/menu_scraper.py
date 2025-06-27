import time
import datetime
import random

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By


import requests
from bs4 import BeautifulSoup
from bs4.element import NavigableString


from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC # Not needed for just connection test
from selenium.common.exceptions import NoSuchElementException, TimeoutException

import re

import os
import certifi
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

import json

from sentence_transformers import SentenceTransformer
from selenium_stealth import stealth
from fake_useragent import UserAgent

import undetected_chromedriver as uc
from selenium.webdriver.common.action_chains import ActionChains


# --- Configuration ---
TARGET_URL = "https://dineoncampus.com/utah/whats-on-the-menu"


# --- Scraper Function for Connection Test ---

def human_wait(min_sec=1.5, max_sec=4.5):
    time.sleep(random.uniform(min_sec, max_sec))

def build_xpath_for_item_name(item_name):
    """
    Build an XPath for a strong tag with the given item_name, handling single quotes in the name.
    Uses double quotes in XPath if the name contains a single quote.
    """
    if "'" in item_name:
        return (
            f'//strong[normalize-space()="{item_name}"]'
            f'/ancestor::td[@data-label="Menu item"]'
            f'//button[contains(@class, "btn-nutrition")]'
        )
    else:
        return (
            f"//strong[normalize-space()='{item_name}']"
            f"/ancestor::td[@data-label='Menu item']"
            f"//button[contains(@class, 'btn-nutrition')]"
        )

def _extract_nutrition_details_for_item(driver, item_name):
    nutrition_details = {"nutrients": {}, "ingredients": "N/A"}
    for attempt in range(2):
        try:
            # Use the robust XPath builder
            xpath_query = build_xpath_for_item_name(item_name)
            print(f"   Looking for button with XPath: {xpath_query}")
            selenium_nutrition_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, xpath_query))
            )
            selenium_nutrition_button.click()
            print(f"   Clicked Nutritional Info button for: {item_name}")
            break
        except (NoSuchElementException, TimeoutException) as e:
            print(f"Failed to find or click nutrition button for {item_name}: {e}")
            if attempt == 0:
                human_wait(3, 5)
            else:
                return {"nutrients": {"error": f"Button not found or clickable: {str(e)}"}, "ingredients": "N/A"}


    # 1. Wait until nutrition info pops up
    try:
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, "modal-content"))
        )
        print("   Nutrition modal popped up.")
    except TimeoutException as e:
        print(f"Nutrition modal did not pop up for {item_name} within timeout: {e}")
        return {"nutrients": {"error": f"Modal did not appear: {str(e)}"}, "ingredients": "N/A"}


    # 2. Extract detailed nutritional data
    nutrition_details_html = driver.page_source
    nutrition_soup = BeautifulSoup(nutrition_details_html, 'html.parser')
   
    modal_body = nutrition_soup.find('div', class_='modal-body')
    if modal_body:
        nutrients = {}
        ul_tags = modal_body.find_all('ul')
        for ul in ul_tags:
            for li in ul.find_all('li'):
                strong_tag = li.find('strong')
                if strong_tag:
                    label = strong_tag.text.strip()
                    # Standardize key: remove colons, parentheses, units, and convert to snake_case
                    label_clean = re.sub(r'\([^)]*\)', '', label)  # Remove parentheses and contents
                    label_clean = label_clean.replace(':', '')      # Remove colons
                    label_clean = label_clean.strip()
                    label_clean = label_clean.lower().replace(' ', '_') # snake_case
                    # Remove trailing underscores (if any)
                    label_clean = re.sub(r'_and$', '', label_clean)
                    texts = []
                    for sibling in strong_tag.next_siblings:
                        if isinstance(sibling, NavigableString):
                            texts.append(str(sibling))
                        else:
                            break # Stop if another tag is encountered
                    # Mapping for problematic keys
                    NUTRIENT_KEY_RENAMES = {
                        "saturated_fat_+_trans_fat": "saturated_and_trans_fat",
                        "vitamin_a_re": "vitamin_a",
                        "calories_from_fat": "calories_from_fat",
                    }
                    label_clean = re.sub(r'_+', '_', label_clean)  # Collapse multiple underscores
                    # Apply mapping if key is in renames
                    label_final = NUTRIENT_KEY_RENAMES.get(label_clean, label_clean)
                    value = ''.join(texts).strip()
                    if label_final and value:
                        nutrients[label_final] = value
        nutrition_details["nutrients"] = nutrients


        # Extract "Made with:" ingredients if present
        made_with_strong_tag = modal_body.find('strong', string=lambda text: text and "Made with:" in text.strip())
        if made_with_strong_tag:
            made_with_texts = []
            for sibling in made_with_strong_tag.next_siblings:
                if isinstance(sibling, NavigableString):
                    made_with_texts.append(str(sibling))
                else:
                    break # Stop if another tag is encountered
            ingredients_text = ''.join(made_with_texts).strip()
            if ingredients_text:
                nutrition_details["ingredients"] = ingredients_text

    print("   Extracted data from modal.")


    # 3. Click the button to close the nutrition info pop-up
    try:
        close_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Close'][class='close']"))
        )
        close_button.click()
        print("   Closed nutrition modal.")
       
        # Wait for the modal to disappear to ensure control returns to main page
        WebDriverWait(driver, 10).until(
            EC.invisibility_of_element_located((By.CLASS_NAME, "modal-content"))
        )
        print("   Nutrition modal disappeared.")
    except (NoSuchElementException, TimeoutException) as e:
        print(f" Failed to find or click close button for {item_name} or modal did not disappear: {e}")
        return {"nutrients": {"error": f"Close button issue or modal persistent: {str(e)}"}, "ingredients": "N/A"}


    except Exception as e:
        print(f" An unexpected error occurred while extracting nutrition details for {item_name}: {e}")
        return {"nutrients": {"error": str(e)}, "ingredients": "N/A"}
    return nutrition_details


def getMenu(driver, dining_hall_name, meal_type):
   print("inside getMenu")
   html_content = driver.page_source
   soup = BeautifulSoup(html_content, 'html.parser')

   # This will hold the stations and their items for the current meal type
   stations_data = []

   # Find all menu tables, which are identified by the class 'menu-items'
   menu_tables = soup.find_all('table', class_='menu-items')
   print(f"Found {len(menu_tables)} menu tables for {dining_hall_name} {meal_type}")

   DIETARY_ICONS = {
       "/img/icon_vegan.png": "Vegan",
       "/img/icon_vegetarian.png": "Vegetarian",
       "/img/icon_protein.png": "Good Source of Protein",
       "/img/howgood-climate-friendly-new.png": "Climate Friendly"
   }

   for idx, table in enumerate(menu_tables):
       print(f"--- Menu Table {idx} HTML ---")
       print(table.prettify())

       caption_tag = table.find('caption')
       if caption_tag:
           station_name = caption_tag.text.strip()
       else:
           station_name = "Unknown Station"

       items_in_station = []

       # Find all rows in the table body, skipping the header row if present
       for row in table.find('tbody').find_all('tr'):
           print("--- Row HTML ---")
           print(row.prettify())
           # Find td elements by their data-label attribute
           item_td = row.find('td', {'data-label': 'Menu item'})
           portion_td = row.find('td', {'data-label': 'Portion'})

           portion_size = None
           if portion_td:
                portion_div = portion_td.find('div')
                if portion_div:
                    portion_size = portion_div.text.strip()
                else:
                    portion_size = portion_td.text.strip()
           else:
                portion_size = "1 serving"  # fallback default

           if item_td: # Ensure item cell is found
               item_name_wrapper = item_td.find('span', class_='category-items_itemNameWrapper_zaBfp')
               if item_name_wrapper:
                   strong_tag = item_name_wrapper.find('strong', class_='menu-item')
                   if strong_tag:
                       item_name = strong_tag.text.strip()
                   else:
                       item_name = "N/A"
               else:
                   item_name = "N/A"

               # Dietary preferences are now 'labels'
               labels = []
               for icon_path, preference_name in DIETARY_ICONS.items():
                   if item_td.find('img', src=icon_path):
                       labels.append(preference_name)

               # Get nutrition details (including ingredients and nutrients)
               print(f"   Attempting to get nutrition details for: {item_name}")
               nutrition_info = _extract_nutrition_details_for_item(driver, item_name)

               # Parse ingredients into a list, remove '^' symbol
               raw_ingredients = nutrition_info.get("ingredients", "N/A")
               if raw_ingredients and raw_ingredients != "N/A":
                   ingredients_list = [i.strip().replace('^', '') for i in raw_ingredients.split(',') if i.strip()]
               else:
                   ingredients_list = []

               items_in_station.append({
                   "name": item_name,
                   "description": "",
                   "labels": labels,
                   "ingredients": ingredients_list,
                   "portion_size": portion_size,
                   "nutrients": nutrition_info.get("nutrients", {})
               })

           # Add a short randomized delay inside the item loop
           human_wait(1.5, 3.0)  # Increased wait time in item loop

       if items_in_station: # Only add station if it has items
           stations_data.append({
               "name": station_name,
               "items": items_in_station
           })

   print(f"getMenu: stations_data for {dining_hall_name} {meal_type} = {stations_data}")
   return stations_data


def extract_data(driver, dining_hall_name):
    meals_data = []
    try:
        # Wait for the meal filter tabs container to be present
        meal_filter_container = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "nav.nav-tabs"))
        )
        print("Meal filter tabs container found.")

        # Find all individual meal filter tabs (li elements)
        initial_meal_tabs_elements = meal_filter_container.find_elements(By.TAG_NAME, "li")
        # Collect the names of the meal tabs first to avoid StaleElementReferenceException
        meal_tab_names = []
        for tab in initial_meal_tabs_elements:
            tab_link = tab.find_element(By.TAG_NAME, "a")
            meal_tab_names.append(tab_link.text.strip())

        for tab_name in meal_tab_names:
            print(f" Clicking meal tab: {tab_name}")
            # Re-locate the tab button for the current tab_name to avoid staleness
            tab_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, f"//ul[contains(@class, 'nav-tabs')]/li/a[normalize-space()='{tab_name}']"))
            )
            tab_button.click()
            print(f"Clicked tab: {tab_name}, waiting for content to load...")
            human_wait(4, 7)  # Increased wait time after clicking tab

            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "row.menu-period-dropdowns"))
            )
            print(f" --- Extracting data for {tab_name} ---")

            # Get menu for this meal tab
            stations = getMenu(driver, dining_hall_name, tab_name)
            print(f"getMenu returned for {dining_hall_name} {tab_name}: {stations}")

            if stations: # Only add meal type if it has stations/items
                meals_data.append({
                    "meal_name": tab_name,
                    "stations": stations
                })
            # break # Remove or comment out for full scraping

    except Exception as e:
        print("Error finding meal filter tabs container or processing tabs:", e)
        return [] # Return empty list on error

    print(f"extract_data: meals_data for {dining_hall_name} = {meals_data}")
    return meals_data


# Cache the embedding model globally
model = SentenceTransformer('all-MiniLM-L6-v2')

def setup_stealth_driver():
    ua = UserAgent()
    user_agent = ua.random  # Or specify a manual string if you prefer
    options = uc.ChromeOptions()
    # options.add_argument('--headless=new')  # Uncomment for headless mode
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument(f'--user-agent={user_agent}')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    driver = None
    for attempt in range(3):
        try:
            driver = uc.Chrome(options=options)
            driver.set_window_size(1920, 1080)
            break
        except Exception as e:
            print(f"Driver setup failed (attempt {attempt+1}): {e}")
            time.sleep(3)
    if driver is None:
        raise RuntimeError("Failed to initialize undetected_chromedriver after 3 attempts.")
    return driver

def apply_stealth_features(driver):
    # 1. Set navigator.webdriver = false
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")
    # 2. Set deviceMemory
    driver.execute_script("Object.defineProperty(navigator, 'deviceMemory', {get: () => 8})")
    # 3. Simulate human-like scrolling
    driver.execute_script("window.scrollBy(0, 500)")
    human_wait(0.5, 1.2)
    # 4. Simulate slight mouse movement
    actions = ActionChains(driver)
    actions.move_by_offset(10, 10).perform()
    human_wait(0.2, 0.5)

def scrape_full_menu_data(url):
    print(f"Attempting to connect ChromeDriver to {url}...")
    driver = None
    all_dining_hall_data = {
        "date": datetime.date.today().isoformat(),
        "dining_halls": []
    }
    try:
        driver = setup_stealth_driver()
        driver.get(url)
        apply_stealth_features(driver)
        human_wait(5, 8)

        # Collect all dining hall names
        all_dining_hall_names = []
        try:
            dropdown_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "menu-location-selector__BV_toggle_"))
            )
            dropdown_button.click()

            dropdown_menu = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "dropdown-menu.show"))
            )

            # Find all list items directly under the dropdown menu
            # These can be headers or direct dining hall buttons or contain uls with dining halls
            all_li_elements = dropdown_menu.find_elements(By.XPATH, "./li")

            for li_element in all_li_elements:
                # Check if it's a direct dining hall button
                try:
                    button = li_element.find_element(By.TAG_NAME, "button")
                    all_dining_hall_names.append(button.text.strip())
                except NoSuchElementException:
                    # If not a direct button, check for a nested ul (common for categories like "Resident Dining")
                    try:
                        nested_ul = li_element.find_element(By.TAG_NAME, "ul")
                        nested_buttons = nested_ul.find_elements(By.TAG_NAME, "button")
                        for button in nested_buttons:
                            all_dining_hall_names.append(button.text.strip())
                    except NoSuchElementException:
                        pass # This li element is neither a button nor contains a ul of buttons

            dropdown_button.click() # Close the dropdown after collecting names
            print(f"Collected {len(all_dining_hall_names)} dining halls: {all_dining_hall_names}")

        except Exception as e:
            print(f" Error collecting dining hall names: {e}")
            return False

        # --- Second Pass: Iterate and click each dining hall by name ---
        for dining_hall_name in all_dining_hall_names:
            print(f"--- Processing Dining Hall: {dining_hall_name} ---")
            try:
                # Reopen dropdown before each click
                dropdown_button = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.ID, "menu-location-selector__BV_toggle_"))
                )
                dropdown_button.click()

                # Wait for the dropdown menu to be visible again
                dropdown_menu = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "dropdown-menu.show"))
                )

                # Find the specific dining hall button by its text within the re-fetched dropdown
                target_button = WebDriverWait(dropdown_menu, 10).until(
                    EC.element_to_be_clickable((By.XPATH, f".//button[normalize-space()='{dining_hall_name}']"))
                )

                print(f" Clicking: {dining_hall_name}")
                target_button.click()
               
                # Call extract_data after clicking and content loads
                meals_for_dining_hall = extract_data(driver, dining_hall_name)
               
                if meals_for_dining_hall:
                    all_dining_hall_data["dining_halls"].append({
                        "name": dining_hall_name,
                        "meals": meals_for_dining_hall
                    })
                break # Added for faster testing: Process only the first dining hall

            except Exception as e:
                print(f" Failed to process {dining_hall_name}: {e}")
                # Continue to the next dining hall even if one fails
                continue

        print(f"Successfully connected to {url} and processed all dining halls.")
        print("--- ALL EXTRACTED MENU DATA ---")
        print(json.dumps(all_dining_hall_data, indent=4))
        return all_dining_hall_data

    except Exception as e:
        print(f" Failed to connect ChromeDriver to {url}: {e}")
        return False
    finally:
        if driver:
            driver.quit()
            print("ChromeDriver session closed.")

           
def generate_embedding_text(food: dict) -> str:
    """
    Creates a rich semantic summary of a food item for embedding.
    """
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

def compute_food_embedding(food, model):
    text = generate_embedding_text(food)
    return model.encode(text).tolist()

def save_foods_to_json(all_dining_hall_data, model, filename="foods.json"):
    import uuid  # Ensure uuid is imported
    foods = []
    date = all_dining_hall_data.get("date")  # Get the date from the top-level dict
    for hall in all_dining_hall_data.get("dining_halls", []):
        dining_hall_id = str(uuid.uuid4())
        for meal in hall.get("meals", []):
            for station in meal.get("stations", []):
                station_id = str(uuid.uuid4())
                for item in station.get("items", []):
                    food_doc = item.copy()
                    food_doc["dining_hall"] = hall["name"]
                    food_doc["dining_hall_id"] = dining_hall_id
                    food_doc["meal_name"] = meal["meal_name"]
                    food_doc["station"] = station["name"]
                    food_doc["station_id"] = station_id
                    food_doc["date"] = date
                    # Compute and add embedding
                    food_doc["embedding"] = compute_food_embedding(food_doc, model)
                    foods.append(food_doc)
    with open(filename, "w") as f:
        json.dump(foods, f, indent=4)
    print(f"Saved {len(foods)} foods to {filename}")


# --- Utility: Upload foods.json to MongoDB ---
def upload_foods_to_mongodb(json_file="foods.json"):
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("MONGODB_URI not set in environment.")
        return
    try:
        client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
        db = client["nutritionapp"]
        collection = db["foods"]
        with open(json_file, "r") as f:
            data = json.load(f)
        if isinstance(data, list):
            result = collection.insert_many(data)
            print(f"Inserted {len(result.inserted_ids)} documents into 'foods' collection.")
        else:
            result = collection.insert_one(data)
            print("Inserted 1 document into 'foods' collection.")
    except Exception as e:
        print("Failed to upload foods to MongoDB:", e)


# --- Main Execution ---
if __name__ == "__main__":
    load_dotenv() 
    uri = os.getenv("MONGODB_URI")
    try:
        client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())
        client.admin.command('ping')
        print("Databases:", client.list_database_names())
    except Exception as e:
        print("MongoDB connection failed:", e)

    # Scrape and save foods
    all_dining_hall_data = None
    try:
        all_dining_hall_data = scrape_full_menu_data(TARGET_URL)
    except Exception as e:
        print("Scraping failed:", e)
    if all_dining_hall_data and isinstance(all_dining_hall_data, dict):
        save_foods_to_json(all_dining_hall_data, model, "foods.json")
        upload_foods_to_mongodb("foods.json")
        print("Scraping and upload complete.")
    else:
        print("No data scraped or scraping failed.")




