#!/usr/bin/env python3
"""
Script to populate food data for the next 90 days.
This script reads all existing food data from MongoDB and creates duplicate entries
for the next 90 days, incrementing the date field for each day.
"""

import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
from bson import ObjectId

# Load environment variables
print("Loading environment variables...", flush=True)
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("ERROR: MONGODB_URI environment variable is required", flush=True)
    sys.exit(1)

print("Connecting to MongoDB...", flush=True)
try:
    client = MongoClient(
        MONGODB_URI,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000  # 5 second timeout
    )
    # Test the connection
    client.server_info()
    db = client["nutritionapp"]
    foods_collection = db["foods"]
    print("Connected successfully!", flush=True)
except Exception as e:
    print(f"ERROR: Failed to connect to MongoDB: {e}", flush=True)
    sys.exit(1)

# Get all unique food items (excluding the _id and date fields)
print("\nFetching existing food data...", flush=True)
existing_foods = list(foods_collection.find({}))
print(f"Found {len(existing_foods)} existing food items", flush=True)

if len(existing_foods) == 0:
    print("No food data found in the database. Exiting...", flush=True)
    sys.exit(0)

# Get the latest date in the database
print("Finding latest date...", flush=True)
latest_date_str = None
for food in existing_foods:
    if food.get("date"):
        if latest_date_str is None or food["date"] > latest_date_str:
            latest_date_str = food["date"]

if latest_date_str:
    print(f"Latest date in database: {latest_date_str}", flush=True)
    # Parse the latest date
    latest_date = datetime.strptime(latest_date_str, "%Y-%m-%d")
    start_date = latest_date + timedelta(days=1)
else:
    # If no dates found, start from tomorrow
    print("No dates found in existing data, starting from tomorrow", flush=True)
    start_date = datetime.now() + timedelta(days=1)

print(f"Will populate data starting from: {start_date.strftime('%Y-%m-%d')}", flush=True)

# Group foods by their unique characteristics (excluding _id and date)
# We'll use a combination of name, dining_hall, meal_name as the key
print("Grouping food templates...", flush=True)
food_templates = {}
for food in existing_foods:
    key = (
        food.get("name", ""),
        food.get("dining_hall", ""),
        food.get("meal_name", ""),
        food.get("station", "")
    )

    # Store this as a template (we'll remove _id and update date)
    if key not in food_templates:
        food_templates[key] = food

print(f"Found {len(food_templates)} unique food templates", flush=True)

# Create new food entries for the next 90 days
print(f"\nGenerating food data for the next 90 days...", flush=True)
new_foods = []
batch_size = 1000  # Insert in batches to avoid memory issues
total_inserted = 0

for day_offset in range(90):
    current_date = start_date + timedelta(days=day_offset)
    date_str = current_date.strftime("%Y-%m-%d")

    for template in food_templates.values():
        # Create a copy of the template
        new_food = template.copy()

        # Remove the _id field (MongoDB will generate a new one)
        if "_id" in new_food:
            del new_food["_id"]

        # Update the date
        new_food["date"] = date_str

        new_foods.append(new_food)

        # Insert in batches
        if len(new_foods) >= batch_size:
            foods_collection.insert_many(new_foods)
            total_inserted += len(new_foods)
            print(f"Inserted batch: {total_inserted} total items (current date: {date_str})", flush=True)
            new_foods = []

# Insert any remaining items
if new_foods:
    foods_collection.insert_many(new_foods)
    total_inserted += len(new_foods)
    print(f"Inserted final batch: {len(new_foods)} items", flush=True)

print(f"\n✅ Successfully populated food data for the next 90 days!", flush=True)
print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {(start_date + timedelta(days=89)).strftime('%Y-%m-%d')}", flush=True)
print(f"Total items created: {total_inserted}", flush=True)
