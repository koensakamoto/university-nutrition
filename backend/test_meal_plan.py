#!/usr/bin/env python3
"""
Test script for meal planning functionality
"""

import sys
import os
from unittest.mock import Mock, MagicMock

# Mock environment variables
os.environ['MONGODB_URI'] = 'mongodb://test'
os.environ['SECRET_KEY'] = 'test-key'
os.environ['OPENAI_API_KEY'] = 'test-openai-key'

def test_meal_planning_components():
    """Test all meal planning components individually"""

    print("🧪 Testing Meal Planning Components\n")

    # Test 1: Models
    print("1️⃣ Testing Pydantic Models...")
    try:
        from models.meal_plan import MealPlanRequest, MealPlanResponse, DiningHallMeal, MealType

        # Create test request
        request = MealPlanRequest(
            use_profile_data=False,
            target_calories=2000,
            protein_percent=30.0,
            carbs_percent=40.0,
            fat_percent=30.0,
            dining_hall_meals=[
                DiningHallMeal(meal_type=MealType.BREAKFAST, dining_hall="Kahlert Village"),
                DiningHallMeal(meal_type=MealType.LUNCH, dining_hall="United Table @ Peterson Heritage Center"),
                DiningHallMeal(meal_type=MealType.DINNER, dining_hall="Kahlert Village")
            ],
            date="2024-01-15"
        )
        print(f"   ✅ Request model: {request.target_calories} cal, {len(request.dining_hall_meals)} meals")

    except Exception as e:
        print(f"   ❌ Model test failed: {e}")
        return False

    # Test 2: Food Filtering
    print("\n2️⃣ Testing Food Filtering...")
    try:
        from meal_planning.food_filtering import extract_dietary_labels, organize_foods_by_meal

        # Test dietary label extraction
        mock_profile = {"dietary_preferences": ["vegetarian", "climate_friendly"]}
        labels = extract_dietary_labels(request, mock_profile)
        print(f"   ✅ Dietary labels extracted: {labels}")

        # Test food organization
        mock_foods = [
            {"_id": "1", "dining_hall": "Kahlert Village", "meal_name": "breakfast", "name": "Eggs"},
            {"_id": "2", "dining_hall": "United Table @ Peterson Heritage Center", "meal_name": "lunch", "name": "Salad"}
        ]
        organized = organize_foods_by_meal(mock_foods, request.dining_hall_meals)
        print(f"   ✅ Foods organized: {len(organized)} meal types")

    except Exception as e:
        print(f"   ❌ Food filtering test failed: {e}")
        return False

    # Test 3: Target Calculation
    print("\n3️⃣ Testing Target Calculation...")
    try:
        from meal_planning.target_calculation import calculate_meal_targets, validate_macro_percentages

        # Test macro validation
        is_valid = validate_macro_percentages(30.0, 40.0, 30.0)
        print(f"   ✅ Macro validation (30/40/30): {is_valid}")

        # Test meal target calculation
        target_macros = {"protein": 30.0, "carbs": 40.0, "fat": 30.0}
        meal_targets = calculate_meal_targets(2000, target_macros)
        print(f"   ✅ Meal targets calculated: {len(meal_targets)} meals")
        print(f"     - Breakfast: {meal_targets['breakfast']['calories']} cal")

    except Exception as e:
        print(f"   ❌ Target calculation test failed: {e}")
        return False

    # Test 4: AI Integration (without actual API call)
    print("\n4️⃣ Testing AI Integration...")
    try:
        from meal_planning.ai_integration import MealPlannerAI

        # Test AI class creation
        ai_planner = MealPlannerAI("test-key")
        print(f"   ✅ AI planner created successfully")

        # Test food organization for AI
        foods_by_meal = {"breakfast": mock_foods[:1], "lunch": mock_foods[1:]}
        ai_foods = ai_planner.organize_foods_for_ai(foods_by_meal)
        print(f"   ✅ Foods organized for AI: {len(ai_foods)} meals")

    except Exception as e:
        print(f"   ❌ AI integration test failed: {e}")
        return False

    # Test 5: Meal Validation
    print("\n5️⃣ Testing Meal Validation...")
    try:
        from meal_planning.meal_validation import calculate_food_nutrition, safe_float

        # Test safe float conversion
        val = safe_float("123.45")
        print(f"   ✅ Safe float conversion: {val}")

        # Test nutrition calculation
        mock_food = {
            "nutrients": {
                "calories": 200,
                "protein": 15,
                "total_carbohydrates": 30,
                "total_fat": 8
            }
        }
        nutrition = calculate_food_nutrition(mock_food, 1.5)
        print(f"   ✅ Nutrition calculation: {nutrition['calories']} cal for 1.5 servings")

    except Exception as e:
        print(f"   ❌ Meal validation test failed: {e}")
        return False

    print("\n🎉 All component tests passed!")
    return True

