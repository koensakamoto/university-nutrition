from fastapi import FastAPI, Query, HTTPException, status, Response, Request, Depends, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import certifi
from datetime import datetime, timedelta
import shutil
import uuid
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
import io
import csv
import json
from authlib.integrations.starlette_client import OAuth

from models.food import Food
from models.agent import AgentQuery

from models.user import UserCreate, UserProfile, ChangePasswordRequest
from models.plate import Plate, PlateItem

from auth_util import (
    hash_password, verify_password, set_auth_cookie, clear_auth_cookie,
    get_user_by_email, get_current_user
)
from jwt_util import create_access_token

from starlette.middleware.sessions import SessionMiddleware



app = FastAPI()

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "dev-secret-key"))

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
db = client["nutritionapp"]
foods_collection = db["foods"]
users_collection = db["users"]

# Google OAuth2 setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

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
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if db_user.get("hashed_password") is None:
        raise HTTPException(status_code=400, detail="Account uses Google login. Please use 'Continue with Google' or set a password in your account settings.")
    if not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    set_auth_cookie(response, token)
    return {"message": "Logged in"}

@app.post("/auth/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out"}

@app.get("/api/profile")
def get_profile(request: Request):
    user = get_current_user(request, users_collection)
    return {
        "email": user.get("email"),
        "profile": user.get("profile", {}),
        "hasPassword": bool(user.get("hashed_password"))
    }

@app.get("/api/email")
def get_email(request: Request):
    user = get_current_user(request, users_collection)
    return user.get("email", {})


@app.put("/api/profile")
def update_profile(request: Request, data: dict = Body(...)):
    user = get_current_user(request, users_collection)
    users_collection.update_one(
        {"email": user["email"]},
        {"$set": {f"profile.{k}": v for k, v in data.items()}}
    )
    return {"message": "Profile updated"}

@app.post("/api/profile/image")
async def upload_profile_image(request: Request, image: UploadFile = File(...)):
    user = get_current_user(request, users_collection)
    # Generate a unique filename
    ext = os.path.splitext(image.filename)[-1]
    filename = f"{uuid.uuid4().hex}{ext}"
    save_dir = "static/profile_images"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    # Construct the URL
    url = f"/static/profile_images/{filename}"
    return {"url": url}

def calculate_bmr(sex, weight_kg, height_cm, age):
    if sex == 'male':
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

def get_activity_multiplier(activity_level):
    return {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'high': 1.725,
        'extreme': 1.9
    }.get(activity_level, 1.2)

@app.get("/api/profile/energy-target")
def get_energy_target(request: Request):
    user = get_current_user(request, users_collection)
    profile = user.get("profile", {})
    sex = profile.get("sex", "male")
    weight_lbs = profile.get("weight", 150)
    height_in = profile.get("height", 68)
    birthday = profile.get("birthday")
    activity_level = profile.get("activity_level", "sedentary")
    weight_goal_type = profile.get("weight_goal_type", "maintain")
    weight_goal_rate = profile.get("weight_goal_rate", 0)
    weight_goal_custom_rate = profile.get("weight_goal_custom_rate", 0)

    weight_kg = float(weight_lbs) * 0.453592
    height_cm = float(height_in) * 2.54

    # Calculate age
    if birthday:
        if isinstance(birthday, str):
            birthdate = datetime.strptime(birthday[:10], "%Y-%m-%d")
        else:
            birthdate = birthday
        today = datetime.today()
        age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    else:
        age = 30  # default

    bmr = calculate_bmr(sex, weight_kg, height_cm, age)
    tdee = bmr * get_activity_multiplier(activity_level)

    # Map string rates to float values
    rate_map = {"slow": 0.5, "moderate": 1.0, "fast": 1.5}

    # Adjust for weight goal
    if weight_goal_type == "lose":
        if str(weight_goal_rate) == "custom":
            try:
                custom_rate = float(weight_goal_custom_rate)
            except Exception:
                custom_rate = 0
            tdee -= 500 * custom_rate
        else:
            rate_value = rate_map.get(str(weight_goal_rate), None)
            if rate_value is not None:
                tdee -= 500 * rate_value
            else:
                try:
                    tdee -= 500 * float(weight_goal_rate)
                except Exception:
                    pass
    elif weight_goal_type == "gain":
        if str(weight_goal_rate) == "custom":
            try:
                custom_rate = float(weight_goal_custom_rate)
            except Exception:
                custom_rate = 0
            tdee += 500 * custom_rate
        else:
            rate_value = rate_map.get(str(weight_goal_rate), None)
            if rate_value is not None:
                tdee += 500 * rate_value
            else:
                try:
                    tdee += 500 * float(weight_goal_rate)
                except Exception:
                    pass
    elif weight_goal_type == "custom":
        try:
            tdee += 500 * float(weight_goal_custom_rate)
        except Exception:
            pass

    return {"energy_target": round(tdee)}

