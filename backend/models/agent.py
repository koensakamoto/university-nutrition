from pydantic import BaseModel
from typing import TypedDict, Any
 
class AgentQuery(BaseModel):
    query: str
    dining_hall: str
    meal_type: str
    date: str 

class AgentRequest(BaseModel):
    user_id: str
    message: str 

class AgentState(TypedDict):
    user_message: str
    user_id: str
    agent_response: Any

    