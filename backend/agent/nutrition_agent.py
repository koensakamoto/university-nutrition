import os
import json
from pprint import pprint
from typing import Any
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import tool, initialize_agent, AgentType
from langgraph.graph import StateGraph, END
from models.agent import AgentState
from dotenv import load_dotenv
import certifi
import re
from datetime import datetime
from dateutil.parser import parse
from scipy.spatial.distance import cosine
from sentence_transformers import SentenceTransformer

# === Load environment variables from .env ===
load_dotenv()

# === Step 1: MongoDB Connection ===
# Always require MONGO_URI and MONGO_DB for remote connection
mongo_uri = os.environ.get("MONGODB_URI")
db_name = os.environ.get("MONGO_DB")
if not mongo_uri:
    raise ValueError("MONGODB_URI environment variable is not set. Please set it in your .env file or environment.")
if not db_name:
    raise ValueError("MONGO_DB environment variable is not set. Please set it in your .env file or environment.")
client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
db = client[db_name]
openai_api_key = os.environ.get("OPENAI_API_KEY")

model = SentenceTransformer('all-MiniLM-L6-v2')

if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set.")

# === Utility Functions ===
def parse_human_date(date_string: str) -> str:
    """
    Parse human-style date strings and return standardized YYYY-MM-DD format.
    
    Args:
        date_string: Human-readable date string (e.g., "July 10", "10th of July", "7/10/2021")
    
    Returns:
        Standardized date string in YYYY-MM-DD format, or None if parsing fails
    """
    try:
        # Use dateutil.parser with fuzzy=True to handle dates embedded in sentences
        parsed_date = parse(date_string, fuzzy=True, default=datetime(2025, 1, 1))
        return parsed_date.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        return None

# === Step 2: Define Tools ===
@tool
def get_basic_profile(user_id: str) -> dict:
    """Use this tool to fetch the user's basic info (name, email, sex, birthday) when the user asks about their identity or account details."""
    try:
        user = db['users'].find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"error": "User not found"}
        profile = user.get("profile", {})
        return {
            "name": profile.get("name"),
            "email": user.get("email"),
            "sex": profile.get("sex"),
            "birthday": profile.get("birthday")
        }
    except Exception as e:
        return {"error": str(e)}

@tool
def fetch_dietary_preferences(user_id: str) -> dict:
    """Use this tool to fetch the user's dietary preferences, restrictions, allergens, and meal preferences when the user asks about what they can/can't eat or their food sensitivities."""
    try:
        user = db['users'].find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"error": "User not found"}
        profile = user.get("profile", {})
        return {
            "diet_type": profile.get("diet_type"),
            "cultural_preference": profile.get("cultural_preference"),
            "allergens": profile.get("allergens"),
            "allergy_notes": profile.get("allergy_notes"),
            "food_sensitivities": profile.get("food_sensitivities"),
            "meal_preference": profile.get("meal_preference")
        }
    except Exception as e:
        return {"error": str(e)}

@tool
def retrieve_user_goals(user_id: str) -> dict:
    """Use this tool to fetch the user's weight and body goals when the user asks about their targets, progress, or goal setting."""
    try:
        user = db['users'].find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"error": "User not found"}
        profile = user.get("profile", {})
        return {
            "weight_goal": profile.get("weight_goal"),
            "weight_goal_type": profile.get("weight_goal_type"),
            "weight_goal_rate": profile.get("weight_goal_rate"),
            "weight_goal_custom_rate": profile.get("weight_goal_custom_rate")
        }
    except Exception as e:
        return {"error": str(e)}

@tool
def get_body_metrics(user_id: str) -> dict:
    """Use this tool to fetch the user's body metrics (height, weight, body fat percent, activity level) when the user asks about their physical stats or health metrics."""
    try:
        user = db['users'].find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"error": "User not found"}
        profile = user.get("profile", {})
        return {
            "height": profile.get("height"),
            "weight": profile.get("weight"),
            "body_fat_percent": profile.get("body_fat_percent"),
            "activity_level": profile.get("activity_level")
        }
    except Exception as e:
        return {"error": str(e)}

