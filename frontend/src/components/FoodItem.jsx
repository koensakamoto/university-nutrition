import React, { useState } from 'react'
import {
  PlusIcon,
  InfoIcon,
  LeafIcon,
  SaladIcon,
  BeefIcon,
  ThermometerIcon,
  XIcon,
} from 'lucide-react'



const FoodItem = ({ item, addToTracker }) => {
  const [showDetails, setShowDetails] = useState(false)



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
            <span className="font-medium">{item.calories} cal</span>
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
          <button
            onClick={toggleDetails}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <InfoIcon size={20} />
          </button>
          <button
            onClick={() => addToTracker(item)}
            className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
          >
            <PlusIcon size={20} />
          </button>
        </div>
      </div>
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="font-bold border-b border-gray-200 pb-1">
              Nutrition Facts
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="font-medium">Calories:</span>{' '}
                {item.calories}
              </div>
              <div>
                <span className="font-medium">Calories from Fat:</span>{' '}
                {(item.totalFat) * 9}
              </div>
              <div>
                <span className="font-medium">Calories from Carbs:</span>{' '}
                {(item.totalFat) * 4}
              </div>
              <div>
                <span className="font-medium">Calories from Protein:</span>{' '}
                {(item.protein) * 4}
              </div>
            </div>


            <div className="border-t border-gray-200 pt-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span className="font-medium">Total Fat:</span>{' '}
                    {item.totalFat}g
                  </div>
                  <div>
                    <span className="font-medium">Saturated Fat:</span>{' '}
                    {(item.saturatedFat)}g
                  </div>
                  <div>
                    <span className="font-medium">Trans Fat:</span>{' '}
                    {(item.transFat)}g
                  </div>
                  <div>
                    <span className="font-medium">Cholesterol:</span>{' '}
                    {(item.cholesterol)}mg
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span className="font-medium">Total Carbs:</span>{' '}
                    {(item.carbs)}g
                  </div>
                  <div>
                    <span className="font-medium">Dietary Fiber:</span>{' '}
                    {(item.dietaryFiber)}g
                  </div>
                  <div>
                    <span className="font-medium">Sugar:</span>{' '}
                    {(item.sugar)}g
                  </div>
                  <div>
                    <span className="font-medium">Protein:</span>{' '}
                    {(item.protein)}g
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span className="font-medium">Sodium:</span>{' '}
                    {(item.sodium)}mg
                  </div>
                  <div>
                    <span className="font-medium">Potassium:</span>{' '}
                    {(item.potassium)}mg
                  </div>
                  <div>
                    <span className="font-medium">Calcium:</span>{' '}
                    {(item.calcium)}mg
                  </div>
                  <div>
                    <span className="font-medium">Iron:</span>{' '}
                    {(item.iron)}mg
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span className="font-medium">Vitamin C:</span>{' '}
                    {item.vitaminC
                      ? `${item.vitaminC}mg`
                      : '-'}
                  </div>
                  <div>
                    <span className="font-medium">Vitamin D:</span>{' '}
                    {item.vitaminD
                      ? `${item.vitaminD} IU`
                      : '-'}
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
