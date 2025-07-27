"""
Weight tracking and analysis tools for the AI agent.

These tools work with the weight_log MongoDB collection to provide
weight progress analysis and goal tracking.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from langchain_core.tools import tool

# Global data service - will be set by the agent
data_service = None

def set_data_service(service):
    global data_service
    data_service = service


@tool
async def get_weight_progress(
    user_id: str,
    days: int = 30,
    include_trends: bool = True
) -> Dict[str, Any]:
    """
    Get user's weight progress over specified period.
    
    Args:
        user_id: User identifier
        days: Number of days to analyze
        include_trends: Whether to include trend analysis
        
    Returns:
        Weight progress data with trends and goal analysis
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get weight logs
    weight_logs = await data_service.get_weight_logs(
        user_id=user_id,
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d")
    )
    
    # Get user profile for goal weight
    user_profile = await data_service.get_user_profile(user_id)
    goal_weight = None
    if user_profile and user_profile.get("profile"):
        goal_weight = user_profile["profile"].get("goal_weight")
    
    # Calculate basic metrics
    current_weight = None
    starting_weight = None
    weight_change = 0
    progress_toward_goal = 0
    
    if weight_logs:
        # Sort by date
        sorted_logs = sorted(weight_logs, key=lambda x: x.get("date", ""))
        starting_weight = sorted_logs[0].get("weight")
        current_weight = sorted_logs[-1].get("weight")
        
        if starting_weight and current_weight:
            weight_change = current_weight - starting_weight
            
            if goal_weight and starting_weight:
                total_goal_change = goal_weight - starting_weight
                if total_goal_change != 0:
                    progress_toward_goal = (weight_change / total_goal_change) * 100
    
    # Calculate trends if requested
    trends = None
    recommendations = []
    
    if include_trends and len(weight_logs) >= 3:
        # Calculate weekly rate
        weeks = days / 7
        weekly_rate = weight_change / weeks if weeks > 0 else 0
        
        # Determine direction
        if abs(weekly_rate) < 0.2:  # Less than 0.2 lbs/week
            direction = "stable"
        elif weekly_rate > 0:
            direction = "gaining"
        else:
            direction = "losing"
        
        # Calculate consistency (variance in weekly changes)
        if len(weight_logs) >= 4:
            weekly_changes = []
            for i in range(len(weight_logs) - 1):
                change = weight_logs[i+1].get("weight", 0) - weight_logs[i].get("weight", 0)
                weekly_changes.append(change)
            
            variance = sum((x - (sum(weekly_changes) / len(weekly_changes)))**2 for x in weekly_changes) / len(weekly_changes)
            
            if variance < 1:
                consistency = "good"
            elif variance < 4:
                consistency = "moderate"
            else:
                consistency = "inconsistent"
        else:
            consistency = "insufficient_data"
        
        trends = {
            "direction": direction,
            "rate": round(weekly_rate, 2),
            "consistency": consistency
        }
        
        # Generate recommendations
        if goal_weight:
            if direction == "stable" and abs(current_weight - goal_weight) > 2:
                recommendations.append("Consider adjusting your nutrition or activity to progress toward your goal")
            elif direction == "gaining" and goal_weight < current_weight:
                recommendations.append("You're gaining weight but your goal is to lose. Review your calorie intake")
            elif direction == "losing" and goal_weight > current_weight:
                recommendations.append("You're losing weight but your goal is to gain. Consider increasing calories")
        
        if consistency == "inconsistent":
            recommendations.append("Try to weigh yourself more consistently for better tracking")
    
    return {
        "period": f"Last {days} days",
        "weight_logs": [{
            "date": log.get("date"),
            "weight": log.get("weight"),
            "notes": log.get("notes", "")
        } for log in weight_logs],
        "current_weight": current_weight,
        "starting_weight": starting_weight,
        "weight_change": round(weight_change, 2) if weight_change else 0,
        "goal_weight": goal_weight,
        "progress_toward_goal": round(progress_toward_goal, 1) if progress_toward_goal else 0,
        "trends": trends,
        "recommendations": recommendations
    }


