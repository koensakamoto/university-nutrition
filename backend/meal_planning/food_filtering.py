"""
Food filtering and dietary preference handling for meal planning
"""
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

def has_complete_macros(food: Dict) -> bool:
    """
    Check if food has complete macro information (protein, carbs, fat)
    """
    nutrients = food.get("nutrients")
    if not nutrients:
        return False

    # Check for required macros - allow multiple key variations
    protein_keys = ["protein"]
    carb_keys = ["total_carbohydrates", "carbs"]
    fat_keys = ["total_fat", "totalFat", "fat"]

    def has_valid_value(keys):
        for key in keys:
            value = nutrients.get(key)
            if value is not None and value != '' and value != '-':
                try:
                    # Allow 0 as valid value (some foods legitimately have 0g of a macro)
                    float_val = float(value)
                    if float_val >= 0:
                        return True
                except (ValueError, TypeError):
                    continue
        return False

    # All three macros must have valid values
    return has_valid_value(protein_keys) and has_valid_value(carb_keys) and has_valid_value(fat_keys)

def extract_dietary_labels(request, user_profile: Dict) -> List[str]:
    """
    Extract dietary labels to filter by from request or user profile
    """
    dietary_labels = []

    if request.use_profile_preferences:
        # Get from user profile
        profile_prefs = user_profile.get("dietary_preferences", [])

        # Map common dietary preferences to food labels
        for pref in profile_prefs:
            pref_lower = pref.lower()
            if pref_lower == "vegetarian":
                dietary_labels.append("vegetarian")
            elif pref_lower == "vegan":
                dietary_labels.append("vegan")
            elif pref_lower in ["climate_friendly", "sustainable", "climate friendly"]:
                dietary_labels.append("climate friendly")

    else:
        # Use manually specified preferences
        if request.dietary_preferences:
            for pref in request.dietary_preferences:
                pref_lower = pref.lower()
                if pref_lower == "vegetarian":
                    dietary_labels.append("vegetarian")
                elif pref_lower == "vegan":
                    dietary_labels.append("vegan")
                elif pref_lower in ["climate_friendly", "sustainable", "climate friendly"]:
                    dietary_labels.append("climate friendly")

    return dietary_labels

def apply_dietary_label_filters(base_query: Dict, dietary_labels: List[str]) -> Dict:
    """
    Apply dietary label filters to MongoDB query
    """
    if not dietary_labels:
        return base_query

    if "vegan" in dietary_labels:
        # Vegan is most restrictive - only get vegan items
        base_query["labels"] = "vegan"
    elif "vegetarian" in dietary_labels:
        # Vegetarian - get both vegetarian and vegan items
        base_query["labels"] = {"$in": ["vegetarian", "vegan"]}
    else:
        # Other labels (like climate friendly)
        base_query["labels"] = {"$in": dietary_labels}

    return base_query

def check_sufficient_foods_per_meal(
    foods: List[Dict],
    dining_hall_meals: List[Dict],
    min_required: int = 8
) -> bool:
    """
    Check if each meal has enough food options
    """
    for meal in dining_hall_meals:
        # Handle both dict and object access
        meal_type = meal["meal_type"] if isinstance(meal, dict) else meal.meal_type
        dining_hall = meal["dining_hall"] if isinstance(meal, dict) else meal.dining_hall

        meal_foods = [
            f for f in foods
            if f["dining_hall"] == dining_hall
            and f["meal_name"] == meal_type
        ]
        if len(meal_foods) < min_required:
            logger.warning(
                f"Insufficient foods for {meal_type} at {dining_hall}: "
                f"{len(meal_foods)} < {min_required}"
            )
            return False
    return True

def prioritize_by_labels(foods: List[Dict], preferred_labels: List[str]) -> List[Dict]:
    """
    Sort foods to prioritize those with preferred dietary labels
    """
    def label_score(food):
        food_labels = food.get("labels", [])
        if isinstance(food_labels, str):
            food_labels = [food_labels]

        score = 0
        for label in preferred_labels:
            if label in food_labels:
                score += 10  # Higher score for matching labels
        return score

    # Sort by label score (descending), so preferred items come first
    return sorted(foods, key=label_score, reverse=True)

