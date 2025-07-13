from auth_util import get_current_user
from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, Tool, AgentType
from langgraph.graph import StateGraph, END
from langchain_core.tools import tool
from dotenv import load_dotenv
import os
from pymongo import MongoClient
import certifi
from bson.objectid import ObjectId
import json

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

# MongoDB connection for user profile lookup
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
db = client["nutritionapp"]
users_collection = db["users"]

MAX_HISTORY_TURNS = 5  # Number of recent turns to keep in memory

# Persistent memory collection
conversations_collection = db["conversations"]

system_prompt = """
You are NutriBot, an expert nutrition assistant specifically designed for university students. 

Your primary goals:
1. Provide personalized nutrition advice based on user profiles and goals
2. Help users track and understand their eating patterns
3. Suggest practical meal improvements for busy students
4. Monitor progress toward health and weight goals
5. Offer evidence-based nutrition guidance

Key principles:
- Always consider the user's specific profile (weight, height, weight goal, weigh goal rate, sex, body fat percentage, meal preferences,
diet type, cultural preferences, food sensitivities, allergies, allergy notes, activity level)
)
- Provide actionable, student-friendly advice
- Use data from their logs to give personalized insights
- Be encouraging and supportive
- Focus on sustainable habits over quick fixes
- Consider budget and time constraints common to students

Response style:
- Be conversational but informative
- Use bullet points for multiple recommendations
- Include specific numbers when relevant (calories, macros, etc.)
- Explain the "why" behind recommendations
- Keep responses helpful but not overwhelming (aim for 100-200 words unless more detail is specifically requested)

When analyzing user data:
- Look for patterns in eating habits
- Identify nutritional gaps or excesses
- Consider meal timing and frequency
- Assess progress toward stated goals
- Note any concerning trends
"""



@tool(description="Get the user's weight log data. Returns a list of weight entries for the user, sorted by date descending.")
def get_weight_log(user_id: str) -> list:
    print("get_weight_log", user_id)
    """
    Get the user's weight log data. Returns a list of weight entries for the user, sorted by date descending.
    """
    logs = list(db["weight_log"].find({"user_id": user_id}).sort("date", -1))
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs

@tool(description="Summarize the user's last 7 days of logged meals, showing which foods were eaten each day and the average daily calories, protein, carbs, and fat.")
def get_meal_history(user_id: str) -> dict:
    """ 
    Retrieves a summary of the user's most recent 7 days of meal logs.

    Returns:
        A dictionary containing:
            - A mapping from each date to the list of food names consumed on that day.
            - The average daily intake of calories, protein (g), carbs (g), and fat (g).
      """
     

    plates = list(db["plates"].find({"user_id": user_id}).sort("date", -1).limit(7))
    food_ids = set()
    for plate in plates:
        for item in plate["items"]:
            if not item["food_id"].startswith("custom-"):
                food_ids.add(ObjectId(item["food_id"]))
    foods = list(db["foods"].find({"_id": {"$in": list(food_ids)}}))
    food_lookup = {str(food["_id"]): food for food in foods}
    result = {}
    total_calories = 0
    total_protein = 0
    total_fat = 0
    total_carbs = 0
    for plate in plates:
        date = plate["date"]
        food_names = []
        for item in plate["items"]:
            qty = item.get("quantity", 1)
            if item["food_id"].startswith("custom-") and "custom_macros" in item:
                macros = item["custom_macros"]
                food_names.append(macros.get("name", "Custom Food"))
                total_calories += macros.get("calories", 0) * qty
                total_protein += macros.get("protein", 0) * qty
                total_fat += macros.get("totalFat", 0) * qty
                total_carbs += macros.get("carbs", 0) * qty
            else:
                food = food_lookup.get(item["food_id"])
                name = food.get("name", "Unknown Food") if food else "Unknown Food"
                food_names.append(name)
                if food:
                    total_calories += food.get("calories", 0) * qty
                    total_protein += food.get("protein", 0) * qty
                    total_fat += food.get("total_fat", 0) * qty
                    total_carbs += food.get("total_carbohydrates", 0) * qty
        result[date] = food_names
    n_days = len(plates)
    avg_calories = total_calories / n_days if n_days else 0
    avg_protein = total_protein / n_days if n_days else 0
    avg_fat = total_fat / n_days if n_days else 0
    avg_carbs = total_carbs / n_days if n_days else 0
    return {
        "plates": result,
        "average_calories_per_day": round(avg_calories, 1),
        "average_protein_per_day": round(avg_protein, 1),
        "average_fat_per_day": round(avg_fat, 1),
        "average_carbs_per_day": round(avg_carbs, 1)
    }

def format_weight_goal(weight_goal_type, weight_goal, weight_goal_rate, weight_goal_custom_rate):
    weight_map = {
        "slow": 0.5,
        "moderate": 1.0,
        "fast": 1.5
    }

    if weight_goal_type == "maintain":
        return 0.0
    # Custom rate
    if weight_goal_rate == "custom" and weight_goal_custom_rate:
        rate = float(weight_goal_custom_rate)
    else:
        rate = weight_map.get(weight_goal_rate, 0.0)
    # Negative for weight loss
    if weight_goal_type == "lose":
        rate = -1 * (rate)
    return rate



