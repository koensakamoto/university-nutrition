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
    switch (tag) {
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
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <BeefIcon size={12} className="mr-1" />
            Protein
          </span>
        )
      case 'climate-friendly':
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
            {item.tags.map((tag) => (
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
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{item.description}</div>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div>
              <span className="font-medium">Protein:</span> {item.protein}g
            </div>
            <div>
              <span className="font-medium">Carbs:</span> {item.carbs}g
            </div>
            <div>
              <span className="font-medium">Fat:</span> {item.fat}g
            </div>
          </div>
          {item.allergens && item.allergens.length > 0 && (
            <div className="mt-2 text-xs">
              <span className="font-medium text-amber-700">Allergens:</span>{' '}
              {item.allergens.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default FoodItem