@app.post("/api/account/change-password")
def change_password(request: Request, data: ChangePasswordRequest):
    user = get_current_user(request, users_collection)
    if not verify_password(data.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hashed = hash_password(data.new_password)
    users_collection.update_one(
        {"email": user["email"]},
        {"$set": {"hashed_password": new_hashed}}
    )
    return {"message": "Password updated"}

@app.delete("/api/account")
def delete_account(request: Request):
    user = get_current_user(request, users_collection)
    users_collection.delete_one({"email": user["email"]})
    # Optionally, delete related data (nutrition logs, etc.)
    return {"message": "Account deleted"}

@app.get("/api/plate")
def get_plate(request: Request, date: str):
    user = get_current_user(request, users_collection)
    plate = db["plates"].find_one({"user_id": str(user["_id"]), "date": date})
    if not plate:
        return {"items": []}
    # Convert ObjectId to string for user_id
    plate["user_id"] = str(plate["user_id"])
    plate["_id"] = str(plate["_id"])
    print("plate", plate)
    return plate

@app.post("/api/plate")
def save_plate(request: Request, plate: Plate = Body(...)):
    user = get_current_user(request, users_collection)
    items = []
    for item in plate.items:
        print(item)
        d = item.dict()
        # If custom food, ensure custom_macros is present and valid
        if str(d.get("food_id", "")).startswith("custom-"):
            if "custom_macros" not in d or d["custom_macros"] is None:
                raise HTTPException(status_code=400, detail="Custom food must include custom_macros")
        # Remove custom_macros if it is None or not present
        if "custom_macros" in d and d["custom_macros"] is None:
            del d["custom_macros"]
        items.append(d)
    db["plates"].update_one(
        {"user_id": str(user["_id"]), "date": plate.date},
        {"$set": {"items": items, "user_id": str(user["_id"]), "date": plate.date}},
        upsert=True
    )
    return {"message": "Plate saved"}

@app.get("/api/plate/summary")
def get_plate_summary(request: Request, start_date: str, end_date: str):
    user = get_current_user(request, users_collection)
    user_id = str(user["_id"])
    # Query all plates for user in date range
    plates = list(db["plates"].find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }))
    # Collect all unique food_ids (excluding custom foods)
    food_ids = set()
    for plate in plates:
        for item in plate.get("items", []):
            food_id = item.get("food_id")
            if food_id and not str(food_id).startswith("custom-"):
                food_ids.add(food_id)
    # Bulk fetch all foods
    foods_map = {}
    if food_ids:
        object_ids = []
        str_ids = []
        for fid in food_ids:
            try:
                object_ids.append(ObjectId(fid))
            except Exception:
                str_ids.append(fid)
        if object_ids:
            for food in db["foods"].find({"_id": {"$in": object_ids}}):
                foods_map[str(food["_id"])] = food
        if str_ids:
            for food in db["foods"].find({"_id": {"$in": str_ids}}):
                foods_map[food["_id"]] = food
    # For each plate, sum up calories, protein, carbs
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0
    days_tracked = set()
    for plate in plates:
        days_tracked.add(plate["date"])
        for item in plate["items"]:
            quantity = item.get("quantity", 1)
            # Custom food support
            if "custom_macros" in item:
                n = item["custom_macros"]
                if n is None:
                    print(f"Warning: custom_macros is None for item: {item}")
                    continue
                protein = float(n.get("protein", 0)) * quantity
                fat = float(n.get("totalFat", n.get("total_fat", 0))) * quantity
                fiber = float(n.get("dietary_fiber", 0))
                total_carbs_val = float(n.get("carbs", n.get("total_carbohydrates", 0)))
                net_carbs = (total_carbs_val - fiber) * quantity
                total_protein += protein
                total_fat += fat
                total_carbs += net_carbs
                # Calculate calories from macros
                total_calories += (protein * 4) + (net_carbs * 4) + (fat * 9)
                continue
            food_id = item.get("food_id")
            food = foods_map.get(str(food_id))
            if not food:
                print(f"Warning: food_id {food_id} not found in foods collection for item: {item}")
                continue
            n = food.get("nutrients", {})
            if n is None:
                print(f"Warning: nutrients is None for food_id {food_id} (food: {food})")
                continue
            protein = float(n.get("protein", 0)) * quantity
            fat = float(n.get("total_fat", 0)) * quantity
            fiber = float(n.get("dietary_fiber", 0))
            total_carbs_val = float(n.get("total_carbohydrates", 0))
            net_carbs = (total_carbs_val - fiber) * quantity
            total_protein += protein
            total_fat += fat
            total_carbs += net_carbs
            # Calculate calories from macros
            total_calories += (protein * 4) + (net_carbs * 4) + (fat * 9)
            print("item", item, "total_carbs", total_carbs)
    # Calculate averages
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    num_days = (end - start).days + 1
    print("days_tracked", len(days_tracked))
    print("total_calories", total_calories)
    avg_calories = total_calories / len(days_tracked) if days_tracked else 0
    print("avg_calories", avg_calories)
    avg_protein = total_protein / len(days_tracked) if days_tracked else 0
    avg_carbs = total_carbs / len(days_tracked) if days_tracked else 0
    return {
        "average_calories": round(avg_calories, 1),
        "average_protein": round(avg_protein, 1),
        "average_carbs": round(avg_carbs, 1),
        "days_tracked": len(days_tracked),
        "total_days": num_days
    }

