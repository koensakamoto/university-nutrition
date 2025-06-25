from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    sex: str
    birthday: date
    height_cm: float
    weight_kg: float
    body_fat_percent: Optional[float]
    bmi: Optional[float]
    weight_goal: float
    weight_goal_rate: str
    activity_level: str
    protein_target: str
    carb_target: str
    fat_target: str
    diet_type: str
    meal_preference: List[str]
    cultural_preference: str
    allergens: List[str]


class User(BaseModel):
    id: str
    email: EmailStr
    profile: UserProfile