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

def extract_data(){
    BreakfastFilter = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "__BVID_5667__BV_tab_button__")))

    print("continer good")
        

    return true;
}



def test_chromedriver_connection(url):
    """
    Tests if ChromeDriver can successfully connect and navigate to the given URL.
    """
    print(f"Attempting to connect ChromeDriver to {url}...")
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Run Chrome in headless mode (no visible browser UI)
    options.add_argument("--no-sandbox")  # Required for some environments
    options.add_argument(
        "--disable-dev-shm-usage"
    )  # Overcomes limited resource problems

    driver = None  # Initialize driver to None
    try:
        # This line will download and set up ChromeDriver if it's not already there.
        driver = webdriver.Chrome(
            service=ChromeService(ChromeDriverManager().install()), options=options
        )
        driver.get(url)

        dropdown_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "menu-location-selector__BV_toggle_")))
        dropdown_button.click()

        print("clicked")
        expectedHall = 'City Edge @ Kahlert Village'

        dropdown_menu = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "dropdown-menu.show"))
        )

        print("drop down menu cleared")


        building_lis = dropdown_menu.find_elements(By.XPATH, "./li")

        print("build lis good ")
        for item in building_lis:
            try:
                #gets all building locations
                header = item.find_element(By.TAG_NAME, "header").text
                print(f"\n Building: {header}")

                dining_hall_ul = item.find_elements(By.TAG_NAME, "ul")

                for dh_ul in dining_hall_ul:
                    dh_lis = dh_ul.find_elements(By.TAG_NAME, "li")
                    for dh in dh_lis:
                        try:
                            button = dh.find_element(By.TAG_NAME, "button")
                            dining_hall_name = button.text.strip()
                            print(f"🍽️ Dining Hall: {dining_hall_name}")
                        except:
                            print("⚠️ Couldn't find button inside dining hall li")
                            continue

            except:
                pass
        # html = driver.page_source
        # soup = BeautifulSoup(html, "html.parser")
        # print(soup.prettify())

        time.sleep(20)

        print(f"Successfully connected to {url} and navigated. Title: '{driver.title}'")
        return True
    except Exception as e:
        print(f"Failed to connect ChromeDriver to {url}: {e}")
        return False
    finally:
        if driver:  # Ensure driver was successfully initialized before quitting
            driver.quit()
            print("ChromeDriver session closed.")


# --- Main Execution ---
if __name__ == "__main__":

    if test_chromedriver_connection(TARGET_URL):
        print("\nChromeDriver connection test PASSED.")

    else:
        print("\nChromeDriver connection test FAILED.")
