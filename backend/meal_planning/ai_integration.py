"""
AI integration for intelligent meal plan generation using OpenAI GPT
"""
import json
from openai import OpenAI
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class MealPlannerAI:
    def __init__(self, api_key: str):
        """Initialize AI meal planner with OpenAI API key"""
        self.client = OpenAI(api_key=api_key)

    def organize_foods_for_ai(
        self,
        foods_by_meal: Dict[str, List[Dict]],
        max_foods_per_meal: int = 30
    ) -> Dict[str, List[Dict]]:
        """
        Format food data for AI consumption with simplified structure
        """
        ai_foods_by_meal = {}

        for meal_type, foods in foods_by_meal.items():
            # Convert to simplified format for AI
            ai_foods = []

            for food in foods[:max_foods_per_meal]:  # Limit foods to fit in context
                nutrients = food.get("nutrients", {})

                # Extract nutrition data with fallbacks
                calories = self._safe_float(nutrients.get("calories", 0))
                protein = self._safe_float(nutrients.get("protein", 0))
                carbs = self._safe_float(nutrients.get("total_carbohydrates", 0))
                fat = self._safe_float(nutrients.get("total_fat", 0))

                # Skip foods with no nutritional data
                if calories == 0 and protein == 0 and carbs == 0 and fat == 0:
                    continue

                ai_food = {
                    "id": str(food["_id"]),
                    "name": food.get("name", "Unknown Food"),
                    "calories": calories,
                    "protein_g": protein,
                    "carbs_g": carbs,
                    "fat_g": fat
                }

                # Add dietary labels if available
                labels = food.get("labels", [])
                if labels:
                    if isinstance(labels, str):
                        labels = [labels]
                    ai_food["labels"] = labels

                ai_foods.append(ai_food)

            ai_foods_by_meal[meal_type] = ai_foods
            logger.info(f"Prepared {len(ai_foods)} foods for {meal_type} AI processing")

        return ai_foods_by_meal

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
            hall_mapping[meal.meal_type] = meal.dining_hall

        prompt = f"""You are an expert nutritionist creating a precise meal plan for a college student. Your PRIMARY GOAL is to achieve protein targets - this is NON-NEGOTIABLE.

{dietary_context}

ABSOLUTE REQUIREMENTS (MUST BE MET):
1. **PROTEIN TARGETS ARE MANDATORY** - You MUST hit within ±5% of protein targets
2. **CALORIE TARGETS** - Hit 95-105% of target calories for each meal
3. **MACRO BALANCE** - Achieve all macro targets as closely as possible

MEAL TARGETS TO HIT PRECISELY:

🌅 BREAKFAST (at {hall_mapping.get('breakfast', 'Unknown Hall')}):
- 🚨 PROTEIN: {meal_targets['breakfast']['protein_g']:.1f}g (CRITICAL - within ±5%)
- Calories: {meal_targets['breakfast']['calories']:.0f} (95-110% range, DO NOT exceed)
- Carbs: {meal_targets['breakfast']['carbs_g']:.1f}g (flexible)
- Fat: {meal_targets['breakfast']['fat_g']:.1f}g (flexible)

Available Breakfast Foods:
{json.dumps(foods_by_meal.get('breakfast', []), indent=2)}

☀️ LUNCH (at {hall_mapping.get('lunch', 'Unknown Hall')}):
- 🚨 PROTEIN: {meal_targets['lunch']['protein_g']:.1f}g (CRITICAL - within ±5%)
- Calories: {meal_targets['lunch']['calories']:.0f} (95-110% range, DO NOT exceed)
- Carbs: {meal_targets['lunch']['carbs_g']:.1f}g (flexible)
- Fat: {meal_targets['lunch']['fat_g']:.1f}g (flexible)

Available Lunch Foods:
{json.dumps(foods_by_meal.get('lunch', []), indent=2)}

🌙 DINNER (at {hall_mapping.get('dinner', 'Unknown Hall')}):
- 🚨 PROTEIN: {meal_targets['dinner']['protein_g']:.1f}g (CRITICAL - within ±5%)
- Calories: {meal_targets['dinner']['calories']:.0f} (95-110% range, DO NOT exceed)
- Carbs: {meal_targets['dinner']['carbs_g']:.1f}g (flexible)
- Fat: {meal_targets['dinner']['fat_g']:.1f}g (flexible)

Available Dinner Foods:
{json.dumps(foods_by_meal.get('dinner', []), indent=2)}

MANDATORY SELECTION STRATEGY (FOLLOW EXACTLY):

STEP 1: PROTEIN FOUNDATION (CRITICAL)
- For each meal, identify the highest protein foods available
- ALWAYS start with protein-rich items (>15g protein per serving)
- Scale quantities UP if needed to hit protein targets within ±5%
- Common high-protein foods: chicken, fish, beef, eggs, beans, tofu, protein shakes

STEP 2: PROTEIN CALCULATION CHECK
- Calculate total protein from selected foods
- If under target: ADD MORE PROTEIN or INCREASE quantities
- If over target: Slightly reduce quantities but KEEP within ±5%

STEP 3: FILL REMAINING CALORIES (CAREFULLY)
- Calculate remaining calories after protein selections
- Add carbs/fats STRATEGICALLY to reach targets without exceeding 110%
- Use smaller portions (0.5-1.5 servings) to fine-tune targets
- STOP adding foods once you approach calorie limits

CALCULATION REQUIREMENT:
Before finalizing, mentally calculate:
- Total protein = sum(food_protein × quantity) - MUST be {meal_targets['breakfast']['protein_g']:.1f} + {meal_targets['lunch']['protein_g']:.1f} + {meal_targets['dinner']['protein_g']:.1f} = {meal_targets['breakfast']['protein_g'] + meal_targets['lunch']['protein_g'] + meal_targets['dinner']['protein_g']:.1f}g total
- Total calories = sum(food_calories × quantity) - MUST be 2090-2420 calories
- Total carbs = sum(food_carbs × quantity)
- Total fat = sum(food_fat × quantity)

PROTEIN CHECKPOINT: Target is {meal_targets['breakfast']['protein_g'] + meal_targets['lunch']['protein_g'] + meal_targets['dinner']['protein_g']:.1f}g protein total. Each gram short is a CRITICAL failure.

MANDATORY PROTEIN SOURCES TO PRIORITIZE:
🥚 Eggs (12-15g protein) - excellent for breakfast
🍗 Chicken/Turkey (20-30g protein) - perfect for lunch/dinner
🐟 Fish (18-25g protein) - great for any meal
🥩 Beef/Pork (15-25g protein) - substantial dinner protein
🫘 Beans/Legumes (8-15g protein) - good plant protein
🥛 Milk/Yogurt (8-12g protein) - supplements other proteins

SELECTION EXAMPLES FOR HIGH PROTEIN:
✅ GOOD: Grilled Chicken (25g) + Greek Yogurt (12g) = 37g protein
✅ GOOD: Scrambled Eggs (18g) + Turkey Sausage (8g) = 26g protein
❌ BAD: French Toast (11g) + Fruit (1g) = 12g protein (too low!)

FINAL VERIFICATION CHECKLIST:
🚨 Is breakfast protein within 95-105% of {meal_targets['breakfast']['protein_g']:.1f}g? (MUST be YES)
🚨 Is lunch protein within 95-105% of {meal_targets['lunch']['protein_g']:.1f}g? (MUST be YES)
🚨 Is dinner protein within 95-105% of {meal_targets['dinner']['protein_g']:.1f}g? (MUST be YES)
✅ Are calories within 95-110% of targets?
✅ Are portions realistic (0.5-3.0 servings)?

CRITICAL INSTRUCTION: Balance protein targets with calorie limits. Aim for 95-105% of both protein AND calorie targets simultaneously. Do not exceed 110% of calorie targets.

Return ONLY valid JSON in this exact format:
{{
    "breakfast": [
        {{"food_id": "12345", "quantity": 1.2}},
        {{"food_id": "67890", "quantity": 1.8}}
    ],
    "lunch": [
        {{"food_id": "11111", "quantity": 1.5}},
        {{"food_id": "22222", "quantity": 0.8}}
    ],
    "dinner": [
        {{"food_id": "33333", "quantity": 2.0}},
        {{"food_id": "44444", "quantity": 1.3}}
    ]
}}"""

        return prompt

    def call_openai_for_meal_plan(self, prompt: str) -> Optional[Dict]:
        """
        Make API call to OpenAI for meal plan generation
        """
        try:
            logger.info("Calling OpenAI API for meal plan generation")

            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert nutritionist specializing in college dining hall meal plans. Always return valid JSON exactly as requested."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,  # Balance creativity with consistency
                max_tokens=1500,
                response_format={"type": "json_object"}
            )

            # Parse the response
            content = response.choices[0].message.content
            meal_plan = json.loads(content)

            logger.info("Successfully received AI meal plan response")
            return meal_plan

        except Exception as e:
            # Handle all OpenAI errors generically since the API has changed
            if "rate_limit" in str(e).lower():
                logger.error(f"OpenAI rate limit exceeded: {e}")
            elif "api" in str(e).lower():
                logger.error(f"OpenAI API error: {e}")
            elif "invalid" in str(e).lower():
                logger.error(f"Invalid OpenAI request: {e}")
            else:
                logger.error(f"Unexpected error calling OpenAI: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return None

    def validate_ai_response(
        self,
        ai_response: Dict,
        foods_by_meal: Dict[str, List[Dict]]
    ) -> Dict:
        """
        Validate and clean AI response to ensure all food IDs exist
        """
        validated_response = {}

        # Create lookup maps for food IDs
        food_id_maps = {}
        for meal_type, foods in foods_by_meal.items():
            food_id_maps[meal_type] = {str(food["_id"]): food for food in foods}

        for meal_type in ["breakfast", "lunch", "dinner"]:
            validated_meal = []
            ai_meal = ai_response.get(meal_type, [])

            if not isinstance(ai_meal, list):
                logger.warning(f"AI response for {meal_type} is not a list, skipping")
                continue

            for item in ai_meal:
                if not isinstance(item, dict):
                    continue

                food_id = str(item.get("food_id", ""))
                quantity = item.get("quantity", 1.0)

                # Validate food ID exists
                if food_id in food_id_maps.get(meal_type, {}):
                    # Constrain quantity to reasonable range
                    quantity = max(0.5, min(2.5, float(quantity)))

                    validated_meal.append({
                        "food_id": food_id,
                        "quantity": round(quantity, 1)
                    })
                else:
                    logger.warning(f"AI selected invalid food ID {food_id} for {meal_type}")

            validated_response[meal_type] = validated_meal
            logger.info(f"Validated {len(validated_meal)} foods for {meal_type}")

        return validated_response

    def generate_meal_plan(
        self,
        foods_by_meal: Dict[str, List[Dict]],
        meal_targets: Dict[str, Dict[str, float]],
        dietary_labels: List[str],
        dining_hall_meals: List[Dict]
    ) -> Optional[Dict]:
        """
        Main function to generate AI meal plan

        Returns:
            Dict with meal plan or None if generation failed
        """
        try:
            # Organize foods for AI consumption
            ai_foods = self.organize_foods_for_ai(foods_by_meal)

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

            # Call OpenAI
            ai_response = self.call_openai_for_meal_plan(prompt)
            if not ai_response:
                return None

            # Validate response
            validated_plan = self.validate_ai_response(ai_response, foods_by_meal)

            # Ensure all meals have at least one food
            for meal_type in ["breakfast", "lunch", "dinner"]:
                if not validated_plan.get(meal_type):
                    logger.error(f"No valid foods selected for {meal_type}")
                    return None

            logger.info("Successfully generated and validated AI meal plan")
            return validated_plan

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