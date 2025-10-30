"""
Target calculation and macro distribution for meal planning
"""
from typing import Dict, Tuple
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def calculate_bmr(sex: str, weight_kg: float, height_cm: float, age: int) -> float:
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
    """
    if sex.lower() == 'male':
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

def get_activity_multiplier(activity_level: str) -> float:
    """
    Get activity multiplier for TDEE calculation
    """
    multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'high': 1.725,
        'extreme': 1.9
    }
    return multipliers.get(activity_level.lower(), 1.2)

def calculate_energy_target_from_profile(user_profile: Dict) -> int:
    """
    Calculate daily energy target from user profile data
    Similar to the existing get_energy_target endpoint logic
    """
    sex = user_profile.get("sex", "male")
    weight_lbs = user_profile.get("weight", 150)
    height_in = user_profile.get("height", 68)
    birthday = user_profile.get("birthday")
    activity_level = user_profile.get("activity_level", "sedentary")
    weight_goal_type = user_profile.get("weight_goal_type", "maintain")
    weight_goal_rate = user_profile.get("weight_goal_rate", 0)
    weight_goal_custom_rate = user_profile.get("weight_goal_custom_rate", 0)

    # Convert to metric
    weight_kg = float(weight_lbs) * 0.453592
    height_cm = float(height_in) * 2.54

    # Calculate age
    if birthday:
        if isinstance(birthday, str):
            birthdate = datetime.strptime(birthday[:10], "%Y-%m-%d")
        else:
            birthdate = birthday
        today = datetime.today()
        age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    else:
        age = 30  # default

    # Calculate BMR and TDEE
    bmr = calculate_bmr(sex, weight_kg, height_cm, age)
    tdee = bmr * get_activity_multiplier(activity_level)

    # Map string rates to float values
    rate_map = {"slow": 0.5, "moderate": 1.0, "fast": 1.5}

    # Adjust for weight goal
    if weight_goal_type in ["lose", "losing"]:
        if str(weight_goal_rate) == "custom":
            try:
                custom_rate = float(weight_goal_custom_rate)
            except Exception:
                custom_rate = 0
            tdee -= 500 * custom_rate
        else:
            rate_value = rate_map.get(str(weight_goal_rate), None)
            if rate_value is not None:
                tdee -= 500 * rate_value
            else:
                try:
                    tdee -= 500 * float(weight_goal_rate)
                except Exception:
                    pass

    elif weight_goal_type in ["gain", "gaining"]:
        if str(weight_goal_rate) == "custom":
            try:
                custom_rate = float(weight_goal_custom_rate)
            except Exception:
                custom_rate = 0
            tdee += 500 * custom_rate
        else:
            rate_value = rate_map.get(str(weight_goal_rate), None)
            if rate_value is not None:
                tdee += 500 * rate_value
            else:
                try:
                    tdee += 500 * float(weight_goal_rate)
                except Exception:
                    pass

    elif weight_goal_type == "custom":
        try:
            tdee += 500 * float(weight_goal_custom_rate)
        except Exception:
            pass

    return round(tdee)

def get_macro_targets_from_profile(user_profile: Dict) -> Dict[str, float]:
    """
    Get macro percentage targets from user profile
    """
    return {
        "protein": user_profile.get("macro_protein", 30.0),
        "carbs": user_profile.get("macro_carbs", 40.0),
        "fat": user_profile.get("macro_fat", 30.0)
    }

def validate_macro_percentages(protein_pct: float, carbs_pct: float, fat_pct: float) -> bool:
    """
    Validate that macro percentages sum to 100%
    """
    total = protein_pct + carbs_pct + fat_pct
    return abs(total - 100.0) <= 0.01  # Allow small floating point errors

def get_user_targets(request, user_profile: Dict) -> Tuple[int, Dict[str, float]]:
    """
    Get target calories and macros based on request preferences

    Returns:
        Tuple of (target_calories, target_macros_dict)
    """
    if request.use_profile_data:
        # Get from user profile
        target_calories = calculate_energy_target_from_profile(user_profile)
        target_macros = get_macro_targets_from_profile(user_profile)

        logger.info(f"Using profile targets: {target_calories} cal, {target_macros}")
    else:
        # Use provided values
        target_calories = request.target_calories
        target_macros = {
            "protein": request.protein_percent,
            "carbs": request.carbs_percent,
            "fat": request.fat_percent
        }

        # Validate macros sum to 100%
        if not validate_macro_percentages(
            target_macros["protein"],
            target_macros["carbs"],
            target_macros["fat"]
        ):
            raise ValueError("Macro percentages must sum to 100%")

        logger.info(f"Using manual targets: {target_calories} cal, {target_macros}")

    return target_calories, target_macros

def calculate_meal_targets(target_calories: int, target_macros: Dict[str, float]) -> Dict[str, Dict[str, float]]:
    """
    Distribute daily targets across meals (breakfast, lunch, dinner)

    Returns:
        Dict with meal targets for each meal type
    """
    # Calorie distribution across meals
    meal_distributions = {
        "breakfast": 0.30,  # 30% of daily calories
        "lunch": 0.35,      # 35% of daily calories
        "dinner": 0.35      # 35% of daily calories
    }

    meal_targets = {}

    for meal_type, calorie_percentage in meal_distributions.items():
        meal_calories = target_calories * calorie_percentage

        # Calculate macro grams for this meal
        protein_calories = meal_calories * target_macros["protein"] / 100
        carbs_calories = meal_calories * target_macros["carbs"] / 100
        fat_calories = meal_calories * target_macros["fat"] / 100

        # Convert calories to grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
        protein_grams = protein_calories / 4
        carbs_grams = carbs_calories / 4
        fat_grams = fat_calories / 9

        meal_targets[meal_type] = {
            "calories": round(meal_calories, 1),
            "protein_g": round(protein_grams, 1),
            "carbs_g": round(carbs_grams, 1),
            "fat_g": round(fat_grams, 1)
        }

        logger.debug(f"{meal_type.title()} targets: {meal_targets[meal_type]}")

    return meal_targets

def calculate_macro_percentages(total_calories: float, total_protein: float, total_carbs: float, total_fat: float) -> Dict[str, float]:
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
    calorie_tolerance: float = 0.15,  # ±15%
    macro_tolerance: float = 8.0      # ±8 percentage points
) -> Tuple[bool, str]:
    """
    Check if generated meal plan meets targets within acceptable tolerance

    Returns:
        Tuple of (success, message)
    """
    # Check calorie target
    calorie_diff_pct = abs(actual_calories - target_calories) / target_calories
    calorie_ok = calorie_diff_pct <= calorie_tolerance

    # Check macro targets
    protein_diff = abs(actual_macros["protein"] - target_macros["protein"])
    carbs_diff = abs(actual_macros["carbs"] - target_macros["carbs"])
    fat_diff = abs(actual_macros["fat"] - target_macros["fat"])

    macros_ok = (protein_diff <= macro_tolerance and
                 carbs_diff <= macro_tolerance and
                 fat_diff <= macro_tolerance)

    success = calorie_ok and macros_ok

    if success:
        message = "Meal plan successfully meets all targets"
    elif not calorie_ok:
        message = f"Calories off by {calorie_diff_pct:.1%} (target: {target_calories}, actual: {actual_calories:.0f})"
    else:
        message = f"Macros outside tolerance - P: {protein_diff:.1f}%, C: {carbs_diff:.1f}%, F: {fat_diff:.1f}%"

    logger.info(f"Target achievement: {success} - {message}")

    return success, message