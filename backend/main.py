from fastapi import FastAPI, Query, HTTPException, status, Response, Request, Depends, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional, List
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import certifi
import logging
import sys
from collections import defaultdict
import asyncio
from datetime import datetime, timedelta
import shutil
import uuid
import time
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
import io
import csv
import json
from authlib.integrations.starlette_client import OAuth
from pydantic import BaseModel
import cloudinary
import cloudinary.uploader

from models.food import Food

from models.user import UserCreate, UserProfile, ChangePasswordRequest, UserLogin
from models.plate import Plate, PlateItem

from auth_util import (
    hash_password, verify_password, set_auth_cookie, clear_auth_cookie,
    get_user_by_email, get_current_user
)
from jwt_util import create_access_token, decode_access_token

from starlette.middleware.sessions import SessionMiddleware



# Load environment variables first
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Configure logging based on environment
def setup_logging():
    """Configure logging for production and development"""
    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    
    if is_production:
        # Production: JSON structured logging, INFO level
        logging.basicConfig(
            level=logging.INFO,
            format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "message": "%(message)s"}',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler('app.log', mode='a')
            ]
        )
    else:
        # Development: Human readable, DEBUG level
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[logging.StreamHandler(sys.stdout)]
        )
    
    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("pymongo.topology").setLevel(logging.WARNING)
    logging.getLogger("pymongo.connection").setLevel(logging.WARNING)
    
    return logging.getLogger(__name__)

# Initialize logging
logger = setup_logging()
logger.info("FastAPI app initialization starting...")

app = FastAPI()

# Get environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# CORS middleware setup
# Restrict headers to only what the app actually needs
ALLOWED_HEADERS = [
    "Content-Type",
    "Authorization", 
    "Accept",
    "Origin",
    "X-Requested-With",
    "Cache-Control",
    "Pragma"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "https://crimsonbites-backend.railway.app"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=ALLOWED_HEADERS,
    expose_headers=["Content-Length", "Content-Type"],  # Headers frontend can access
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Determine if running in production
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "dev-secret-key"),
    max_age=1800,  # 30 minutes
    same_site="lax",
    https_only=IS_PRODUCTION  # Enable HTTPS-only in production
)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers for production
        if IS_PRODUCTION:
            # Strict Transport Security - Force HTTPS
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        # Content Security Policy - Prevent XSS attacks
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self'; "
            "media-src 'self'; "
            "object-src 'none'; "
            "frame-ancestors 'none';"
        )
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # XSS Protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer Policy - Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy - Control browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "speaker=(), "
            "vibrate=(), "
            "fullscreen=(self)"
        )
        
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Rate Limiting Middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
        
    def get_client_ip(self, request: Request) -> str:
        """Get client IP from request headers or connection"""
        # Check for forwarded headers first (behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
            
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting in development
        if not IS_PRODUCTION:
            return await call_next(request)
            
        client_ip = self.get_client_ip(request)
        current_time = datetime.now()
        
        # Clean old requests (older than 1 minute)
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < timedelta(minutes=1)
        ]
        
        # Check if rate limit exceeded
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return Response(
                content='{"detail": "Rate limit exceeded. Please try again later."}',
                status_code=429,
                headers={"Content-Type": "application/json", "Retry-After": "60"}
            )
        
        # Add current request
        self.requests[client_ip].append(current_time)
        
        return await call_next(request)

# Apply rate limiting - more restrictive for auth endpoints
app.add_middleware(RateLimitMiddleware, requests_per_minute=100)

