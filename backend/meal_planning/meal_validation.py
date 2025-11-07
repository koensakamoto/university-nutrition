"""
Meal plan validation and nutritional calculation functions
"""
from typing import List, Dict, Tuple
import logging
from models.meal_plan import PlannedMeal, PlannedMealItem, MealPlanResponse

logger = logging.getLogger(__name__)

def safe_float(value, default: float = 0.0) -> float:
    """Safely convert value to float with default"""
    try:
        return float(value) if value not in [None, '', '-'] else default
    except (ValueError, TypeError):
        return default

def find_food_by_id(food_id: str, foods_by_meal: Dict[str, List[Dict]]) -> Tuple[Dict, str]:
    """
    Find food by ID across all meals

    Returns:
        Tuple of (food_dict, meal_type) or (None, None) if not found
    """
    for meal_type, foods in foods_by_meal.items():
        for food in foods:
            if str(food["_id"]) == food_id:
                return food, meal_type
    return None, None

def calculate_food_nutrition(food: Dict, quantity: float) -> Dict[str, float]:
    """
    Calculate nutrition values for a food item with given quantity
    """
    nutrients = food.get("nutrients", {})

    base_calories = safe_float(nutrients.get("calories", 0))
    base_protein = safe_float(nutrients.get("protein", 0))
    base_carbs = safe_float(nutrients.get("total_carbohydrates", 0))
    base_fat = safe_float(nutrients.get("total_fat", 0))

    return {
        "calories": base_calories * quantity,
        "protein": base_protein * quantity,
        "carbs": base_carbs * quantity,
        "fat": base_fat * quantity
    }

