#!/usr/bin/env python3
"""
Full test script that logs in and generates an actual AI meal plan
"""

import requests
import json
from datetime import datetime, timedelta

# Test user credentials
TEST_EMAIL = "testing@gmail.com"
TEST_PASSWORD = "testPass123"

def create_test_user_if_needed(session):
    """Create a test user if it doesn't exist"""
    print("🔐 Creating test user if needed...")

    register_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "first_name": "Test",
        "last_name": "User"
    }

    try:
        response = session.post("http://localhost:8000/auth/register", json=register_data)
        if response.status_code == 200:
            print("✅ Test user created successfully")
            return True
        elif response.status_code == 400 and "already registered" in response.json().get("detail", ""):
            print("✅ Test user already exists")
            return True
        else:
            print(f"❌ Failed to create user: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return False

def login_test_user(session):
    """Login with test user credentials"""
    print("🔑 Logging in test user...")

    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }

    try:
        response = session.post("http://localhost:8000/auth/login", json=login_data)
        if response.status_code == 200:
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False

def get_available_date(session):
    """Get a recent date that likely has food data"""
    print("📅 Finding available food data...")

    for days_ago in range(0, 7):
        test_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        try:
            response = session.get(f"http://localhost:8000/api/available-options?date={test_date}")
            if response.status_code == 200:
                data = response.json()
                if data.get("dining_halls") and len(data["dining_halls"]) > 0:
                    print(f"✅ Found food data for {test_date}")
                    print(f"   Available halls: {', '.join(data['dining_halls'])}")
                    return test_date, data["dining_halls"]
        except Exception as e:
            print(f"Error checking {test_date}: {e}")

    return None, []

