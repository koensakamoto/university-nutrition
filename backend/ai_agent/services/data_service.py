"""
Data service for AI agent MongoDB operations.

This service handles all database interactions for the AI agent,
working with the existing MongoDB collections: users, foods, plates, weight_log.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from bson import ObjectId
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class NutritionDataService:
    """Service for handling nutrition-related data operations."""
    
    def __init__(self, db_client):
        """Initialize with MongoDB client."""
        self.db = db_client["nutritionapp"]
        self.users = self.db["users"]
        self.foods = self.db["foods"]
        self.plates = self.db["plates"]
        self.weight_log = self.db["weight_log"]
        # Conversations collection for AI chat history
        self.conversations = self.db["conversations"]
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile from users collection."""
        try:
            user = self.users.find_one({"_id": ObjectId(user_id)})
            if user:
                return {
                    "user_id": str(user["_id"]),
                    "email": user.get("email"),
                    "profile": user.get("profile", {}),
                    "name": user.get("profile", {}).get("name", "")
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            return None
    
    async def get_user_plates(
        self, 
        user_id: str, 
        start_date: str, 
        end_date: str
    ) -> List[Dict[str, Any]]:
        """Get user's plates (meals) for date range."""
        try:
            plates = list(self.plates.find({
                "user_id": user_id,
                "date": {"$gte": start_date, "$lte": end_date}
            }))
            
            # Convert ObjectId to string for JSON serialization
            for plate in plates:
                plate["_id"] = str(plate["_id"])
            
            return plates
        except Exception as e:
            logger.error(f"Error fetching user plates: {e}")
            return []
    
    async def get_foods_by_date(
        self, 
        date: str,
        dining_hall: Optional[str] = None,
        meal_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get available foods from foods collection for specific date."""
        try:
            query = {"date": date}
            
            if dining_hall:
                query["dining_hall"] = dining_hall
            if meal_type:
                # Handle case-insensitive meal type matching
                query["meal_name"] = {"$regex": f"^{meal_type}$", "$options": "i"}
            
            foods = list(self.foods.find(query))
            
            # Convert ObjectId to string
            for food in foods:
                food["_id"] = str(food["_id"])
            
            return foods
        except Exception as e:
            logger.error(f"Error fetching foods by date: {e}")
            return []
    
    async def get_weight_logs(
        self, 
        user_id: str, 
        start_date: str, 
        end_date: str
    ) -> List[Dict[str, Any]]:
        """Get user's weight logs for date range."""
        try:
            logs = list(self.weight_log.find({
                "user_id": user_id,
                "date": {"$gte": start_date, "$lte": end_date}
            }).sort("date", 1))  # Sort by date ascending
            
            return logs
        except Exception as e:
            logger.error(f"Error fetching weight logs: {e}")
            return []
    
    async def calculate_nutrition_from_plates(
        self, 
        plates: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate total nutrition from plates and foods data."""
        total_nutrition = {
            "calories": 0.0,
            "protein": 0.0,
            "carbs": 0.0,
            "fat": 0.0,
            "fiber": 0.0
        }
        
        try:
            # Get all unique food IDs from plates
            food_ids = []
            for plate in plates:
                for item in plate.get("items", []):
                    food_id = item.get("food_id")
                    if food_id:
                        food_ids.append(food_id)
            
            # Get nutrition data for all foods
            foods_data = await self._get_foods_nutrition_data(food_ids)
            
            # Calculate totals
            for plate in plates:
                for item in plate.get("items", []):
                    food_id = item.get("food_id")
                    quantity = item.get("quantity", 1.0)
                    
                    # Check for custom macros first
                    if item.get("custom_macros"):
                        custom = item["custom_macros"]
                        total_nutrition["calories"] += custom.get("calories", 0) * quantity
                        total_nutrition["protein"] += custom.get("protein", 0) * quantity
                        total_nutrition["carbs"] += custom.get("carbs", 0) * quantity
                        total_nutrition["fat"] += custom.get("totalFat", 0) * quantity
                    elif food_id in foods_data:
                        # Use food database nutrition
                        food_nutrition = foods_data[food_id]
                        total_nutrition["calories"] += food_nutrition.get("calories", 0) * quantity
                        total_nutrition["protein"] += food_nutrition.get("protein", 0) * quantity
                        total_nutrition["carbs"] += food_nutrition.get("carbs", 0) * quantity
                        total_nutrition["fat"] += food_nutrition.get("fat", 0) * quantity
                        total_nutrition["fiber"] += food_nutrition.get("fiber", 0) * quantity
            
            return total_nutrition
            
        except Exception as e:
            logger.error(f"Error calculating nutrition from plates: {e}")
            return total_nutrition
    
    async def _get_foods_nutrition_data(self, food_ids: List[str]) -> Dict[str, Dict[str, float]]:
        """Get nutrition data for multiple foods."""
        nutrition_data = {}
        
        try:
            # Separate ObjectIds and string IDs
            object_ids = []
            string_ids = []
            
            for food_id in food_ids:
                try:
                    object_ids.append(ObjectId(food_id))
                except:
                    string_ids.append(food_id)
            
            # Query with ObjectIds
            if object_ids:
                foods = self.foods.find({"_id": {"$in": object_ids}})
                for food in foods:
                    nutrition_data[str(food["_id"])] = self._extract_nutrition(food)
            
            # Query with string IDs
            if string_ids:
                foods = self.foods.find({"_id": {"$in": string_ids}})
                for food in foods:
                    nutrition_data[food["_id"]] = self._extract_nutrition(food)
            
        except Exception as e:
            logger.error(f"Error fetching foods nutrition data: {e}")
        
        return nutrition_data
    
    def _extract_nutrition(self, food: Dict[str, Any]) -> Dict[str, float]:
        """Extract nutrition values from food document."""
        nutrients = food.get("nutrients", {})
        
        def safe_float(value, default=0.0):
            """Safely convert string to float."""
            try:
                if isinstance(value, (int, float)):
                    return float(value)
                if isinstance(value, str):
                    # Remove units and convert
                    clean_value = value.replace("g", "").replace("kcal", "").replace("mg", "").strip()
                    return float(clean_value) if clean_value else default
                return default
            except:
                return default
        
        return {
            "calories": safe_float(nutrients.get("calories", nutrients.get("Calories", 0))),
            "protein": safe_float(nutrients.get("protein", nutrients.get("Protein", 0))),
            "carbs": safe_float(nutrients.get("carbs", nutrients.get("Carbohydrates", 0))),
            "fat": safe_float(nutrients.get("fat", nutrients.get("Total Fat", 0))),
            "fiber": safe_float(nutrients.get("fiber", nutrients.get("Dietary Fiber", 0)))
        }
    
    async def search_foods(
        self, 
        query: str, 
        date: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search foods by name/description."""
        try:
            search_query = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"ingredients": {"$regex": query, "$options": "i"}}
                ]
            }
            
            if date:
                search_query["date"] = date
            
            foods = list(self.foods.find(search_query).limit(limit))
            
            # Convert ObjectId to string
            for food in foods:
                food["_id"] = str(food["_id"])
            
            return foods
            
        except Exception as e:
            logger.error(f"Error searching foods: {e}")
            return []
    
    async def get_conversation_history(
        self, 
        user_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent conversation history for user."""
        try:
            conversations = list(self.conversations.find({
                "user_id": user_id
            }).sort("timestamp", -1).limit(limit))
            
            return conversations
        except Exception as e:
            logger.error(f"Error fetching conversation history: {e}")
            return []
    
    async def save_conversation_exchange(
        self, 
        user_id: str, 
        user_message: str, 
        agent_response: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Save a conversation exchange."""
        try:
            self.conversations.insert_one({
                "user_id": user_id,
                "user_message": user_message,
                "agent_response": agent_response,
                "timestamp": datetime.now(),
                "metadata": metadata or {}
            })
            return True
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
            return False