#!/usr/bin/env python3
"""
AI Meal Generation Accuracy and Performance Tests
Tests both profile-based and custom meal generation using real database data
"""

import requests
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

BASE_URL = "http://localhost:8000"
USER_EMAIL = "c@c.com"
USER_PASSWORD = "riq21#A20"


def login() -> requests.Session:
    """Login and return authenticated session"""
    session = requests.Session()

    login_data = {
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    }

    response = session.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        raise Exception(f"Login failed: {response.status_code} - {response.text}")

    print("✅ Login successful")
    return session


def get_available_date_and_halls(session: requests.Session) -> Tuple[str, Dict]:
    """Find the most recent date with available food data"""
    print("\n📅 Finding available food data...")

    for days_ago in range(0, 7):
        test_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        response = session.get(f"{BASE_URL}/api/available-options?date={test_date}")

        if response.status_code == 200:
            data = response.json()
            dining_halls = data.get("dining_halls", [])
            meal_types_by_hall = data.get("meal_types_by_hall", {})

            if dining_halls:
                print(f"✅ Found food data for {test_date}")
                print(f"   Available halls: {', '.join(dining_halls)}")
                return test_date, meal_types_by_hall

    raise Exception("No food data available in database for recent dates")


def select_meals_from_halls(meal_types_by_hall: Dict) -> List[Dict]:
    """Select one dining hall for each meal type"""
    selected_meals = []

    # Find halls that serve each meal type
    for meal_type in ["Breakfast", "Lunch", "Dinner"]:
        hall_found = False
        for hall, meal_types in meal_types_by_hall.items():
            if meal_type in meal_types:
                selected_meals.append({
                    "meal_type": meal_type.lower(),
                    "dining_hall": hall
                })
                hall_found = True
                print(f"   Selected {hall} for {meal_type}")
                break

        if not hall_found:
            print(f"   ⚠️  No hall found for {meal_type}")

    return selected_meals


def validate_meal_plan(meal_plan: Dict, target_calories: int, test_name: str) -> Dict:
    """Validate meal plan accuracy and return metrics"""
    print(f"\n📊 Validating {test_name}...")

    metrics = {
        "total_calories": meal_plan.get("total_calories", 0),
        "target_calories": meal_plan.get("target_calories", 0),
        "total_protein": meal_plan.get("total_protein", 0),
        "total_carbs": meal_plan.get("total_carbs", 0),
        "total_fat": meal_plan.get("total_fat", 0),
        "actual_macros": meal_plan.get("actual_macros", {}),
        "target_macros": meal_plan.get("target_macros", {}),
        "num_meals": len(meal_plan.get("meals", [])),
        "total_foods": sum(len(m.get("foods", [])) for m in meal_plan.get("meals", []))
    }

    # Calculate accuracy
    calorie_error = abs(metrics["total_calories"] - metrics["target_calories"]) / metrics["target_calories"] * 100

    print(f"   Calories: {metrics['total_calories']:.0f} / {metrics['target_calories']} ({calorie_error:.1f}% error)")
    print(f"   Protein:  {metrics['total_protein']:.1f}g ({metrics['actual_macros'].get('protein', 0):.1f}%)")
    print(f"   Carbs:    {metrics['total_carbs']:.1f}g ({metrics['actual_macros'].get('carbs', 0):.1f}%)")
    print(f"   Fat:      {metrics['total_fat']:.1f}g ({metrics['actual_macros'].get('fat', 0):.1f}%)")
    print(f"   Total foods: {metrics['total_foods']} across {metrics['num_meals']} meals")

    # Check accuracy thresholds
    if calorie_error > 20:
        print(f"   ⚠️  Calorie error {calorie_error:.1f}% exceeds 20% threshold")
    else:
        print(f"   ✅ Calorie accuracy within acceptable range")

    # Check macro accuracy
    for macro in ["protein", "carbs", "fat"]:
        target = metrics["target_macros"].get(macro, 0)
        actual = metrics["actual_macros"].get(macro, 0)
        if target > 0:
            macro_error = abs(actual - target) / target * 100
            if macro_error > 25:
                print(f"   ⚠️  {macro.capitalize()} error {macro_error:.1f}% exceeds 25% threshold")

    return metrics


