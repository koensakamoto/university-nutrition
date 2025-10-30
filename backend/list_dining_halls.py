#!/usr/bin/env python3
"""
Script to list all dining halls in the database
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

# Get all unique dining halls
dining_halls = foods_collection.distinct("dining_hall")
print(f"Found {len(dining_halls)} dining halls in the database:\n")

for i, hall in enumerate(sorted(dining_halls), 1):
    count = foods_collection.count_documents({"dining_hall": hall})
    print(f"{i}. {hall} ({count} items)")

client.close()