# Auth-specific Rate Limiting Middleware
class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_period: int = 5, period_minutes: int = 5):
        super().__init__(app)
        self.requests_per_period = requests_per_period
        self.period_minutes = period_minutes
        self.requests = defaultdict(list)
        
    def get_client_ip(self, request: Request) -> str:
        """Get client IP from request headers or connection"""
        # Check for forwarded headers first (behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
            
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    async def dispatch(self, request: Request, call_next):
        # Only apply to sensitive auth endpoints
        auth_endpoints = [
            "/auth/login",
            "/auth/register", 
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/account/change-password"
        ]
        
        if not any(request.url.path == endpoint for endpoint in auth_endpoints):
            return await call_next(request)
        
        # Skip rate limiting in development
        if not IS_PRODUCTION:
            return await call_next(request)
            
        client_ip = self.get_client_ip(request)
        current_time = datetime.now()
        
        # Clean old requests (older than period)
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < timedelta(minutes=self.period_minutes)
        ]
        
        # Check if rate limit exceeded
        if len(self.requests[client_ip]) >= self.requests_per_period:
            logger.warning(f"Auth rate limit exceeded for IP: {client_ip} on endpoint: {request.url.path}")
            return Response(
                content='{"detail": "Too many authentication attempts. Please try again later."}',
                status_code=429,
                headers={
                    "Content-Type": "application/json", 
                    "Retry-After": str(self.period_minutes * 60)
                }
            )
        
        # Add current request
        self.requests[client_ip].append(current_time)
        
        return await call_next(request)

# Apply auth-specific rate limiting (5 attempts per 5 minutes)
app.add_middleware(AuthRateLimitMiddleware, requests_per_period=5, period_minutes=5)

# MongoDB connection with production optimizations
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    logger.error("MONGODB_URI environment variable not set!")
    raise RuntimeError("MONGODB_URI environment variable is required")
else:
    logger.info(f"MongoDB URI loaded: {MONGODB_URI[:50]}...")

# Production-optimized MongoDB client
client = MongoClient(
    MONGODB_URI,
    tlsCAFile=certifi.where(),
    # Connection pooling settings
    maxPoolSize=20,  # Maximum connections in pool
    minPoolSize=5,   # Minimum connections to maintain
    maxIdleTimeMS=30000,  # Close connections after 30s idle
    # Timeout settings
    connectTimeoutMS=5000,    # 5s connection timeout
    serverSelectionTimeoutMS=5000,  # 5s server selection timeout
    socketTimeoutMS=10000,    # 10s socket timeout
    # Retry settings
    retryWrites=True,
    retryReads=True,
    # Monitoring
    heartbeatFrequencyMS=10000,  # Check server health every 10s
)

db = client["nutritionapp"]
foods_collection = db["foods"]
users_collection = db["users"]

# Database index optimization
def ensure_database_indexes():
    """Create database indexes for optimal query performance"""
    try:
        logger.info("Creating database indexes for performance optimization...")
        
        # Users collection indexes
        users_collection.create_index("email", unique=True, background=True)
        users_collection.create_index("reset_token", background=True, sparse=True)
        
        # Foods collection indexes - critical for menu browsing performance
        foods_collection.create_index([
            ("date", 1),
            ("dining_hall", 1),
            ("meal_name", 1)
        ], background=True, name="date_hall_meal_idx")
        
        foods_collection.create_index([
            ("name", "text"),
            ("description", "text")
        ], background=True, name="food_search_idx")
        
        foods_collection.create_index("labels", background=True)
        foods_collection.create_index("dining_hall", background=True)
        foods_collection.create_index("meal_name", background=True)
        foods_collection.create_index("date", background=True)
        
        # Plates collection indexes - critical for nutrition tracking
        db["plates"].create_index([
            ("user_id", 1),
            ("date", 1)
        ], unique=True, background=True, name="user_date_idx")
        
        db["plates"].create_index("user_id", background=True)
        db["plates"].create_index("date", background=True)
        
        # Weight log indexes
        db["weight_log"].create_index([
            ("user_id", 1),
            ("date", 1)
        ], unique=True, background=True, name="weight_user_date_idx")
        
        db["weight_log"].create_index("user_id", background=True)
        db["weight_log"].create_index([
            ("user_id", 1),
            ("date", -1)  # Descending for latest entries first
        ], background=True, name="weight_latest_idx")
        
        # Additional optimizations for past meal lookups
        # Index for recent meal history
        db["plates"].create_index([
            ("user_id", 1),
            ("date", -1)  # Recent meals first
        ], background=True, name="recent_meals_idx")
        
        # Index for date range queries (nutrition history)
        db["plates"].create_index([
            ("user_id", 1),
            ("date", 1),
            ("items", 1)  # Include items for covered queries
        ], background=True, name="meal_history_idx")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create database indexes: {e}")
        # Don't fail startup if indexes can't be created
        pass