@app.get("/api/plate/food-macros")
def get_food_macros(request: Request, start_date: str, end_date: str):
    user = get_current_user(request, users_collection)
    user_id = str(user["_id"])
    # Find all plates for user in date range
    plates = list(db["plates"].find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }))
    result = []
    for plate in plates:
        date = plate["date"]
        for item in plate.get("items", []):
            quantity = item.get("quantity", 1)
            if "custom_macros" in item:
                n = item["custom_macros"]
                if n is None:
                    print(f"Warning: custom_macros is None for item: {item}")
                    continue
                fiber = float(n.get("dietary_fiber", 0))
                total_carbs = float(n.get("carbs", n.get("total_carbohydrates", 0)))
                net_carbs = total_carbs - fiber
                result.append({
                    "date": date,
                    "calories": int(n.get("calories", 0)) * quantity,
                    "protein": float(n.get("protein", 0)) * quantity,
                    "carbs": net_carbs * quantity,
                    "fat": float(n.get("totalFat", n.get("total_fat", 0))) * quantity,
                    "fiber": fiber * quantity
                })
                continue
            food_id = item.get("food_id")
            food = None
            try:
                food = db["foods"].find_one({"_id": ObjectId(food_id)})
            except Exception:
                food = db["foods"].find_one({"_id": food_id})
            if not food:
                print(f"Warning: food_id {food_id} not found in foods collection for item: {item}")
                continue
            n = food.get("nutrients", {})
            if n is None:
                print(f"Warning: nutrients is None for food_id {food_id} (food: {food})")
                continue
            fiber = float(n.get("dietary_fiber", 0))
            total_carbs = float(n.get("total_carbohydrates", 0))
            net_carbs = total_carbs - fiber
            result.append({
                "date": date,
                "calories": int(n.get("calories", 0)) * quantity,
                "protein": float(n.get("protein", 0)) * quantity,
                "carbs": net_carbs * quantity,
                "fat": float(n.get("total_fat", 0)) * quantity,
                "fiber": fiber * quantity
            })
    return result

@app.put("/api/profile/email")
def update_email(request: Request, data: dict = Body(...)):
    user = get_current_user(request, users_collection)
    new_email = data.get("email")
    if not new_email:
        raise HTTPException(status_code=400, detail="Email is required")
    # Check if new_email is already taken
    if users_collection.find_one({"email": new_email}):
        raise HTTPException(status_code=400, detail="Email already in use")
    users_collection.update_one(
        {"email": user["email"]},
        {"$set": {"email": new_email}}
    )
    return {"message": "Email updated"}

@app.post("/api/weight-log")
def upsert_weight_log(request: Request, weight: float = Body(...), date: str = Body(None)):
    user = get_current_user(request, users_collection)
    user_id = str(user["_id"])
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    db["weight_log"].update_one(
        {"user_id": user_id, "date": date},
        {"$set": {"weight": weight, "user_id": user_id, "date": date}},
        upsert=True
    )
    return {"message": "Weight log updated"}