@tool
def review_nutrition_history(user_id: str, start_date: str = None, end_date: str = None, summary: bool = False) -> dict:
    """
    Fetch the user's meal logs with optional date filtering. If summary=True, return a summary (total meals, average calories, most common foods, and average macros per meal) instead of raw logs.
    """
    try:
        user_id_str = str(user_id)
        query = {"user_id": user_id_str}
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query["date"] = date_filter
        meals = list(db['plates'].find(query))
        cleaned_meals = []
        for meal in meals:
            cleaned_meal = {
                "date": meal.get("date"),
                "items": []
            }
            for item in meal.get("items", []):
                # Custom food
                if "custom_macros" in item:
                    macros = item["custom_macros"]
                    name = macros.get("name", "Unknown Food")
                    calories = macros.get("calories", "Unknown")
                    protein = macros.get("protein", "Unknown")
                    carbs = macros.get("carbs", "Unknown")
                    fat = macros.get("totalFat", "Unknown")
                # Standard food, look up in foods collection
                elif "food_id" in item:
                    food = db["foods"].find_one({"_id": ObjectId(item["food_id"])})
                    name = food.get("name", "Unknown Food") if food else "Unknown Food"
                    nutrients = food.get("nutrients", {}) if food else {}
                    calories = nutrients.get("calories", "Unknown")
                    protein = nutrients.get("protein", "Unknown")
                    carbs = nutrients.get("total_carbohydrates", "Unknown")
                    fat = nutrients.get("total_fat", "Unknown")
                # Fallback
                else:
                    name = "Unknown Food"
                    calories = protein = carbs = fat = "Unknown"
                cleaned_item = {
                    "name": name,
                    "quantity": item.get("quantity", 1),
                    "calories": calories,
                    "protein": protein,
                    "carbs": carbs,
                    "fat": fat
                }
                cleaned_meal["items"].append(cleaned_item)
            cleaned_meals.append(cleaned_meal)
        # if summary:
        #     total_meals = len(cleaned_meals)
        #     total_calories = 0
        #     total_protein = 0
        #     total_carbs = 0
        #     total_fat = 0
        #     food_counter = {}
        #     for meal in cleaned_meals:
        #         meal_protein = 0
        #         meal_carbs = 0
        #         meal_fat = 0
        #         for item in meal["items"]:
        #             # Only sum calories/macros if numeric
        #             try:
        #                 cal = float(item["calories"])
        #                 total_calories += cal
        #             except (ValueError, TypeError):
        #                 pass
        #             try:
        #                 protein = float(item["protein"])
        #                 meal_protein += protein
        #             except (ValueError, TypeError):
        #                 pass
        #             try:
        #                 carbs = float(item["carbs"])
        #                 meal_carbs += carbs
        #             except (ValueError, TypeError):
        #                 pass
        #             try:
        #                 fat = float(item["fat"])
        #                 meal_fat += fat
        #             except (ValueError, TypeError):
        #                 pass
        #             food_name = item["name"]
        #             if food_name:
        #                 food_counter[food_name] = food_counter.get(food_name, 0) + 1
        #         total_protein += meal_protein
        #         total_carbs += meal_carbs
        #         total_fat += meal_fat
        #     avg_calories = round(total_calories / total_meals, 2) if total_meals else 0
        #     avg_protein = round(total_protein / total_meals, 2) if total_meals else 0
        #     avg_carbs = round(total_carbs / total_meals, 2) if total_meals else 0
        #     avg_fat = round(total_fat / total_meals, 2) if total_meals else 0
        #     most_common_foods = sorted(food_counter.items(), key=lambda x: x[1], reverse=True)[:3]
        #     return {
        #         "summary": {
        #             "total_meals": total_meals,
        #             "average_calories_per_meal": avg_calories,
        #             "most_common_foods": most_common_foods,
        #             "average_macros_per_meal": {
        #                 "protein_g": avg_protein,
        #                 "carbs_g": avg_carbs,
        #                 "fat_g": avg_fat
        #             }
        #         }
        #     }
        return {"logs": cleaned_meals}
    except Exception as e:
        return {"error": str(e)}

