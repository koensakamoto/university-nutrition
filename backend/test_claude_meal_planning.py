#!/usr/bin/env python3
"""
Test Claude Sonnet 4.5 AI meal planning with real MongoDB data
"""

import os
import sys
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi
import logging

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from meal_planning.ai_integration import MealPlannerAI
from meal_planning.food_filtering import get_filtered_foods_for_meal_plan
from meal_planning.meal_validation import enhance_meal_plan_response
from models.meal_plan import MealPlanRequest, DiningHallMeal

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def calculate_meal_targets(target_calories: int, target_macros: dict) -> dict:
    """Calculate nutrition targets for each meal and daily total"""
    # Calculate daily totals in grams
    daily_protein_g = (target_macros["protein"] / 100 * target_calories) / 4
    daily_carbs_g = (target_macros["carbs"] / 100 * target_calories) / 4
    daily_fat_g = (target_macros["fat"] / 100 * target_calories) / 9

    # Distribute across 3 meals (breakfast, lunch, dinner)
    # Using _g suffix to match expected format in ai_integration.py
    # Note: Don't include "daily_total" here as ai_integration.py sums all values
    return {
        "breakfast": {
            "calories": target_calories / 3,
            "protein_g": daily_protein_g / 3,
            "carbs_g": daily_carbs_g / 3,
            "fat_g": daily_fat_g / 3
        },
        "lunch": {
            "calories": target_calories / 3,
            "protein_g": daily_protein_g / 3,
            "carbs_g": daily_carbs_g / 3,
            "fat_g": daily_fat_g / 3
        },
        "dinner": {
            "calories": target_calories / 3,
            "protein_g": daily_protein_g / 3,
            "carbs_g": daily_carbs_g / 3,
            "fat_g": daily_fat_g / 3
        }
    }

