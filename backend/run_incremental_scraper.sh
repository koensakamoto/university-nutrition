#!/bin/bash

# Incremental Menu Scraper - Cron-friendly wrapper script
# Run this script 1-2 times later in the day to catch any missing meals

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "Warning: No virtual environment found"
fi

# Set up logging
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/incremental_scraper_cron_$TIMESTAMP.log"

echo "===============================================" | tee -a "$LOG_FILE"
echo "Incremental Menu Scraper Started: $(date)" | tee -a "$LOG_FILE"
echo "Working Directory: $SCRIPT_DIR" | tee -a "$LOG_FILE"
echo "Log File: $LOG_FILE" | tee -a "$LOG_FILE"
echo "===============================================" | tee -a "$LOG_FILE"

# Run the incremental scraper
python3 incremental_scraper.py 2>&1 | tee -a "$LOG_FILE"

# Capture exit code
EXIT_CODE=${PIPESTATUS[0]}

echo "===============================================" | tee -a "$LOG_FILE"
echo "Incremental Menu Scraper Finished: $(date)" | tee -a "$LOG_FILE"
echo "Exit Code: $EXIT_CODE" | tee -a "$LOG_FILE"
echo "===============================================" | tee -a "$LOG_FILE"

# Clean up old log files (keep last 10)
find "$LOG_DIR" -name "incremental_scraper_cron_*.log" -type f -exec ls -t {} + | tail -n +11 | xargs -r rm

exit $EXIT_CODE