@tool
def analyze_weight_trends(user_id: str, start_date: str = None, end_date: str = None) -> dict:
    """Use this tool if the user asks about their weight changes, progress, or how their weight has trended over time."""
    try:
        query = {"user_id": user_id}
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query["date"] = date_filter
        weights = list(db['weight_log'].find(query).sort("date", 1))
        if not weights:
            return {"error": "No weight logs found for user."}
        weight_values = [w.get("weight") for w in weights if w.get("weight") is not None]
        dates = [w.get("date") for w in weights]
        if not weight_values:
            return {"error": "No valid weight entries found."}
        starting_weight = weight_values[0]
        latest_weight = weight_values[-1]
        min_weight = min(weight_values)
        max_weight = max(weight_values)
        average_weight = round(sum(weight_values) / len(weight_values), 2)
        total_logs = len(weight_values)
        weight_change = round(latest_weight - starting_weight, 2)
        trend = f"You’ve {'lost' if weight_change < 0 else 'gained'} {abs(weight_change)} lbs over {total_logs-1 if total_logs>1 else 0} days. {'Great progress!' if weight_change < 0 else 'Keep tracking!'}"
        summary = {
            "start_date": dates[0],
            "end_date": dates[-1],
            "starting_weight": starting_weight,
            "latest_weight": latest_weight,
            "min_weight": min_weight,
            "max_weight": max_weight,
            "average_weight": average_weight,
            "total_logs": total_logs,
            "weight_change": weight_change,
            "trend": trend
        }
        recent_logs = [
            {"date": w.get("date"), "weight": w.get("weight")} for w in weights[-3:]
        ][::-1]
        return {"summary": summary, "recent_logs": recent_logs}
    except Exception as e:
        return {"error": str(e)}

@tool
def find_dining_hall_foods(query: str) -> list:
    """Use this tool if the user asks about food on a specific date or wants help finding a certain type of food (e.g. 'high protein' or 'vegan') from the dining halls."""
    try:
        parsed_date = parse_human_date(query)
        if parsed_date:
            foods = list(db['foods'].find({"date": parsed_date}))
        else:
            foods = list(db['foods'].find({"name": {"$regex": query, "$options": "i"}}))
        cleaned_foods = []
        for food in foods:
            cleaned_food = {
                "name": food.get("name"),
                "description": food.get("description"),
                "dining_hall": food.get("dining_hall"),
                "meal_name": food.get("meal_name"),
                "station": food.get("station"),
                "date": food.get("date"),
                "portion_size": food.get("portion_size"),
                "nutrients": food.get("nutrients", {})
            }
            cleaned_foods.append(cleaned_food)
        return cleaned_foods
    except Exception as e:
        return [{"error": str(e)}]

# Load the embedding model once (should match the one used for food embeddings)


@tool
def find_similar_foods(query: str, dining_hall: str, date: str, meal_name: str, top_k: int = 5) -> list:
    """
    Use this tool to find foods similar to the user's query, but only among those available at the selected dining hall, date, and meal.
    Returns only essential fields (not embeddings) to avoid context overflow.
    """
    foods = list(db['foods'].find({
        "dining_hall": dining_hall,
        "date": date,
        "meal_name": meal_name,
        "embedding": {"$exists": True}
    }))
    if not foods:
        return []
    query_embedding = model.encode(query)
    scored = []
    for food in foods:
        sim = 1 - cosine(query_embedding, food['embedding'])
        scored.append((sim, food))
    scored.sort(reverse=True, key=lambda x: x[0])
    def food_summary(food):
        return {
            "_id": str(food.get("_id")),
            "name": food.get("name"),
            "description": food.get("description"),
            "labels": food.get("labels"),
            "ingredients": food.get("ingredients"),
            "portion_size": food.get("portion_size"),
            "nutrients": food.get("nutrients"),
            "station": food.get("station"),
        }
    return [food_summary(food) for sim, food in scored[:top_k]]

tools = [
    get_basic_profile,
    fetch_dietary_preferences,
    retrieve_user_goals,
    get_body_metrics,
    review_nutrition_history,
    analyze_weight_trends,
    find_dining_hall_foods,
    find_similar_foods,  # <-- add the new tool
]

# === Step 3: Set up LLM and Agent ===
llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0,
    openai_api_key=openai_api_key,
    max_tokens=200
)

