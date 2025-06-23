from pydantic import BaseModel
 
class AgentQuery(BaseModel):
    query: str
    dining_hall: str
    meal_type: str
    date: str 