# Initialize indexes on startup
ensure_database_indexes()

# Initialize AI Agent
try:
    from ai_agent.agent import NutritionAgent
    from ai_agent.api import router as ai_router, set_agent
    
    # Get OpenAI API key
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if OPENAI_API_KEY:
        logger.info("Initializing AI nutrition agent...")
        nutrition_agent = NutritionAgent(client, OPENAI_API_KEY)
        set_agent(nutrition_agent)
        
        # Add AI agent routes
        app.include_router(ai_router)
        logger.info("AI agent initialized successfully")
    else:
        logger.warning("OPENAI_API_KEY not found - AI agent features disabled")
        
except ImportError as e:
    logger.warning(f"AI agent dependencies not available: {e}")
except Exception as e:
    logger.error(f"Failed to initialize AI agent: {e}")

# In-memory cache for frequently accessed food items
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)  # Cache up to 1000 food items
def get_cached_food_nutrients(food_id: str):
    """Cache food nutrients to avoid repeated database lookups"""
    try:
        food = foods_collection.find_one(
            {"_id": ObjectId(food_id)}, 
            {"nutrients": 1, "name": 1, "_id": 0}
        )
        return food if food else None
    except Exception:
        # Handle string IDs
        food = foods_collection.find_one(
            {"_id": food_id}, 
            {"nutrients": 1, "name": 1, "_id": 0}
        )
        return food if food else None

def bulk_get_foods_optimized(food_ids: set):
    """Optimized bulk food retrieval with caching"""
    foods_map = {}
    uncached_ids = []
    
    # First, try to get from cache
    for food_id in food_ids:
        cached_food = get_cached_food_nutrients(food_id)
        if cached_food:
            foods_map[food_id] = cached_food
        else:
            uncached_ids.append(food_id)
    
    # Bulk fetch uncached foods
    if uncached_ids:
        object_ids = []
        str_ids = []
        for fid in uncached_ids:
            try:
                object_ids.append(ObjectId(fid))
            except Exception:
                str_ids.append(fid)
        
        # Optimized projection - only fetch needed fields
        projection = {"nutrients": 1, "name": 1}
        
        if object_ids:
            for food in foods_collection.find({"_id": {"$in": object_ids}}, projection):
                food_id = str(food["_id"])
                foods_map[food_id] = food
                # Cache the result
                get_cached_food_nutrients(food_id)
        
        if str_ids:
            for food in foods_collection.find({"_id": {"$in": str_ids}}, projection):
                food_id = food["_id"]
                foods_map[food_id] = food
                # Cache the result
                get_cached_food_nutrients(food_id)
    
    return foods_map

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

# Helper to check if food has complete macros (protein, carbs, fat)
def has_complete_macros(food):
    nutrients = food.get("nutrients")
    if not nutrients:
        return False
    
    # Check for required macros - allow multiple key variations
    protein_keys = ["protein"]
    carb_keys = ["total_carbohydrates", "carbs"]
    fat_keys = ["total_fat", "totalFat", "fat"]
    
    def has_valid_value(keys):
        for key in keys:
            value = nutrients.get(key)
            if value is not None and value != '' and value != '-':
                try:
                    # Allow 0 as valid value (some foods legitimately have 0g of a macro)
                    float_val = float(value)
                    if float_val >= 0:
                        return True
                except (ValueError, TypeError):
                    continue
        return False
    
    # All three macros must have valid values
    return has_valid_value(protein_keys) and has_valid_value(carb_keys) and has_valid_value(fat_keys)

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
        # Add trackable field based on macro completeness
        food["trackable"] = has_complete_macros(food)
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

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