def get_filtered_foods_for_meal_plan(
    request,
    user_profile: Dict,
    foods_collection,
    date: str
) -> Dict:
    """
    Main function to fetch and filter foods based on dietary preferences

    Returns:
        Dict with keys:
            - foods_by_meal: Dict[str, List[Dict]]
            - dietary_labels: List[str]
    """
    # Build base query for available foods
    base_query = {
        "date": date,
        "$or": []
    }

    # Add dining hall/meal combinations
    # Handle case-insensitive meal names and "Every Day" meals
    for meal in request.dining_hall_meals:
        # Handle both dict and object access
        if isinstance(meal, dict):
            meal_type = meal["meal_type"]
            dining_hall = meal["dining_hall"]
        else:
            # Handle both enum and string values
            meal_type = meal.meal_type.value if hasattr(meal.meal_type, 'value') else meal.meal_type
            dining_hall = meal.dining_hall

        meal_type_lower = meal_type.lower()

        # Create OR conditions for this dining hall
        meal_conditions = [
            # Direct match (case-insensitive)
            {
                "dining_hall": dining_hall,
                "meal_name": {"$regex": f"^{meal_type}$", "$options": "i"}
            },
            # "Every Day" meals that can be used for any meal
            {
                "dining_hall": dining_hall,
                "meal_name": {"$regex": "^every ?day$", "$options": "i"}
            }
        ]

        base_query["$or"].extend(meal_conditions)

    # Extract dietary labels
    dietary_labels = extract_dietary_labels(request, user_profile)

    # Apply dietary label filters
    if dietary_labels:
        base_query = apply_dietary_label_filters(base_query, dietary_labels)
        logger.info(f"Applied dietary label filters: {dietary_labels}")

    # Execute query
    available_foods = list(foods_collection.find(base_query))
    logger.info(f"Found {len(available_foods)} foods matching criteria")

    # Filter for trackable foods (complete macros)
    trackable_foods = [f for f in available_foods if has_complete_macros(f)]
    logger.info(f"Foods with complete macros: {len(trackable_foods)}")

    # Check if we have sufficient foods per meal
    min_foods_per_meal = 8
    has_sufficient = check_sufficient_foods_per_meal(
        trackable_foods,
        request.dining_hall_meals,
        min_foods_per_meal
    )

    if not has_sufficient and dietary_labels:
        # Fallback: remove strict label requirement but prioritize labeled foods
        logger.info("Insufficient foods with dietary labels, using soft filtering")

        # Remove strict label requirement
        base_query.pop("labels", None)
        all_foods = list(foods_collection.find(base_query))
        trackable_foods = [f for f in all_foods if has_complete_macros(f)]

        # Sort to prioritize foods with preferred labels
        trackable_foods = prioritize_by_labels(trackable_foods, dietary_labels)

        logger.info(f"Fallback filtering yielded {len(trackable_foods)} foods")

    # Organize foods by meal type
    foods_by_meal = organize_foods_by_meal(trackable_foods, request.dining_hall_meals)

    return {
        "foods_by_meal": foods_by_meal,
        "dietary_labels": dietary_labels
    }

def organize_foods_by_meal(
    foods: List[Dict],
    dining_hall_meals: List[Dict]
) -> Dict[str, List[Dict]]:
    """
    Organize foods by meal type for easier processing
    """
    foods_by_meal = {}

    for meal in dining_hall_meals:
        # Handle both dict and object access
        if isinstance(meal, dict):
            meal_type = meal["meal_type"]
            dining_hall = meal["dining_hall"]
        else:
            # Handle both enum and string values
            meal_type = meal.meal_type.value if hasattr(meal.meal_type, 'value') else meal.meal_type
            dining_hall = meal.dining_hall

        # Get foods for this specific meal/hall combo
        # Handle case-insensitive matching and "Every Day" meals
        meal_foods = []
        for f in foods:
            if f["dining_hall"] == dining_hall:
                food_meal_name = f["meal_name"].lower()
                target_meal_type = meal_type.lower()

                # Direct match
                if food_meal_name == target_meal_type:
                    meal_foods.append(f)
                # "Every Day" or "EveryDay" meals can be used for any meal type
                elif food_meal_name in ["every day", "everyday"]:
                    meal_foods.append(f)

        foods_by_meal[meal_type] = meal_foods
        logger.info(f"Meal {meal_type} at {dining_hall}: {len(meal_foods)} foods available")

    return foods_by_meal