def validate_meal_plan_selections(
    ai_meal_plan: Dict,
    foods_by_meal: Dict[str, List[Dict]]
) -> Tuple[bool, List[str]]:
    """
    Validate that all selected foods exist and have valid quantities

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    is_valid = True

    required_meals = ["breakfast", "lunch", "dinner"]

    for meal_type in required_meals:
        if meal_type not in ai_meal_plan:
            errors.append(f"Missing {meal_type} in meal plan")
            is_valid = False
            continue

        meal_foods = ai_meal_plan[meal_type]
        if not isinstance(meal_foods, list) or len(meal_foods) == 0:
            errors.append(f"No foods selected for {meal_type}")
            is_valid = False
            continue

        for item in meal_foods:
            if not isinstance(item, dict):
                errors.append(f"Invalid food item format in {meal_type}")
                is_valid = False
                continue

            food_id = item.get("food_id")
            quantity = item.get("quantity")

            if not food_id:
                errors.append(f"Missing food_id in {meal_type}")
                is_valid = False
                continue

            # Check if food exists
            food, _ = find_food_by_id(str(food_id), foods_by_meal)
            if not food:
                errors.append(f"Food ID {food_id} not found in available foods for {meal_type}")
                is_valid = False
                continue

            # Validate quantity
            try:
                qty = float(quantity)
                if qty <= 0 or qty > 3.0:
                    errors.append(f"Invalid quantity {qty} for food {food_id} in {meal_type}")
                    is_valid = False
            except (ValueError, TypeError):
                errors.append(f"Invalid quantity format for food {food_id} in {meal_type}")
                is_valid = False

    return is_valid, errors

def calculate_meal_nutrition_totals(
    meal_foods: List[Dict],
    foods_by_meal: Dict[str, List[Dict]]
) -> Dict[str, float]:
    """
    Calculate total nutrition for a single meal
    """
    totals = {
        "calories": 0.0,
        "protein": 0.0,
        "carbs": 0.0,
        "fat": 0.0
    }

    for item in meal_foods:
        food_id = str(item["food_id"])
        quantity = float(item["quantity"])

        # Find the food
        food, _ = find_food_by_id(food_id, foods_by_meal)
        if not food:
            logger.warning(f"Food {food_id} not found during nutrition calculation")
            continue

        # Calculate nutrition for this item
        item_nutrition = calculate_food_nutrition(food, quantity)

        # Add to totals
        for nutrient in totals:
            totals[nutrient] += item_nutrition[nutrient]

    return totals

def create_planned_meal_items(
    meal_foods: List[Dict],
    foods_by_meal: Dict[str, List[Dict]],
    meal_type: str,
    dining_hall: str
) -> List[PlannedMealItem]:
    """
    Create PlannedMealItem objects from AI selections
    """
    planned_items = []

    for item in meal_foods:
        food_id = str(item["food_id"])
        quantity = float(item["quantity"])

        # Find the food
        food, _ = find_food_by_id(food_id, foods_by_meal)
        if not food:
            logger.warning(f"Skipping food {food_id} - not found")
            continue

        # Calculate nutrition for this quantity
        nutrition = calculate_food_nutrition(food, quantity)

        planned_item = PlannedMealItem(
            food_id=food_id,
            food_name=food.get("name", "Unknown Food"),
            quantity=round(quantity, 1),
            calories=round(nutrition["calories"], 1),
            protein=round(nutrition["protein"], 1),
            carbs=round(nutrition["carbs"], 1),
            fat=round(nutrition["fat"], 1),
            dining_hall=dining_hall,
            meal_name=meal_type
        )

        planned_items.append(planned_item)

    return planned_items

def enhance_meal_plan_response(
    ai_meal_plan: Dict,
    foods_by_meal: Dict[str, List[Dict]],
    dining_hall_meals: List[Dict],
    target_calories: int,
    target_macros: Dict[str, float],
    date: str
) -> MealPlanResponse:
    """
    Convert AI meal plan to full MealPlanResponse with calculated nutrition
    """
    # Create dining hall mapping
    hall_mapping = {}
    for meal in dining_hall_meals:
        # Handle both dict and object access
        meal_type = meal["meal_type"] if isinstance(meal, dict) else meal.meal_type
        dining_hall = meal["dining_hall"] if isinstance(meal, dict) else meal.dining_hall
        hall_mapping[meal_type] = dining_hall

    planned_meals = []
    total_calories = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0

    # Process each meal
    for meal_type in ["breakfast", "lunch", "dinner"]:
        dining_hall = hall_mapping.get(meal_type, "Unknown")
        meal_foods = ai_meal_plan.get(meal_type, [])

        # Create planned meal items
        planned_items = create_planned_meal_items(
            meal_foods,
            foods_by_meal,
            meal_type,
            dining_hall
        )

        # Calculate meal totals
        meal_totals = calculate_meal_nutrition_totals(meal_foods, foods_by_meal)

        # Create planned meal
        planned_meal = PlannedMeal(
            meal_type=meal_type,
            dining_hall=dining_hall,
            foods=planned_items,
            total_calories=round(meal_totals["calories"], 1),
            total_protein=round(meal_totals["protein"], 1),
            total_carbs=round(meal_totals["carbs"], 1),
            total_fat=round(meal_totals["fat"], 1)
        )

        planned_meals.append(planned_meal)

        # Add to daily totals
        total_calories += meal_totals["calories"]
        total_protein += meal_totals["protein"]
        total_carbs += meal_totals["carbs"]
        total_fat += meal_totals["fat"]

    # Calculate actual macro percentages
    actual_macros = calculate_actual_macro_percentages(
        total_calories, total_protein, total_carbs, total_fat
    )

    # Check if targets were achieved (pass actual grams for accurate error messages)
    success, message = check_target_achievement(
        total_calories, actual_macros, target_calories, target_macros,
        actual_protein_g=total_protein,
        actual_carbs_g=total_carbs,
        actual_fat_g=total_fat
    )

    return MealPlanResponse(
        date=date,
        target_calories=target_calories,
        target_macros=target_macros,
        meals=planned_meals,
        total_calories=round(total_calories, 1),
        total_protein=round(total_protein, 1),
        total_carbs=round(total_carbs, 1),
        total_fat=round(total_fat, 1),
        actual_macros=actual_macros,
        success=success,
        message=message
    )

def calculate_actual_macro_percentages(
    total_calories: float,
    total_protein: float,
    total_carbs: float,
    total_fat: float
) -> Dict[str, float]:
    """
    Calculate actual macro percentages from totals
    """
    if total_calories == 0:
        return {"protein": 0.0, "carbs": 0.0, "fat": 0.0}

    protein_calories = total_protein * 4
    carbs_calories = total_carbs * 4
    fat_calories = total_fat * 9

    return {
        "protein": round((protein_calories / total_calories) * 100, 1),
        "carbs": round((carbs_calories / total_calories) * 100, 1),
        "fat": round((fat_calories / total_calories) * 100, 1)
    }

def check_target_achievement(
    actual_calories: float,
    actual_macros: Dict[str, float],
    target_calories: int,
    target_macros: Dict[str, float],
    actual_protein_g: float = None,
    actual_carbs_g: float = None,
    actual_fat_g: float = None,
    calorie_tolerance: float = 0.10,  # ±10% (90-110% of target)
    macro_tolerance: float = 6.0      # ±6 percentage points (slightly more lenient)
) -> Tuple[bool, str]:
    """
    Check if generated meal plan meets targets within acceptable tolerance
    """
    # Check calorie target
    calorie_diff_pct = abs(actual_calories - target_calories) / target_calories
    calorie_ok = calorie_diff_pct <= calorie_tolerance

    # Check macro targets (percentage points)
    protein_diff = abs(actual_macros["protein"] - target_macros["protein"])
    carbs_diff = abs(actual_macros["carbs"] - target_macros["carbs"])
    fat_diff = abs(actual_macros["fat"] - target_macros["fat"])

    macros_ok = (protein_diff <= macro_tolerance and
                 carbs_diff <= macro_tolerance and
                 fat_diff <= macro_tolerance)

    success = calorie_ok and macros_ok

    # Calculate actual gram differences (for more accurate error messages)
    if actual_protein_g is not None and actual_carbs_g is not None and actual_fat_g is not None:
        # Calculate target grams from percentages
        target_protein_g = (target_macros["protein"] / 100 * target_calories) / 4
        target_carbs_g = (target_macros["carbs"] / 100 * target_calories) / 4
        target_fat_g = (target_macros["fat"] / 100 * target_calories) / 9

        # Calculate percentage difference in grams (not percentage points)
        protein_gram_diff = abs(actual_protein_g - target_protein_g) / target_protein_g * 100 if target_protein_g > 0 else 0
        carbs_gram_diff = abs(actual_carbs_g - target_carbs_g) / target_carbs_g * 100 if target_carbs_g > 0 else 0
        fat_gram_diff = abs(actual_fat_g - target_fat_g) / target_fat_g * 100 if target_fat_g > 0 else 0
    else:
        # Fallback to percentage point differences
        protein_gram_diff = protein_diff
        carbs_gram_diff = carbs_diff
        fat_gram_diff = fat_diff

    if success:
        message = f"🎯 Excellent! All targets met within tolerance. Calories: {actual_calories:.0f}/{target_calories} ({actual_calories/target_calories*100:.1f}%)"
    elif not calorie_ok and not macros_ok:
        diff_cal = actual_calories - target_calories
        message = f"❌ Both calories and macros off target. Calories: {'+' if diff_cal > 0 else ''}{diff_cal:.0f} ({actual_calories:.0f}/{target_calories}), Macro diffs: P:{protein_gram_diff:.1f}%, C:{carbs_gram_diff:.1f}%, F:{fat_gram_diff:.1f}%"
    elif not calorie_ok:
        diff_cal = actual_calories - target_calories
        message = f"⚠️ Calories off target: {'+' if diff_cal > 0 else ''}{diff_cal:.0f} ({actual_calories:.0f}/{target_calories}, {actual_calories/target_calories*100:.1f}%)"
    else:
        message = f"⚠️ Macros outside tolerance - Protein: {protein_gram_diff:.1f}%, Carbs: {carbs_gram_diff:.1f}%, Fat: {fat_gram_diff:.1f}% off target"

    logger.info(f"Target achievement: {success} - {message}")

    return success, message