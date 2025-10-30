#!/usr/bin/env python3
"""
Script to remove all City Edge dining hall entries from MongoDB
"""
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import certifi

load_dotenv()

# Connect to MongoDB
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
db = client["nutrition_app"]
foods_collection = db["foods"]

# Find how many City Edge items exist
count = foods_collection.count_documents({"dining_hall": "City Edge @ Kahlert Village"})
print(f"Found {count} items from City Edge @ Kahlert Village")

if count > 0:
    # Show a sample
    sample = foods_collection.find_one({"dining_hall": "City Edge @ Kahlert Village"})
    print(f"\nSample item: {sample.get('name', 'Unknown')} - {sample.get('meal_name', 'Unknown meal')}")

    # Delete all City Edge items
    result = foods_collection.delete_many({"dining_hall": "City Edge @ Kahlert Village"})
    print(f"\n✅ Deleted {result.deleted_count} items from City Edge @ Kahlert Village")
else:
    print("\n✅ No City Edge items found in database")

client.close()