@app.get("/api/weight-log")
def get_weight_logs(request: Request, start_date: str = Query(...), end_date: str = Query(...)):
    user = get_current_user(request, users_collection)
    user_id = str(user["_id"])
    logs = list(db["weight_log"].find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0, "user_id": 0}))
    # Sort logs by date ascending
    logs.sort(key=lambda x: x["date"])
    return logs

@app.post("/api/export-data")
def export_data(request: Request, body: dict = Body(...)):
    user = get_current_user(request, users_collection)
    user_id = str(user["_id"])
    selections = body.get("selections", {})
    format = body.get("format", "csv")
    export_data = {}

    # Profile Info
    if selections.get("profile"):
        export_data["profile"] = user.get("profile", {})

    # Weight History
    if selections.get("weight"):
        weight_logs = list(db["weight_log"].find({"user_id": user_id}, {"_id": 0, "user_id": 0}))
        weight_logs.sort(key=lambda x: x["date"])
        export_data["weight_history"] = weight_logs

    # Meal Logs
    if selections.get("meals"):
        plates = list(db["plates"].find({"user_id": user_id}))
        for plate in plates:
            plate["_id"] = str(plate["_id"])
        export_data["meal_logs"] = plates

    # JSON Export (improved: no IDs, include food name and macros for all items)
    if format == "json":
        # If meal logs are selected, process them to remove IDs and add names/macros
        if selections.get("meals"):
            # Collect all unique standard food_ids
            food_ids = set()
            for plate in export_data.get("meal_logs", []):
                for item in plate.get("items", []):
                    if "custom_macros" not in item:
                        food_id = item.get("food_id", "")
                        if food_id:
                            food_ids.add(food_id)
            # Batch fetch all foods
            foods_map = {}
            if food_ids:
                from bson import ObjectId
                object_ids = []
                str_ids = []
                for fid in food_ids:
                    try:
                        object_ids.append(ObjectId(fid))
                    except Exception:
                        str_ids.append(fid)
                if object_ids:
                    for food in db["foods"].find({"_id": {"$in": object_ids}}):
                        foods_map[str(food["_id"])] = food
                if str_ids:
                    for food in db["foods"].find({"_id": {"$in": str_ids}}):
                        foods_map[food["_id"]] = food
            # Build new meal_logs structure
            new_meal_logs = []
            for plate in export_data.get("meal_logs", []):
                date = plate.get("date", "")
                new_items = []
                for item in plate.get("items", []):
                    if "custom_macros" in item:
                        n = item["custom_macros"]
                        new_items.append({
                            "name": n.get("name", "Custom Food"),
                            "quantity": item.get("quantity", 1),
                            "calories": n.get("calories", ""),
                            "protein": n.get("protein", ""),
                            "carbs": n.get("carbs", ""),
                            "fat": n.get("totalFat", n.get("total_fat", "")),
                            "type": "Custom"
                        })
                    else:
                        food_id = item.get("food_id", "")
                        food = foods_map.get(str(food_id))
                        if food:
                            n = food.get("nutrients", {})
                            new_items.append({
                                "name": food.get("name", ""),
                                "quantity": item.get("quantity", 1),
                                "calories": n.get("calories", ""),
                                "protein": n.get("protein", ""),
                                "carbs": n.get("total_carbohydrates", ""),
                                "fat": n.get("total_fat", ""),
                                "type": "Standard"
                            })
                        else:
                            new_items.append({
                                "name": "",
                                "quantity": item.get("quantity", 1),
                                "calories": "",
                                "protein": "",
                                "carbs": "",
                                "fat": "",
                                "type": "Standard"
                            })
                new_meal_logs.append({
                    "date": date,
                    "items": new_items
                })
            export_data["meal_logs"] = new_meal_logs
        return JSONResponse(content=export_data)

    # CSV Export (improved, sectioned and flattened)
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        # Profile Info
        if selections.get("profile"):
            writer.writerow(["Profile Info"])
            writer.writerow(["Field", "Value"])
            for k, v in export_data.get("profile", {}).items():
                writer.writerow([k, f"'{v}" if v is not None else ""])
            writer.writerow([])
        # Weight History
        if selections.get("weight"):
            writer.writerow(["Weight History"])
            writer.writerow(["Date", "Weight"])
            for log in export_data.get("weight_history", []):
                weight = log.get("weight", "")
                writer.writerow([log.get("date", ""), f"'{weight}" if weight != "" else ""])
            writer.writerow([])
        # Meal Logs
        if selections.get("meals"):
            writer.writerow(["Meal Logs"])
            writer.writerow(["Date", "Food Name", "Quantity", "Calories", "Protein", "Carbs", "Fat", "Type"])
            # Collect all unique standard food_ids
            food_ids = set()
            for plate in export_data.get("meal_logs", []):
                for item in plate.get("items", []):
                    if "custom_macros" not in item:
                        food_id = item.get("food_id", "")
                        if food_id:
                            food_ids.add(food_id)
            # Batch fetch all foods
            foods_map = {}
            if food_ids:
                from bson import ObjectId
                object_ids = []
                str_ids = []
                for fid in food_ids:
                    try:
                        object_ids.append(ObjectId(fid))
                    except Exception:
                        str_ids.append(fid)
                if object_ids:
                    for food in db["foods"].find({"_id": {"$in": object_ids}}):
                        foods_map[str(food["_id"])] = food
                if str_ids:
                    for food in db["foods"].find({"_id": {"$in": str_ids}}):
                        foods_map[food["_id"]] = food
            # Write meal log rows
            for plate in export_data.get("meal_logs", []):
                date = plate.get("date", "")
                for item in plate.get("items", []):
                    if "custom_macros" in item:
                        n = item["custom_macros"]
                        writer.writerow([
                            date,
                            n.get("name", "Custom Food"),
                            item.get("quantity", 1),
                            n.get("calories", ""),
                            n.get("protein", ""),
                            n.get("carbs", ""),
                            n.get("totalFat", n.get("total_fat", "")),
                            "Custom"
                        ])
                    else:
                        food_id = item.get("food_id", "")
                        food = foods_map.get(str(food_id))
                        if food:
                            n = food.get("nutrients", {})
                            writer.writerow([
                                date,
                                food.get("name", ""),
                                item.get("quantity", 1),
                                n.get("calories", ""),
                                n.get("protein", ""),
                                n.get("total_carbohydrates", ""),
                                n.get("total_fat", ""),
                                "Standard"
                            ])
                        else:
                            writer.writerow([
                                date,
                                "",
                                item.get("quantity", 1),
                                "", "", "", "",
                                "Standard"
                            ])
            writer.writerow([])
        output.seek(0)
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=export.csv"})

    # PDF Export
    if format == "pdf":
        try:
            from fpdf import FPDF
        except ImportError:
            return JSONResponse({"error": "PDF export requires fpdf2. Please install with 'pip install fpdf2'."}, status_code=500)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Profile Info
        if selections.get("profile"):
            pdf.set_font("Arial", style="B", size=14)
            pdf.cell(0, 10, "Profile Info", ln=1)
            pdf.set_font("Arial", size=12)
            profile = export_data.get("profile", {})
            for k, v in profile.items():
                pdf.cell(50, 8, str(k), border=1)
                pdf.cell(0, 8, str(v), border=1, ln=1)
            pdf.ln(5)

        # Weight History
        if selections.get("weight"):
            pdf.set_font("Arial", style="B", size=14)
            pdf.cell(0, 10, "Weight History", ln=1)
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(40, 8, "Date", border=1)
            pdf.cell(40, 8, "Weight", border=1, ln=1)
            pdf.set_font("Arial", size=12)
            for log in export_data.get("weight_history", []):
                pdf.cell(40, 8, str(log.get("date", "")), border=1)
                pdf.cell(40, 8, str(log.get("weight", "")), border=1, ln=1)
            pdf.ln(5)

        # Meal Logs
        if selections.get("meals"):
            pdf.set_font("Arial", style="B", size=14)
            pdf.cell(0, 10, "Meal Logs", ln=1)
            pdf.set_font("Arial", style="B", size=12)
            pdf.cell(30, 8, "Date", border=1)
            pdf.cell(40, 8, "Food Name", border=1)
            pdf.cell(20, 8, "Qty", border=1)
            pdf.cell(20, 8, "Cal", border=1)
            pdf.cell(20, 8, "Protein", border=1)
            pdf.cell(20, 8, "Carbs", border=1)
            pdf.cell(20, 8, "Fat", border=1)
            pdf.cell(20, 8, "Type", border=1, ln=1)
            pdf.set_font("Arial", size=12)
            # Collect all unique standard food_ids
            food_ids = set()
            for plate in export_data.get("meal_logs", []):
                for item in plate.get("items", []):
                    if "custom_macros" not in item:
                        food_id = item.get("food_id", "")
                        if food_id:
                            food_ids.add(food_id)
            # Batch fetch all foods
            foods_map = {}
            if food_ids:
                from bson import ObjectId
                object_ids = []
                str_ids = []
                for fid in food_ids:
                    try:
                        object_ids.append(ObjectId(fid))
                    except Exception:
                        str_ids.append(fid)
                if object_ids:
                    for food in db["foods"].find({"_id": {"$in": object_ids}}):
                        foods_map[str(food["_id"])] = food
                if str_ids:
                    for food in db["foods"].find({"_id": {"$in": str_ids}}):
                        foods_map[food["_id"]] = food
            for plate in export_data.get("meal_logs", []):
                date = plate.get("date", "")
                for item in plate.get("items", []):
                    if "custom_macros" in item:
                        n = item["custom_macros"]
                        pdf.cell(30, 8, str(date), border=1)
                        pdf.cell(40, 8, str(n.get("name", "Custom Food")), border=1)
                        pdf.cell(20, 8, str(item.get("quantity", 1)), border=1)
                        pdf.cell(20, 8, str(n.get("calories", "")), border=1)
                        pdf.cell(20, 8, str(n.get("protein", "")), border=1)
                        pdf.cell(20, 8, str(n.get("carbs", "")), border=1)
                        pdf.cell(20, 8, str(n.get("totalFat", n.get("total_fat", ""))), border=1)
                        pdf.cell(20, 8, "Custom", border=1, ln=1)
                    else:
                        food_id = item.get("food_id", "")
                        food = foods_map.get(str(food_id))
                        if food:
                            n = food.get("nutrients", {})
                            pdf.cell(30, 8, str(date), border=1)
                            pdf.cell(40, 8, str(food.get("name", "")), border=1)
                            pdf.cell(20, 8, str(item.get("quantity", 1)), border=1)
                            pdf.cell(20, 8, str(n.get("calories", "")), border=1)
                            pdf.cell(20, 8, str(n.get("protein", "")), border=1)
                            pdf.cell(20, 8, str(n.get("total_carbohydrates", "")), border=1)
                            pdf.cell(20, 8, str(n.get("total_fat", "")), border=1)
                            pdf.cell(20, 8, "Standard", border=1, ln=1)
                        else:
                            pdf.cell(30, 8, str(date), border=1)
                            pdf.cell(40, 8, "", border=1)
                            pdf.cell(20, 8, str(item.get("quantity", 1)), border=1)
                            pdf.cell(20, 8, "", border=1)
                            pdf.cell(20, 8, "", border=1)
                            pdf.cell(20, 8, "", border=1)
                            pdf.cell(20, 8, "", border=1)
                            pdf.cell(20, 8, "", border=1)
                            pdf.cell(20, 8, "", border=1)
                            pdf.cell(20, 8, "", border=1)
                            pdf.cell(20, 8, "Standard", border=1, ln=1)
            pdf.ln(5)
        pdf_bytes = pdf.output(dest='S')
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=export.pdf"})

    return JSONResponse({"error": "Invalid format."}, status_code=400)

