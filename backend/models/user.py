from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class UserProfile(BaseModel):
    sex: str
    birthday: date
    height: float
    weight: float
    body_fat_percent: Optional[float]
    bmi: Optional[float]
    weight_goal: float
    weight_goal_rate: str
    weight_goal_type: str
    weight_goal_custom_rate: float
    activity_level: str
    protein_target: str
    carb_target: str
    fat_target: str
    diet_type: str
    meal_preference: List[str]
    cultural_preference: str
    allergens: List[str]
    foode_sensitivities: List[str]
    allergen_notes: str
    protein_ratio: int
    carb_ratio: int
    fat_ratio: int
    image: Optional[str] = None

class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    profile: UserProfile

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserLogin(BaseModel):
     email: str
     password: str