def test_claude_meal_planning():
    """Test Claude Sonnet 4.5 with real MongoDB data"""

    print("=" * 80)
    print("🧪 Testing Claude Sonnet 4.5 AI Meal Planning with Real Database")
    print("=" * 80)
    print()

    # Connect to MongoDB
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        print("❌ No MONGODB_URI found in .env")
        return

    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_key:
        print("❌ No ANTHROPIC_API_KEY found in .env")
        return

    try:
        client = MongoClient(mongodb_uri, tlsCAFile=certifi.where())
        db = client[os.getenv("MONGO_DB", "nutritionapp")]
        foods_collection = db["foods"]

        print("✓ Connected to MongoDB")
        print()

        # Test with today's date (or find latest available date)
        test_date = datetime.now().strftime("%Y-%m-%d")

        # Check if we have data for today, otherwise find latest date
        sample_food = foods_collection.find_one({"date": test_date})
        if not sample_food:
            # Find latest date with data
            latest_food = foods_collection.find_one(sort=[("date", -1)])
            if latest_food:
                test_date = latest_food["date"]
                print(f"ℹ️  No data for today, using latest available date: {test_date}")
            else:
                print("❌ No food data found in database")
                return

        print(f"📅 Test Date: {test_date}")
        print()

        # Get available dining halls for this date
        dining_halls = foods_collection.distinct("dining_hall", {"date": test_date})
        print(f"🏛️  Available dining halls: {', '.join(dining_halls)}")

        if len(dining_halls) < 1:
            print("❌ No dining halls found for this date")
            return

        # Use specific dining halls matching the UI selection
        target_hall = "Urban Bytes @ Kahlert Village"

        # Check if target hall exists, otherwise use first available
        if target_hall in dining_halls:
            breakfast_hall = target_hall
            lunch_hall = target_hall
            dinner_hall = target_hall
            print(f"✓ Using target dining hall: {target_hall}")
        else:
            print(f"⚠️  Target hall '{target_hall}' not available, using first available")
            breakfast_hall = dining_halls[0]
            lunch_hall = dining_halls[0]
            dinner_hall = dining_halls[0]

        print(f"   Breakfast: {breakfast_hall}")
        print(f"   Lunch: {lunch_hall}")
        print(f"   Dinner: {dinner_hall}")
        print()

        # Create meal plan request
        dining_hall_meals = [
            {"meal_type": "breakfast", "dining_hall": breakfast_hall},
            {"meal_type": "lunch", "dining_hall": lunch_hall},
            {"meal_type": "dinner", "dining_hall": dinner_hall}
        ]

        # User targets (matching UI: 2000 cal with 30/40/30)
        target_calories = 2000
        target_macros = {
            "protein": 30,  # 150g
            "carbs": 40,    # 200g
            "fat": 30       # 67g
        }

        print("🎯 Target Nutrition:")
        protein_g = (target_macros["protein"] / 100 * target_calories) / 4
        carbs_g = (target_macros["carbs"] / 100 * target_calories) / 4
        fat_g = (target_macros["fat"] / 100 * target_calories) / 9

        print(f"   Calories: {target_calories}")
        print(f"   Protein: {protein_g:.0f}g ({target_macros['protein']}%)")
        print(f"   Carbs: {carbs_g:.0f}g ({target_macros['carbs']}%)")
        print(f"   Fat: {fat_g:.0f}g ({target_macros['fat']}%)")
        print(f"   P:F Ratio: {protein_g/fat_g:.1f}:1 (High protein/low fat)")
        print()

        # Create minimal request object for food filtering
        class SimpleRequest:
            def __init__(self):
                self.date = test_date
                self.dining_hall_meals = dining_hall_meals
                self.dietary_preferences = []
                self.use_profile_preferences = False

        request = SimpleRequest()
        user_profile = {}

        print("🔍 Fetching foods from database...")

        # Get filtered foods
        filtered_result = get_filtered_foods_for_meal_plan(
            request, user_profile, foods_collection, test_date
        )
        foods_by_meal = filtered_result["foods_by_meal"]
        dietary_labels = filtered_result["dietary_labels"]

        # Display food counts
        print(f"   Breakfast: {len(foods_by_meal.get('breakfast', []))} foods")
        print(f"   Lunch: {len(foods_by_meal.get('lunch', []))} foods")
        print(f"   Dinner: {len(foods_by_meal.get('dinner', []))} foods")
        print()

        if not any(foods_by_meal.values()):
            print("❌ No foods available for selected meals")
            return

        # Calculate meal targets
        meal_targets = calculate_meal_targets(target_calories, target_macros)

        print("🤖 Calling Claude Sonnet 4.5 AI...")
        print()
        start_time = time.time()

        # Initialize AI and generate plan
        ai_planner = MealPlannerAI(anthropic_key)
        ai_meal_plan = ai_planner.generate_meal_plan(
            foods_by_meal, meal_targets, dietary_labels, dining_hall_meals, user_profile
        )

        elapsed = time.time() - start_time

        if ai_meal_plan is None:
            print(f"❌ Failed to generate meal plan after {elapsed:.2f}s")
            return

        print(f"✓ Meal plan generated in {elapsed:.2f}s")
        print()

        # Enhance and validate response
        response = enhance_meal_plan_response(
            ai_meal_plan, foods_by_meal, dining_hall_meals,
            target_calories, target_macros, test_date
        )

        # Display results
        print("=" * 80)
        print("📋 GENERATED MEAL PLAN")
        print("=" * 80)
        print()

        for meal in response.meals:
            print(f"🍽️  {meal.meal_type.upper()} ({meal.dining_hall})")
            print(f"   Foods: {len(meal.foods)} items")
            for food_item in meal.foods:
                print(f"   • {food_item.quantity:.1f}x {food_item.food_name}")
                print(f"     {food_item.calories:.0f} cal | P:{food_item.protein:.1f}g | C:{food_item.carbs:.1f}g | F:{food_item.fat:.1f}g")
            print(f"   Meal Total: {meal.total_calories:.0f} cal | P:{meal.total_protein:.1f}g | C:{meal.total_carbs:.1f}g | F:{meal.total_fat:.1f}g")
            print()

        # Calculate accuracy
        cal_diff_pct = (response.total_calories - target_calories) / target_calories * 100
        protein_diff_pct = (response.total_protein - protein_g) / protein_g * 100
        carbs_diff_pct = (response.total_carbs - carbs_g) / carbs_g * 100
        fat_diff_pct = (response.total_fat - fat_g) / fat_g * 100

        cal_in_range = abs(cal_diff_pct) <= 10
        protein_in_range = abs(protein_diff_pct) <= 10
        carbs_in_range = abs(carbs_diff_pct) <= 10
        fat_in_range = abs(fat_diff_pct) <= 10

        all_in_range = cal_in_range and protein_in_range and carbs_in_range and fat_in_range

        print("=" * 80)
        print("📊 DAILY TOTALS vs TARGETS")
        print("=" * 80)
        print(f"Calories:  {response.total_calories:.0f} / {target_calories} ({cal_diff_pct:+.1f}%) {'✓' if cal_in_range else '✗'}")
        print(f"Protein:   {response.total_protein:.1f}g / {protein_g:.0f}g ({protein_diff_pct:+.1f}%) {'✓' if protein_in_range else '✗'}")
        print(f"Carbs:     {response.total_carbs:.1f}g / {carbs_g:.0f}g ({carbs_diff_pct:+.1f}%) {'✓' if carbs_in_range else '✗'}")
        print(f"Fat:       {response.total_fat:.1f}g / {fat_g:.0f}g ({fat_diff_pct:+.1f}%) {'✓' if fat_in_range else '✗'}")
        print()

        print(f"Success: {response.success}")
        print(f"Message: {response.message}")
        print()

        if all_in_range:
            print("🎯 SUCCESS! All nutrients within ±10% tolerance")
        else:
            print("⚠️  Some nutrients outside ±10% tolerance")
            if not cal_in_range:
                print(f"   • Calories off by {abs(cal_diff_pct):.1f}%")
            if not protein_in_range:
                print(f"   • Protein off by {abs(protein_diff_pct):.1f}%")
            if not carbs_in_range:
                print(f"   • Carbs off by {abs(carbs_diff_pct):.1f}%")
            if not fat_in_range:
                print(f"   • Fat off by {abs(fat_diff_pct):.1f}%")

        print()
        print(f"⏱️  Total generation time: {elapsed:.2f}s")
        print("=" * 80)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_claude_meal_planning()
