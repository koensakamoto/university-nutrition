from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class PlateItem(BaseModel):
    food_id: str
    quantity: float
    custom_macros: Optional[Dict[str, Any]] = None

class Plate(BaseModel):
    date: str  # ISO date string, e.g., '2024-06-15'
    name: Optional[str] = None
    items: List[PlateItem] 