from fastapi import FastAPI, Query, HTTPException, status, Response, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import certifi

from models.food import Food
from models.agent import AgentQuery

from models.user import UserCreate, UserProfile
from auth.auth_utils import (
    hash_password, verify_password, set_auth_cookie, clear_auth_cookie,
    get_user_by_email, get_current_user
)
from auth.jwt_utils import create_access_token



app = FastAPI()

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
db = client["nutritionapp"]
foods_collection = db["foods"]

# Helper to convert ObjectId to string
def fix_id(food):
    food["_id"] = str(food["_id"])
    return food

@app.get("/foods", response_model=List[Food])
def get_foods(
    name: Optional[str] = Query(None, description="Partial name match, case-insensitive"),
    label: Optional[str] = Query(None, description="Label must be present in labels array"),
    dining_hall: Optional[str] = Query(None),
    meal_name: Optional[str] = Query(None),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format")
):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if label:
        query["labels"] = label
    if dining_hall:
        query["dining_hall"] = dining_hall
    if meal_name:
        query["meal_name"] = meal_name
    if date:
        query["date"] = date
    foods = list(foods_collection.find(query))
    for food in foods:
        if "_id" in food and food["_id"] is not None:
            food["_id"] = str(food["_id"])
        else:
            food["_id"] = None
    return [Food(**food) for food in foods]

@app.get("/foods/{food_id}", response_model=Food)
def get_food_by_id(food_id: str):
    food = foods_collection.find_one({"_id": ObjectId(food_id)})
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return Food(**food)

@app.post("/foods", response_model=Food, status_code=status.HTTP_201_CREATED)
def create_food(food: Food):
    food_dict = food.dict(by_alias=True, exclude_unset=True)
    food_dict.pop("_id", None)  # Remove _id if present, MongoDB will create it
    result = foods_collection.insert_one(food_dict)
    food_dict["_id"] = str(result.inserted_id)
    return Food(**food_dict)

@app.put("/foods/{food_id}", response_model=Food)
def update_food(food_id: str, food: Food):
    food_dict = food.dict(by_alias=True, exclude_unset=True)
    food_dict.pop("_id", None)
    result = foods_collection.update_one({"_id": ObjectId(food_id)}, {"$set": food_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Food not found")
    updated_food = foods_collection.find_one({"_id": ObjectId(food_id)})
    return Food(**updated_food)

@app.delete("/foods/{food_id}")
def delete_food(food_id: str):
    result = foods_collection.delete_one({"_id": ObjectId(food_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Food not found")
    return {"message": "Food deleted successfully"}

@app.get("/")
def read_root():
    return {"message": "Hello World"}





@app.post("/auth/register")
def register(user: UserCreate, response: Response):
    if get_user_by_email(users_collection, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = hash_password(user.password)
    users_collection.insert_one({
        "email": user.email,
        "hashed_password": hashed_pw,
        "profile": {}  # or default profile fields
    })
    token = create_access_token({"sub": user.email})
    set_auth_cookie(response, token)
    return {"message": "Registered"}

@app.post("/auth/login")
def login(user: UserCreate, response: Response):
    db_user = get_user_by_email(users_collection, user.email)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    set_auth_cookie(response, token)
    return {"message": "Logged in"}

@app.post("/auth/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out"}

@app.get("/profile")
def get_profile(request: Request):
    user = get_current_user(request, users_collection)
    return user.get("profile", {})

@app.put("/profile")
def update_profile(profile: UserProfile, request: Request):
    user = get_current_user(request, users_collection)
    users_collection.update_one(
        {"email": user["email"]},
        {"$set": {"profile": profile.dict()}}
    )
    return {"message": "Profile updated"}