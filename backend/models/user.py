from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserProfile(BaseModel):
    sex: Optional[str] = None
    birthday: Optional[date] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    body_fat_percent: Optional[float] = None
    bmi: Optional[float] = None
    weight_goal: Optional[float] = None
    weight_goal_rate: Optional[str] = None
    weight_goal_type: Optional[str] = None
    weight_goal_custom_rate: Optional[float] = None
    activity_level: Optional[str] = None
    protein_target: Optional[str] = None
    carb_target: Optional[str] = None
    fat_target: Optional[str] = None
    diet_type: Optional[str] = None
    meal_preference: Optional[List[str]] = None
    cultural_preference: Optional[str] = None
    allergens: Optional[List[str]] = None
    foode_sensitivities: Optional[List[str]] = None
    allergen_notes: Optional[str] = None
    protein_ratio: Optional[int] = None
    carb_ratio: Optional[int] = None
    fat_ratio: Optional[int] = None
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
