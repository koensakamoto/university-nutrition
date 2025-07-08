from bson import ObjectId

def get_food_info(food_name, db):
    """Query the foods collection for a food item by name (case-insensitive)."""
    food = db["foods"].find_one({"name": {"$regex": f"^{food_name}$", "$options": "i"}})
    if food:
        return {
            "name": food.get("name"),
            "description": food.get("description"),
            "portion_size": food.get("portion_size"),
            "nutrients": food.get("nutrients"),
            "dining_hall": food.get("dining_hall"),
            "meal_name": food.get("meal_name"),
            "date": food.get("date"),
        }
    return None

def get_meal_log(user_id, db):
    """Query the plates collection for all plates for a user, sorted by date descending."""
    plates = list(db["plates"].find({"user_id": user_id}).sort("date", -1))
    for plate in plates:
        plate["_id"] = str(plate["_id"])
    return plates

def get_user_profile(user_id, db):
    """Query the users collection for a user by _id and return the profile object."""
    user = db["users"].find_one({"_id": ObjectId(user_id)})
    if user:
        profile = user.get("profile", {})
        profile["email"] = user.get("email")
        return profile
    return None

def get_weight_log(user_id, db):
    """Query the weight_log collection for all logs for a user, sorted by date descending."""
    logs = list(db["weight_log"].find({"user_id": user_id}).sort("date", -1))
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs
