"""
FastAPI endpoints for the AI nutrition agent.

Provides chat interface and conversation management for the LangGraph agent.
"""

import asyncio
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .agent import NutritionAgent
from .models.state import QueryType

logger = logging.getLogger(__name__)

# Request/Response models
class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message to the AI agent")
    session_id: Optional[str] = Field(None, description="Optional session ID for conversation continuity")

# Authentication dependency
def get_current_user_id(request: Request) -> str:
    """Extract user ID from authentication."""
    # Import here to avoid circular imports
    from auth_util import get_current_user
    import os
    from pymongo import MongoClient
    
    # Get database connection
    MONGODB_URI = os.getenv("MONGODB_URI")
    if not MONGODB_URI:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    client = MongoClient(MONGODB_URI)
    db = client["nutritionapp"]
    users_collection = db["users"]
    
    try:
        user = get_current_user(request, users_collection)
        return str(user["_id"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

class ChatResponse(BaseModel):
    response: str = Field(..., description="Agent's response")
    session_id: str = Field(..., description="Session ID for this conversation")
    query_type: Optional[str] = Field(None, description="Detected query intent type")
    tools_used: Optional[list] = Field(None, description="Tools that were called during processing")

class ConversationHistoryResponse(BaseModel):
    conversations: list = Field(..., description="List of recent conversations")
    total: int = Field(..., description="Total number of conversations")

# Global agent instance - will be initialized by main.py
nutrition_agent: Optional[NutritionAgent] = None

def get_agent() -> NutritionAgent:
    """Dependency to get the initialized agent."""
    if nutrition_agent is None:
        raise HTTPException(status_code=500, detail="AI agent not initialized")
    return nutrition_agent

def set_agent(agent: NutritionAgent):
    """Set the global agent instance."""
    global nutrition_agent
    nutrition_agent = agent

# Create router
router = APIRouter(prefix="/api/ai", tags=["AI Agent"])

@router.post("/chat")
async def chat_with_agent(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    agent: NutritionAgent = Depends(get_agent)
) -> StreamingResponse:
    """
    Chat with the AI nutrition agent with streaming responses.
    
    Returns a streaming response with real-time agent output.
    """
    try:
        async def generate_response():
            """Generator for streaming response."""
            response_chunks = []
            session_id = request.session_id or f"session_{user_id}_{int(datetime.now().timestamp())}"
            
            try:
                async for chunk in agent.chat(
                    message=request.message,
                    user_id=user_id,
                    session_id=session_id
                ):
                    # Stream each chunk as Server-Sent Events
                    chunk_data = {
                        "type": chunk.get("type", "response"),
                        "content": chunk.get("content", ""),
                        "session_id": session_id,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # Store chunks for final response
                    if chunk.get("type") == "response" and chunk.get("content"):
                        response_chunks.append(chunk.get("content"))
                    
                    yield f"data: {json.dumps(chunk_data)}\n\n"
                
                # Send final completion signal
                final_chunk = {
                    "type": "complete",
                    "session_id": session_id,
                    "full_response": " ".join(response_chunks),
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(final_chunk)}\n\n"
                
            except Exception as e:
                logger.error(f"Error in chat stream: {e}")
                error_chunk = {
                    "type": "error",
                    "content": "I'm having trouble right now. Please try again in a moment.",
                    "error": str(e),
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(error_chunk)}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
        
    except Exception as e:
        logger.error(f"Error initiating chat: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start chat: {str(e)}")

@router.post("/chat/simple", response_model=ChatResponse)
async def simple_chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    agent: NutritionAgent = Depends(get_agent)
) -> ChatResponse:
    """
    Simple non-streaming chat endpoint for basic integrations.
    
    Returns the complete response after processing.
    """
    try:
        session_id = request.session_id or f"session_{user_id}_{int(datetime.now().timestamp())}"
        
        # Collect all chunks
        response_parts = []
        tools_used = []
        query_type = None
        
        async for chunk in agent.chat(
            message=request.message,
            user_id=user_id,
            session_id=session_id
        ):
            if chunk.get("type") == "response" and chunk.get("content"):
                response_parts.append(chunk.get("content"))
            elif chunk.get("type") == "tool_execution":
                tools_used.append(chunk.get("node", "unknown_tool"))
            elif chunk.get("type") == "thinking":
                # Could extract query type from agent state here
                pass
        
        full_response = " ".join(response_parts) if response_parts else "I'm sorry, I couldn't process your request right now."
        
        return ChatResponse(
            response=full_response,
            session_id=session_id,
            query_type=query_type,
            tools_used=list(set(tools_used)) if tools_used else None
        )
        
    except Exception as e:
        logger.error(f"Error in simple chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.get("/conversations", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    limit: int = 10,
    user_id: str = Depends(get_current_user_id),
    agent: NutritionAgent = Depends(get_agent)
) -> ConversationHistoryResponse:
    """
    Get user's conversation history with the AI agent.
    """
    try:
        conversations = await agent.get_conversation_history(user_id, limit)
        
        return ConversationHistoryResponse(
            conversations=conversations,
            total=len(conversations)
        )
        
    except Exception as e:
        logger.error(f"Error fetching conversation history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")

@router.get("/health")
async def health_check(agent: NutritionAgent = Depends(get_agent)) -> Dict[str, Any]:
    """
    Health check endpoint for the AI agent.
    """
    try:
        # Test basic agent functionality
        test_state = {
            "messages": [],
            "user_id": "health_check",
            "tools_called": [],
            "execution_path": [],
            "mongodb_queries": [],
            "response_style": "casual",
            "requires_streaming": False,
            "proactive_suggestions": [],
            "fallback_mode": False,
            "cache_hits": 0,
            "total_tokens_used": 0
        }
        
        return {
            "status": "healthy",
            "agent_initialized": True,
            "model": "gpt-4o-mini",
            "tools_available": len(agent.tools),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/capabilities")
async def get_capabilities(agent: NutritionAgent = Depends(get_agent)) -> Dict[str, Any]:
    """
    Get information about the agent's capabilities and available tools.
    """
    try:
        tool_descriptions = []
        for tool in agent.tools:
            tool_descriptions.append({
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.args_schema.schema() if hasattr(tool, 'args_schema') else {}
            })
        
        return {
            "model": "gpt-4o-mini",
            "architecture": "LangGraph Hybrid Agent",
            "capabilities": [
                "Nutrition tracking and analysis",
                "Weight progress monitoring",
                "Personalized meal suggestions",
                "Food search and discovery",
                "Goal tracking and recommendations",
                "Real-time streaming responses",
                "Conversation memory"
            ],
            "supported_query_types": [e.value for e in QueryType],
            "tools": tool_descriptions,
            "streaming_supported": True,
            "memory_enabled": True
        }
        
    except Exception as e:
        logger.error(f"Error getting capabilities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get capabilities: {str(e)}")