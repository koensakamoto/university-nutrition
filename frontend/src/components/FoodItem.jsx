import React, { useState } from 'react'
import {
  PlusIcon,
  MinusIcon,
  InfoIcon,
  LeafIcon,
  SaladIcon,
  BeefIcon,
  ThermometerIcon,
  XIcon,
} from 'lucide-react'

const FoodItem = ({ item, addToTracker }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [servings, setServings] = useState(1);

  // Helper function to display nutrient values, showing '-' for null/undefined
  const displayNutrient = (value, unit = '', defaultText = '-') => {
    if (value === null || value === undefined) {
      return defaultText;
    }
    return `${value}${unit}`;
  };

  // Helper function to calculate calories from macros (only if all values are available)
  const calculateCalories = (value, multiplier) => {
    if (value === null || value === undefined) {
      return '-';
    }
    return (value * multiplier).toFixed(0);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }
  
  const renderTag = (tag) => {
    const normalized = String(tag).toLowerCase()
    switch (normalized) {
      case 'vegetarian':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <SaladIcon size={12} className="mr-1" />
            Vegetarian
          </span>
        )
      case 'vegan':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-900">
            <LeafIcon size={12} className="mr-1" />
            Vegan
          </span>
        )
      case 'protein':
      case 'good source of protein':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <BeefIcon size={12} className="mr-1" />
            Protein
          </span>
        )
      case 'climate-friendly':
      case 'climate friendly':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            <ThermometerIcon size={12} className="mr-1" />
            Climate Friendly
          </span>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span className="mr-3">{item.portionSize}</span>
            <span className="font-medium">{displayNutrient(item.calories, ' cal')}</span>
          </div>
          <div className="mt-2 space-x-1">
            {(item.tags || []).map((tag) => (
              <span key={tag} className="inline-block mr-1 mb-1">
                {renderTag(tag)}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1">
              <button
                onClick={() => setServings(Math.max(0.1, Math.round((servings - 0.1) * 10) / 10))}
                className="p-1 hover:bg-gray-200 rounded-l-lg focus:outline-none"
                aria-label="Decrease servings"
                tabIndex={-1}
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={servings}
                onChange={e => setServings(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-12 text-center bg-transparent border-none focus:ring-2 focus:ring-blue-400 focus:bg-white rounded outline-none appearance-none mx-1"
                aria-label="Servings"
                style={{
                  MozAppearance: 'textfield',
                  appearance: 'textfield'
                }}
              />
              <button
                onClick={() => setServings(Math.round((servings + 0.1) * 10) / 10)}
                className="p-1 hover:bg-gray-200 rounded-r-lg focus:outline-none"
                aria-label="Increase servings"
                tabIndex={-1}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                addToTracker(item, servings);
                setServings(1);
              }}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-1 rounded-full"
              aria-label="Add item to plate"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800"
      >
        <InfoIcon className="h-3 w-3 mr-1" />
        {showDetails ? 'Hide details' : 'Show details'}
      </button>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="font-bold border-b border-gray-200 pb-1">
              Nutrition Facts
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="font-medium">Calories:</span>{' '}
                {displayNutrient(item.calories)}
              </div>
              <div>
                <span className="font-medium">Calories from Fat:</span>{' '}
                {calculateCalories(item.totalFat, 9)}
              </div>
              <div>
                <span className="font-medium">Calories from Carbs:</span>{' '}
                {calculateCalories(item.carbs, 4)}
              </div>
              <div>
                <span className="font-medium">Calories from Protein:</span>{' '}
                {calculateCalories(item.protein, 4)}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="font-medium">Total Fat:</span>{' '}
                  {displayNutrient(item.totalFat, 'g')}
                </div>
                <div>
                  <span className="font-medium">Saturated Fat:</span>{' '}
                  {displayNutrient(item.saturatedFat, 'g')}
                </div>
                <div>
                  <span className="font-medium">Trans Fat:</span>{' '}
                  {displayNutrient(item.transFat, 'g')}
                </div>
                <div>
                  <span className="font-medium">Cholesterol:</span>{' '}
                  {displayNutrient(item.cholesterol, 'mg')}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="font-medium">Total Carbs:</span>{' '}
                  {displayNutrient(item.carbs, 'g')}
                </div>
                <div>
                  <span className="font-medium">Dietary Fiber:</span>{' '}
                  {displayNutrient(item.dietaryFiber, 'g')}
                </div>
                <div>
                  <span className="font-medium">Sugars:</span>{' '}
                  {displayNutrient(item.sugars, 'g')}
                </div>
                <div>
                  <span className="font-medium">Protein:</span>{' '}
                  {displayNutrient(item.protein, 'g')}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="font-medium">Sodium:</span>{' '}
                  {displayNutrient(item.sodium, 'mg')}
                </div>
                <div>
                  <span className="font-medium">Potassium:</span>{' '}
                  {displayNutrient(item.potassium, 'mg')}
                </div>
                <div>
                  <span className="font-medium">Calcium:</span>{' '}
                  {displayNutrient(item.calcium, 'mg')}
                </div>
                <div>
                  <span className="font-medium">Iron:</span>{' '}
                  {displayNutrient(item.iron, 'mg')}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="font-medium">Vitamin C:</span>{' '}
                  {displayNutrient(item.vitaminC, 'mg')}
                </div>
                <div>
                  <span className="font-medium">Vitamin D:</span>{' '}
                  {item.vitaminD && item.vitaminD !== '-' ? `${item.vitaminD} IU` : '-'}
                </div>
              </div>
            </div>

  

            {item.description && (
              <div className="text-sm text-gray-600 mt-2">{item.description}</div>
            )}
            {item.ingredients && item.ingredients.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="font-medium text-amber-700">Ingredients:</span>{' '}
                {item.ingredients.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default FoodItem
