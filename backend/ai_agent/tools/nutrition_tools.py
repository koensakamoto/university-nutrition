"""
Nutrition-focused tools for the AI agent.

These tools interact with MongoDB collections to provide personalized
nutrition data and analysis for users.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from langchain_core.tools import tool
from bson import ObjectId

# Global data service - will be set by the agent
data_service = None

def set_data_service(service):
    global data_service
    data_service = service


@tool
async def get_user_nutrition_progress(
    user_id: str,
    days: int = 1,
    include_goals: bool = True
) -> Dict[str, Any]:
    """
    Get comprehensive nutrition progress for a user over specified days.
    
    Args:
        user_id: User identifier
        days: Number of days to analyze (1-30)
        include_goals: Whether to include goal comparison
        
    Returns:
        Nutrition summary with intake, goals, and progress analysis
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days-1)
    
    # Get user plates for the period
    plates = await data_service.get_user_plates(
        user_id=user_id,
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d")
    )
    
    # Calculate total nutrition
    total_nutrition = await data_service.calculate_nutrition_from_plates(plates)
    
    # Calculate daily averages
    daily_average = {
        key: round(value / days, 1) for key, value in total_nutrition.items()
    }
    
    # Get user profile for goals if requested
    goals = None
    progress_percentage = None
    if include_goals:
        user_profile = await data_service.get_user_profile(user_id)
        if user_profile and user_profile.get("profile"):
            profile_data = user_profile["profile"]
            goals = {
                "calories": profile_data.get("calorie_target", 2000),
                "protein": profile_data.get("protein_target", 150),
                "carbs": profile_data.get("carb_target", 250),
                "fat": profile_data.get("fat_target", 65)
            }
            
            # Calculate progress percentages
            progress_percentage = {}
            for nutrient, target in goals.items():
                if target > 0:
                    progress_percentage[nutrient] = round(
                        (daily_average.get(nutrient, 0) / target) * 100, 1
                    )
    
    return {
        "period": f"Last {days} day(s)",
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "total_nutrition": total_nutrition,
        "daily_average": daily_average,
        "goals": goals,
        "progress_percentage": progress_percentage,
        "meals_logged": len(plates),
        "days_with_data": len(set(plate.get("date") for plate in plates))
    }


