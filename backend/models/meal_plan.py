from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from enum import Enum

class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"

class DiningHallMeal(BaseModel):
    meal_type: MealType
    dining_hall: str

class MealPlanRequest(BaseModel):
    # Option to use profile data
    use_profile_data: bool = Field(default=False, description="Use profile targets instead of manual entry")

    # Manual entry options (required if use_profile_data is False)
    target_calories: Optional[int] = Field(None, gt=0, description="Target daily calories")
    protein_percent: Optional[float] = Field(None, ge=0, le=100, description="Percentage of calories from protein")
    carbs_percent: Optional[float] = Field(None, ge=0, le=100, description="Percentage of calories from carbs")
    fat_percent: Optional[float] = Field(None, ge=0, le=100, description="Percentage of calories from fat")

    # Required fields for all requests
    dining_hall_meals: List[DiningHallMeal] = Field(description="Dining hall for each meal")
    date: str = Field(description="Date for meal plan in YYYY-MM-DD format")

    # Optional filters (can come from profile or be specified)
    use_profile_preferences: bool = Field(default=False, description="Use dietary preferences from profile")
    dietary_preferences: Optional[List[str]] = Field(default=[], description="Dietary preferences to filter by")
    allergens_to_avoid: Optional[List[str]] = Field(default=[], description="Allergens to avoid")

    @validator('protein_percent')
    def validate_macros(cls, v, values):
        if not values.get('use_profile_data'):
            if v is None:
                raise ValueError("protein_percent required when not using profile data")
            carbs = values.get('carbs_percent')
            fat = values.get('fat_percent')
            if carbs is not None and fat is not None:
                total = v + carbs + fat
                if abs(total - 100) > 0.01:  # Allow small floating point errors
                    raise ValueError(f"Macros must sum to 100%, got {total}%")
        return v

    @validator('target_calories')
    def validate_calories(cls, v, values):
        if not values.get('use_profile_data') and v is None:
            raise ValueError("target_calories required when not using profile data")
        return v

class PlannedMealItem(BaseModel):
    food_id: str
    food_name: str
    quantity: float
    calories: float
    protein: float
    carbs: float
    fat: float
    dining_hall: str
    meal_name: str

class PlannedMeal(BaseModel):
    meal_type: MealType
    dining_hall: str
    foods: List[PlannedMealItem] = Field(description="List of food items with quantities")
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float

class MealPlanResponse(BaseModel):
    date: str
    target_calories: int
    target_macros: Dict[str, float] = Field(description="Target macro percentages")
    meals: List[PlannedMeal]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    actual_macros: Dict[str, float] = Field(description="Actual macro percentages achieved")
    success: bool
    message: Optional[str] = Field(None, description="Error or warning message if any")