def test_ai_meal_plan_generation():
    """Test the complete flow: login + AI meal plan generation"""

    print("🤖 Full AI Meal Plan Generation Test\n")

    # Create session to maintain cookies
    session = requests.Session()

    # Step 1: Create/login test user
    if not create_test_user_if_needed(session):
        return

    if not login_test_user(session):
        return

    # Step 2: Find available food data
    date, dining_halls = get_available_date(session)
    if not date or not dining_halls:
        print("❌ No food data available for recent dates")
        return

    # Step 3: Prepare meal plan request
    print(f"\n🍽️  Preparing AI meal plan request for {date}...")

    # Select dining halls for each meal
    primary_hall = dining_halls[0]
    lunch_hall = dining_halls[1] if len(dining_halls) > 1 else primary_hall
    dinner_hall = dining_halls[2] if len(dining_halls) > 2 else primary_hall

    # Smart dining hall selection - use halls that actually have food
    # Use Urban Bytes or United Table since they have breakfast/lunch/dinner
    # Use Panda Express or Shake Smart for any meal (they serve "Every Day")

    meal_request = {
        "use_profile_data": False,  # Use manual targets for testing
        "target_calories": 2200,
        "protein_percent": 25.0,
        "carbs_percent": 45.0,
        "fat_percent": 30.0,
        "dining_hall_meals": [
            {"meal_type": "breakfast", "dining_hall": "Urban Bytes @ Kahlert Village"},
            {"meal_type": "lunch", "dining_hall": "United Table @ Peterson Heritage Center"},
            {"meal_type": "dinner", "dining_hall": "Urban Bytes @ Kahlert Village"}
        ],
        "date": date,
        "use_profile_preferences": False,
        "dietary_preferences": [],  # Could add ["vegetarian"] to test filtering
        "allergens_to_avoid": []
    }

    print(f"   🎯 Target: {meal_request['target_calories']} calories")
    print(f"   📊 Macros: {meal_request['protein_percent']}% protein, {meal_request['carbs_percent']}% carbs, {meal_request['fat_percent']}% fat")
    print(f"   🏢 Halls: ")
    for meal in meal_request['dining_hall_meals']:
        print(f"      {meal['meal_type'].title()}: {meal['dining_hall']}")

    # Step 4: Call AI meal plan generation
    print(f"\n🤖 Calling AI meal plan generation (this may take 30-60 seconds)...")

    try:
        response = session.post(
            "http://localhost:8000/api/meal-plan",
            json=meal_request,
            headers={"Content-Type": "application/json"},
            timeout=120  # AI calls can take a while
        )

        if response.status_code == 200:
            meal_plan = response.json()
            print("🎉 AI meal plan generated successfully!")
            display_meal_plan(meal_plan)

        elif response.status_code == 503:
            print("❌ AI service unavailable")
            error_detail = response.json().get("detail", "Unknown error")
            print(f"   Error: {error_detail}")
            if "API key" in error_detail:
                print("💡 Make sure OPENAI_API_KEY is set in your .env file")

        else:
            print(f"❌ API call failed with status {response.status_code}")
            try:
                error_detail = response.json().get("detail", "Unknown error")
                print(f"   Error: {error_detail}")
            except:
                print(f"   Raw response: {response.text}")

    except requests.exceptions.Timeout:
        print("❌ Request timed out - AI generation took too long")
        print("💡 Try again, sometimes OpenAI is slow")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def display_meal_plan(meal_plan):
    """Display the AI-generated meal plan beautifully"""

    print(f"\n" + "="*80)
    print(f"🤖 AI-GENERATED MEAL PLAN FOR {meal_plan['date'].upper()}")
    print("="*80)

    # Overview
    print(f"\n📊 NUTRITIONAL SUMMARY:")
    print(f"   🎯 Target: {meal_plan['target_calories']} calories")
    print(f"   ✅ Actual: {meal_plan['total_calories']:.0f} calories ({meal_plan['total_calories']/meal_plan['target_calories']*100:.1f}% of target)")

    target = meal_plan['target_macros']
    actual = meal_plan['actual_macros']

    print(f"\n   📈 MACRONUTRIENT BREAKDOWN:")
    print(f"      Protein: {actual['protein']:5.1f}% (target: {target['protein']:.1f}%) | {meal_plan['total_protein']:.1f}g")
    print(f"      Carbs:   {actual['carbs']:5.1f}% (target: {target['carbs']:.1f}%) | {meal_plan['total_carbs']:.1f}g")
    print(f"      Fat:     {actual['fat']:5.1f}% (target: {target['fat']:.1f}%) | {meal_plan['total_fat']:.1f}g")

    success_icon = "🎯" if meal_plan['success'] else "⚠️"
    print(f"\n   {success_icon} Status: {meal_plan['message']}")

    # Individual meals
    meal_icons = {"breakfast": "🌅", "lunch": "☀️", "dinner": "🌙"}

    for meal in meal_plan['meals']:
        icon = meal_icons.get(meal['meal_type'], "🍽️")
        print(f"\n{icon} {meal['meal_type'].upper()} at {meal['dining_hall']}")
        print(f"   📍 Total: {meal['total_calories']:.0f} cal | {meal['total_protein']:.1f}g protein | {meal['total_carbs']:.1f}g carbs | {meal['total_fat']:.1f}g fat")
        print(f"   🍽️  Selected foods:")

        for i, food in enumerate(meal['foods'], 1):
            quantity_text = f"{food['quantity']:.1f}" if food['quantity'] != int(food['quantity']) else f"{int(food['quantity'])}"
            plural = "s" if food['quantity'] != 1 else ""
            print(f"      {i}. {food['food_name']} ({quantity_text} serving{plural})")
            print(f"         💊 {food['calories']:.0f} cal, {food['protein']:.1f}g protein, {food['carbs']:.1f}g carbs, {food['fat']:.1f}g fat")

    print(f"\n" + "="*80)
    print("🧠 This meal plan was intelligently created by GPT-4!")
    print("🎲 Run again to get a different combination of foods.")
    print("="*80)

if __name__ == "__main__":
    test_ai_meal_plan_generation()