def test_profile_based_meal_generation(session: requests.Session, date: str, selected_meals: List[Dict]):
    """Test meal generation using user profile data"""
    print("\n" + "="*80)
    print("TEST 1: PROFILE-BASED MEAL GENERATION")
    print("="*80)

    meal_request = {
        "use_profile_data": True,
        "use_profile_preferences": True,
        "dining_hall_meals": selected_meals,
        "date": date
    }

    print(f"\n🤖 Generating meal plan with user profile...")
    print(f"   Date: {date}")
    print(f"   Meals: {len(selected_meals)}")

    start_time = time.time()

    response = session.post(
        f"{BASE_URL}/api/meal-plan",
        json=meal_request,
        timeout=180  # 3 minutes
    )

    elapsed_time = time.time() - start_time

    print(f"\n⏱️  Generation time: {elapsed_time:.2f} seconds")

    if response.status_code != 200:
        print(f"❌ API call failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

    meal_plan = response.json()
    metrics = validate_meal_plan(meal_plan, meal_plan.get("target_calories", 0), "Profile-Based Plan")

    # Print detailed meal breakdown
    print(f"\n🍽️  Meal Breakdown:")
    for meal in meal_plan.get("meals", []):
        print(f"\n   {meal['meal_type'].upper()} at {meal['dining_hall']}")
        print(f"   Total: {meal['total_calories']:.0f} cal, {meal['total_protein']:.1f}g P, {meal['total_carbs']:.1f}g C, {meal['total_fat']:.1f}g F")
        for food in meal.get("foods", []):
            print(f"      • {food['food_name']} ({food['quantity']}x)")

    return {
        "success": True,
        "elapsed_time": elapsed_time,
        "metrics": metrics,
        "meal_plan": meal_plan
    }


def test_custom_meal_generation(session: requests.Session, date: str, selected_meals: List[Dict]):
    """Test meal generation with custom nutrition targets"""
    print("\n" + "="*80)
    print("TEST 2: CUSTOM TARGET MEAL GENERATION")
    print("="*80)

    meal_request = {
        "use_profile_data": False,
        "target_calories": 2200,
        "protein_percent": 30.0,
        "carbs_percent": 40.0,
        "fat_percent": 30.0,
        "use_profile_preferences": False,
        "dietary_preferences": [],
        "allergens_to_avoid": [],
        "dining_hall_meals": selected_meals,
        "date": date
    }

    print(f"\n🤖 Generating meal plan with custom targets...")
    print(f"   Date: {date}")
    print(f"   Target: {meal_request['target_calories']} cal")
    print(f"   Macros: {meal_request['protein_percent']}% P, {meal_request['carbs_percent']}% C, {meal_request['fat_percent']}% F")
    print(f"   Meals: {len(selected_meals)}")

    start_time = time.time()

    response = session.post(
        f"{BASE_URL}/api/meal-plan",
        json=meal_request,
        timeout=180  # 3 minutes
    )

    elapsed_time = time.time() - start_time

    print(f"\n⏱️  Generation time: {elapsed_time:.2f} seconds")

    if response.status_code != 200:
        print(f"❌ API call failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

    meal_plan = response.json()
    metrics = validate_meal_plan(meal_plan, meal_request["target_calories"], "Custom Target Plan")

    # Print detailed meal breakdown
    print(f"\n🍽️  Meal Breakdown:")
    for meal in meal_plan.get("meals", []):
        print(f"\n   {meal['meal_type'].upper()} at {meal['dining_hall']}")
        print(f"   Total: {meal['total_calories']:.0f} cal, {meal['total_protein']:.1f}g P, {meal['total_carbs']:.1f}g C, {meal['total_fat']:.1f}g F")
        for food in meal.get("foods", []):
            print(f"      • {food['food_name']} ({food['quantity']}x)")

    return {
        "success": True,
        "elapsed_time": elapsed_time,
        "metrics": metrics,
        "meal_plan": meal_plan
    }


def print_summary(test1_result: Dict, test2_result: Dict):
    """Print test summary and comparison"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    if test1_result:
        print(f"\n✅ Profile-Based Generation:")
        print(f"   Time: {test1_result['elapsed_time']:.2f}s")
        print(f"   Calories: {test1_result['metrics']['total_calories']:.0f} / {test1_result['metrics']['target_calories']}")
        print(f"   Foods: {test1_result['metrics']['total_foods']}")
    else:
        print(f"\n❌ Profile-Based Generation: FAILED")

    if test2_result:
        print(f"\n✅ Custom Target Generation:")
        print(f"   Time: {test2_result['elapsed_time']:.2f}s")
        print(f"   Calories: {test2_result['metrics']['total_calories']:.0f} / {test2_result['metrics']['target_calories']}")
        print(f"   Foods: {test2_result['metrics']['total_foods']}")
    else:
        print(f"\n❌ Custom Target Generation: FAILED")

    # Performance comparison
    if test1_result and test2_result:
        avg_time = (test1_result['elapsed_time'] + test2_result['elapsed_time']) / 2
        print(f"\n📊 Performance:")
        print(f"   Average generation time: {avg_time:.2f}s")
        if avg_time < 30:
            print(f"   ✅ Excellent performance (< 30s)")
        elif avg_time < 60:
            print(f"   ✅ Good performance (< 60s)")
        else:
            print(f"   ⚠️  Slow performance (> 60s)")


def main():
    """Run all tests"""
    print("🤖 AI Meal Generation Accuracy & Performance Tests")
    print("="*80)

    try:
        # Step 1: Login
        session = login()

        # Step 2: Get available date and dining halls
        date, meal_types_by_hall = get_available_date_and_halls(session)

        # Step 3: Select one meal from each type
        print(f"\n🍽️  Selecting meals for each type...")
        selected_meals = select_meals_from_halls(meal_types_by_hall)

        if len(selected_meals) != 3:
            print(f"⚠️  Warning: Only found {len(selected_meals)} meals (expected 3)")
            if len(selected_meals) == 0:
                print("❌ No meals available, cannot proceed with tests")
                return

        # Step 4: Run test 1 - Profile-based generation
        test1_result = test_profile_based_meal_generation(session, date, selected_meals)

        # Step 5: Run test 2 - Custom target generation
        test2_result = test_custom_meal_generation(session, date, selected_meals)

        # Step 6: Print summary
        print_summary(test1_result, test2_result)

        print("\n" + "="*80)
        print("✅ All tests completed!")
        print("="*80)

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
