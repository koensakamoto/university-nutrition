#!/bin/bash

# Set environment variables
export SSL_CERT_FILE="/Users/koensakamoto/Dev/NutritionCalculator/backend/.venv/lib/python3.11/site-packages/certifi/cacert.pem"

LOG_PATH="/Users/koensakamoto/Dev/NutritionCalculator/backend/cron_menu_scraper.log"
PYTHON_PATH="/Users/koensakamoto/Dev/NutritionCalculator/backend/.venv/bin/python"
SCRIPT_PATH="/Users/koensakamoto/Dev/NutritionCalculator/backend/menu_scraper.py"

echo "---- Script started at $(date) ----" >> "$LOG_PATH"
env >> "$LOG_PATH"

# Run the menu scraper using the venv Python
"$PYTHON_PATH" "$SCRIPT_PATH" >> "$LOG_PATH" 2>&1

