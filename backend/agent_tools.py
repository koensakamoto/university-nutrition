from langchain.tools import tool
from pymongo.collection import Collection

@tool
def get_user_profile(email: str, users_collection: Collection) -> str:
    """
    Retrieve and return a formatted summary of a user's profile information from the database.

    Args:
        email (str): The email address of the user whose profile is to be retrieved.
        users_collection (Collection): The MongoDB collection containing user documents.

    Returns:
        str: A human-readable summary of the user's profile, or a message if the profile is not found.
    """
    user = users_collection.find_one({"email": email})
    if not user or "profile" not in user:
        return "User profile not found."
    profile = user["profile"]
    # Format the profile as a readable string
    profile_lines = [f"{key}: {value}" for key, value in profile.items()]
    return "User Profile:\n" + "\n".join(profile_lines)

