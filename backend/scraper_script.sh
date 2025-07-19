#!/bin/bash

# Log start time and environment for debugging
LOGFILE="/Users/koensakamoto/Dev/NutritionCalculator/backend/cron_menu_scraper.log"
echo "\n--- Run at $(date) ---" >> "$LOGFILE"
env >> "$LOGFILE"

# Change to backend directory
cd /Users/koensakamoto/Dev/NutritionCalculator/backend || exit 1

# Activate virtual environment
source .venv/bin/activate

# Run the scraper
python3 menu_scraper.py >> "$LOGFILE" 2>&1