@app.get("/test")
def test_endpoint():
    logger.info("Test endpoint called!")
    return {"message": "Test endpoint working", "routes_loaded": True}

# Log that routes have been registered
logger.info("All routes registered successfully")





@app.post("/auth/register")
def register(user: UserCreate, response: Response):
    if get_user_by_email(users_collection, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = hash_password(user.password)
    users_collection.insert_one({
        "email": user.email,
        "hashed_password": hashed_pw,
        "profile": {"name": user.first_name + " " + user.last_name}  # or default profile fields
    })
    token = create_access_token({"sub": user.email})
    set_auth_cookie(response, token)
    return {"message": "Registered"}

@app.post("/auth/login")
def login(user: UserLogin, response: Response):
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

@app.post("/auth/exchange-token")
async def exchange_token(request: Request, response: Response):
    """Exchange URL token for secure httpOnly cookie"""
    try:
        body = await request.json()
        token = body.get('token')
        
        if not token:
            raise HTTPException(status_code=400, detail="Token required")
        
        # Verify the token is valid
        try:
            payload = decode_access_token(token)
            email = payload.get("sub")
            if not email:
                raise HTTPException(status_code=401, detail="Invalid token")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Set the secure httpOnly cookie
        set_auth_cookie(response, token)
        
        return {"message": "Token exchanged successfully"}
        
    except Exception as e:
        logger.error(f"Token exchange failed: {e}")
        raise HTTPException(status_code=400, detail="Token exchange failed")

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
    
    # File size validation (5MB limit)
    max_size = 5 * 1024 * 1024  # 5MB in bytes
    if image.size and image.size > max_size:
        raise HTTPException(status_code=400, detail="File size too large. Maximum size is 5MB.")
    
    # File type validation
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
    if image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.")
    
    # File extension validation
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    ext = os.path.splitext(image.filename)[-1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file extension.")
    
    # Read file content and validate it's actually an image
    content = await image.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")
    
    # Additional size check on actual content
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File size too large. Maximum size is 5MB.")
    
    # Basic file header validation (magic bytes)
    image_signatures = {
        b'\xff\xd8\xff': 'jpg',  # JPEG
        b'\x89\x50\x4e\x47': 'png',  # PNG
        b'\x47\x49\x46\x38': 'gif',  # GIF
        b'\x52\x49\x46\x46': 'webp'  # WEBP (starts with RIFF)
    }
    
    file_is_valid = False
    for signature in image_signatures:
        if content.startswith(signature):
            file_is_valid = True
            break
    
    if not file_is_valid:
        raise HTTPException(status_code=400, detail="Invalid image file. File content doesn't match expected image format.")
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            content,
            folder="profile_images",
            public_id=f"user_{user['_id']}",
            overwrite=True,
            transformation=[
                {"width": 200, "height": 200, "crop": "fill", "gravity": "face"},
                {"quality": "auto", "fetch_format": "auto"}
            ]
        )
        
        # Save the Cloudinary URL to user's profile
        image_url = result['secure_url']
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"profile.image": image_url}}
        )
        
        # Return the Cloudinary URL
        return {"url": image_url}
        
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image. Please try again.")

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
    if weight_goal_type == "lose" or weight_goal_type == "losing":
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
    elif weight_goal_type == "gain" or weight_goal_type == "gaining":
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
    elif weight_goal_type == "maintain" or weight_goal_type == "maintaining":
        # For maintenance, don't adjust TDEE - return the calculated TDEE as-is
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
    user_id = str(user["_id"])
    
    # Delete profile image if it exists
    if user.get("profile", {}).get("image"):
        image_url = user["profile"]["image"]
        try:
            if image_url.startswith("/static/profile_images/"):
                # Legacy local file deletion
                image_path = image_url[1:]  # Remove leading slash
                full_path = os.path.join(os.getcwd(), image_path)
                if os.path.exists(full_path):
                    os.remove(full_path)
            else:
                # Cloudinary image deletion
                public_id = f"profile_images/user_{user['_id']}"
                cloudinary.uploader.destroy(public_id)
        except Exception as e:
            logger.warning(f"Failed to delete profile image: {e}")
            pass
    
    # Delete all user-related data from database
    users_collection.delete_one({"email": user["email"]})
    db["plates"].delete_many({"user_id": user_id})
    db["weight_log"].delete_many({"user_id": user_id})
    
    return {"message": "Account and all associated data deleted"}