@app.get('/auth/google/login')
async def google_login(request: Request):
    redirect_uri = request.url_for('google_auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get('/auth/google/auth')
async def google_auth(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")
    if not user_info:
        user_info = await oauth.google.parse_id_token(request, token)
    email = user_info['email']
    db_user = get_user_by_email(users_collection, email)
    if not db_user:
        users_collection.insert_one({
            "email": email,
            "hashed_password": None,
            "profile": {"name": user_info.get("name", "")}
        })
        db_user = get_user_by_email(users_collection, email)
    # Issue JWT/cookie
    jwt_token = create_access_token({"sub": email})
    # Redirect based on password presence
    if not db_user.get("hashed_password"):
        response = RedirectResponse(url="http://localhost:5173/set-password")
    else:
        response = RedirectResponse(url="http://localhost:5173/dashboard")
    set_auth_cookie(response, jwt_token)
    return response

@app.post("/api/account/set-password")
def set_password(request: Request, new_password: str = Body(...)):
    user = get_current_user(request, users_collection)
    if user.get("hashed_password"):
        raise HTTPException(status_code=400, detail="Password already set.")
    hashed_pw = hash_password(new_password)
    users_collection.update_one(
        {"email": user["email"]},
        {"$set": {"hashed_password": hashed_pw}}
    )
    return {"message": "Password set successfully"}

# Serve static files (if not already present)
app.mount("/static", StaticFiles(directory="static"), name="static")