#!/usr/bin/env python3
"""
Simple AI Meal Generation Test with detailed timing
"""

import requests
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
USER_EMAIL = "c@c.com"
USER_PASSWORD = "riq21#A20"


def main():
    print("🤖 Simple AI Meal Generation Test\n")

    session = requests.Session()

    # Login
    print("1️⃣ Logging in...")
    login_response = session.post(f"{BASE_URL}/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })

    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return

    print("✅ Login successful\n")

    # Get available date
    print("2️⃣ Finding available food data...")
    date = datetime.now().strftime("%Y-%m-%d")
    opts_response = session.get(f"{BASE_URL}/api/available-options?date={date}")

    if opts_response.status_code != 200:
        print(f"❌ Failed to get options: {opts_response.status_code}")
        return

    data = opts_response.json()
    halls = data.get("dining_halls", [])
    meal_types_by_hall = data.get("meal_types_by_hall", {})

    print(f"✅ Found {len(halls)} dining halls for {date}\n")

    # Select meals
    selected_meals = []
    for meal_type in ["Breakfast", "Lunch", "Dinner"]:
        for hall, types in meal_types_by_hall.items():
            if meal_type in types:
                selected_meals.append({
                    "meal_type": meal_type.lower(),
                    "dining_hall": hall
                })
                print(f"   Selected {hall} for {meal_type}")
                break

    if len(selected_meals) < 3:
        print(f"\n⚠️  Only found {len(selected_meals)} meals")

    # Test custom meal generation
    print("\n3️⃣ Generating meal plan with custom targets...")
    print("   Target: 2000 calories, 30% protein, 40% carbs, 30% fat")

    meal_request = {
        "use_profile_data": False,
        "target_calories": 2000,
        "protein_percent": 30.0,
        "carbs_percent": 40.0,
        "fat_percent": 30.0,
        "use_profile_preferences": False,
        "dietary_preferences": [],
        "allergens_to_avoid": [],
        "dining_hall_meals": selected_meals,
        "date": date
    }

    print(f"\n⏱️  Starting AI generation at {datetime.now().strftime('%H:%M:%S')}...")
    start_time = time.time()

    try:
        response = session.post(
            f"{BASE_URL}/api/meal-plan",
            json=meal_request,
            timeout=180,
            stream=False  # Disable streaming to get full response
        )

        elapsed = time.time() - start_time

        print(f"⏱️  Response received after {elapsed:.2f} seconds")
        print(f"   Status code: {response.status_code}")

        if response.status_code == 200:
            meal_plan = response.json()

            print(f"\n✅ SUCCESS!")
            print(f"\n📊 Results:")
            print(f"   Time: {elapsed:.2f} seconds")
            print(f"   Calories: {meal_plan['total_calories']:.0f} / {meal_plan['target_calories']}")
            print(f"   Protein: {meal_plan['total_protein']:.1f}g ({meal_plan['actual_macros']['protein']:.1f}%)")
            print(f"   Carbs: {meal_plan['total_carbs']:.1f}g ({meal_plan['actual_macros']['carbs']:.1f}%)")
            print(f"   Fat: {meal_plan['total_fat']:.1f}g ({meal_plan['actual_macros']['fat']:.1f}%)")
            print(f"   Total foods: {sum(len(m['foods']) for m in meal_plan['meals'])}")

            # Show each meal
            print(f"\n🍽️  Meals:")
            for meal in meal_plan['meals']:
                print(f"   {meal['meal_type'].title()}: {meal['total_calories']:.0f} cal, {len(meal['foods'])} foods")

        else:
            print(f"\n❌ FAILED")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:500]}")

    except requests.exceptions.Timeout:
        elapsed = time.time() - start_time
        print(f"\n❌ TIMEOUT after {elapsed:.2f} seconds")
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n❌ ERROR after {elapsed:.2f} seconds")
        print(f"   {e}")


if __name__ == "__main__":
    main()