def get_user_profile_context(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return "User Profile: N/A"
    profile = user.get("profile", {})
    def fmt(val):
        if isinstance(val, list):
            return ", ".join(str(v) for v in val) if val else "N/A"
        if val is None or val == "":
            return "N/A"
        return str(val)
    lines = [
        f"User ID: {user_id}",
        f"Name: {fmt(profile.get('name'))}",
        f"Email: {user.get('email', 'N/A')}",
        f"Sex: {fmt(profile.get('sex'))}",
        f"Birthday: {fmt(profile.get('birthday'))}",
        f"Dietary Preferences: {fmt(profile.get('diet_type'))}",
        f"Cultural Preferences: {fmt(profile.get('cultural_preference'))}",
        f"Allergens: {fmt(profile.get('allergens'))}",
        f"Allergy Notes: {fmt(profile.get('allergy_notes'))}",
        f"Food Sensitivities: {fmt(profile.get('food_sensitivities'))}",
        f"Meal Preference: {fmt(profile.get('meal_preference'))}",
        f"Height (inches): {fmt(profile.get('height'))}",
        f"Weight (lbs): {fmt(profile.get('weight'))}",
        f"Body Fat Percent: {fmt(profile.get('body_fat_percent'))}",
        f"Activity Level: {fmt(profile.get('activity_level'))}",
        f"weight goal: {fmt(profile.get('weight_goal'))}",
        f"Weight Goal lbs/per week: {fmt(format_weight_goal(profile.get('weight_goal_type'), profile.get('weight_goal'), profile.get('weight_goal_rate'), profile.get('weight_goal_custom_rate')))}",
    ]
    return "User Profile:\n" + "\n".join(lines)

# Initialize the LLM
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=.7, openai_api_key=openai_api_key)

# Create agent with structured chat, supports multi-input tools
agent = initialize_agent(
    tools=[get_weight_log, get_meal_history],
    llm=llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)



def load_conversation(user_id):
    doc = conversations_collection.find_one({"user_id": user_id})
    if doc:
        return doc.get("conversation_history", []), doc.get("context_data", {})
    return [], {}

def save_conversation(user_id, conversation_history, context_data):
    conversations_collection.update_one(
        {"user_id": user_id},
        {"$set": {"conversation_history": conversation_history, "context_data": context_data}},
        upsert=True
    )

def build_system_message(context_data):
    if not context_data:
        return system_prompt
    lines = [f"{k.replace('_', ' ').capitalize()}: {v}" for k, v in context_data.items()]
    return "User Context:\n" + "\n".join(lines)


def extract_final_answer(response):
    """
    Robustly extracts the final answer from the agent's response, handling nested dicts, JSON strings, and common output keys.
    """
    # If it's a string, try to parse as JSON
    if isinstance(response, str):
        try:
            parsed = json.loads(response)
            return extract_final_answer(parsed)
        except Exception:
            return response  # Not JSON, return as is
    # If it's a dict, look for common keys
    if isinstance(response, dict):
        for key in ["output", "result", "answer", "message", "action_input"]:
            if key in response:
                return extract_final_answer(response[key])
        # If the dict has only one value, return it recursively
        if len(response) == 1:
            return extract_final_answer(next(iter(response.values())))
        # Otherwise, return the dict as a string
        return str(response)
    # If it's something else, just return as string
    return str(response)

# Wrap agent in LangGraph

def agent_node(state):
    # All user input and context (user_id, user_message, dining_hall, meal_type, date, etc.)
    # should be passed in via the state dictionary from the FastAPI endpoint.
    # Do NOT try to access request or user input directly in this file.
    user_id = state.get("user_id", None)
    user_message = state.get("user_message", "")
    # 1. Load persistent memory
    if user_id:
        conversation_history, context_data = load_conversation(user_id)
        # Always fetch the latest user profile context
        user_profile_context = get_user_profile_context(user_id)
    else:
        conversation_history, context_data = [], {}
        user_profile_context = "User Profile: N/A"
    # 2. Append latest user message
    conversation_history.append({"role": "user", "content": user_message})
    # 3. Truncate history if needed
    if len(conversation_history) > MAX_HISTORY_TURNS:
        conversation_history = conversation_history[-MAX_HISTORY_TURNS:]
    # 4. Build system message with user profile context
    system_message = f"{system_prompt}\n{user_profile_context}\n"
    # 5. Build messages for LLM
    messages = [{"role": "system", "content": system_message}] + conversation_history
    print("AGENT INPUT:", messages)  # DEBUG: Show the exact input to the agent
    # 6. Call the agent/LLM
    input_str = "\n".join([m["content"] for m in messages if m["content"]])
    response = agent({"input": input_str})
    print("RAW AGENT RESPONSE:", response)
    print("RESPONSE TYPE:", type(response))
    # 7. Extract and append assistant reply
    try:
        final_answer = extract_final_answer(response)
    except Exception as e:
        print("EXTRACTION ERROR:", e)
        final_answer = str(response)
    print("EXTRACTED FINAL ANSWER:", final_answer)
    conversation_history.append({"role": "assistant", "content": final_answer})
    # 8. Save updated memory
    if user_id:
        save_conversation(user_id, conversation_history, context_data)
    # 9. Update state
    state["conversation_history"] = conversation_history
    state["response"] = final_answer
    return state

graph = StateGraph(dict)
graph.add_node("agent", agent_node)
graph.set_entry_point("agent")
graph.add_edge("agent", END)

app = graph.compile()