@app.get("/api/plate")
def get_plate(request: Request, date: str):
    user = get_current_user(request, users_collection)
    # Optimized single plate lookup with projection
    plate = db["plates"].find_one(
        {"user_id": str(user["_id"]), "date": date},
        {"items": 1, "date": 1, "_id": 0}  # Only return needed fields
    )
    if not plate:
        return {"items": []}
    return plate

@app.post("/api/plate")
def save_plate(request: Request, plate: Plate = Body(...)):
    user = get_current_user(request, users_collection)
    items = []
    for item in plate.items:
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
    # Optimized query with projection to only fetch needed fields
    plates = list(db["plates"].find(
        {
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        },
        {
            "date": 1,
            "items": 1,
            "_id": 0  # Don't return _id to save bandwidth
        }
    ).hint("meal_history_idx"))  # Use our optimized index
    # Collect all unique food_ids (excluding custom foods)
    food_ids = set()
    for plate in plates:
        for item in plate.get("items", []):
            food_id = item.get("food_id")
            if food_id and not str(food_id).startswith("custom-"):
                food_ids.add(food_id)
    # Use optimized bulk food retrieval with caching
    foods_map = bulk_get_foods_optimized(food_ids)
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
                continue
            n = food.get("nutrients", {})
            if n is None:
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
    # Calculate averages
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    num_days = (end - start).days + 1
    avg_calories = total_calories / len(days_tracked) if days_tracked else 0
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
    # Optimized query with projection and index hint
    plates = list(db["plates"].find(
        {
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        },
        {
            "date": 1,
            "items": 1,
            "_id": 0
        }
    ).hint("meal_history_idx").sort("date", 1))  # Sort by date ascending
    result = []
    for plate in plates:
        date = plate["date"]
        for item in plate.get("items", []):
            quantity = item.get("quantity", 1)
            if "custom_macros" in item:
                n = item["custom_macros"]
                if n is None:
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
                continue
            n = food.get("nutrients", {})
            if n is None:
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
            return JSONResponse({"error": "PDF export is temporarily unavailable. Please try CSV or JSON format instead."}, status_code=400)
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
                            food_name = str(food.get("name", ""))
                            # Handle special characters by replacing problematic ones
                            safe_food_name = food_name.encode('latin-1', 'replace').decode('latin-1')
                            pdf.cell(40, 8, safe_food_name, border=1)
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
                            pdf.cell(20, 8, "Standard", border=1, ln=1)
            pdf.ln(5)
        pdf_bytes = pdf.output(dest='S')
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=export.pdf"})

    return JSONResponse({"error": "Invalid format."}, status_code=400)

@app.get('/auth/google/login')
async def google_login(request: Request):
    # Use the exact same URI format as configured in Google Console
    redirect_uri = f"{BACKEND_URL}/auth/google/auth"
    
    response = await oauth.google.authorize_redirect(request, redirect_uri)
    return response

