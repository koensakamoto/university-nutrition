import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Utensils, User, Settings, Shield, Zap, PieChart, Leaf, Scale, Star } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

// Format date for API (defined outside component to avoid hoisting issues)
const getLocalDateString = (date) => {
  return date.getFullYear() + '-' +
         String(date.getMonth() + 1).padStart(2, '0') + '-' +
         String(date.getDate()).padStart(2, '0')
}

// Map allergen IDs to display labels
const allergenLabels = {
  'milk': 'Dairy',
  'eggs': 'Eggs',
  'fish': 'Fish',
  'shellfish': 'Shellfish',
  'tree_nuts': 'Tree Nuts',
  'peanuts': 'Peanuts',
  'wheat': 'Wheat',
  'soybeans': 'Soy',
  'gluten': 'Gluten',
  'lactose': 'Lactose',
}

const formatAllergenDisplay = (allergenIds) => {
  if (!allergenIds || allergenIds.length === 0) return ''
  return allergenIds
    .map(id => allergenLabels[id] || id.charAt(0).toUpperCase() + id.slice(1))
    .join(', ')
}

const AIMealPlanner = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // Selections for each meal
  const [breakfastHall, setBreakfastHall] = useState('')
  const [lunchHall, setLunchHall] = useState('')
  const [dinnerHall, setDinnerHall] = useState('')

  // Date selection
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()))

  // Nutrition target mode: 'account' or 'custom'
  const [targetMode, setTargetMode] = useState('account')

  // User profile data
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Custom nutrition targets (percentages)
  const [customTargets, setCustomTargets] = useState({
    calories: '',
    proteinPercent: '30',
    carbsPercent: '40',
    fatPercent: '30'
  })

  // Track which dining halls are available for each meal type
  const [hallsByMeal, setHallsByMeal] = useState({
    Breakfast: [],
    Lunch: [],
    Dinner: []
  })

  // Meal plan generation state
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const [mealPlan, setMealPlan] = useState(null)

  // Fetch user profile on mount
  useEffect(() => {
    setProfileLoading(true)
    fetch('/api/profile', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        // Backend returns {email, profile: {...}, hasPassword}
        setUserProfile(data.profile || {})
      })
      .catch((error) => {
        console.error('Error fetching profile:', error)
        setUserProfile(null)
      })
      .finally(() => {
        setProfileLoading(false)
      })
  }, [])

  // Fetch available dining halls when date changes
  useEffect(() => {
    setIsLoading(true)

    fetch(`/api/available-options?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        const halls = data.dining_halls || []
        const mealsByHall = data.meal_types_by_hall || {}

        // Organize which halls are available for each meal
        const organized = {
          Breakfast: [],
          Lunch: [],
          Dinner: []
        }

        halls.forEach(hall => {
          const meals = mealsByHall[hall] || []
          if (meals.includes('Breakfast')) organized.Breakfast.push(hall)
          if (meals.includes('Lunch')) organized.Lunch.push(hall)
          if (meals.includes('Dinner')) organized.Dinner.push(hall)
        })

        setHallsByMeal(organized)
      })
      .catch((error) => {
        console.error('Error fetching dining halls:', error)
        setHallsByMeal({ Breakfast: [], Lunch: [], Dinner: [] })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [selectedDate])

  const handleGeneratePlan = async () => {
    // Build the request
    const dining_hall_meals = []
    if (breakfastHall) dining_hall_meals.push({ meal_type: 'breakfast', dining_hall: breakfastHall })
    if (lunchHall) dining_hall_meals.push({ meal_type: 'lunch', dining_hall: lunchHall })
    if (dinnerHall) dining_hall_meals.push({ meal_type: 'dinner', dining_hall: dinnerHall })

    const requestBody = {
      date: selectedDate,
      dining_hall_meals: dining_hall_meals,
      use_profile_data: targetMode === 'account',
      use_profile_preferences: targetMode === 'account'
    }

    // Add custom targets if in custom mode
    if (targetMode === 'custom') {
      requestBody.target_calories = parseInt(customTargets.calories)
      requestBody.protein_percent = parseFloat(customTargets.proteinPercent)
      requestBody.carbs_percent = parseFloat(customTargets.carbsPercent)
      requestBody.fat_percent = parseFloat(customTargets.fatPercent)
    }

    // Call API
    setGenerating(true)
    setGenerationError(null)
    setMealPlan(null)

    try {
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorDetail = errorData.detail || 'Failed to generate meal plan'

        // Map technical errors to user-friendly messages
        let userMessage = errorDetail
        if (errorDetail.includes('No food data available')) {
          userMessage = 'No menu data available for the selected date and dining halls. Please try a different date or dining hall.'
        } else if (errorDetail.includes('AI meal planning temporarily unavailable')) {
          userMessage = 'AI meal planning is temporarily unavailable. Please try again later.'
        } else if (errorDetail.includes('tuple') || errorDetail.includes('await') || errorDetail.includes('async')) {
          userMessage = 'A technical error occurred. Please try again or contact support if the issue persists.'
        } else if (response.status === 401 || response.status === 403) {
          userMessage = 'Your session has expired. Please refresh the page and log in again.'
        } else if (response.status === 500) {
          userMessage = 'An unexpected error occurred while generating your meal plan. Please try again.'
        }

        throw new Error(userMessage)
      }

      const data = await response.json()
      setMealPlan(data)
    } catch (error) {
      console.error('Meal plan generation error:', error)

      // Handle network errors
      if (error.message.includes('Failed to fetch') || error.message === 'Network request failed') {
        setGenerationError('Unable to connect to the server. Please check your internet connection and try again.')
      } else {
        setGenerationError(error.message)
      }
    } finally {
      setGenerating(false)
    }
  }

  // Check if at least one meal is selected
  const hasMealSelection = breakfastHall || lunchHall || dinnerHall

  // Check if macros sum to 100%
  const macroSum = parseFloat(customTargets.proteinPercent || 0) +
                   parseFloat(customTargets.carbsPercent || 0) +
                   parseFloat(customTargets.fatPercent || 0)
  const macrosValid = Math.abs(macroSum - 100) < 0.1

  // Check if profile is complete (has all required fields)
  const isProfileComplete = userProfile &&
                           userProfile.weight &&
                           userProfile.height &&
                           userProfile.birthday &&
                           userProfile.activity_level &&
                           userProfile.weight_goal &&
                           (userProfile.protein_ratio || userProfile.protein_grams) &&
                           (userProfile.carb_ratio || userProfile.carb_grams) &&
                           (userProfile.fat_ratio || userProfile.fat_grams)

  // Validation for generate button
  let canGenerate = false
  if (targetMode === 'account') {
    // Account mode: need at least one meal selected AND complete profile
    canGenerate = hasMealSelection && isProfileComplete
  } else {
    // Custom mode: need meal + valid calories + valid macros
    canGenerate = hasMealSelection &&
                  customTargets.calories &&
                  parseFloat(customTargets.calories) >= 1000 &&
                  macrosValid
  }

  // Macro preset options
  const macroPresets = [
    { name: 'Balanced', protein: 30, carbs: 40, fat: 30 },
    { name: 'High Protein', protein: 40, carbs: 30, fat: 30 },
    { name: 'Low Carb', protein: 35, carbs: 20, fat: 45 },
    { name: 'High Carb', protein: 25, carbs: 50, fat: 25 }
  ]

  const applyPreset = (preset) => {
    setCustomTargets({
      ...customTargets,
      proteinPercent: preset.protein.toString(),
      carbsPercent: preset.carbs.toString(),
      fatPercent: preset.fat.toString()
    })
  }

  // Calculate grams from percentages (for display)
  const calculateGramsFromPercent = (percent, calories, isFat = false) => {
    if (!calories || !percent) return 0
    const caloriesFromMacro = (calories * percent) / 100
    // Protein and carbs: 4 cal/g, Fat: 9 cal/g
    return Math.round(caloriesFromMacro / (isFat ? 9 : 4))
  }

  return (
    <div className="flex flex-col flex-grow w-full p-2 sm:p-4 lg:p-6 bg-gray-50 rounded-lg">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900">AI Meal Planner</h1>
          </div>
          <p className="text-sm text-gray-600">
            Select dining halls for each meal and generate a personalized nutrition plan
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading dining hall options..." />
        ) : (
          <>
            {/* Nutrition Target Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4 sm:mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Nutrition Targets
              </h3>

              {/* Card-based selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Use Profile Option */}
                <div
                  onClick={() => setTargetMode('account')}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    targetMode === 'account'
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      targetMode === 'account' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <User className={`h-5 w-5 ${
                        targetMode === 'account' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold ${
                          targetMode === 'account' ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          My Profile
                        </h4>
                        {targetMode === 'account' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full font-medium">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Use saved preferences and goals
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Option */}
                <div
                  onClick={() => setTargetMode('custom')}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    targetMode === 'custom'
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      targetMode === 'custom' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Settings className={`h-5 w-5 ${
                        targetMode === 'custom' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-semibold ${
                          targetMode === 'custom' ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          Custom Targets
                        </h4>
                        {targetMode === 'custom' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full font-medium">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Set specific calories and macros
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Preview - Enhanced */}
              {targetMode === 'account' && userProfile && (
                <div className="p-5 bg-white rounded-2xl border border-gray-200">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-900">Your Profile Summary</p>
                  </div>

                  {/* Warning when profile data is incomplete */}
                  {!isProfileComplete && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900">
                          Complete your profile to generate personalized meal plans
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Add the following information in Settings:
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1.5">Required</p>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>• Age, gender, weight, and height</div>
                            <div>• Activity level and weight goal</div>
                            <div>• Macro targets (protein, carbs, fat)</div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1.5">Optional</p>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>• Diet type and meal preferences</div>
                            <div>• Allergens and dietary restrictions</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    {/* Row 1, Col 1: Daily Calorie Target */}
                    {userProfile.daily_calorie_target && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Zap className="h-5 w-5 text-gray-400" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">Daily Calorie Target</p>
                          <p className="text-base text-gray-900 font-semibold">
                            {userProfile.daily_calorie_target} kcal
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Row 1, Col 2: Macro Targets */}
                    {(userProfile.protein_ratio || userProfile.carb_ratio || userProfile.fat_ratio) && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <PieChart className="h-5 w-5 text-gray-400" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">Macro Targets</p>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {userProfile.protein_grams !== undefined && (
                              <div>P: <span className="font-semibold text-gray-900">{userProfile.protein_grams}g</span> <span className="text-gray-400">({userProfile.protein_ratio || 0}%)</span></div>
                            )}
                            {userProfile.carb_grams !== undefined && (
                              <div>C: <span className="font-semibold text-gray-900">{userProfile.carb_grams}g</span> <span className="text-gray-400">({userProfile.carb_ratio || 0}%)</span></div>
                            )}
                            {userProfile.fat_grams !== undefined && (
                              <div>F: <span className="font-semibold text-gray-900">{userProfile.fat_grams}g</span> <span className="text-gray-400">({userProfile.fat_ratio || 0}%)</span></div>
                            )}
                            {!userProfile.protein_grams && !userProfile.carb_grams && !userProfile.fat_grams && (
                              <div>P: {userProfile.protein_ratio || 0}% / C: {userProfile.carb_ratio || 0}% / F: {userProfile.fat_ratio || 0}%</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Row 2, Col 1: Diet Type */}
                    {userProfile.diet_type && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Leaf className="h-5 w-5 text-gray-400" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">Diet Type</p>
                          <p className="text-sm text-gray-900 font-medium capitalize">{userProfile.diet_type}</p>
                        </div>
                      </div>
                    )}

                    {/* Row 2, Col 2: Allergens */}
                    {((userProfile.allergens && userProfile.allergens.length > 0) || (userProfile.food_sensitivities && userProfile.food_sensitivities.length > 0) || userProfile.allergen_notes || userProfile.allergy_notes) && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Shield className="h-5 w-5 text-gray-400" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">Avoiding</p>
                          {(userProfile.allergens && userProfile.allergens.length > 0) || (userProfile.food_sensitivities && userProfile.food_sensitivities.length > 0) ? (
                            <p className="text-sm text-gray-900 font-medium">
                              {[
                                ...(userProfile.allergens || []),
                                ...(userProfile.food_sensitivities || [])
                              ].length > 0 ? formatAllergenDisplay([
                                ...(userProfile.allergens || []),
                                ...(userProfile.food_sensitivities || [])
                              ]) : ''}
                            </p>
                          ) : null}
                          {(userProfile.allergen_notes || userProfile.allergy_notes) && (
                            <p className="text-xs text-gray-600 mt-1">{userProfile.allergen_notes || userProfile.allergy_notes}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Row 3, Col 1: Body Stats */}
                    {userProfile.weight && userProfile.height && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Scale className="h-5 w-5 text-gray-400" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">Body Stats</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {userProfile.weight} lbs, {userProfile.height} in
                          </p>
                          {userProfile.activity_level && (
                            <p className="text-xs text-gray-500 capitalize mt-1">Activity: {userProfile.activity_level}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Row 3, Col 2: Meal Preferences */}
                    {userProfile.meal_preference && userProfile.meal_preference.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <Star className="h-5 w-5 text-gray-400" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-1">Preferences</p>
                          <div className="flex flex-wrap gap-1.5">
                            {userProfile.meal_preference.map((pref, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium">
                                {pref}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {targetMode === 'account' && profileLoading && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-xs text-gray-600">Loading your profile data...</p>
                </div>
              )}

              {targetMode === 'account' && !profileLoading && userProfile && Object.keys(userProfile).length === 0 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                  <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Complete your profile in settings to use personalized nutrition targets.
                  </p>
                </div>
              )}

              {/* Custom Targets Inputs - Only show when custom mode is selected */}
              {targetMode === 'custom' && (
                <>
                  <div className="pt-3 border-t border-gray-200">
                    {/* Macro Presets */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Quick Presets
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {macroPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                          >
                            {preset.name}
                            <span className="ml-1 text-gray-500">
                              ({preset.protein}/{preset.carbs}/{preset.fat})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calorie Target */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Daily Calorie Target
                      </label>
                      <input
                        type="number"
                        value={customTargets.calories}
                        onChange={(e) => setCustomTargets({...customTargets, calories: e.target.value})}
                        placeholder="2000"
                        min="1000"
                        max="5000"
                        className="block w-full sm:w-48 px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                      />
                    </div>

                    {/* Macro Percentages */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Protein %
                        </label>
                        <input
                          type="number"
                          value={customTargets.proteinPercent}
                          onChange={(e) => setCustomTargets({...customTargets, proteinPercent: e.target.value})}
                          placeholder="30"
                          min="10"
                          max="50"
                          step="1"
                          className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        />
                        {customTargets.calories && (
                          <p className="text-xs text-gray-500 mt-1">
                            ≈ {calculateGramsFromPercent(parseFloat(customTargets.proteinPercent), parseFloat(customTargets.calories), false)}g
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Carbs %
                        </label>
                        <input
                          type="number"
                          value={customTargets.carbsPercent}
                          onChange={(e) => setCustomTargets({...customTargets, carbsPercent: e.target.value})}
                          placeholder="40"
                          min="10"
                          max="70"
                          step="1"
                          className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        />
                        {customTargets.calories && (
                          <p className="text-xs text-gray-500 mt-1">
                            ≈ {calculateGramsFromPercent(parseFloat(customTargets.carbsPercent), parseFloat(customTargets.calories), false)}g
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Fat %
                        </label>
                        <input
                          type="number"
                          value={customTargets.fatPercent}
                          onChange={(e) => setCustomTargets({...customTargets, fatPercent: e.target.value})}
                          placeholder="30"
                          min="15"
                          max="50"
                          step="1"
                          className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        />
                        {customTargets.calories && (
                          <p className="text-xs text-gray-500 mt-1">
                            ≈ {calculateGramsFromPercent(parseFloat(customTargets.fatPercent), parseFloat(customTargets.calories), true)}g
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Validation Indicator */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            Total: <span className={`font-semibold ${macrosValid ? 'text-green-600' : 'text-amber-600'}`}>
                              {macroSum.toFixed(1)}%
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {macrosValid ? '✓ Macros sum to 100%' : '⚠ Macros must sum to 100%'}
                          </p>
                        </div>
                        {!macrosValid && (
                          <button
                            onClick={() => applyPreset(macroPresets[0])}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Auto-fix
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Meal Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Breakfast */}
              <MealCard
                title="Breakfast"
                halls={hallsByMeal.Breakfast}
                selectedHall={breakfastHall}
                onSelect={setBreakfastHall}
              />

              {/* Lunch */}
              <MealCard
                title="Lunch"
                halls={hallsByMeal.Lunch}
                selectedHall={lunchHall}
                onSelect={setLunchHall}
              />

              {/* Dinner */}
              <MealCard
                title="Dinner"
                halls={hallsByMeal.Dinner}
                selectedHall={dinnerHall}
                onSelect={setDinnerHall}
              />
            </div>

            {/* Generate Button */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left flex-1">
                  {canGenerate ? (
                    <>
                      <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                        Ready to generate
                      </h3>
                      <p className="text-xs text-gray-500">
                        AI-powered meal planning based on your goals
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {!(breakfastHall || lunchHall || dinnerHall) && 'Select at least one dining hall to get started'}
                      {(breakfastHall || lunchHall || dinnerHall) && targetMode === 'account' && !isProfileComplete && 'Complete your profile to generate personalized meal plans'}
                      {(breakfastHall || lunchHall || dinnerHall) && targetMode === 'custom' && !customTargets.calories && 'Enter your daily calorie target'}
                      {(breakfastHall || lunchHall || dinnerHall) && targetMode === 'custom' && customTargets.calories && parseFloat(customTargets.calories) < 1000 && 'Calorie target must be at least 1000'}
                      {(breakfastHall || lunchHall || dinnerHall) && targetMode === 'custom' && customTargets.calories && parseFloat(customTargets.calories) >= 1000 && !macrosValid && (
                        <span className="text-gray-700">⚠ Macros must sum to 100% (currently {macroSum.toFixed(1)}%)</span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleGeneratePlan}
                  disabled={!canGenerate || generating}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                    canGenerate && !generating
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {generating ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Meal Plan
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Loading State */}
            {generating && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Creating Your Personalized Meal Plan
                </h3>
                <p className="text-sm text-gray-600">
                  Our AI is analyzing your meal selections and selecting optimal foods for your nutrition goals...
                  <br />
                  <span className="text-xs text-gray-500 mt-2 block">This may take 30-60 seconds</span>
                </p>
              </div>
            )}

            {/* Error State */}
            {generationError && !generating && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Unable to Generate Meal Plan
                    </h3>
                    <p className="text-sm text-red-700 mb-3">
                      {generationError}
                    </p>
                    <button
                      onClick={() => setGenerationError(null)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success State - Meal Plan Results */}
            {mealPlan && !generating && (
              <div className="mt-8">
                <MealPlanResults plan={mealPlan} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Meal Plan Results Component
const MealPlanResults = ({ plan }) => {
  // Calculate percentage of target
  const caloriePercentage = Math.round((plan.total_calories / plan.target_calories) * 100)

  // Format date nicely
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Nutrition Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-5">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Meal Plan</div>
          <h3 className="text-xl font-bold text-gray-900">{formatDate(plan.date)}</h3>
        </div>

        {/* Calories */}
        <div className="mb-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Calories</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{Math.round(plan.total_calories)}</span>
                <span className="text-base text-gray-400">/ {plan.target_calories}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-600">{caloriePercentage}%</div>
            </div>
          </div>
          <div className="relative w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500 bg-blue-600"
              style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <div className="text-xs text-gray-500 mb-1">Protein</div>
            <div className="text-xl font-bold text-gray-900">{Math.round(plan.total_protein)}g</div>
            <div className="text-xs text-gray-400 mt-0.5">{plan.actual_macros.protein.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Carbs</div>
            <div className="text-xl font-bold text-gray-900">{Math.round(plan.total_carbs)}g</div>
            <div className="text-xs text-gray-400 mt-0.5">{plan.actual_macros.carbs.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Fat</div>
            <div className="text-xl font-bold text-gray-900">{Math.round(plan.total_fat)}g</div>
            <div className="text-xs text-gray-400 mt-0.5">{plan.actual_macros.fat.toFixed(0)}%</div>
          </div>
        </div>

        {/* Status message */}
        {!plan.success && plan.message && (
          <div className="pt-5 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              {plan.message.replace(/⚠️|⚠/g, '').trim()}
            </div>
          </div>
        )}
      </div>

      {/* Meals */}
      <div className="space-y-3">
        {plan.meals.map((meal, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Meal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-bold text-gray-900">
                    {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                  </h4>
                  <span className="bg-white text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
                    {meal.dining_hall}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(meal.total_calories)}</div>
                  <div className="text-xs text-gray-500 font-medium">calories</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-white rounded-lg px-3 py-1.5 border border-gray-200">
                  <span className="text-xs text-gray-500 font-medium">Protein</span>
                  <span className="ml-1.5 text-sm font-semibold text-gray-900">{Math.round(meal.total_protein)}g</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-1.5 border border-gray-200">
                  <span className="text-xs text-gray-500 font-medium">Carbs</span>
                  <span className="ml-1.5 text-sm font-semibold text-gray-900">{Math.round(meal.total_carbs)}g</span>
                </div>
                <div className="bg-white rounded-lg px-3 py-1.5 border border-gray-200">
                  <span className="text-xs text-gray-500 font-medium">Fat</span>
                  <span className="ml-1.5 text-sm font-semibold text-gray-900">{Math.round(meal.total_fat)}g</span>
                </div>
              </div>
            </div>

            {/* Foods */}
            <div className="divide-y divide-gray-100">
              {meal.foods.map((food, foodIdx) => (
                <div key={foodIdx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-1.5">{food.food_name}</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                        <span className="font-medium">Qty: {food.quantity}x</span>
                        <span>{Math.round(food.calories)} cal</span>
                        <span>P: {Math.round(food.protein)}g</span>
                        <span>C: {Math.round(food.carbs)}g</span>
                        <span>F: {Math.round(food.fat)}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Reusable Meal Card Component
const MealCard = ({ title, halls, selectedHall, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {halls.length === 0 ? (
          <div className="text-center py-6">
            <Utensils className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No dining halls available</p>
          </div>
        ) : (
          <>
            {/* Show first 3 options or all if expanded */}
            <div className="space-y-2">
              {halls.slice(0, isExpanded ? halls.length : 3).map((hall) => (
                <button
                  key={hall}
                  onClick={() => onSelect(selectedHall === hall ? '' : hall)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                    selectedHall === hall
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{hall}</span>
                    {selectedHall === hall && (
                      <span className="text-blue-600 text-xs font-semibold">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Expand/Collapse button if more than 3 halls */}
            {halls.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {isExpanded ? 'Show less' : `Show ${halls.length - 3} more`}
              </button>
            )}

            {/* Optional meal indicator */}
            {!selectedHall && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Optional - skip if not needed
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AIMealPlanner
