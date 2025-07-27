"""
Main Nutrition AI Agent using LangGraph.

Implements the hybrid single agent + selective delegation pattern:
- Single conversational interface for users
- Smart tool calling for data retrieval
- Optional specialist delegation for complex queries
- Real-time streaming responses
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, AsyncIterator

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from .models.state import NutritionAgentState, QueryIntent, QueryType
from .services.data_service import NutritionDataService
from .tools.nutrition_tools import (
    get_user_nutrition_progress,
    get_available_dining_foods,
    get_user_meal_history,
    search_foods_by_criteria,
    analyze_nutrition_gaps,
    get_personalized_meal_suggestions,
    calculate_nutrition_targets,
    set_data_service as set_nutrition_data_service
)
from .tools.weight_tools import (
    get_weight_progress,
    analyze_weight_patterns,
    get_weight_goal_analysis,
    set_data_service as set_weight_data_service
)

logger = logging.getLogger(__name__)


class NutritionAgent:
    """
    Hybrid AI agent for personalized nutrition assistance.
    
    Features:
    - Single conversational interface
    - Smart data retrieval from MongoDB
    - Personalized responses based on user data
    - Real-time streaming
    - Conversation memory
    """
    
    def __init__(self, db_client, openai_api_key: str):
        """Initialize the nutrition agent."""
        self.db_client = db_client
        self.data_service = NutritionDataService(db_client)
        
        # Set data service for tools
        set_nutrition_data_service(self.data_service)
        set_weight_data_service(self.data_service)
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            api_key=openai_api_key,
            model="gpt-4o-mini",
            temperature=0.7,
            streaming=True
        )
        
        # Initialize tools
        self.tools = [
            get_user_nutrition_progress,
            get_available_dining_foods,
            get_user_meal_history,
            search_foods_by_criteria,
            analyze_nutrition_gaps,
            get_personalized_meal_suggestions,
            calculate_nutrition_targets,
            get_weight_progress,
            analyze_weight_patterns,
            get_weight_goal_analysis
        ]
        
        # Create LLM with tools
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        
        # Build the graph
        self.agent = self._build_agent()
    
    def _build_agent(self) -> StateGraph:
        """Build the LangGraph agent."""
        
        # Create graph
        graph = StateGraph(NutritionAgentState)
        
        # Add nodes
        graph.add_node("analyze_query", self._analyze_query)
        graph.add_node("call_model", self._call_model)
        graph.add_node("tools", ToolNode(self.tools))
        
        # Define flow
        graph.add_edge(START, "analyze_query")
        graph.add_edge("analyze_query", "call_model")
        
        # Conditional edges for tool calling
        graph.add_conditional_edges(
            "call_model",
            self._should_continue,
            {
                "tools": "tools",
                "end": END
            }
        )
        graph.add_edge("tools", "call_model")
        
        # Add memory
        memory = MemorySaver()
        return graph.compile(checkpointer=memory)
    
    async def _analyze_query(self, state: NutritionAgentState) -> NutritionAgentState:
        """Analyze the user's query to understand intent."""
        
        if not state.get("messages"):
            return state
        
        user_message = state["messages"][-1].content
        
        # Simple intent analysis based on keywords
        query_intent = self._classify_intent(user_message)
        
        return {
            **state,
            "query_intent": query_intent,
            "original_query": user_message,
            "start_time": datetime.now()
        }
    
    def _classify_intent(self, message: str) -> QueryIntent:
        """Classify user message intent."""
        
        message_lower = message.lower()
        
        # Nutrition tracking keywords
        if any(word in message_lower for word in 
               ['ate', 'consumed', 'had', 'today', 'calories', 'protein', 'intake']):
            return QueryIntent(
                type=QueryType.NUTRITION_TRACKING,
                confidence=0.9,
                data_requirements=["user_plates", "user_profile"],
                urgency="immediate",
                context_clues={"timeframe": "today"},
                complexity="simple"
            )
        
        # Meal planning keywords
        elif any(word in message_lower for word in 
                 ['should eat', 'recommend', 'suggest', 'dining hall', 'lunch', 'dinner', 'breakfast']):
            return QueryIntent(
                type=QueryType.MEAL_PLANNING,
                confidence=0.85,
                data_requirements=["available_foods", "user_profile", "nutrition_progress"],
                urgency="planning",
                context_clues={"meal_type": self._extract_meal_type(message_lower)},
                complexity="moderate"
            )
        
        # Goal analysis keywords
        elif any(word in message_lower for word in 
                 ['progress', 'goal', 'target', 'how am i doing', 'on track']):
            return QueryIntent(
                type=QueryType.GOAL_ANALYSIS,
                confidence=0.9,
                data_requirements=["user_profile", "nutrition_progress", "weight_history"],
                urgency="immediate",
                context_clues={},
                complexity="moderate"
            )
        
        # Weight tracking keywords
        elif any(word in message_lower for word in 
                 ['weight', 'pounds', 'lbs', 'kg', 'scale', 'losing', 'gaining']):
            return QueryIntent(
                type=QueryType.WEIGHT_TRACKING,
                confidence=0.85,
                data_requirements=["weight_history", "user_profile"],
                urgency="immediate",
                context_clues={},
                complexity="simple"
            )
        
        # Food search keywords
        elif any(word in message_lower for word in 
                 ['find', 'search', 'available', 'menu', 'options', 'where can i']):
            return QueryIntent(
                type=QueryType.FOOD_SEARCH,
                confidence=0.8,
                data_requirements=["available_foods"],
                urgency="immediate",
                context_clues={"search_query": message},
                complexity="simple"
            )
        
        # Default to general
        else:
            return QueryIntent(
                type=QueryType.GENERAL,
                confidence=0.3,
                data_requirements=[],
                urgency="educational",
                context_clues={},
                complexity="simple"
            )
    
    def _extract_meal_type(self, message: str) -> Optional[str]:
        """Extract meal type from message."""
        if 'breakfast' in message:
            return 'breakfast'
        elif 'lunch' in message:
            return 'lunch'
        elif 'dinner' in message:
            return 'dinner'
        elif 'snack' in message:
            return 'snack'
        return None
    
    async def _call_model(self, state: NutritionAgentState) -> NutritionAgentState:
        """Call the LLM with context and tools."""
        
        # Build system prompt based on available data
        system_prompt = await self._build_system_prompt(state)
        
        # Prepare messages
        messages = [SystemMessage(content=system_prompt)] + state["messages"]
        
        # Call LLM
        response = await self.llm_with_tools.ainvoke(messages)
        
        return {
            **state,
            "messages": [response]
        }
    
    async def _build_system_prompt(self, state: NutritionAgentState) -> str:
        """Build dynamic system prompt based on user context."""
        
        base_prompt = """You are a friendly, encouraging nutrition assistant for a college student.
        
        Your personality:
        - Casual and conversational tone
        - Scientifically accurate but easy to understand
        - Encouraging and supportive
        - Personalized based on user's data
        
        You have access to tools to get user's personal nutrition data, dining hall menus, 
        weight tracking, and meal history. Use these tools when the user asks questions 
        that would benefit from their personal data.
        
        Guidelines:
        - Always be positive and encouraging
        - Use specific data when available (e.g., "You've had 45g protein today")
        - Suggest specific foods from dining halls when relevant
        - Keep responses concise but helpful
        - If you don't have access to specific data, say so and offer general advice
        """
        
        # Add user context if available
        if state.get("user_profile"):
            profile = state["user_profile"]
            diet_type = profile.get('profile', {}).get('diet_type', 'no restrictions')
            base_prompt += f"""
            
        User Information:
        - Goals: {profile.get('profile', {}).get('weight_goal_type', 'maintenance')}
        - Activity Level: {profile.get('profile', {}).get('activity_level', 'moderate')}
        - Dietary Preferences: {diet_type}
        
        IMPORTANT: When calling food-related tools, ALWAYS pass the user_id parameter and apply dietary restrictions.
        If the user is {diet_type}, only suggest foods that match their dietary preferences.
        Never recommend foods that conflict with their dietary restrictions.
        """
        
        # Add query-specific context
        if state.get("query_intent"):
            intent = state["query_intent"]
            if intent.type == QueryType.NUTRITION_TRACKING:
                base_prompt += "\n\nThe user is asking about their nutrition intake. Use tools to get their actual data."
            elif intent.type == QueryType.MEAL_PLANNING:
                base_prompt += "\n\nThe user wants meal suggestions. Consider their goals and what's available at dining halls."
        
        return base_prompt
    
    def _should_continue(self, state: NutritionAgentState) -> str:
        """Determine whether to continue with tools or end."""
        
        last_message = state["messages"][-1]
        
        # Check if the message has tool calls
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            return "tools"
        else:
            return "end"
    
    async def chat(
        self, 
        message: str, 
        user_id: str,
        session_id: Optional[str] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Main chat interface with streaming responses.
        
        Args:
            message: User's message
            user_id: User identifier
            session_id: Optional session identifier for conversation memory
            
        Yields:
            Streaming response chunks
        """
        
        try:
            # Create session config
            config = {
                "configurable": {
                    "thread_id": session_id or f"user_{user_id}"
                }
            }
            
            # Load user profile for personalization
            user_profile = await self.data_service.get_user_profile(user_id)
            
            # Prepare initial state
            initial_state = {
                "messages": [HumanMessage(content=message)],
                "user_id": user_id,
                "user_profile": user_profile,
                "tools_called": [],
                "execution_path": [],
                "mongodb_queries": [],
                "response_style": "casual",
                "requires_streaming": True,
                "proactive_suggestions": [],
                "fallback_mode": False,
                "cache_hits": 0,
                "total_tokens_used": 0
            }
            
            # Stream the agent execution
            async for chunk in self.agent.astream(initial_state, config=config):
                yield self._format_chunk(chunk)
            
            # Save conversation to database
            if chunk and "messages" in chunk and len(chunk["messages"]) > 0:
                agent_response = chunk["messages"][-1].content
                await self.data_service.save_conversation_exchange(
                    user_id=user_id,
                    user_message=message,
                    agent_response=agent_response
                )
        
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            yield {
                "type": "error",
                "content": "I'm having trouble right now. Please try again in a moment.",
                "error": str(e)
            }
    
    def _format_chunk(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        """Format agent chunk for streaming response."""
        
        # Extract the node that was executed
        node_name = list(chunk.keys())[0] if chunk else "unknown"
        node_data = chunk.get(node_name, {})
        
        if node_name == "call_model" and "messages" in node_data:
            message = node_data["messages"][-1]
            if hasattr(message, 'content') and message.content:
                return {
                    "type": "response",
                    "content": message.content,
                    "node": node_name
                }
        
        elif node_name == "tools":
            return {
                "type": "tool_execution",
                "content": "Getting your data...",
                "node": node_name
            }
        
        elif node_name == "analyze_query":
            return {
                "type": "thinking",
                "content": "Understanding your question...",
                "node": node_name
            }
        
        return {
            "type": "processing",
            "content": "",
            "node": node_name
        }
    
    async def get_conversation_history(
        self, 
        user_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get user's conversation history."""
        return await self.data_service.get_conversation_history(user_id, limit)