@app.get('/auth/google/auth')
async def google_auth(request: Request):
    try:
        
        # Try a different approach - manually handle the OAuth state
        state = request.query_params.get('state')
        code = request.query_params.get('code')
        
        if not state or not code:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=missing_params")
        
        # Manual token exchange to bypass session state issues
        import httpx
        token_data = {
            'client_id': os.getenv("GOOGLE_CLIENT_ID"),
            'client_secret': os.getenv("GOOGLE_CLIENT_SECRET"),
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': f"{BACKEND_URL}/auth/google/auth"
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                'https://oauth2.googleapis.com/token',
                data=token_data
            )
            if token_response.status_code != 200:
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange_failed")
            
            token = token_response.json()
            
        # Get user info manually
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f"Bearer {token['access_token']}"}
            )
            if user_response.status_code != 200:
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=userinfo_failed")
            
            user_info = user_response.json()
    except Exception as e:
        logger.error(f"OAuth authentication failed: {type(e).__name__}")
        # Redirect to frontend with error
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=oauth_failed")
    
    # Continue with user processing
    try:
        email = user_info['email']
        
        db_user = get_user_by_email(users_collection, email)
        
        if not db_user:
            users_collection.insert_one({
                "email": email,
                "hashed_password": None,
                "profile": {"name": user_info.get("name", "")}
            })
            db_user = get_user_by_email(users_collection, email)
            logger.info(f"New OAuth user created successfully")
        
        # Issue JWT/cookie
        jwt_token = create_access_token({"sub": email})
        
        # Pass token via URL for cross-domain auth
        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
        response = RedirectResponse(url=redirect_url)
        
        # Still set cookie for same-domain requests
        set_auth_cookie(response, jwt_token)
        return response
        
    except Exception as user_error:
        logger.error(f"User processing after OAuth failed: {type(user_error).__name__}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=user_processing_failed")

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

@app.post("/api/auth/forgot-password")
async def forgot_password(request: dict = Body(...)):
    """Send password reset email to user"""
    try:
        email = request.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
            
        # Check if user exists
        user = get_user_by_email(users_collection, email)
        if not user:
            # For security, always return success even if user doesn't exist
            return {"message": "If the email exists in our system, a reset link has been sent."}
        
        # Generate reset token (expires in 1 hour)
        reset_token = create_access_token({"sub": email, "type": "reset"}, expires_delta=timedelta(hours=1))
        
        # Store reset token in database (optional - for token invalidation)
        users_collection.update_one(
            {"email": email},
            {"$set": {"reset_token": reset_token, "reset_token_expires": time.time() + 3600}}
        )
        
        # Send password reset email
        from email_util import send_password_reset_email
        print(f"DEBUG: SMTP_USER = {os.getenv('SMTP_USER')}")
        print(f"DEBUG: SMTP_PASSWORD = {'SET' if os.getenv('SMTP_PASSWORD') else 'NOT SET'}")
        email_sent = await send_password_reset_email(email, reset_token)
        print(f"DEBUG: Email sent result = {email_sent}")
        
        # Also log for development (remove in production)
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        
        return {"message": "If the email exists in our system, a reset link has been sent."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process password reset request")

@app.post("/api/auth/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...)):
    """Reset password using reset token"""
    try:
        # Decode and validate reset token
        payload = decode_access_token(token)
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        email = payload["sub"]
        user = get_user_by_email(users_collection, email)
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        # Check if token is still valid in database (optional security check)
        if user.get("reset_token") != token or user.get("reset_token_expires", 0) < time.time():
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Hash new password and update user
        hashed_password = hash_password(new_password)
        users_collection.update_one(
            {"email": email},
            {
                "$set": {"hashed_password": hashed_password},
                "$unset": {"reset_token": "", "reset_token_expires": ""}
            }
        )
        
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to reset password")

# Production-optimized static file serving
class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add caching headers for static assets
        if request.url.path.startswith("/static/"):
            # Cache static assets for 1 year (they have content hashes)
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            response.headers["Expires"] = (datetime.now() + timedelta(days=365)).strftime("%a, %d %b %Y %H:%M:%S GMT")
        
        return response

app.add_middleware(CacheControlMiddleware)

# Static files removed - using Cloudinary for profile images


@app.get("/api/available-options")
def get_available_options(date: str):
    dining_halls = foods_collection.distinct("dining_hall", {"date": date})
    meal_types_by_hall = {}
    for hall in dining_halls:
        meal_types = foods_collection.distinct("meal_name", {"date": date, "dining_hall": hall})
        meal_types_by_hall[hall] = sorted(meal_types)
    return {
        "dining_halls": sorted(dining_halls),
        "meal_types_by_hall": meal_types_by_hall
    }