import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Sparkles, Utensils, User, Settings, Activity, Target, Shield, Heart } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

// Format date for API (defined outside component to avoid hoisting issues)
const getLocalDateString = (date) => {
  return date.getFullYear() + '-' +
         String(date.getMonth() + 1).padStart(2, '0') + '-' +
         String(date.getDate()).padStart(2, '0')
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

  const handleGeneratePlan = () => {
    // TODO: Integration with AI meal planning system will be added later
    console.log('Generate meal plan:', {
      breakfast: breakfastHall,
      lunch: lunchHall,
      dinner: dinnerHall,
      targetMode: targetMode,
      customTargets: targetMode === 'custom' ? customTargets : null
    })

    // For now, just show an alert
    alert('AI meal plan generation will be implemented soon!')
  }

  // Check if at least one meal is selected
  const hasMealSelection = breakfastHall || lunchHall || dinnerHall

  // Check if macros sum to 100%
  const macroSum = parseFloat(customTargets.proteinPercent || 0) +
                   parseFloat(customTargets.carbsPercent || 0) +
                   parseFloat(customTargets.fatPercent || 0)
  const macrosValid = Math.abs(macroSum - 100) < 0.1

  // Validation for generate button
  let canGenerate = false
  if (targetMode === 'account') {
    // Account mode: just need at least one meal selected
    canGenerate = hasMealSelection
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
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
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
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-900">Your Profile Summary</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Body Stats */}
                    {userProfile.weight && userProfile.height && (
                      <div className="flex items-start gap-2">
                        <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-900">Body Stats</p>
                          <p className="text-xs text-blue-700">
                            {userProfile.weight} lbs, {userProfile.height} in
                            {userProfile.activity_level && (
                              <span className="block text-blue-600">{userProfile.activity_level}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Macro Targets */}
                    {(userProfile.protein_ratio || userProfile.carb_ratio || userProfile.fat_ratio) && (
                      <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-900">Macro Targets</p>
                          <p className="text-xs text-blue-700">
                            P: {userProfile.protein_ratio || 0}% / C: {userProfile.carb_ratio || 0}% / F: {userProfile.fat_ratio || 0}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Diet Type */}
                    {userProfile.diet_type && (
                      <div className="flex items-start gap-2">
                        <Heart className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-900">Diet Type</p>
                          <p className="text-xs text-blue-700">{userProfile.diet_type}</p>
                        </div>
                      </div>
                    )}

                    {/* Allergens */}
                    {userProfile.allergens && userProfile.allergens.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-900">Avoiding</p>
                          <p className="text-xs text-blue-700">{userProfile.allergens.join(', ')}</p>
                        </div>
                      </div>
                    )}

                    {/* Meal Preferences */}
                    {userProfile.meal_preference && userProfile.meal_preference.length > 0 && (
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <Heart className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-900">Preferences</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {userProfile.meal_preference.map((pref, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Ready to generate your meal plan?
                  </h3>
                  <p className="text-sm text-gray-600">
                    {canGenerate ? (
                      'AI will create a personalized nutrition plan based on your selections'
                    ) : (
                      <>
                        {!(breakfastHall || lunchHall || dinnerHall) && 'Select at least one dining hall to get started'}
                        {(breakfastHall || lunchHall || dinnerHall) && targetMode === 'custom' && !customTargets.calories && 'Enter your daily calorie target'}
                        {(breakfastHall || lunchHall || dinnerHall) && targetMode === 'custom' && customTargets.calories && parseFloat(customTargets.calories) < 1000 && 'Calorie target must be at least 1000'}
                        {(breakfastHall || lunchHall || dinnerHall) && targetMode === 'custom' && customTargets.calories && parseFloat(customTargets.calories) >= 1000 && !macrosValid && (
                          <span className="text-amber-600">⚠ Macros must sum to 100% (currently {macroSum.toFixed(1)}%)</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleGeneratePlan}
                  disabled={!canGenerate}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                    canGenerate
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                  Generate Meal Plan
                </button>
              </div>
            </div>
          </>
        )}
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
