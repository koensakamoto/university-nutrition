#!/usr/bin/env python3
"""
Test script to generate an actual AI meal plan using the API
"""

import requests
import json
from datetime import datetime, timedelta

def get_available_date():
    """Get a recent date that likely has food data"""
    # Try the last few days
    for days_ago in range(0, 7):
        test_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        try:
            response = requests.get(f"http://localhost:8000/api/available-options?date={test_date}")
            if response.status_code == 200:
                data = response.json()
                if data.get("dining_halls"):
                    print(f"✅ Found available food data for {test_date}")
                    print(f"   Available dining halls: {data['dining_halls']}")
                    return test_date, data["dining_halls"]
        except Exception as e:
            print(f"Error checking {test_date}: {e}")

    return None, []

def test_meal_plan_generation():
    """Test the AI meal plan generation endpoint"""

    print("🤖 Testing AI Meal Plan Generation\n")

    # Step 1: Find a date with available food data
    print("1️⃣ Finding available food data...")
    date, dining_halls = get_available_date()

    if not date or not dining_halls:
        print("❌ No food data available for recent dates")
        print("💡 Try adding some food data to the database first")
        return

    # Step 2: Prepare meal plan request
    print(f"\n2️⃣ Preparing meal plan request for {date}...")

    # Use the first available dining hall for all meals (or mix them)
    primary_hall = dining_halls[0]
    lunch_hall = dining_halls[1] if len(dining_halls) > 1 else primary_hall

    # Test with manual entry (not profile data)
    meal_request = {
        "use_profile_data": False,
        "target_calories": 2000,
        "protein_percent": 30.0,
        "carbs_percent": 40.0,
        "fat_percent": 30.0,
        "dining_hall_meals": [
            {"meal_type": "breakfast", "dining_hall": primary_hall},
            {"meal_type": "lunch", "dining_hall": lunch_hall},
            {"meal_type": "dinner", "dining_hall": primary_hall}
        ],
        "date": date,
        "use_profile_preferences": False,
        "dietary_preferences": [],
        "allergens_to_avoid": []
    }

    print(f"   Target: {meal_request['target_calories']} calories")
    print(f"   Macros: {meal_request['protein_percent']}% protein, {meal_request['carbs_percent']}% carbs, {meal_request['fat_percent']}% fat")
    print(f"   Halls: {[m['dining_hall'] for m in meal_request['dining_hall_meals']]}")

    # Step 3: Make API call
    print(f"\n3️⃣ Calling AI meal plan generation API...")

    try:
        response = requests.post(
            "http://localhost:8000/api/meal-plan",
            json=meal_request,
            headers={"Content-Type": "application/json"},
            timeout=60  # AI calls can take a while
        )

        if response.status_code == 200:
            meal_plan = response.json()
            print("✅ AI meal plan generated successfully!")
            display_meal_plan(meal_plan)

        elif response.status_code == 401:
            print("❌ Authentication required - you need to be logged in")
            print("💡 Try logging in through the frontend first")

        elif response.status_code == 503:
            print("❌ AI service unavailable")
            error_detail = response.json().get("detail", "Unknown error")
            print(f"   Error: {error_detail}")
            print("💡 Check if OPENAI_API_KEY is set in .env file")

        else:
            print(f"❌ API call failed with status {response.status_code}")
            try:
                error_detail = response.json().get("detail", "Unknown error")
                print(f"   Error: {error_detail}")
            except:
                print(f"   Raw response: {response.text}")

    except requests.exceptions.Timeout:
        print("❌ Request timed out - AI generation took too long")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server - is it running on http://localhost:8000?")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def display_meal_plan(meal_plan):
    """Display the generated meal plan in a nice format"""

    print(f"\n🍽️  AI-Generated Meal Plan for {meal_plan['date']}")
    print("=" * 60)

    print(f"\n📊 Targets vs Actual:")
    print(f"   Calories: {meal_plan['actual_calories']:.0f} / {meal_plan['target_calories']} ({'✅' if meal_plan['success'] else '⚠️'})")

    target_macros = meal_plan['target_macros']
    actual_macros = meal_plan['actual_macros']

    print(f"   Protein:  {actual_macros['protein']:.1f}% / {target_macros['protein']:.1f}%")
    print(f"   Carbs:    {actual_macros['carbs']:.1f}% / {target_macros['carbs']:.1f}%")
    print(f"   Fat:      {actual_macros['fat']:.1f}% / {target_macros['fat']:.1f}%")

    if meal_plan['message']:
        print(f"\n💬 {meal_plan['message']}")

    # Display each meal
    for meal in meal_plan['meals']:
        print(f"\n🍽️  {meal['meal_type'].upper()} at {meal['dining_hall']}")
        print(f"   Total: {meal['total_calories']:.0f} cal, {meal['total_protein']:.1f}g protein, {meal['total_carbs']:.1f}g carbs, {meal['total_fat']:.1f}g fat")
        print("   Foods:")

        for food in meal['foods']:
            print(f"     • {food['food_name']} ({food['quantity']} serving{'s' if food['quantity'] != 1 else ''})")
            print(f"       {food['calories']:.0f} cal, {food['protein']:.1f}g protein, {food['carbs']:.1f}g carbs, {food['fat']:.1f}g fat")

    print("\n" + "=" * 60)
    print("🤖 This meal plan was generated by AI using GPT-4!")

if __name__ == "__main__":
    test_meal_plan_generation()