"""
Rate limiting for AI meal plan generation
"""
from datetime import datetime, timedelta
from typing import Dict, Tuple
from fastapi import HTTPException
from pymongo.collection import Collection
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

# Rate limit configuration (can be moved to .env if needed)
RATE_LIMITS = {
    "meal_plan_per_hour": 1,      # Max 1 meal plan per hour
    "meal_plan_per_day": 3,        # Max 3 meal plans per day
}

def check_rate_limit(user_id: str, users_collection: Collection) -> Tuple[bool, str]:
    """
    Check if user has exceeded rate limits for AI meal plan generation

    Args:
        user_id: User's MongoDB ObjectId as string
        users_collection: MongoDB users collection

    Returns:
        (is_allowed, error_message) - True if allowed, False with error message if exceeded

    Raises:
        HTTPException: If rate limit is exceeded
    """
    try:
        user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")

        # Get or initialize usage tracking
        usage = user_doc.get("ai_meal_plan_usage", {
            "requests": [],
            "last_reset": datetime.utcnow()
        })

        # Clean up old requests (keep only last 24 hours)
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        one_day_ago = now - timedelta(days=1)

        # Filter to keep only recent requests
        recent_requests = [
            req for req in usage.get("requests", [])
            if isinstance(req, datetime) and req > one_day_ago
        ]

        # Count requests in the last hour and day
        requests_last_hour = sum(1 for req in recent_requests if req > one_hour_ago)
        requests_last_day = len(recent_requests)

        # Check limits
        if requests_last_hour >= RATE_LIMITS["meal_plan_per_hour"]:
            logger.warning(f"User {user_id} exceeded hourly rate limit: {requests_last_hour}/{RATE_LIMITS['meal_plan_per_hour']}")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. You can generate {RATE_LIMITS['meal_plan_per_hour']} meal plan per hour. Please try again later."
            )

        if requests_last_day >= RATE_LIMITS["meal_plan_per_day"]:
            logger.warning(f"User {user_id} exceeded daily rate limit: {requests_last_day}/{RATE_LIMITS['meal_plan_per_day']}")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. You can generate {RATE_LIMITS['meal_plan_per_day']} meal plans per day. Please try again tomorrow."
            )

        return True, ""

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking rate limit for user {user_id}: {e}")
        # In case of error, allow the request (fail open)
        return True, ""

def record_meal_plan_request(user_id: str, users_collection: Collection) -> None:
    """
    Record a successful meal plan generation request for rate limiting

    Args:
        user_id: User's MongoDB ObjectId as string
        users_collection: MongoDB users collection
    """
    try:
        now = datetime.utcnow()

        # Add current timestamp to requests array
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$push": {
                    "ai_meal_plan_usage.requests": now
                },
                "$set": {
                    "ai_meal_plan_usage.last_request": now
                }
            },
            upsert=True
        )

        logger.info(f"Recorded meal plan request for user {user_id}")

    except Exception as e:
        logger.error(f"Error recording meal plan request for user {user_id}: {e}")
        # Don't fail the request if we can't record it

def get_rate_limit_status(user_id: str, users_collection: Collection) -> Dict:
    """
    Get current rate limit status for a user

    Args:
        user_id: User's MongoDB ObjectId as string
        users_collection: MongoDB users collection

    Returns:
        Dict with rate limit information
    """
    try:
        user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return {
                "requests_last_hour": 0,
                "requests_last_day": 0,
                "hourly_limit": RATE_LIMITS["meal_plan_per_hour"],
                "daily_limit": RATE_LIMITS["meal_plan_per_day"]
            }

        usage = user_doc.get("ai_meal_plan_usage", {})
        recent_requests = usage.get("requests", [])

        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        one_day_ago = now - timedelta(days=1)

        requests_last_hour = sum(
            1 for req in recent_requests
            if isinstance(req, datetime) and req > one_hour_ago
        )
        requests_last_day = sum(
            1 for req in recent_requests
            if isinstance(req, datetime) and req > one_day_ago
        )

        return {
            "requests_last_hour": requests_last_hour,
            "requests_last_day": requests_last_day,
            "hourly_limit": RATE_LIMITS["meal_plan_per_hour"],
            "daily_limit": RATE_LIMITS["meal_plan_per_day"],
            "remaining_hour": max(0, RATE_LIMITS["meal_plan_per_hour"] - requests_last_hour),
            "remaining_day": max(0, RATE_LIMITS["meal_plan_per_day"] - requests_last_day)
        }

    except Exception as e:
        logger.error(f"Error getting rate limit status for user {user_id}: {e}")
        return {
            "requests_last_hour": 0,
            "requests_last_day": 0,
            "hourly_limit": RATE_LIMITS["meal_plan_per_hour"],
            "daily_limit": RATE_LIMITS["meal_plan_per_day"],
            "remaining_hour": RATE_LIMITS["meal_plan_per_hour"],
            "remaining_day": RATE_LIMITS["meal_plan_per_day"]
        }
