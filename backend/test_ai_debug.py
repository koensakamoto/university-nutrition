#!/usr/bin/env python3
"""
Debug test to trigger AI meal generation and watch what happens
"""

import requests
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
USER_EMAIL = "c@c.com"
USER_PASSWORD = "riq21#A20"

def main():
    print("🔍 AI Meal Generation Debug Test")
    print("📝 Watch your backend console for logs...")
    print("="*80)

    session = requests.Session()

    # Login
    print("\n1. Logging in...")
    login_response = session.post(f"{BASE_URL}/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })

    if login_response.status_code != 200:
        print(f"❌ Login failed")
        return

    print("✅ Logged in")

    # Get available date
    print("\n2. Getting available food data...")
    date = "2025-11-05"
    opts_response = session.get(f"{BASE_URL}/api/available-options?date={date}")
    data = opts_response.json()

    # Use specific halls that we know have data
    meal_request = {
        "use_profile_data": False,
        "target_calories": 2000,
        "protein_percent": 30.0,
        "carbs_percent": 40.0,
        "fat_percent": 30.0,
        "use_profile_preferences": False,
        "dietary_preferences": [],
        "allergens_to_avoid": [],
        "dining_hall_meals": [
            {"meal_type": "breakfast", "dining_hall": "United Table @ Peterson Heritage Center"},
            {"meal_type": "lunch", "dining_hall": "Union Food Court @ Union Building"},
            {"meal_type": "dinner", "dining_hall": "United Table @ Peterson Heritage Center"}
        ],
        "date": date
    }

    print("\n3. Starting AI meal generation...")
    print(f"   Time: {datetime.now().strftime('%H:%M:%S')}")
    print(f"   Target: {meal_request['target_calories']} cal")
    print(f"   Macros: {meal_request['protein_percent']}P/{meal_request['carbs_percent']}C/{meal_request['fat_percent']}F")
    print("\n⏱️  WAITING FOR RESPONSE...")
    print("   (Check backend console for detailed logs)")
    print("   Expected: 30-90 seconds for AI generation")

    start = time.time()

    # Show progress dots
    import threading

    stop_dots = threading.Event()

    def show_progress():
        while not stop_dots.is_set():
            print(".", end="", flush=True)
            time.sleep(2)

    progress_thread = threading.Thread(target=show_progress)
    progress_thread.start()

    try:
        response = session.post(
            f"{BASE_URL}/api/meal-plan",
            json=meal_request,
            timeout=180
        )

        stop_dots.set()
        progress_thread.join()

        elapsed = time.time() - start

        print(f"\n\n⏱️  Response received after {elapsed:.2f} seconds")

        if response.status_code == 200:
            meal_plan = response.json()
            print(f"✅ SUCCESS!")
            print(f"\n📊 Result:")
            print(f"   Calories: {meal_plan['total_calories']:.0f} / {meal_plan['target_calories']}")
            print(f"   Foods: {sum(len(m['foods']) for m in meal_plan['meals'])}")

        else:
            print(f"❌ FAILED - Status {response.status_code}")
            print(f"   Error: {response.text[:200]}")

    except requests.exceptions.Timeout:
        stop_dots.set()
        progress_thread.join()
        elapsed = time.time() - start
        print(f"\n\n❌ TIMEOUT after {elapsed:.2f} seconds")
        print("\n💡 Check backend logs to see where it got stuck")
    except Exception as e:
        stop_dots.set()
        progress_thread.join()
        elapsed = time.time() - start
        print(f"\n\n❌ ERROR after {elapsed:.2f} seconds: {e}")

if __name__ == "__main__":
    main()
