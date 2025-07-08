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
def make_tools(db):
    @tool
    def get_user_profile(user_id: str) -> dict:
        """Fetch the user's profile from the database. Use this to understand the user's goals, preferences, and dietary restrictions."""
        try:
            user = db['users'].find_one({"_id": ObjectId(user_id)})
            if not user:
                return {"error": "User not found"}
            # Clean the data - remove sensitive and internal fields
            user.pop("hashed_password", None)
            user.pop("_id", None)
            return user
        except Exception as e:
            return {"error": str(e)}

    @tool
    def get_meal_log(user_id: str) -> list:
        """Fetch the user's meal log. Analyze the nutritional content, variety, and patterns to provide insights and recommendations."""
        try:
            # Ensure user_id is a string to match how it's stored in the database
            user_id_str = str(user_id)
            meals = list(db['plates'].find({"user_id": user_id_str}))
            
            # Clean and format the data
            cleaned_meals = []
            for meal in meals:
                cleaned_meal = {
                    "date": meal.get("date"),
                    "items": []
                }
                for item in meal.get("items", []):
                    cleaned_item = {
                        "name": item.get("custom_macros", {}).get("name", "Unknown Food"),
                        "quantity": item.get("quantity", 1),
                        "calories": item.get("custom_macros", {}).get("calories", "Unknown"),
                        "protein": item.get("custom_macros", {}).get("protein", "Unknown"),
                        "carbs": item.get("custom_macros", {}).get("carbs", "Unknown"),
                        "fat": item.get("custom_macros", {}).get("totalFat", "Unknown")
                    }
                    cleaned_meal["items"].append(cleaned_item)
                cleaned_meals.append(cleaned_meal)
            
            return cleaned_meals
        except Exception as e:
            return [{"error": str(e)}]

    @tool
    def get_weight_log(user_id: str) -> list:
        """Fetch the user's weight history. Analyze trends, patterns, and progress to provide insights and recommendations."""
        try:
            weights = list(db['weight_log'].find({"user_id": user_id}))
            
            # Clean and format the data
            cleaned_weights = []
            for weight_entry in weights:
                cleaned_weights.append({
                    "date": weight_entry.get("date"),
                    "weight": weight_entry.get("weight")
                })
            
            return cleaned_weights
        except Exception as e:
            return [{"error": str(e)}]

    @tool
    def get_food_info(query: str) -> list:
        """Search food items by name, description, or date. Analyze nutritional content to identify healthy options and provide meal suggestions. You can search for foods by name (e.g., 'chicken'), or by date (e.g., '2025-07-04' or 'July 4')."""
        try:
            # First, try to parse as a date
            parsed_date = parse_human_date(query)
            
            if parsed_date:
                # Search by exact date
                foods = list(db['foods'].find({"date": parsed_date}))
                print(f"DEBUG: Parsed date '{query}' as '{parsed_date}', found {len(foods)} foods")
            else:
                # Search by name or description
                foods = list(db['foods'].find({"name": {"$regex": query, "$options": "i"}}))
                print(f"DEBUG: Searched for food name '{query}', found {len(foods)} foods")
            
            if foods:
                print(f"DEBUG: Sample food: {foods[0].get('name')} on {foods[0].get('date')}")
            
            # Clean and format the data
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
            print(f"DEBUG: Error in get_food_info: {str(e)}")
            return [{"error": str(e)}]

    return [get_user_profile, get_meal_log, get_weight_log, get_food_info]

tools = make_tools(db)

# === Step 3: Set up LLM and Agent ===
llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0,
    openai_api_key=openai_api_key
)

agent_executor = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True,
    agent_kwargs={
        "system_message": (
            "You are a helpful nutrition assistant. Answer questions and "
            "provide guidance about nutrition, food, and health. You are able to "
            "search the database for information about foods, meal logs, weight logs, "
            "and user profiles. The user's ID will be provided at the beginning of "
            "each input message in the format 'User ID: [user_id]'. Extract this "
            "user_id and use it for any database lookups. Never ask the user for "
            "their ID. When users ask about specific dates, dining halls, or meal "
            "options, proactively search the food database using get_food_info to "
            "find relevant foods for that date. For example, if they ask about "
            "'July 4th' or 'fourth of July', search for 'July 4' to find foods "
            "available on that date. "
            "CRITICAL: You MUST NEVER return raw database data to the user. "
            "ALWAYS analyze the data and provide insights, trends, and recommendations. "
            "For weight logs: identify trends, patterns, progress, and suggest goals. "
            "For meal logs: analyze nutritional content, variety, balance, and suggest improvements. "
            "For foods: identify healthy options, protein content, and suggest meal combinations. "
            "Always provide actionable advice and context. If you retrieve data, "
            "you MUST interpret it and give meaningful analysis before responding."
        )
    }
)

# === Step 5: LangGraph Node ===
def agent_node(state: AgentState) -> AgentState:
    user_id = state["user_id"]
    query = state["user_message"]
    
    # Include user_id in the input so the agent can access it
    # Add explicit instruction to analyze data and provide insights
    input_with_context = (
        f"User ID: {user_id}\n\n"
        f"User Question: {query}\n\n"
        f"IMPORTANT INSTRUCTIONS: After retrieving any data from the database, "
        f"you MUST analyze it and provide insights, trends, and recommendations. "
        f"DO NOT just list the raw data. Instead, interpret the data and give "
        f"meaningful analysis and actionable advice. If you retrieve meal logs, "
        f"analyze nutritional patterns. If you retrieve weight logs, identify trends. "
        f"If you retrieve foods, suggest healthy combinations and options."
    )
    
    response = agent_executor.invoke({"input": input_with_context})
    
    # Post-process the response to ensure it's not just raw data
    response_text = response["output"]
    
    # If the response looks like raw data (contains ObjectId, embedding, etc.), 
    # force the LLM to provide analysis
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