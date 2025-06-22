from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class Food(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: Optional[str] = ""
    labels: List[str]
    ingredients: List[str]
    nutrients: Dict[str, str]
    dining_hall: Optional[str] = None
    dining_hall_id: Optional[str] = None
    meal_name: Optional[str] = None
    date: Optional[str] = None
    station: Optional[str] = None
    station_id: Optional[str] = None
    item_id: Optional[str] = None
    portion_size: Optional[str] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "656e...",
                "name": "Apple",
                "description": "",
                "labels": ["Vegan", "Vegetarian"],
                "ingredients": ["Apple"],
                "nutrients": {"calories": "52", "protein": "0.3"},
                "dining_hall": "Main Hall",
                "dining_hall_id": "uuid-dining-hall",
                "meal_name": "Breakfast",
                "date": "2024-05-30",
                "station": "500 Degrees",
                "station_id": "uuid-station",
                "item_id": "uuid-item",
                "portion_size": "1 tbsp"
            }
        }