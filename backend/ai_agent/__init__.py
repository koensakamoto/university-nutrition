"""
AI Agent Package for Nutrition Assistant

This package implements a hybrid LangGraph AI agent that provides:
- Personalized nutrition advice using user data
- Smart tool calling for data retrieval 
- Conversational interface with memory
- Efficient caching and optimization
"""

from .agent import NutritionAgent
from .models.state import NutritionAgentState

__all__ = ["NutritionAgent", "NutritionAgentState"]