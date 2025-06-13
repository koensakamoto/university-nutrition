import React, { useEffect, useState } from 'react'
import Filter from './Filter'
import FoodStations from './FoodStations'
import AIAssistant from './AIAssistant'
import { MessageCircleIcon } from 'lucide-react'
// Mock data for food stations
const mockFoodStations = [
  {
    id: 1,
    name: '500 Degrees',
    description: 'Pizza and Italian specialties',
    items: [
      {
        id: 101,
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and basil',
        portionSize: '1 slice',
        calories: 250,
        protein: 12,
        carbs: 30,
        fat: 10,
        tags: ['vegetarian'],
        allergens: ['dairy', 'gluten'],
      },
      {
        id: 102,
        name: 'Pepperoni Pizza',
        description: 'Pizza with tomato sauce, mozzarella, and pepperoni',
        portionSize: '1 slice',
        calories: 300,
        protein: 14,
        carbs: 30,
        fat: 15,
        tags: [],
        allergens: ['dairy', 'gluten'],
      },
    ],
  },
  {
    id: 2,
    name: 'Carrots',
    description: 'Vegetarian and vegan options',
    items: [
      {
        id: 201,
        name: 'Garden Salad',
        description: 'Fresh mixed greens with assorted vegetables',
        portionSize: '1 bowl',
        calories: 120,
        protein: 3,
        carbs: 15,
        fat: 6,
        tags: ['vegan', 'climate-friendly'],
        allergens: [],
      },
      {
        id: 202,
        name: 'Quinoa Bowl',
        description: 'Quinoa with roasted vegetables and tahini dressing',
        portionSize: '1 bowl',
        calories: 350,
        protein: 10,
        carbs: 45,
        fat: 14,
        tags: ['vegan', 'climate-friendly'],
        allergens: ['sesame'],
      },
    ],
  },
  {
    id: 3,
    name: 'Grill Station',
    description: 'Burgers and grilled items',
    items: [
      {
        id: 301,
        name: 'Cheeseburger',
        description: 'Beef patty with cheese on a brioche bun',
        portionSize: '1 burger',
        calories: 550,
        protein: 28,
        carbs: 35,
        fat: 32,
        tags: ['protein'],
        allergens: ['dairy', 'gluten'],
      },
      {
        id: 302,
        name: 'Grilled Chicken Sandwich',
        description: 'Grilled chicken breast with lettuce and tomato',
        portionSize: '1 sandwich',
        calories: 420,
        protein: 35,
        carbs: 40,
        fat: 12,
        tags: ['protein'],
        allergens: ['gluten'],
      },
    ],
  },
]
const Dashboard = ({ isLoggedIn, addToTracker }) => {
  const [diningHall, setDiningHall] = useState('Main Hall')
  const [date, setDate] = useState(new Date())
  const [mealType, setMealType] = useState('Lunch')
  const [foodStations, setFoodStations] = useState([])
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  useEffect(() => {
    // In a real app, we would fetch data based on selected filters
    // For now, we'll just use our mock data
    setFoodStations(mockFoodStations)
  }, [diningHall, date, mealType])
  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant)
  }
  return (
    <div className="flex flex-col flex-grow w-full md:w-3/4 p-4">
      <Filter
        diningHall={diningHall}
        setDiningHall={setDiningHall}
        date={date}
        setDate={setDate}
        mealType={mealType}
        setMealType={setMealType}
      />
      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-800">
          {diningHall} - {mealType} Menu
        </h2>
        <p className="text-gray-600">
          {date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
      <div className="mt-4">
        <FoodStations stations={foodStations} addToTracker={addToTracker} />
      </div>
      {/* Mobile AI Assistant FAB */}
      <button
        onClick={toggleAIAssistant}
        className="md:hidden fixed right-4 bottom-20 bg-blue-600 text-white p-3 rounded-full shadow-lg z-10"
      >
        <MessageCircleIcon size={24} />
      </button>
      {/* Desktop AI Assistant Panel */}
      <div className="hidden md:block mt-6">
        <AIAssistant />
      </div>
      {/* Mobile AI Assistant Panel (when active) */}
      {showAIAssistant && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 flex items-end">
          <div className="bg-white rounded-t-xl w-full p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nutrition Assistant</h3>
              <button onClick={toggleAIAssistant} className="text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <AIAssistant isMobile={true} />
          </div>
        </div>
      )}
    </div>
  )
}
export default Dashboard
