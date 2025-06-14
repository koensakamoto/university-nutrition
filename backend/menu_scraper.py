import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

import requests
from bs4 import BeautifulSoup

from selenium.webdriver.support.ui import WebDriverWait 
from selenium.webdriver.support import expected_conditions as EC # Not needed for just connection test

# --- Configuration ---
TARGET_URL = "https://dineoncampus.com/utah/whats-on-the-menu"

# --- Scraper Function for Connection Test -

def extract_data(driver):
    print("inside extract_data")
    try:
        # Wait for the meal filter tabs to be present, indicating content has loaded
        meal_filter = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "nav.nav-tabs"))
        )
        print("Meal filter tabs found, content likely loaded.")

    except Exception as e:
        print("❌ Error clicking dinner tab:", e)

    return True


def test_chromedriver_connection(url):
    print(f"Attempting to connect ChromeDriver to {url}...")
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Consider enabling for production
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = None
    try:
        driver = webdriver.Chrome(
            service=ChromeService(ChromeDriverManager().install()), options=options
        )
        driver.get(url)
        time.sleep(12)  # Initial wait for the page to load completely

        # --- First Pass: Collect all dining hall names ---
        all_dining_hall_names = []
        try:
            dropdown_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "menu-location-selector__BV_toggle_"))
            )
            dropdown_button.click()

            dropdown_menu = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "dropdown-menu.show"))
            )

            building_lis = dropdown_menu.find_elements(By.XPATH, "./li")

            for building in building_lis:
                try:
                    # Some building sections might not have a header or dining halls
                    dining_hall_ul = building.find_element(By.TAG_NAME, "ul")
                    dining_hall_lis = dining_hall_ul.find_elements(By.TAG_NAME, "li")
                    for dh_li in dining_hall_lis:
                        button = dh_li.find_element(By.TAG_NAME, "button")
                        all_dining_hall_names.append(button.text.strip())
                except:
                    # Skip if no ul or li found for dining halls
                    pass
            dropdown_button.click() # Close the dropdown after collecting names

            print(f"Collected {len(all_dining_hall_names)} dining halls: {all_dining_hall_names}")

        except Exception as e:
            print(f" Error collecting dining hall names: {e}")
            return False

        # --- Second Pass: Iterate and click each dining hall by name ---
        for dining_hall_name in all_dining_hall_names:
            print(f"\n--- Processing Dining Hall: {dining_hall_name} ---")
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
                # This ensures we get a fresh, non-stale element
                target_button = WebDriverWait(dropdown_menu, 10).until(
                    EC.element_to_be_clickable((By.XPATH, f".//button[normalize-space()=\'{dining_hall_name}\']"))
                )

                print(f" Clicking: {dining_hall_name}")
                target_button.click()

                # Call extract_data after clicking and content loads
                extract_data(driver)

            except Exception as e:
                print(f"⚠️ Failed to process {dining_hall_name}: {e}")
                # Continue to the next dining hall even if one fails
                continue

        print(f"Successfully connected to {url} and processed all dining halls.")
        return True

    except Exception as e:
        print(f" Failed to connect ChromeDriver to {url}: {e}")
        return False
    finally:
        if driver:
            driver.quit()
            print("ChromeDriver session closed.")




# --- Main Execution ---
if __name__ == "__main__":

    if test_chromedriver_connection(TARGET_URL):
        print("\nChromeDriver connection test PASSED.")

    else:
        print("\nChromeDriver connection test FAILED.")