def test_endpoint_logic():
    """Test the endpoint logic flow"""

    print("\n🔗 Testing Endpoint Logic Flow\n")

    try:
        # Mock the database collections and other dependencies
        mock_foods_collection = Mock()
        mock_users_collection = Mock()

        # Mock request and user
        from models.meal_plan import MealPlanRequest, DiningHallMeal, MealType

        request = MealPlanRequest(
            use_profile_data=True,
            dining_hall_meals=[
                DiningHallMeal(meal_type=MealType.BREAKFAST, dining_hall="Test Hall"),
            ],
            date="2024-01-15",
            use_profile_preferences=True
        )

        mock_user = {
            "email": "test@example.com",
            "profile": {
                "weight": 150,
                "height": 68,
                "sex": "male",
                "birthday": "1990-01-01",
                "activity_level": "moderate",
                "weight_goal_type": "maintain",
                "dietary_preferences": ["vegetarian"],
                "macro_protein": 25.0,
                "macro_carbs": 45.0,
                "macro_fat": 30.0
            }
        }

        print("1️⃣ Testing target calculation from profile...")
        from meal_planning.target_calculation import get_user_targets

        target_calories, target_macros = get_user_targets(request, mock_user["profile"])
        print(f"   ✅ Targets from profile: {target_calories} cal, {target_macros}")

        print("\n2️⃣ Testing mock food filtering...")
        # This would normally query the database
        mock_available_foods = [
            {
                "_id": "food1",
                "name": "Oatmeal",
                "dining_hall": "Test Hall",
                "meal_name": "breakfast",
                "nutrients": {"calories": 150, "protein": 6, "total_carbohydrates": 27, "total_fat": 3},
                "labels": ["vegetarian"]
            }
        ]

        from meal_planning.food_filtering import organize_foods_by_meal
        foods_by_meal = organize_foods_by_meal(mock_available_foods, request.dining_hall_meals)
        print(f"   ✅ Foods organized: {len(foods_by_meal)} meals")

        print("\n3️⃣ Testing meal targets calculation...")
        from meal_planning.target_calculation import calculate_meal_targets
        meal_targets = calculate_meal_targets(target_calories, target_macros)
        print(f"   ✅ Meal targets: {len(meal_targets)} meals calculated")

        print("\n🎉 Endpoint logic flow test passed!")
        return True

    except Exception as e:
        print(f"❌ Endpoint logic test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting Meal Planning Backend Tests\n")

    # Run component tests
    components_passed = test_meal_planning_components()

    if components_passed:
        # Run endpoint logic tests
        endpoint_passed = test_endpoint_logic()

        if endpoint_passed:
            print("\n✅ ALL TESTS PASSED!")
            print("🎯 Backend meal planning implementation is ready!")
            print("\n📋 Next Steps:")
            print("   1. Start the FastAPI server")
            print("   2. Test the /api/meal-plan endpoint with real data")
            print("   3. Implement frontend components")
            sys.exit(0)
        else:
            print("\n❌ Endpoint logic tests failed")
            sys.exit(1)
    else:
        print("\n❌ Component tests failed")
        sys.exit(1)