@tool
async def get_available_dining_foods(
    date: str,
    meal_type: Optional[str] = None,
    dining_hall: Optional[str] = None,
    dietary_filters: Optional[List[str]] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get available foods from dining halls for a specific date.
    
    Args:
        date: Date in YYYY-MM-DD format
        meal_type: Optional filter (breakfast, lunch, dinner)
        dining_hall: Optional specific dining hall
        dietary_filters: Optional dietary restrictions (vegetarian, vegan, etc.)
        user_id: Optional user ID to automatically apply their dietary preferences
        
    Returns:
        Available foods organized by dining hall and meal type
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    # If user_id provided, get their dietary preferences
    if user_id and not dietary_filters:
        user_profile = await data_service.get_user_profile(user_id)
        if user_profile and user_profile.get("profile"):
            diet_type = user_profile["profile"].get("diet_type")
            if diet_type:
                dietary_filters = [diet_type]
    
    # Get foods for the date
    foods = await data_service.get_foods_by_date(
        date=date,
        dining_hall=dining_hall,
        meal_type=meal_type
    )
    
    # Apply dietary filters if provided
    if dietary_filters:
        filtered_foods = []
        for food in foods:
            food_labels = food.get("labels", [])
            food_tags = food.get("tags", [])
            allergens = food.get("allergens", [])
            
            # Simple dietary filter logic
            include_food = True
            for filter_term in dietary_filters:
                filter_lower = filter_term.lower()
                if filter_lower in ["vegetarian", "vegan"]:
                    # Check both labels and tags (case insensitive)
                    food_labels_lower = [label.lower() for label in food_labels]
                    food_tags_lower = [tag.lower() for tag in food_tags]
                    if filter_lower not in food_labels_lower and filter_lower not in food_tags_lower:
                        include_food = False
                        break
                elif filter_lower in ["gluten-free", "dairy-free"]:
                    # Check if allergen is present
                    allergen_check = "gluten" if "gluten" in filter_lower else "dairy"
                    if any(allergen_check in allergen.lower() for allergen in allergens):
                        include_food = False
                        break
            
            if include_food:
                filtered_foods.append(food)
        
        foods = filtered_foods
    
    # Organize by dining hall and meal type
    dining_halls = {}
    meal_types = set()
    
    for food in foods:
        hall = food.get("dining_hall", "Unknown")
        meal = food.get("meal_name", "Unknown")
        meal_types.add(meal)
        
        if hall not in dining_halls:
            dining_halls[hall] = {}
        if meal not in dining_halls[hall]:
            dining_halls[hall][meal] = []
        
        dining_halls[hall][meal].append({
            "id": str(food.get("_id", "")),
            "name": food.get("name", ""),
            "description": food.get("description", ""),
            "nutrients": food.get("nutrients", {}),
            "tags": food.get("tags", []),
            "allergens": food.get("allergens", [])
        })
    
    return {
        "date": date,
        "dining_halls": dining_halls,
        "total_foods": len(foods),
        "meal_types": list(meal_types),
        "filtered_by": {
            "meal_type": meal_type,
            "dining_hall": dining_hall,
            "dietary_filters": dietary_filters or []
        }
    }


@tool
async def get_user_meal_history(
    user_id: str,
    days: int = 7,
    include_nutrition: bool = True
) -> Dict[str, Any]:
    """
    Get user's recent meal history from plates collection.
    
    Args:
        user_id: User identifier
        days: Number of days to look back
        include_nutrition: Whether to include nutrition calculations
        
    Returns:
        Recent meals with nutrition information
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get user plates
    plates = await data_service.get_user_plates(
        user_id=user_id,
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d")
    )
    
    # Process meals
    meals = []
    food_frequency = {}
    dining_hall_frequency = {}
    
    for plate in plates:
        meal_data = {
            "plate_id": plate.get("_id"),
            "date": plate.get("date"),
            "items": plate.get("items", []),
            "dining_hall": plate.get("dining_hall", "Unknown")
        }
        
        # Count food and dining hall frequency
        dining_hall = plate.get("dining_hall", "Unknown")
        dining_hall_frequency[dining_hall] = dining_hall_frequency.get(dining_hall, 0) + 1
        
        for item in plate.get("items", []):
            food_name = item.get("name", "Unknown")
            food_frequency[food_name] = food_frequency.get(food_name, 0) + 1
        
        if include_nutrition:
            # Calculate nutrition for this plate
            plate_nutrition = await data_service.calculate_nutrition_from_plates([plate])
            meal_data["nutrition"] = plate_nutrition
        
        meals.append(meal_data)
    
    # Analyze patterns
    most_common_foods = sorted(food_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
    dining_hall_preferences = sorted(dining_hall_frequency.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "period": f"Last {days} days",
        "meals": meals,
        "patterns": {
            "most_common_foods": [{
                "food": food,
                "frequency": freq
            } for food, freq in most_common_foods],
            "dining_hall_preferences": [{
                "dining_hall": hall,
                "visits": count
            } for hall, count in dining_hall_preferences],
            "nutrition_trends": {} if include_nutrition else None
        },
        "total_meals": len(plates),
        "days_analyzed": days
    }


@tool
async def search_foods_by_criteria(
    query: str,
    date: Optional[str] = None,
    nutrition_requirements: Optional[Dict[str, float]] = None,
    dietary_restrictions: Optional[List[str]] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search for foods matching specific criteria.
    
    Args:
        query: Food name or ingredient to search for
        date: Optional date filter for availability
        nutrition_requirements: Optional nutrition targets (e.g., {"protein": 20})
        dietary_restrictions: Optional dietary filters
        limit: Maximum number of results
        
    Returns:
        Matching foods with nutrition information
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    # Search foods
    foods = await data_service.search_foods(query, date, limit * 2)  # Get more for filtering
    
    # Apply nutrition requirements filter
    if nutrition_requirements:
        filtered_foods = []
        for food in foods:
            nutrients = food.get("nutrients", {})
            meets_requirements = True
            
            for nutrient, min_value in nutrition_requirements.items():
                food_value = nutrients.get(nutrient, 0)
                # Handle string values
                if isinstance(food_value, str):
                    try:
                        food_value = float(food_value.replace("g", "").replace("kcal", "").strip())
                    except:
                        food_value = 0
                
                if food_value < min_value:
                    meets_requirements = False
                    break
            
            if meets_requirements:
                filtered_foods.append(food)
        
        foods = filtered_foods
    
    # Apply dietary restrictions
    if dietary_restrictions:
        filtered_foods = []
        for food in foods:
            tags = [tag.lower() for tag in food.get("tags", [])]
            allergens = [allergen.lower() for allergen in food.get("allergens", [])]
            
            meets_restrictions = True
            for restriction in dietary_restrictions:
                restriction_lower = restriction.lower()
                if restriction_lower in ["vegetarian", "vegan"]:
                    if restriction_lower not in tags:
                        meets_restrictions = False
                        break
                elif "gluten-free" in restriction_lower:
                    if any("gluten" in allergen for allergen in allergens):
                        meets_restrictions = False
                        break
            
            if meets_restrictions:
                filtered_foods.append(food)
        
        foods = filtered_foods
    
    # Limit results
    foods = foods[:limit]
    
    # Format results
    results = []
    for food in foods:
        results.append({
            "id": str(food.get("_id", "")),
            "name": food.get("name", ""),
            "description": food.get("description", ""),
            "dining_hall": food.get("dining_hall", ""),
            "meal_type": food.get("meal_name", ""),
            "nutrients": food.get("nutrients", {}),
            "tags": food.get("tags", []),
            "date": food.get("date", "")
        })
    
    return {
        "query": query,
        "filters_applied": {
            "date": date,
            "nutrition_requirements": nutrition_requirements,
            "dietary_restrictions": dietary_restrictions
        },
        "results": results,
        "total_found": len(results),
        "suggestions": ["Try searching for similar foods", "Check different dining halls"] if len(results) < 3 else []
    }


@tool
async def analyze_nutrition_gaps(
    user_id: str,
    analysis_period: int = 7
) -> Dict[str, Any]:
    """
    Analyze user's nutrition data to identify gaps and deficiencies.
    
    Args:
        user_id: User identifier
        analysis_period: Days to analyze for patterns
        
    Returns:
        Analysis of nutrition gaps and recommendations
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    # Get user profile for targets
    user_profile = await data_service.get_user_profile(user_id)
    if not user_profile:
        return {"error": "User profile not found"}
    
    # Get nutrition progress for analysis period
    nutrition_data = await get_user_nutrition_progress(
        user_id=user_id,
        days=analysis_period,
        include_goals=True
    )
    
    if "error" in nutrition_data:
        return nutrition_data
    
    daily_avg = nutrition_data.get("daily_average", {})
    goals = nutrition_data.get("goals", {})
    
    # Analyze gaps
    nutrition_gaps = {}
    recommendations = []
    priority_nutrients = []
    
    for nutrient, target in goals.items():
        current = daily_avg.get(nutrient, 0)
        if target > 0:
            percentage = (current / target) * 100
            gap = max(0, target - current)
            
            if percentage < 70:
                status = "low"
                priority_nutrients.append(nutrient)
                recommendations.append(f"Increase {nutrient} intake by {gap:.1f}g per day")
            elif percentage < 90:
                status = "moderate"
            else:
                status = "adequate"
            
            nutrition_gaps[nutrient] = {
                "status": status,
                "current": current,
                "target": target,
                "gap": gap,
                "percentage": round(percentage, 1)
            }
    
    return {
        "analysis_period": f"Last {analysis_period} days",
        "nutrition_gaps": nutrition_gaps,
        "eating_patterns": {
            "meal_frequency": "regular" if nutrition_data.get("meals_logged", 0) >= analysis_period else "irregular",
            "days_with_data": nutrition_data.get("days_with_data", 0),
            "consistency": "good" if nutrition_data.get("days_with_data", 0) >= analysis_period * 0.8 else "needs_improvement"
        },
        "recommendations": recommendations,
        "priority_nutrients": priority_nutrients
    }


@tool
async def get_personalized_meal_suggestions(
    user_id: str,
    meal_type: str,
    date: str,
    nutrition_targets: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Generate personalized meal suggestions based on user profile and goals.
    
    Args:
        user_id: User identifier
        meal_type: breakfast, lunch, dinner, or snack
        date: Date for food availability
        nutrition_targets: Optional specific nutrition targets for this meal
        
    Returns:
        Personalized meal suggestions with rationale
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    # Get user profile
    user_profile = await data_service.get_user_profile(user_id)
    if not user_profile:
        return {"error": "User profile not found"}
    
    profile_data = user_profile.get("profile", {})
    dietary_preferences = profile_data.get("diet_type", "")
    
    # Get available foods for the date
    available_foods = await get_available_dining_foods(
        date=date,
        meal_type=meal_type
    )
    
    if "error" in available_foods:
        return available_foods
    
    # Get nutrition gaps
    nutrition_gaps = await analyze_nutrition_gaps(user_id, 7)
    priority_nutrients = nutrition_gaps.get("priority_nutrients", [])
    
    # Generate suggestions based on available foods and user needs
    suggestions = []
    all_foods = []
    
    for hall, meals in available_foods.get("dining_halls", {}).items():
        for meal, foods in meals.items():
            if meal.lower() == meal_type.lower():
                all_foods.extend(foods)
    
    # Score foods based on user preferences and nutrition needs
    scored_foods = []
    for food in all_foods:
        score = 0
        reasons = []
        
        # Check dietary preferences
        food_tags = [tag.lower() for tag in food.get("tags", [])]
        if dietary_preferences and dietary_preferences.lower() in food_tags:
            score += 10
            reasons.append(f"Matches {dietary_preferences} preference")
        
        # Check priority nutrients
        nutrients = food.get("nutrients", {})
        for nutrient in priority_nutrients:
            nutrient_value = nutrients.get(nutrient, 0)
            if isinstance(nutrient_value, str):
                try:
                    nutrient_value = float(nutrient_value.replace("g", "").replace("kcal", "").strip())
                except:
                    nutrient_value = 0
            
            if nutrient_value > 10:  # Arbitrary threshold for "good source"
                score += 5
                reasons.append(f"Good source of {nutrient}")
        
        if score > 0:
            scored_foods.append({
                "food": food,
                "score": score,
                "reasons": reasons
            })
    
    # Sort by score and take top suggestions
    scored_foods.sort(key=lambda x: x["score"], reverse=True)
    top_suggestions = scored_foods[:5]
    
    suggestions = [{
        "name": item["food"]["name"],
        "dining_hall": item["food"].get("dining_hall", ""),
        "description": item["food"].get("description", ""),
        "nutrients": item["food"].get("nutrients", {}),
        "reasons": item["reasons"],
        "score": item["score"]
    } for item in top_suggestions]
    
    return {
        "meal_type": meal_type,
        "date": date,
        "suggestions": suggestions,
        "rationale": {
            "based_on_goals": bool(priority_nutrients),
            "dietary_preferences": [dietary_preferences] if dietary_preferences else [],
            "nutrition_gaps": priority_nutrients,
            "available_foods": len(all_foods) > 0
        },
        "alternatives": all_foods[:3] if len(suggestions) < 3 else [],
        "nutrition_impact": {
            "focused_nutrients": priority_nutrients,
            "dietary_alignment": dietary_preferences
        }
    }


@tool
async def calculate_nutrition_targets(
    user_id: str,
    goal_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculate personalized nutrition targets based on user profile.
    
    Args:
        user_id: User identifier
        goal_type: Optional specific goal (weight_loss, muscle_gain, maintenance)
        
    Returns:
        Calculated nutrition targets and recommendations
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    # Get user profile
    user_profile = await data_service.get_user_profile(user_id)
    if not user_profile:
        return {"error": "User profile not found"}
    
    profile_data = user_profile.get("profile", {})
    
    # Extract user data with defaults
    age = profile_data.get("age", 25)
    sex = profile_data.get("sex", "unknown")
    weight = profile_data.get("current_weight", 70)  # kg
    height = profile_data.get("height", 175)  # cm
    activity_level = profile_data.get("activity_level", "moderate")
    current_goal = goal_type or profile_data.get("weight_goal_type", "maintenance")
    
    # Calculate BMR using Mifflin-St Jeor equation
    if sex.lower() == "male":
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    
    # Activity multipliers
    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    
    activity_mult = activity_multipliers.get(activity_level, 1.55)
    maintenance_calories = bmr * activity_mult
    
    # Adjust for goals
    if current_goal == "weight_loss":
        daily_calories = maintenance_calories - 500  # 1 lb/week loss
        protein_ratio = 0.35  # Higher protein for weight loss
        carb_ratio = 0.35
        fat_ratio = 0.30
    elif current_goal == "weight_gain":
        daily_calories = maintenance_calories + 300  # Slower bulk
        protein_ratio = 0.25
        carb_ratio = 0.45
        fat_ratio = 0.30
    else:  # maintenance
        daily_calories = maintenance_calories
        protein_ratio = 0.25
        carb_ratio = 0.45
        fat_ratio = 0.30
    
    # Calculate macro targets
    protein_calories = daily_calories * protein_ratio
    carb_calories = daily_calories * carb_ratio
    fat_calories = daily_calories * fat_ratio
    
    protein_grams = protein_calories / 4  # 4 cal/g
    carb_grams = carb_calories / 4  # 4 cal/g
    fat_grams = fat_calories / 9  # 9 cal/g
    
    return {
        "targets": {
            "daily_calories": round(daily_calories),
            "protein": round(protein_grams),
            "carbs": round(carb_grams),
            "fat": round(fat_grams)
        },
        "based_on": {
            "age": age,
            "sex": sex,
            "weight": weight,
            "height": height,
            "activity_level": activity_level,
            "goal": current_goal,
            "bmr": round(bmr),
            "maintenance_calories": round(maintenance_calories)
        },
        "macro_ratios": {
            "protein_percent": round(protein_ratio * 100),
            "carb_percent": round(carb_ratio * 100),
            "fat_percent": round(fat_ratio * 100)
        },
        "recommendations": [
            f"Aim for {round(protein_grams)} grams of protein daily",
            f"Target {round(daily_calories)} calories per day for {current_goal}",
            "Focus on whole foods and consistent meal timing"
        ]
    }