"""
AI integration for intelligent meal plan generation using OpenAI GPT
"""
import json
from openai import OpenAI
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class MealPlannerAI:
    def __init__(self, api_key: str):
        """Initialize AI meal planner with OpenAI API key"""
        self.client = OpenAI(api_key=api_key)

    def organize_foods_for_ai(
        self,
        foods_by_meal: Dict[str, List[Dict]],
        max_foods_per_meal: int = 40  # Reduced to minimize ID confusion
    ) -> Tuple[Dict[str, List[Dict]], Dict[str, Dict[int, str]]]:
        """
        Format food data for AI consumption with ultra-compact structure to save tokens

        Returns:
            (ai_foods_by_meal, id_mappings) where id_mappings maps simple indices to MongoDB IDs
        """
        ai_foods_by_meal = {}
        id_mappings = {}  # meal_type -> {index -> mongodb_id}

        for meal_type, foods in foods_by_meal.items():
            # Convert to ultra-compact format for AI (saves ~70% tokens)
            ai_foods = []
            meal_id_map = {}

            for idx, food in enumerate(foods[:max_foods_per_meal]):  # Limit foods to fit in context
                nutrients = food.get("nutrients", {})

                # Extract nutrition data with fallbacks
                calories = self._safe_float(nutrients.get("calories", 0))
                protein = self._safe_float(nutrients.get("protein", 0))
                carbs = self._safe_float(nutrients.get("total_carbohydrates", 0))
                fat = self._safe_float(nutrients.get("total_fat", 0))

                # Skip foods with no nutritional data
                if calories == 0 and protein == 0 and carbs == 0 and fat == 0:
                    continue

                # Store mapping from simple index to MongoDB ID
                meal_id_map[idx] = str(food["_id"])

                # Ultra-compact format: [index, name, cal, prot, carb, fat]
                # Use simple index instead of long MongoDB ID to reduce confusion
                ai_food = [
                    idx,  # Simple integer index instead of long ObjectId
                    food.get("name", "Unknown"),
                    int(calories) if calories == int(calories) else calories,
                    int(protein) if protein == int(protein) else protein,
                    int(carbs) if carbs == int(carbs) else carbs,
                    int(fat) if fat == int(fat) else fat
                ]

                ai_foods.append(ai_food)

            ai_foods_by_meal[meal_type] = ai_foods
            id_mappings[meal_type] = meal_id_map
            logger.info(f"Prepared {len(ai_foods)} foods for {meal_type} AI processing")

        return ai_foods_by_meal, id_mappings

    def _safe_float(self, value) -> float:
        """Safely convert value to float"""
        try:
            return float(value) if value not in [None, '', '-'] else 0.0
        except (ValueError, TypeError):
            return 0.0

    def create_meal_plan_prompt(
        self,
        foods_by_meal: Dict[str, List[Dict]],
        meal_targets: Dict[str, Dict[str, float]],
        dietary_labels: List[str],
        dining_hall_meals: List[Dict]
    ) -> str:
        """
        Create structured prompt for AI meal planning
        """

        # Build dietary context
        dietary_context = ""
        if dietary_labels:
            if "vegan" in dietary_labels:
                dietary_context = "IMPORTANT: User follows a VEGAN diet. Only select vegan foods."
            elif "vegetarian" in dietary_labels:
                dietary_context = "IMPORTANT: User follows a VEGETARIAN diet. Only select vegetarian or vegan foods."
            elif "climate friendly" in dietary_labels:
                dietary_context = "IMPORTANT: User prefers CLIMATE-FRIENDLY options when available."

        # Create hall mapping for context
        hall_mapping = {}
        for meal in dining_hall_meals:
            # Handle both dict and object access
            meal_type = meal["meal_type"] if isinstance(meal, dict) else meal.meal_type
            dining_hall = meal["dining_hall"] if isinstance(meal, dict) else meal.dining_hall
            hall_mapping[meal_type] = dining_hall

        # Calculate total targets for reference
        total_target_calories = sum(meal['calories'] for meal in meal_targets.values())
        total_target_protein = sum(meal['protein_g'] for meal in meal_targets.values())
        total_target_carbs = sum(meal['carbs_g'] for meal in meal_targets.values())
        total_target_fat = sum(meal['fat_g'] for meal in meal_targets.values())

        prompt = f"""Create precise meal plan hitting targets within 97-103%.

{dietary_context}

TARGETS:
Breakfast: {meal_targets['breakfast']['calories']:.0f}cal, {meal_targets['breakfast']['protein_g']:.1f}g protein
Lunch: {meal_targets['lunch']['calories']:.0f}cal, {meal_targets['lunch']['protein_g']:.1f}g protein
Dinner: {meal_targets['dinner']['calories']:.0f}cal, {meal_targets['dinner']['protein_g']:.1f}g protein

FOODS [index,name,cal,prot,carb,fat]:
Breakfast: {json.dumps(foods_by_meal.get('breakfast', []))}
Lunch: {json.dumps(foods_by_meal.get('lunch', []))}
Dinner: {json.dumps(foods_by_meal.get('dinner', []))}

CRITICAL: Only use food indices from the lists above. Do NOT make up indices.

PROCESS:
1. Start with high-protein foods (chicken, eggs, tofu, greek yogurt)
2. Use fractional quantities (0.5, 1.2, 1.8, 2.3) to hit BOTH calories AND protein targets
3. Verify math: sum(food_cal × qty) must be 97-103% of target
4. Adjust quantities in 0.1 increments until targets met

Return JSON format:
{{"breakfast":[{{"food_index":0,"quantity":1.5}}],"lunch":[...],"dinner":[...]}}"""

        return prompt

    def call_openai_for_meal_plan(self, prompt: str) -> Optional[Dict]:
        """
        Make API call to OpenAI for meal plan generation
        """
        try:
            logger.info("Calling OpenAI API for meal plan generation")

            # Use simple json_object mode instead of strict json_schema to save tokens
            meal_plan_schema = {"type": "json_object"}

            response = self.client.chat.completions.create(
                model="gpt-5-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert nutritionist specializing in college dining hall meal plans. You must calculate exact nutritional totals and hit precise targets. Always return valid JSON exactly as requested."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                # GPT-5 only supports default temperature (1), parameter omitted
                max_completion_tokens=16000,  # Increased limit to prevent truncation issues
                response_format=meal_plan_schema  # Using json_object mode to minimize token overhead
            )

            # Debug: Check response details
            message = response.choices[0].message
            logger.info(f"Response ID: {response.id}")
            logger.info(f"Model used: {response.model}")
            logger.info(f"Finish reason: {response.choices[0].finish_reason}")

            # Check for refusal (GPT-5 specific)
            logger.info(f"Refusal field: {getattr(message, 'refusal', 'N/A')}")
            if hasattr(message, 'refusal') and message.refusal:
                logger.error(f"AI refused to generate response: {message.refusal}")
                return None

            # Check if there's a parsed field (for structured outputs with json_schema)
            logger.info(f"Has parsed attribute: {hasattr(message, 'parsed')}")
            logger.info(f"Parsed field value: {getattr(message, 'parsed', 'NO_ATTR')}")
            if hasattr(message, 'parsed') and message.parsed:
                logger.info("Using parsed structured output from GPT-5")
                meal_plan = message.parsed
                # Convert pydantic model to dict if needed
                if hasattr(meal_plan, 'model_dump'):
                    meal_plan = meal_plan.model_dump()
                elif hasattr(meal_plan, 'dict'):
                    meal_plan = meal_plan.dict()
                logger.info("Successfully received AI meal plan from parsed field")
                return meal_plan

            # Parse the response from content field
            content = response.choices[0].message.content
            logger.info(f"Content is None: {content is None}")
            logger.info(f"Content type: {type(content)}")
            logger.info(f"Content length: {len(content) if content else 0}")
            logger.info(f"Raw AI response content (first 500 chars): {content[:500] if content else 'EMPTY'}")

            if not content:
                logger.error("AI returned empty content and no parsed field")
                return None

            # Try to parse with better error handling
            content_stripped = content.strip()
            if not content_stripped:
                logger.error("AI returned only whitespace")
                return None

            meal_plan = json.loads(content_stripped)

            logger.info("Successfully received AI meal plan response")
            return meal_plan

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response content was: {content if 'content' in locals() else 'NOT CAPTURED'}")
            return None
        except Exception as e:
            # Handle all OpenAI errors with detailed logging
            error_str = str(e).lower()
            if "insufficient_quota" in error_str or "429" in error_str:
                logger.error(f"OpenAI quota/billing issue: {e}")
                logger.error("Please check: 1) Account has credits, 2) Payment method added, 3) GPT-5 access enabled")
            elif "rate_limit" in error_str:
                logger.error(f"OpenAI rate limit exceeded: {e}")
            elif "api" in error_str:
                logger.error(f"OpenAI API error: {e}")
            elif "invalid" in error_str:
                logger.error(f"Invalid OpenAI request: {e}")
            else:
                logger.error(f"Unexpected error calling OpenAI: {e}")
            return None

    def validate_ai_response(
        self,
        ai_response: Dict,
        foods_by_meal: Dict[str, List[Dict]],
        id_mappings: Dict[str, Dict[int, str]]
    ) -> Dict:
        """
        Validate and clean AI response, mapping indices back to MongoDB IDs

        Args:
            ai_response: AI response with food_index fields
            foods_by_meal: Original food data for validation
            id_mappings: Mapping from indices to MongoDB IDs

        Returns:
            Validated meal plan with food_id fields
        """
        validated_response = {}

        for meal_type in ["breakfast", "lunch", "dinner"]:
            validated_meal = []
            ai_meal = ai_response.get(meal_type, [])

            if not isinstance(ai_meal, list):
                logger.warning(f"AI response for {meal_type} is not a list, skipping")
                continue

            for item in ai_meal:
                if not isinstance(item, dict):
                    continue

                # Get food index from AI response
                food_index = item.get("food_index")
                quantity = item.get("quantity", 1.0)

                # Convert to int if it's a valid index
                try:
                    food_index = int(food_index)
                except (ValueError, TypeError):
                    logger.warning(f"AI returned invalid food_index '{food_index}' for {meal_type}")
                    continue

                # Map index to MongoDB ID
                meal_mapping = id_mappings.get(meal_type, {})
                food_id = meal_mapping.get(food_index)

                if food_id:
                    # Constrain quantity to reasonable range
                    quantity = max(0.5, min(3.0, float(quantity)))

                    validated_meal.append({
                        "food_id": food_id,
                        "quantity": round(quantity, 1)
                    })
                else:
                    logger.warning(f"AI selected invalid food_index {food_index} for {meal_type}")

            validated_response[meal_type] = validated_meal
            logger.info(f"Validated {len(validated_meal)} foods for {meal_type}")

        return validated_response

    def validate_meal_plan_accuracy(
        self,
        meal_plan: Dict,
        foods_by_meal: Dict[str, List[Dict]],
        meal_targets: Dict[str, Dict[str, float]],
        tolerance: float = 0.03
    ) -> Tuple[bool, Dict[str, str]]:
        """
        Validate that meal plan meets nutritional accuracy requirements

        Returns:
            (is_valid, errors_dict) where errors_dict contains meal_type -> error message
        """
        errors = {}

        # Create lookup maps for food data
        food_maps = {}
        for meal_type, foods in foods_by_meal.items():
            food_maps[meal_type] = {str(food["_id"]): food for food in foods}

        for meal_type in ["breakfast", "lunch", "dinner"]:
            meal_items = meal_plan.get(meal_type, [])
            target = meal_targets.get(meal_type, {})

            if not meal_items or not target:
                errors[meal_type] = "Missing meal data"
                continue

            # Calculate actual totals
            total_calories = 0
            total_protein = 0
            total_carbs = 0
            total_fat = 0

            for item in meal_items:
                food_id = str(item.get("food_id", ""))
                quantity = item.get("quantity", 1.0)

                food_data = food_maps.get(meal_type, {}).get(food_id)
                if not food_data:
                    continue

                nutrients = food_data.get("nutrients", {})
                total_calories += self._safe_float(nutrients.get("calories", 0)) * quantity
                total_protein += self._safe_float(nutrients.get("protein", 0)) * quantity
                total_carbs += self._safe_float(nutrients.get("total_carbohydrates", 0)) * quantity
                total_fat += self._safe_float(nutrients.get("total_fat", 0)) * quantity

            # Check accuracy requirements
            target_calories = target.get("calories", 0)
            target_protein = target.get("protein_g", 0)

            # Calculate percentage differences
            if target_calories > 0:
                cal_diff = abs(total_calories - target_calories) / target_calories
                if cal_diff > tolerance:
                    errors[meal_type] = f"Calories off by {cal_diff*100:.1f}% (got {total_calories:.0f}, target {target_calories:.0f})"
                    continue

            if target_protein > 0:
                prot_diff = abs(total_protein - target_protein) / target_protein
                if prot_diff > tolerance:
                    errors[meal_type] = f"Protein off by {prot_diff*100:.1f}% (got {total_protein:.1f}g, target {target_protein:.1f}g)"
                    continue

            logger.info(f"{meal_type}: calories={total_calories:.0f}/{target_calories:.0f}, protein={total_protein:.1f}g/{target_protein:.1f}g")

        is_valid = len(errors) == 0
        return is_valid, errors

    def generate_meal_plan(
        self,
        foods_by_meal: Dict[str, List[Dict]],
        meal_targets: Dict[str, Dict[str, float]],
        dietary_labels: List[str],
        dining_hall_meals: List[Dict],
        max_retries: int = 2  # Reduced from 3 to avoid rate limiting
    ) -> Optional[Dict]:
        """
        Main function to generate AI meal plan with retry logic

        Returns:
            Dict with meal plan or None if generation failed
        """
        try:
            # Organize foods for AI consumption (now returns tuple with ID mappings)
            ai_foods, id_mappings = self.organize_foods_for_ai(foods_by_meal)

            # Check if we have foods for all meals
            for meal_type in ["breakfast", "lunch", "dinner"]:
                if not ai_foods.get(meal_type):
                    logger.error(f"No foods available for {meal_type}")
                    return None

            # Create prompt
            prompt = self.create_meal_plan_prompt(
                ai_foods,
                meal_targets,
                dietary_labels,
                dining_hall_meals
            )

            # Try generating meal plan with retries
            best_plan = None
            best_errors = None

            for attempt in range(max_retries):
                logger.info(f"Meal plan generation attempt {attempt + 1}/{max_retries}")

                # Call OpenAI
                ai_response = self.call_openai_for_meal_plan(prompt)
                if not ai_response:
                    continue

                # Validate response (map indices to food IDs)
                validated_plan = self.validate_ai_response(ai_response, foods_by_meal, id_mappings)

                # Ensure all meals have at least one food
                missing_meals = [m for m in ["breakfast", "lunch", "dinner"] if not validated_plan.get(m)]
                if missing_meals:
                    logger.warning(f"Attempt {attempt + 1}: Missing foods for {missing_meals}")
                    continue

                # Validate nutritional accuracy
                is_accurate, errors = self.validate_meal_plan_accuracy(
                    validated_plan,
                    foods_by_meal,
                    meal_targets
                )

                if is_accurate:
                    logger.info(f"Successfully generated accurate meal plan on attempt {attempt + 1}")
                    return validated_plan
                else:
                    logger.warning(f"Attempt {attempt + 1}: Accuracy issues - {errors}")
                    # Keep track of best attempt in case all fail
                    if best_plan is None or len(errors) < len(best_errors):
                        best_plan = validated_plan
                        best_errors = errors

            # If we exhausted retries, return best attempt or None
            if best_plan:
                logger.warning(f"Returning best attempt after {max_retries} retries. Remaining issues: {best_errors}")
                return best_plan
            else:
                logger.error(f"Failed to generate valid meal plan after {max_retries} attempts")
                return None

        except Exception as e:
            logger.error(f"Error in AI meal plan generation: {e}")
            return None

def create_meal_planner_ai(api_key: str) -> Optional[MealPlannerAI]:
    """
    Factory function to create AI meal planner instance
    """
    if not api_key:
        logger.warning("No OpenAI API key provided")
        return None

    try:
        return MealPlannerAI(api_key)
    except Exception as e:
        logger.error(f"Failed to create AI meal planner: {e}")
        return None