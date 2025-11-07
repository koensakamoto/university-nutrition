"""
AI integration for intelligent meal plan generation using Claude (Anthropic)
"""
import json
from anthropic import Anthropic
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class MealPlannerAI:
    def __init__(self, api_key: str):
        """Initialize AI meal planner with Anthropic API key"""
        self.client = Anthropic(api_key=api_key)

    def build_dietary_context_from_profile(self, user_profile: Dict, dietary_labels: List[str]) -> str:
        """
        Build dietary context string from actual user profile data.
        Only includes fields that exist and have values.

        Args:
            user_profile: User profile dictionary from database
            dietary_labels: List of food filtering labels (from extract_dietary_labels)

        Returns:
            Formatted string for AI prompt (empty if no dietary restrictions)
        """
        context_lines = []

        # Map allergen IDs to specific foods to avoid
        allergen_foods = {
            'milk': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'dairy'],
            'eggs': ['eggs', 'egg'],
            'fish': ['fish', 'salmon', 'tuna', 'tilapia', 'cod', 'halibut'],
            'shellfish': ['shellfish', 'shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster'],
            'tree_nuts': ['almonds', 'cashews', 'walnuts', 'pecans', 'pistachios', 'hazelnuts'],
            'peanuts': ['peanuts', 'peanut butter'],
            'wheat': ['wheat', 'bread', 'pasta', 'flour'],
            'soybeans': ['soy', 'tofu', 'edamame', 'soy sauce'],
            'gluten': ['wheat', 'barley', 'rye', 'bread', 'pasta', 'flour'],
            'lactose': ['milk', 'cheese', 'cream', 'yogurt', 'dairy']
        }

        # 1. ALLERGENS - CRITICAL (must avoid) - Put this FIRST for maximum visibility
        # Options: milk, eggs, fish, shellfish, tree_nuts, peanuts, wheat, soybeans
        allergens = user_profile.get("allergens", [])
        food_sens = user_profile.get("food_sensitivities") or user_profile.get("foode_sensitivities") or []

        all_allergens = []
        if allergens and isinstance(allergens, list):
            all_allergens.extend([str(a) for a in allergens if a])
        if food_sens and isinstance(food_sens, list):
            all_allergens.extend([str(s) for s in food_sens if s])

        if all_allergens:
            context_lines.append("🚨 CRITICAL ALLERGEN RESTRICTIONS 🚨")
            context_lines.append("=" * 60)
            for allergen in all_allergens:
                allergen_lower = allergen.lower()
                if allergen_lower in allergen_foods:
                    foods_to_avoid = allergen_foods[allergen_lower]
                    context_lines.append(f"❌ {allergen.upper()}: DO NOT select ANY foods containing: {', '.join(foods_to_avoid)}")
                else:
                    context_lines.append(f"❌ {allergen.upper()}: DO NOT select ANY foods containing this ingredient")

            context_lines.append("")
            context_lines.append("BEFORE selecting each food, CHECK its name and ingredients!")
            context_lines.append("If a food name contains ANY of the above ingredients, SKIP IT!")
            context_lines.append("=" * 60)
            context_lines.append("")

        # 2. Diet Type - primary dietary restriction
        # Options: regular, vegetarian, vegan, pescatarian, keto, paleo, mediterranean, low-carb
        diet_type = user_profile.get("diet_type", "")
        if diet_type and diet_type != "regular":
            if diet_type == "vegan":
                context_lines.append("🌱 DIET: VEGAN - Exclude ALL animal products (meat, fish, dairy, eggs, honey)")
            elif diet_type == "vegetarian":
                context_lines.append("🌱 DIET: VEGETARIAN - Exclude meat and fish. Dairy and eggs OK.")
            elif diet_type == "pescatarian":
                context_lines.append("🐟 DIET: PESCATARIAN - Include fish/seafood. Exclude other meats (chicken, beef, pork).")
            elif diet_type == "keto":
                context_lines.append("🥑 DIET: KETOGENIC - Prioritize very low carb (<20g per meal), high fat foods.")
            elif diet_type == "paleo":
                context_lines.append("🥩 DIET: PALEO - Exclude grains, legumes, dairy, processed foods.")
            elif diet_type == "mediterranean":
                context_lines.append("🫒 DIET: MEDITERRANEAN - Emphasize fish, olive oil, vegetables, whole grains, moderate dairy.")
            elif diet_type == "low-carb":
                context_lines.append("🥗 DIET: LOW-CARB - Minimize carbohydrates. Limit bread, pasta, rice, sugary foods.")
            context_lines.append("")

        # 3. Allergen/Allergy Notes (handle both field name variations)
        allergy_notes = user_profile.get("allergy_notes") or user_profile.get("allergen_notes") or ""
        if allergy_notes and str(allergy_notes).strip():
            context_lines.append(f"⚠️ ADDITIONAL NOTES: {str(allergy_notes).strip()}")
            context_lines.append("")

        # 4. Meal Preferences
        # Options: Low Sodium, Low Sugar, High Protein, High Fiber, Gluten-Free, Dairy-Free
        meal_prefs = user_profile.get("meal_preference", [])
        if meal_prefs and isinstance(meal_prefs, list) and len(meal_prefs) > 0:
            pref_list = [str(p) for p in meal_prefs if p]
            if pref_list:
                prefs_str = ", ".join(pref_list)
                context_lines.append(f"✨ PREFERENCES: Prioritize {prefs_str} options when available.")
                context_lines.append("")

        return "\n".join(context_lines) if context_lines else ""

    def organize_foods_for_ai(
        self,
        foods_by_meal: Dict[str, List[Dict]],
        max_foods_per_meal: int = 50  # Reduced to 50 to minimize token usage and avoid rate limiting
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

    def _get_food_selection_rules(self, target_protein: float, target_fat: float, foods_by_meal: Dict) -> str:
        """Generate food selection rules based on protein/fat ratio"""
        ratio = target_protein / target_fat if target_fat > 0 else 0

        if ratio > 2.5:
            # High protein, low fat - need to be very selective
            return f"""Ratio {ratio:.1f}:1 is HIGH - you MUST avoid fatty proteins!

PRIORITIZE (use heavily):
- Greek yogurt 2%: 11P/3F = 3.7:1 ratio (EXCELLENT)
- Chicken breast, turkey breast (if available): ~23P/5F
- Egg whites, protein powder (if available)
- Cottage cheese, skim milk

LIMIT (use sparingly):
- Whole eggs: 14P/16F = 0.9:1 (BAD - use max 1-2x total)
- Cheese: High fat, use only for small adjustments

AVOID COMPLETELY:
- Chicken tikka masala, curry dishes (hidden fat)
- Roasted/fried chicken (skin = fat)
- Pork, beef, sausage
- Oils, butter, nuts, avocado, peanut butter"""

        elif ratio > 1.5:
            # Balanced - can use most proteins
            return f"""Ratio {ratio:.1f}:1 is BALANCED - moderate selectivity needed.

GOOD CHOICES:
- Greek yogurt, eggs, chicken, turkey
- Milk, cheese (moderate amounts)

AVOID:
- Excessive oils, butter"""

        else:
            # Low protein, high fat - can use fatty foods
            return f"""Ratio {ratio:.1f}:1 is LOW - fat is needed!

USE FREELY:
- Cheese, oils, butter, nuts, avocado
- Fatty meats (pork, beef)
- Eggs with yolks"""

    def create_meal_plan_prompt(
        self,
        foods_by_meal: Dict[str, List[Dict]],
        meal_targets: Dict[str, Dict[str, float]],
        dietary_labels: List[str],
        dining_hall_meals: List[Dict],
        user_profile: Dict = None
    ) -> str:
        """
        Create structured prompt for AI meal planning with user dietary context
        """

        # Build dietary context from user profile if available
        dietary_context = ""
        if user_profile:
            dietary_context = self.build_dietary_context_from_profile(user_profile, dietary_labels)

        # Fallback to simple dietary labels if no profile or no context generated
        if not dietary_context and dietary_labels:
            dietary_labels_lower = [str(label).lower() for label in dietary_labels]
            if "vegan" in dietary_labels_lower:
                dietary_context = "IMPORTANT: User follows a VEGAN diet. Only select vegan foods."
            elif "vegetarian" in dietary_labels_lower:
                dietary_context = "IMPORTANT: User follows a VEGETARIAN diet. Only select vegetarian or vegan foods."
            elif "climate friendly" in dietary_labels_lower:
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

        prompt = f"""🎯 DAILY TARGET (all 3 meals combined):
• Calories: {total_target_calories:.0f} (MUST be {total_target_calories*0.75:.0f}-{total_target_calories*1.25:.0f})
• Protein: {total_target_protein:.0f}g (MUST be {total_target_protein*0.75:.0f}-{total_target_protein*1.25:.0f}g)
• Carbs: {total_target_carbs:.0f}g (MUST be {total_target_carbs*0.75:.0f}-{total_target_carbs*1.25:.0f}g)
• Fat: {total_target_fat:.0f}g (MUST be {total_target_fat*0.75:.0f}-{total_target_fat*1.25:.0f}g)

{dietary_context}

📋 AVAILABLE FOODS [index, name, cal, P, C, F]:
Breakfast: {json.dumps(foods_by_meal.get('breakfast',[]))}
Lunch: {json.dumps(foods_by_meal.get('lunch',[]))}
Dinner: {json.dumps(foods_by_meal.get('dinner',[]))}

🧮 STEP-BY-STEP CALCULATION PROCESS:

STEP 1: Initialize running totals
total_cal = 0, total_P = 0, total_C = 0, total_F = 0

STEP 2: Build each meal conservatively (qty 1.0)
For EACH food you add:
  - Calculate: food_cal × qty, food_P × qty, food_C × qty, food_F × qty
  - Add to totals: total_cal += result, total_P += result, etc.
  - CHECK: Am I approaching the limit? If total_cal > {total_target_calories*1.0:.0f}, STOP adding foods

STEP 3: After building all 3 meals, calculate FINAL TOTALS
  - Sum ALL foods across breakfast + lunch + dinner
  - Compare to targets

STEP 4: Adjust if needed
  - Too high (>125%)? REDUCE quantities to 0.5x or REMOVE foods
  - Too low (<75%)? INCREASE quantities to 1.5-2.0x
  - Just right? You're done!

⚠️ CRITICAL WARNINGS:
❌ DO NOT add foods without calculating their contribution first
❌ DO NOT use quantities >2.0 unless totals are WAY under target (<70%)
❌ DO NOT select multiple high-calorie items (>300 cal) in same meal
❌ STOP adding foods when you're close to target - don't overshoot!

💡 SMART FOOD SELECTION:
✓ Start with MODERATE items (100-250 cal each)
✓ Use HIGH-CALORIE items (>300 cal) sparingly - max 1-2 per meal
✓ Fill gaps with LOW-CALORIE items (<100 cal) for fine-tuning
✓ Aim for ~{total_target_calories/3:.0f} cal per meal as rough guide

EXAMPLE CALCULATION (for {total_target_calories:.0f} cal target):
Breakfast: Bagel(310 cal) × 1.0 + Sausage(70 cal) × 2.0 + Fruit(25 cal) × 2.0 = 450 cal
Lunch: Chicken(180 cal) × 2.0 + Rice(150 cal) × 1.5 + Veggies(45 cal) × 2.0 = 675 cal
Dinner: Pork(280 cal) × 1.0 + Potatoes(230 cal) × 1.5 + Beans(90 cal) × 2.0 = 805 cal
DAILY TOTAL: 1930 cal (79% ✓ - within 75-125% range)
If needed: Increase Potatoes to 2.0x (+115 cal) and Rice to 2.0x (+75 cal) and Bagel to 1.5x (+155 cal)
NEW TOTAL: 2275 cal (93% ✓)

Return ONLY JSON (no explanations):
{{"breakfast":[{{"food_index":0,"quantity":1.0}}],"lunch":[...],"dinner":[...]}}"""

        return prompt

    def call_claude_for_meal_plan(self, prompt: str) -> Optional[Dict]:
        """
        Make API call to Claude for meal plan generation
        """
        try:
            logger.info("Calling Claude API for meal plan generation")

            system_prompt = """You are a MATHEMATICAL meal planner. Your ONLY job is to select foods whose nutritional values SUM to the target ranges.

🔢 MANDATORY CALCULATION PROCESS:

1. INITIALIZE: total_cal=0, total_P=0, total_C=0, total_F=0

2. FOR EACH MEAL (breakfast, lunch, dinner):
   - Pick 4-6 foods, START with qty=1.0
   - As you add EACH food, calculate:
     * total_cal += (food_cal × qty)
     * total_P += (food_P × qty)
     * total_C += (food_C × qty)
     * total_F += (food_F × qty)

3. AFTER selecting all 3 meals:
   - Sum your totals across ALL meals
   - Check: Is total_cal within 75-125% of target? If NO, adjust quantities
   - Check: Is total_P within 75-125% of target? If NO, adjust quantities
   - Repeat for total_C and total_F

4. ADJUSTMENT RULES:
   - If >125% (too high): REDUCE quantities to 0.5x or REMOVE foods
   - If <75% (too low): INCREASE quantities to 1.5-2.0x
   - Goal: Get ALL four macros (cal, P, C, F) within 75-125% range

⚠️ COMMON MISTAKES TO AVOID:
❌ Selecting too many high-calorie items (>300 cal) - use MAX 1-2 per meal
❌ Using quantities >2.0 when already near target - you'll overshoot
❌ Forgetting to sum across ALL THREE meals
❌ Not calculating running totals - you MUST do math as you go

🔒 ALLERGEN SAFETY (CHECK BEFORE EVERY FOOD):
- Read allergen restrictions at top of prompt
- Check food NAME for restricted ingredients
- Examples to SKIP:
  * Dairy allergy? Skip: Cheese, Butter, Milk, Yogurt, Cream, Whey
  * Egg allergy? Skip: Scrambled Eggs, Egg Sandwich
  * Nut allergy? Skip: Peanut Butter, Almond, Walnut

✅ VALIDATION BEFORE RETURNING:
- Calculate final totals: sum(all breakfast foods) + sum(all lunch foods) + sum(all dinner foods)
- Verify: 75% ≤ (total_cal / target_cal) ≤ 125%
- Verify: 75% ≤ (total_P / target_P) ≤ 125%
- Same for C and F
- If ANY macro is outside range, ADJUST and recalculate

🚨 CRITICAL OUTPUT REQUIREMENT 🚨
Your response MUST be ONLY the JSON object. NO text before or after.
DO NOT include calculations, explanations, or thinking process.
DO NOT include "Looking at", "STEP 1", or ANY other text.
ONLY this exact format:
{"breakfast":[{"food_index":0,"quantity":1.0}],"lunch":[...],"dinner":[...]}

Your ENTIRE response must be ONLY that JSON object and nothing else."""

            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",  # Claude Sonnet 4.5
                max_tokens=8000,
                temperature=0,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Debug: Check response details
            logger.info(f"Response ID: {response.id}")
            logger.info(f"Model used: {response.model}")
            logger.info(f"Stop reason: {response.stop_reason}")
            logger.info(f"Usage: {response.usage}")

            # Claude returns content in a different structure
            if not response.content or len(response.content) == 0:
                logger.error("Claude returned empty content")
                return None

            # Get text content from response
            content = response.content[0].text if response.content else None
            logger.info(f"Content is None: {content is None}")
            logger.info(f"Content type: {type(content)}")
            logger.info(f"Content length: {len(content) if content else 0}")
            logger.info(f"Raw Claude response content (first 500 chars): {content[:500] if content else 'EMPTY'}")

            if not content or len(content.strip()) == 0:
                logger.error("Claude returned empty content")
                return None

            # Try to parse with better error handling
            content_stripped = content.strip()
            if not content_stripped:
                logger.error("AI returned only whitespace")
                return None

            # Try to extract JSON from response (AI sometimes includes explanations before JSON)
            # Look for the last occurrence of a JSON object starting with '{'
            import re

            # First try: parse the entire content as JSON
            try:
                meal_plan = json.loads(content_stripped)
                logger.info("Successfully parsed AI meal plan response")
                return meal_plan
            except json.JSONDecodeError:
                # Second try: extract JSON from mixed content
                # Look for pattern: {"breakfast":[...
                json_match = re.search(r'\{"breakfast":\[.*\]\}', content_stripped, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    try:
                        meal_plan = json.loads(json_str)
                        logger.info("Successfully extracted and parsed JSON from AI response with explanations")
                        return meal_plan
                    except json.JSONDecodeError:
                        logger.error("Found JSON-like pattern but failed to parse it")
                        return None
                else:
                    logger.error("Could not find JSON pattern in AI response")
                    return None

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
                    quantity = max(0.5, min(5.0, float(quantity)))

                    validated_meal.append({
                        "food_id": food_id,
                        "quantity": round(quantity, 1)
                    })
                else:
                    logger.warning(f"AI selected invalid food_index {food_index} for {meal_type}")

            validated_response[meal_type] = validated_meal
            logger.info(f"Validated {len(validated_meal)} foods for {meal_type}")

        return validated_response

    def validate_daily_totals(
        self,
        meal_plan: Dict,
        foods_by_meal: Dict[str, List[Dict]],
        meal_targets: Dict[str, Dict[str, float]],
        tolerance: float = 0.25
    ) -> Tuple[bool, str]:
        """
        Validate that overall daily totals meet nutritional accuracy requirements (75-125%)

        Returns:
            (is_valid, error_message)
        """
        # Create lookup maps for food data
        food_maps = {}
        for meal_type, foods in foods_by_meal.items():
            food_maps[meal_type] = {str(food["_id"]): food for food in foods}

        # Calculate daily totals
        daily_calories = 0
        daily_protein = 0
        daily_carbs = 0
        daily_fat = 0

        for meal_type in ["breakfast", "lunch", "dinner"]:
            meal_items = meal_plan.get(meal_type, [])
            for item in meal_items:
                food_id = str(item.get("food_id", ""))
                quantity = item.get("quantity", 1.0)

                food_data = food_maps.get(meal_type, {}).get(food_id)
                if not food_data:
                    continue

                nutrients = food_data.get("nutrients", {})
                daily_calories += self._safe_float(nutrients.get("calories", 0)) * quantity
                daily_protein += self._safe_float(nutrients.get("protein", 0)) * quantity
                daily_carbs += self._safe_float(nutrients.get("total_carbohydrates", 0)) * quantity
                daily_fat += self._safe_float(nutrients.get("total_fat", 0)) * quantity

        # Calculate daily targets
        target_calories = sum(meal['calories'] for meal in meal_targets.values())
        target_protein = sum(meal['protein_g'] for meal in meal_targets.values())
        target_carbs = sum(meal['carbs_g'] for meal in meal_targets.values())
        target_fat = sum(meal['fat_g'] for meal in meal_targets.values())

        # Check overall daily accuracy
        errors = []

        if target_calories > 0:
            cal_diff = abs(daily_calories - target_calories) / target_calories
            if cal_diff > tolerance:
                errors.append(f"Cal {cal_diff*100:.0f}% off ({daily_calories:.0f}/{target_calories:.0f})")

        if target_protein > 0:
            prot_diff = abs(daily_protein - target_protein) / target_protein
            if prot_diff > tolerance:
                errors.append(f"P {prot_diff*100:.0f}% off ({daily_protein:.1f}g/{target_protein:.1f}g)")

        if target_carbs > 0:
            carb_diff = abs(daily_carbs - target_carbs) / target_carbs
            if carb_diff > tolerance:
                errors.append(f"C {carb_diff*100:.0f}% off ({daily_carbs:.1f}g/{target_carbs:.1f}g)")

        if target_fat > 0:
            fat_diff = abs(daily_fat - target_fat) / target_fat
            if fat_diff > tolerance:
                errors.append(f"F {fat_diff*100:.0f}% off ({daily_fat:.1f}g/{target_fat:.1f}g)")

        if errors:
            return False, "Daily totals: " + ", ".join(errors)

        logger.info(f"Daily totals validated: cal={daily_calories:.0f}/{target_calories:.0f}, "
                   f"prot={daily_protein:.1f}g/{target_protein:.1f}g, "
                   f"carb={daily_carbs:.1f}g/{target_carbs:.1f}g, "
                   f"fat={daily_fat:.1f}g/{target_fat:.1f}g")
        return True, ""

    def validate_meal_plan_accuracy(
        self,
        meal_plan: Dict,
        foods_by_meal: Dict[str, List[Dict]],
        meal_targets: Dict[str, Dict[str, float]],
        tolerance: float = 0.25
    ) -> Tuple[bool, Dict[str, str]]:
        """
        Validate that meal plan meets nutritional accuracy requirements.
        Focus on DAILY TOTALS (75-125% strict), individual meals are flexible.

        Returns:
            (is_valid, errors_dict) where errors_dict contains error messages
        """
        errors = {}

        # Only validate overall daily totals (meals can be flexible)
        is_daily_valid, daily_error = self.validate_daily_totals(
            meal_plan,
            foods_by_meal,
            meal_targets,
            tolerance
        )
        if not is_daily_valid:
            errors["DAILY_TOTAL"] = daily_error

        is_valid = len(errors) == 0
        return is_valid, errors

    def generate_meal_plan(
        self,
        foods_by_meal: Dict[str, List[Dict]],
        meal_targets: Dict[str, Dict[str, float]],
        dietary_labels: List[str],
        dining_hall_meals: List[Dict],
        user_profile: Dict = None,
        max_retries: int = 4  # Reduced to 4 retries to avoid rate limiting
    ) -> Optional[Dict]:
        """
        Main function to generate AI meal plan with retry logic

        Args:
            foods_by_meal: Foods organized by meal type
            meal_targets: Nutrition targets for each meal
            dietary_labels: Labels used for food filtering
            dining_hall_meals: List of selected dining hall/meal combinations
            user_profile: User profile with dietary preferences, allergens, etc.
            max_retries: Maximum retry attempts

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

            # Create prompt with user profile dietary context
            prompt = self.create_meal_plan_prompt(
                ai_foods,
                meal_targets,
                dietary_labels,
                dining_hall_meals,
                user_profile
            )

            # Try generating meal plan with retries and feedback
            best_plan = None
            best_errors = {}  # Initialize as empty dict instead of None
            retry_prompt = prompt

            for attempt in range(max_retries):
                logger.info(f"Meal plan generation attempt {attempt + 1}/{max_retries}")

                # Call OpenAI with current prompt (includes feedback from previous attempt)
                ai_response = self.call_claude_for_meal_plan(retry_prompt)
                if not ai_response:
                    logger.warning(f"Attempt {attempt + 1}: AI returned no response (None)")
                    continue

                # Validate response (map indices to food IDs)
                validated_plan = self.validate_ai_response(ai_response, foods_by_meal, id_mappings)

                # Log the generated meal plan details (even if incomplete)
                logger.info(f"=== ATTEMPT {attempt + 1} MEAL PLAN ===")
                for meal_type in ["breakfast", "lunch", "dinner"]:
                    meal_items = validated_plan.get(meal_type, [])
                    if not meal_items:
                        logger.info(f"{meal_type.upper()}: EMPTY (no foods selected)")
                        continue

                    logger.info(f"{meal_type.upper()}:")
                    meal_cal = 0
                    meal_p = 0
                    meal_c = 0
                    meal_f = 0

                    for item in meal_items:
                        food_id = str(item.get("food_id", ""))
                        quantity = item.get("quantity", 1.0)

                        # Find food in the foods list
                        food_data = None
                        for f in foods_by_meal.get(meal_type, []):
                            if str(f["_id"]) == food_id:
                                food_data = f
                                break

                        if food_data:
                            nutrients = food_data.get("nutrients", {})
                            cal = self._safe_float(nutrients.get("calories", 0)) * quantity
                            prot = self._safe_float(nutrients.get("protein", 0)) * quantity
                            carb = self._safe_float(nutrients.get("total_carbohydrates", 0)) * quantity
                            fat = self._safe_float(nutrients.get("total_fat", 0)) * quantity

                            meal_cal += cal
                            meal_p += prot
                            meal_c += carb
                            meal_f += fat

                            logger.info(f"  - {food_data.get('name')} x{quantity}: {cal:.0f} cal, {prot:.1f}P, {carb:.1f}C, {fat:.1f}F")

                    logger.info(f"  {meal_type.upper()} TOTAL: {meal_cal:.0f} cal, {meal_p:.1f}P, {meal_c:.1f}C, {meal_f:.1f}F")

                # Ensure all meals have at least one food
                missing_meals = [m for m in ["breakfast", "lunch", "dinner"] if not validated_plan.get(m)]
                if missing_meals:
                    logger.warning(f"Attempt {attempt + 1}: Missing foods for {missing_meals}, skipping this attempt")
                    continue

                # Validate nutritional accuracy
                is_accurate, errors = self.validate_meal_plan_accuracy(
                    validated_plan,
                    foods_by_meal,
                    meal_targets
                )

                logger.info(f"Attempt {attempt + 1} validation result: is_accurate={is_accurate}, errors={errors}")

                if is_accurate:
                    logger.info(f"Successfully generated accurate meal plan on attempt {attempt + 1}")
                    return validated_plan
                else:
                    logger.warning(f"Attempt {attempt + 1}: Accuracy issues - {errors}")
                    # Keep track of best attempt in case all fail
                    if best_plan is None or len(errors) < len(best_errors):
                        best_plan = validated_plan
                        best_errors = errors

                    # Add feedback for next retry with mathematical guidance
                    if attempt < max_retries - 1:  # Don't add feedback on last attempt
                        feedback = "\n\n❌ YOUR LAST ATTEMPT FAILED ❌\n"

                        for meal_type, error_msg in errors.items():
                            # Parse actual vs target from error message format: "P 28% off (229.0g/320.0g)"
                            import re

                            feedback += f"\n{error_msg}\n"

                            # Extract all macros
                            p_match = re.search(r'P \d+% off \((\d+\.?\d*)g/(\d+\.?\d*)g\)', error_msg)
                            c_match = re.search(r'C \d+% off \((\d+\.?\d*)g/(\d+\.?\d*)g\)', error_msg)
                            f_match = re.search(r'F \d+% off \((\d+\.?\d*)g/(\d+\.?\d*)g\)', error_msg)
                            cal_match = re.search(r'Cal \d+% off \((\d+\.?\d*)/(\d+\.?\d*)\)', error_msg)

                            corrections = []

                            if cal_match:
                                actual_cal = float(cal_match.group(1))
                                target_cal = float(cal_match.group(2))
                                diff_cal = actual_cal - target_cal
                                percent_off = (diff_cal / target_cal) * 100
                                if abs(percent_off) > 25:
                                    if diff_cal > 0:
                                        corrections.append(f"CALORIES TOO HIGH by {abs(diff_cal):.0f} cal ({abs(percent_off):.0f}%)")
                                        corrections.append(f"  → REDUCE all quantities by ~{min(50, abs(percent_off)):.0f}% (multiply by {1 - min(0.5, abs(percent_off)/100):.1f})")
                                        corrections.append(f"  → OR REMOVE high-calorie foods (>300 cal each)")
                                    else:
                                        corrections.append(f"CALORIES TOO LOW by {abs(diff_cal):.0f} cal ({abs(percent_off):.0f}%)")
                                        corrections.append(f"  → INCREASE all quantities by ~{min(50, abs(percent_off)):.0f}% (multiply by {1 + min(0.5, abs(percent_off)/100):.1f})")

                            if p_match:
                                actual_p = float(p_match.group(1))
                                target_p = float(p_match.group(2))
                                diff_p = actual_p - target_p
                                percent_off = (diff_p / target_p) * 100
                                if abs(percent_off) > 25:
                                    if diff_p > 0:
                                        corrections.append(f"PROTEIN TOO HIGH by {abs(diff_p):.0f}g - use LESS protein sources or lower quantities")
                                    else:
                                        corrections.append(f"PROTEIN TOO LOW by {abs(diff_p):.0f}g - add more chicken/eggs/lean proteins")

                            if f_match:
                                actual_f = float(f_match.group(1))
                                target_f = float(f_match.group(2))
                                diff_f = actual_f - target_f
                                percent_off = (diff_f / target_f) * 100
                                if abs(percent_off) > 25:
                                    if diff_f > 0:
                                        corrections.append(f"FAT TOO HIGH by {abs(diff_f):.0f}g")
                                        corrections.append(f"  → AVOID: bacon, sausage, cheese, oil, fried foods, burgers")
                                        corrections.append(f"  → SWITCH TO: grilled chicken, turkey breast, vegetables")

                            for correction in corrections:
                                feedback += f"{correction}\n"

                        feedback += f"\n🔢 NEXT ATTEMPT:\n"
                        feedback += f"1. Select foods with qty=1.0 first\n"
                        feedback += f"2. Calculate running total as you add each food\n"
                        feedback += f"3. STOP when total is near target (don't overshoot!)\n"
                        feedback += f"4. Adjust quantities up or down to hit 75-125% range\n\n"
                        retry_prompt = prompt + feedback

            # If we exhausted retries, only return best attempt if it's reasonably close
            if best_plan:
                # Check if best attempt is at least somewhat accurate (within 25% tolerance)
                # Don't want to return wildly inaccurate plans
                is_acceptable, _ = self.validate_meal_plan_accuracy(
                    best_plan,
                    foods_by_meal,
                    meal_targets,
                    tolerance=0.25  # More lenient 25% tolerance for fallback
                )

                if is_acceptable:
                    logger.warning(f"Returning best attempt after {max_retries} retries. Remaining issues: {best_errors}")
                    return best_plan
                else:
                    logger.error(f"Best attempt after {max_retries} retries still too inaccurate (>25% off). Rejecting plan. Issues: {best_errors}")
                    return None
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