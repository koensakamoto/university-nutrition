import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Sparkles, Utensils } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const AIMealPlanner = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // Selections for each meal
  const [breakfastHall, setBreakfastHall] = useState('')
  const [lunchHall, setLunchHall] = useState('')
  const [dinnerHall, setDinnerHall] = useState('')

  // Nutrition target mode: 'account' or 'custom'
  const [targetMode, setTargetMode] = useState('account')

  // Custom nutrition targets
  const [customTargets, setCustomTargets] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  // Track which dining halls are available for each meal type
  const [hallsByMeal, setHallsByMeal] = useState({
    Breakfast: [],
    Lunch: [],
    Dinner: []
  })

  // Format date for API
  const getLocalDateString = (date) => {
    return date.getFullYear() + '-' +
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0')
  }

  // Fetch available dining halls on mount (using today's date)
  useEffect(() => {
    setIsLoading(true)
    const formattedDate = getLocalDateString(new Date())

    fetch(`/api/available-options?date=${formattedDate}`)
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
  }, [])

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

  const canGenerate = breakfastHall || lunchHall || dinnerHall

  // Calculate calories from macros (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
  const calculateCaloriesFromMacros = () => {
    const protein = parseFloat(customTargets.protein) || 0
    const carbs = parseFloat(customTargets.carbs) || 0
    const fat = parseFloat(customTargets.fat) || 0
    return (protein * 4) + (carbs * 4) + (fat * 9)
  }

  const calculatedCalories = calculateCaloriesFromMacros()
  const hasCustomCalories = customTargets.calories !== ''
  const hasCustomMacros = customTargets.protein || customTargets.carbs || customTargets.fat

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
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Nutrition Targets
              </h3>

              {/* Radio Options */}
              <div className="space-y-3 mb-4">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="radio"
                    name="targetMode"
                    value="account"
                    checked={targetMode === 'account'}
                    onChange={(e) => setTargetMode(e.target.value)}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      Use my dietary preferences and nutrition goals
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      AI will use your saved dietary restrictions, allergens, and macro targets
                    </p>
                  </div>
                </label>

                <label className="flex items-start cursor-pointer group">
                  <input
                    type="radio"
                    name="targetMode"
                    value="custom"
                    checked={targetMode === 'custom'}
                    onChange={(e) => setTargetMode(e.target.value)}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      Set custom nutrition targets
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Manually specify calories and macros for this meal plan
                    </p>
                  </div>
                </label>
              </div>

              {/* Custom Targets Inputs - Only show when custom mode is selected */}
              {targetMode === 'custom' && (
                <>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Calories
                        </label>
                        <input
                          type="number"
                          value={customTargets.calories}
                          onChange={(e) => setCustomTargets({...customTargets, calories: e.target.value})}
                          placeholder="2000"
                          className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          value={customTargets.protein}
                          onChange={(e) => setCustomTargets({...customTargets, protein: e.target.value})}
                          placeholder="150"
                          className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Carbs (g)
                        </label>
                        <input
                          type="number"
                          value={customTargets.carbs}
                          onChange={(e) => setCustomTargets({...customTargets, carbs: e.target.value})}
                          placeholder="200"
                          className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Fat (g)
                        </label>
                        <input
                          type="number"
                          value={customTargets.fat}
                          onChange={(e) => setCustomTargets({...customTargets, fat: e.target.value})}
                          placeholder="65"
                          className="block w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Macro-Calorie Relationship Indicator */}
                    {hasCustomMacros && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700">
                              Calories from macros: <span className="font-semibold text-gray-900">{Math.round(calculatedCalories)}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Protein & Carbs: 4 cal/g • Fat: 9 cal/g
                            </p>
                          </div>
                          {hasCustomCalories && Math.abs(parseFloat(customTargets.calories) - calculatedCalories) > 50 && (
                            <div className="text-xs text-amber-600 font-medium">
                              ⚠ Macros don't match calories
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Ready to generate your meal plan?
                  </h3>
                  <p className="text-sm text-gray-600">
                    {canGenerate
                      ? 'AI will create a personalized nutrition plan based on your selections'
                      : 'Select at least one dining hall to get started'}
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
