"""
State management for the Nutrition AI Agent.

Defines the core state structure that flows through the LangGraph agent,
including conversation history, user context, and execution tracking.

This state is designed around the existing MongoDB collections:
- users: User profiles, goals, preferences
- foods: Dining hall menu items with nutrition data
- plates: User's daily meal tracking
- weight_log: User's weight tracking over time
- conversations: AI chat history (to be created)
"""

from typing import TypedDict, Annotated, Optional, List, Dict, Any, Union
from langgraph.graph.message import add_messages
from dataclasses import dataclass
from enum import Enum
from datetime import datetime


class QueryType(Enum):
    """Types of queries the agent can handle."""
    GENERAL = "general"                      # General nutrition questions
    NUTRITION_TRACKING = "nutrition_tracking"    # Daily intake analysis from plates
    MEAL_PLANNING = "meal_planning"          # Meal suggestions from dining halls
    GOAL_ANALYSIS = "goal_analysis"          # Progress toward user profile goals
    FOOD_SEARCH = "food_search"              # Finding foods in dining halls
    WEIGHT_TRACKING = "weight_tracking"      # Weight progress analysis
    EDUCATION = "education"                  # Learning about nutrition
    MOTIVATION = "motivation"                # Encouragement and support


@dataclass
class QueryIntent:
    """Detailed analysis of user query intent."""
    type: QueryType
    confidence: float                        # 0.0 to 1.0
    data_requirements: List[str]             # What MongoDB collections to query
    urgency: str                            # "immediate", "planning", "educational"
    context_clues: Dict[str, Any]           # Additional context extracted
    complexity: str                         # "simple", "moderate", "complex"


class NutritionAgentState(TypedDict):
    """
    Core state that flows through the LangGraph agent.
    
    This state maintains all context and data needed for intelligent
    nutrition assistance throughout the conversation.
    """
    
    # Core conversation
    messages: Annotated[List, add_messages]  # Chat history with user
    user_id: str                            # Current user identifier (from users collection)
    
    # Query analysis  
    query_intent: Optional[QueryIntent]      # Analyzed intent of current query
    original_query: str                     # Raw user input
    
    # MongoDB Data Context (cached for performance)
    user_profile: Optional[Dict]            # From users collection
    recent_plates: Optional[List[Dict]]     # From plates collection (recent meals)
    available_foods: Optional[List[Dict]]   # From foods collection (dining hall menu)
    weight_history: Optional[List[Dict]]    # From weight_log collection
    nutrition_progress: Optional[Dict]      # Calculated from plates + user goals
    
    # Execution tracking
    tools_called: List[str]                 # Which tools have been used
    execution_path: List[str]               # Node execution sequence
    mongodb_queries: List[str]              # What collections were queried
    
    # Response configuration
    response_style: str                     # "casual", "scientific", "motivational"
    requires_streaming: bool                # Whether to stream response
    proactive_suggestions: List[str]        # Additional helpful suggestions
    
    # Error handling
    error_context: Optional[str]            # Any errors encountered
    fallback_mode: bool                     # Whether using fallback responses
    
    # Performance tracking
    start_time: Optional[datetime]          # Request start time
    cache_hits: int                        # Number of cache hits
    total_tokens_used: int                 # Token usage tracking


class UserProfileData(TypedDict):
    """User profile data from users collection."""
    email: str
    name: str
    profile: Dict[str, Any]                 # Contains all UserProfile fields
    

class PlateData(TypedDict):
    """Plate data from plates collection."""
    date: str                              # ISO date string
    name: Optional[str]                    # Plate name
    items: List[Dict[str, Any]]            # PlateItems with food_id, quantity, custom_macros
    user_id: str
    

class FoodData(TypedDict):
    """Food data from foods collection."""
    _id: Union[str, Any]                   # MongoDB ObjectId
    name: str
    description: Optional[str]
    labels: List[str]                      # Dietary labels (Vegan, etc.)
    ingredients: List[str]
    nutrients: Dict[str, str]              # Nutrition facts
    dining_hall: Optional[str]
    meal_name: Optional[str]              # Breakfast, Lunch, Dinner
    date: Optional[str]                   # When this food is available
    station: Optional[str]                # Station within dining hall
    

class WeightLogData(TypedDict):
    """Weight log data from weight_log collection."""
    user_id: str
    date: str                             # ISO date string
    weight: float                         # Weight in user's preferred units


class NutritionSummary(TypedDict):
    """Calculated nutrition summary from plates data."""
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    meals_logged: int
    days_analyzed: int
    average_daily_calories: float
    goal_progress: Dict[str, float]       # Progress toward user's goals


class ConversationContext(TypedDict):
    """Extended conversation context for memory management."""
    user_id: str
    session_id: str
    conversation_start: datetime
    total_exchanges: int
    user_preferences: Dict[str, Any]        # Learned preferences
    common_topics: List[str]                # Frequently discussed topics
    recent_goals_mentioned: List[str]       # Goals user has mentioned