SYSTEM_MESSAGE = """
You are NutriBot, a helpful and knowledgeable nutrition assistant for university dining halls. Your role is to help students make informed food choices, track their nutrition, and achieve their health goals.

## Your Capabilities:
- Access student profiles (basic info, dietary preferences, body metrics, weight goals)
- Analyze meal logs and weight tracking data
- Search dining hall food database by name or date
- Provide personalized nutrition recommendations
- Help with meal planning and goal tracking

## Your Personality:
- Friendly, encouraging, and supportive
- Use a conversational tone appropriate for college students
- Be motivating but not preachy
- Acknowledge challenges students face (budget, time, dining hall limitations)

## Response Guidelines:
1. **Always provide analysis, not raw data** - interpret information and give actionable insights
2. **Be specific and practical** - suggest actual foods available in dining halls
3. **Consider the user's goals** - tailor advice to their weight goals, dietary restrictions, and preferences
4. **Provide context** - explain why certain foods or choices are beneficial
5. **Use encouraging language** - focus on progress and positive changes
6. **Be concise: Limit your response to 4-6 sentences. Only include the most important recommendations.**
7. **Be concise but thorough** - students want quick, useful information

## When analyzing data:
- Look for patterns and trends
- Identify nutritional gaps or excesses
- Suggest specific improvements
- Celebrate progress and achievements
- Provide meal timing and combination suggestions

## Important Notes:
- Never provide medical advice - suggest consulting healthcare providers for medical concerns
- Focus on balanced nutrition rather than extreme restrictions
- Consider dining hall availability and student lifestyle constraints
- Be sensitive to different dietary needs and cultural preferences

Remember: Your goal is to help students develop healthy, sustainable eating habits while navigating university dining options.
"""

agent_executor = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True,
    agent_kwargs={
        "system_message": SYSTEM_MESSAGE
    }
)

# === Step 5: LangGraph Node ===
def agent_node(state: AgentState) -> AgentState:
    user_id = state["user_id"]
    query = state["user_message"]

    # Compose the input with context and instructions
    input_with_context = f"""
Context: You're helping a university student with their nutrition and dining hall food choices. They may ask about:
- What to eat for their goals
- Analysis of their current eating patterns
- Specific food recommendations
- Weight tracking progress
- Meal planning advice
- Food information from dining halls

Instructions for this query:
1. Use the available tools to gather relevant information about this user
2. Analyze the data to provide meaningful insights and recommendations
3. Focus on actionable advice specific to university dining halls
4. Consider the student's profile, goals, and dietary preferences
5. If suggesting foods, reference items that would be available in dining halls
6. Provide encouragement and practical tips for sustainable healthy eating
7. **Be concise. Limit your response to 4-6 sentences. Only include the most important recommendations.**

User ID: {user_id}
User Question: {query}
"""

    response = agent_executor.invoke({"input": input_with_context})

    response_text = response["output"]

    if any(indicator in response_text.lower() for indicator in ['objectid', 'embedding', '_id', 'bson']):
        analysis_prompt = (
            f"The user asked: {query}\n\n"
            f"Raw data was retrieved: {response_text[:500]}...\n\n"
            f"Please analyze this data and provide insights, trends, and recommendations. "
            f"DO NOT repeat the raw data. Instead, give meaningful analysis and actionable advice."
        )
        analysis_response = llm.invoke(analysis_prompt)
        return {**state, "agent_response": analysis_response.content}

    return {**state, "agent_response": response_text}

# === Step 6: Build LangGraph ===
graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.set_entry_point("agent")
graph.add_edge("agent", END)
app = graph.compile()

# === Step 7: CLI Test ===
if __name__ == "__main__":
    # Test the parse_human_date function
    print("Testing parse_human_date function:")
    test_cases = [
        "July 10 2021",
        "10th of July", 
        "I ate on July 4",
        "chicken salad",
        "December 25",
        "March 15th",
        "7/10/2021",
        "July 10 2021"
    ]
    
    for test_input in test_cases:
        result = parse_human_date(test_input)
        print(f"'{test_input}' → {result}")
    
    print("\n" + "="*50)
    
    user_id = "685b5bb051b5073e954897f7"  # Default user ID for testing - matches the plate in your DB
    print("Type 'exit' to quit.")
    while True:
        message = input("Ask a nutrition question: ")
        if message.lower() == "exit":
            break
        state = {"user_message": message, "user_id": user_id}
        result = app.invoke(state)
        print("\nAgent:")
        print(result["agent_response"])
        print()  # Add a blank line for better readability