from langchain.tools import tool
from pymongo.collection import Collection

@tool
def get_user_profile(email: str, users_collection: Collection) -> str:
    """
    Retrieves a user's nutrition-relevant profile data from the database.

    Parameters:
        email (str): The user's email address used to identify the profile.
        users_collection (Collection): The MongoDB collection containing user documents.

    Returns:
        str: A formatted string of the user's nutrition profile details. Fields may include:
            - sex: Biological sex ('male', 'female').
            - birthday
            - current_weight
            - body_fat_percentage
            - BMI
            - goal_weight
            - energy_target
            - weight_goal_rate
            - activity_level
            - macro_targets
            - diet_type
            - meal_preferences
            - cultural_preferences
            - food_allergens
            - additional_allergies_or_notes
            - height: User's height.
            - weight: User's weight in kg or lbs.
            - age: User's age in years.
            - goal: Nutrition or fitness goal (e.g., 'weight_loss', 'muscle_gain').

    Raises:
        ValueError: If the user email does not exist or lacks a profile.
        Exception: If there is an issue querying the database.

    Example:
        >>> get_user_profile("john@example.com", users_collection)
        "User Profile:\nsex: male\nheight: 180\nweight: 75\n..."
    """
    try:
        user = users_collection.find_one({"email": email})
        if not user or "profile" not in user:
            raise ValueError("User profile not found.")

        profile = user["profile"]
        profile_lines = [f"{key.replace('_', ' ').capitalize()}: {value}" for key, value in profile.items()]
        return "User Profile:\n" + "\n".join(profile_lines)
    except Exception as e:
        raise Exception(f"Error retrieving user profile: {str(e)}")
    
@tool
def get_food_info(food_name: str, foods_collection: Collection) -> str:
    """
    Retrieves detailed nutritional information for a specific food item.

    Parameters:
        food_name (str): The name (or partial name) of the food item to search for.
        foods_collection (Collection): The MongoDB collection containing food documents.

    Returns:
        str: A formatted string containing the food's nutritional facts, or a message
             indicating that the food was not found.

    Example:
        >>> get_food_info("grilled chicken", foods_collection)
        "Food: Grilled Chicken Breast\nCalories: 165 kcal\nProtein: 31g\nCarbs: 0g\nFat: 3.6g"

    Raises:
        Exception: If there's an issue querying the database.
    """
    try:
        food = foods_collection.find_one(
            {"name": {"$regex": food_name, "$options": "i"}}
        )
        if not food:
            return f"No food found matching '{food_name}'."

        return (
            f"Food: {food.get('name', 'Unknown')}\n"
            f"Calories: {food.get('calories', '?')} kcal\n"
            f"Protein: {food.get('protein', '?')} g\n"
            f"Carbohydrates: {food.get('carbs', '?')} g\n"
            f"Fat: {food.get('fat', '?')} g\n"
            f"Serving Size: {food.get('serving_size', 'N/A')}"
        )

    except Exception as e:
        return f"An error occurred while retrieving food info: {str(e)}"
    

    