@tool
async def analyze_weight_patterns(
    user_id: str,
    analysis_period: int = 90
) -> Dict[str, Any]:
    """
    Analyze weight patterns and provide insights.
    
    Args:
        user_id: User identifier
        analysis_period: Days to analyze for patterns
        
    Returns:
        Weight pattern analysis and insights
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=analysis_period)
    
    # Get weight logs
    weight_logs = await data_service.get_weight_logs(
        user_id=user_id,
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d")
    )
    
    if not weight_logs:
        return {
            "analysis_period": f"Last {analysis_period} days",
            "error": "No weight data found for analysis period"
        }
    
    # Sort by date
    sorted_logs = sorted(weight_logs, key=lambda x: x.get("date", ""))
    
    # Calculate weekly changes
    weekly_changes = []
    for i in range(len(sorted_logs) - 1):
        current_weight = sorted_logs[i+1].get("weight", 0)
        prev_weight = sorted_logs[i].get("weight", 0)
        change = current_weight - prev_weight
        weekly_changes.append(change)
    
    weekly_average_change = sum(weekly_changes) / len(weekly_changes) if weekly_changes else 0
    
    # Find largest fluctuations
    largest_fluctuations = []
    if len(weekly_changes) > 0:
        max_gain = max(weekly_changes)
        max_loss = min(weekly_changes)
        
        if max_gain > 1:  # More than 1 lb gain
            largest_fluctuations.append({"type": "gain", "amount": round(max_gain, 2)})
        if max_loss < -1:  # More than 1 lb loss
            largest_fluctuations.append({"type": "loss", "amount": round(abs(max_loss), 2)})
    
    # Analyze logging frequency
    expected_logs = analysis_period // 7  # Assuming weekly logging
    actual_logs = len(weight_logs)
    logging_frequency_ratio = actual_logs / expected_logs if expected_logs > 0 else 0
    
    if logging_frequency_ratio >= 0.8:
        logging_frequency = "excellent"
    elif logging_frequency_ratio >= 0.6:
        logging_frequency = "good"
    elif logging_frequency_ratio >= 0.4:
        logging_frequency = "moderate"
    else:
        logging_frequency = "poor"
    
    # Get user goal for alignment analysis
    user_profile = await data_service.get_user_profile(user_id)
    goal_alignment = "unknown"
    recommended_adjustments = []
    
    if user_profile and user_profile.get("profile"):
        profile_data = user_profile["profile"]
        goal_type = profile_data.get("weight_goal_type", "maintenance")
        
        if goal_type == "weight_loss" and weekly_average_change <= -0.5:
            goal_alignment = "on_track"
        elif goal_type == "weight_gain" and weekly_average_change >= 0.5:
            goal_alignment = "on_track"
        elif goal_type == "maintenance" and abs(weekly_average_change) <= 0.3:
            goal_alignment = "on_track"
        else:
            goal_alignment = "needs_adjustment"
            
            if goal_type == "weight_loss" and weekly_average_change >= 0:
                recommended_adjustments.append("Consider reducing calorie intake or increasing activity")
            elif goal_type == "weight_gain" and weekly_average_change <= 0:
                recommended_adjustments.append("Consider increasing calorie intake")
    
    # Predict goal date if possible
    estimated_goal_date = None
    confidence = "low"
    
    if user_profile and len(sorted_logs) >= 4:
        profile_data = user_profile["profile"]
        goal_weight = profile_data.get("goal_weight")
        current_weight = sorted_logs[-1].get("weight")
        
        if goal_weight and current_weight and abs(weekly_average_change) > 0.1:
            weight_to_goal = goal_weight - current_weight
            weeks_to_goal = weight_to_goal / weekly_average_change
            
            if 0 < weeks_to_goal < 104:  # Between 0 and 2 years
                estimated_goal_date = (datetime.now() + timedelta(weeks=weeks_to_goal)).strftime("%Y-%m-%d")
                confidence = "medium" if len(sorted_logs) >= 8 else "low"
    
    return {
        "analysis_period": f"Last {analysis_period} days",
        "patterns": {
            "weekly_average_change": round(weekly_average_change, 2),
            "total_logs": len(weight_logs),
            "largest_fluctuations": largest_fluctuations,
            "trend_direction": "decreasing" if weekly_average_change < -0.2 else "increasing" if weekly_average_change > 0.2 else "stable"
        },
        "insights": {
            "logging_frequency": logging_frequency,
            "goal_alignment": goal_alignment,
            "recommended_adjustments": recommended_adjustments
        },
        "predictions": {
            "estimated_goal_date": estimated_goal_date,
            "confidence": confidence
        }
    }


@tool
async def get_weight_goal_analysis(
    user_id: str
) -> Dict[str, Any]:
    """
    Analyze progress toward weight goals.
    
    Args:
        user_id: User identifier
        
    Returns:
        Goal analysis with recommendations
    """
    if not data_service:
        return {"error": "Data service not available"}
    
    # Get user profile
    user_profile = await data_service.get_user_profile(user_id)
    if not user_profile or not user_profile.get("profile"):
        return {"error": "User profile not found"}
    
    profile_data = user_profile["profile"]
    
    # Extract goal information
    target_weight = profile_data.get("goal_weight")
    goal_type = profile_data.get("weight_goal_type", "maintenance")
    target_rate = profile_data.get("weight_goal_rate", 1.0)  # lbs/week
    current_weight = profile_data.get("current_weight")
    
    # Get recent weight progress
    weight_progress = await get_weight_progress(user_id, 30, True)
    
    if "error" in weight_progress:
        return weight_progress
    
    # Calculate current progress
    weight_to_goal = 0
    time_to_goal = "unknown"
    current_rate = weight_progress.get("trends", {}).get("rate", 0) if weight_progress.get("trends") else 0
    on_track = True
    
    if target_weight and current_weight:
        weight_to_goal = target_weight - current_weight
        
        # Estimate time to goal
        if abs(current_rate) > 0.1:  # If there's meaningful progress
            weeks_to_goal = abs(weight_to_goal / current_rate)
            if weeks_to_goal < 104:  # Less than 2 years
                time_to_goal = f"{int(weeks_to_goal)} weeks"
        
        # Check if on track
        if goal_type == "weight_loss":
            on_track = current_rate <= -0.3 and weight_to_goal < 0  # Losing weight toward goal
        elif goal_type == "weight_gain":
            on_track = current_rate >= 0.3 and weight_to_goal > 0  # Gaining weight toward goal
        else:  # maintenance
            on_track = abs(current_rate) <= 0.3 and abs(weight_to_goal) <= 5
    
    # Generate recommendations
    calorie_adjustment = None
    activity_suggestions = []
    monitoring_frequency = "weekly"
    
    if not on_track:
        if goal_type == "weight_loss":
            if current_rate >= 0:  # Not losing or gaining
                calorie_adjustment = -200  # Reduce by 200 calories
                activity_suggestions = ["Add 30 minutes of cardio daily", "Increase daily steps to 10,000"]
            elif current_rate < -target_rate:  # Losing too fast
                calorie_adjustment = 100  # Increase slightly
        
        elif goal_type == "weight_gain":
            if current_rate <= 0:  # Not gaining
                calorie_adjustment = 300  # Add 300 calories
                activity_suggestions = ["Focus on strength training", "Add protein shakes"]
            elif current_rate > target_rate:  # Gaining too fast
                calorie_adjustment = -100  # Reduce slightly
        
        monitoring_frequency = "bi-weekly"  # More frequent if not on track
    
    return {
        "goal_info": {
            "target_weight": target_weight,
            "goal_type": goal_type,
            "target_rate": target_rate,
            "timeline": "ongoing"
        },
        "current_progress": {
            "current_weight": current_weight,
            "weight_to_goal": round(weight_to_goal, 1) if weight_to_goal else 0,
            "time_to_goal": time_to_goal,
            "current_rate": round(current_rate, 2),
            "on_track": on_track
        },
        "recommendations": {
            "calorie_adjustment": calorie_adjustment,
            "activity_suggestions": activity_suggestions,
            "monitoring_frequency": monitoring_frequency
        }
    }