import React, { useEffect, useState } from 'react'
import Filter from './Filter'
import FoodStations from './FoodStations'
import AIAssistant from './AIAssistant'
import CustomMealForm from './CustomMealForm'
import { MessageCircleIcon, PlusCircleIcon } from 'lucide-react'
import NutrientTracker from './NutrientTracker'
import { useFetchWithAuth, useAuth } from '../AuthProvider'


const Dashboard = ({ isLoggedIn, addToTracker, trackedItems, setTrackedItems, removeItem, clearItems, date, setDate, onSavePlate }) => {
  const transformFoodData = (data) => {
    if (!Array.isArray(data)) {
      console.warn("transformFoodData received invalid input:", data);
      return [];
    }

    const stationMap = {};

    data.forEach(item => {
      const stationName = item.station || "Other";
      const station_id = item.station_id || stationName; // fallback to name if id missing

      if (!stationMap[station_id]) {
        stationMap[station_id] = {
          name: stationName,
          description: "",
          items: [],
          station_id: station_id
        };
      }

      const n = item.nutrients || {};
      stationMap[station_id].items.push({
        id: item.id || item._id,
        name: item.name,
        description: item.description,
        portionSize: item.portion_size || '1 serving',
        tags: item.labels || [],
        allergens: item.allergens || [],
        ingredients: item.ingredients,


        calories: parseInt(n.calories) || 0,
        protein: parseInt(n.protein) || 0,
        carbs: parseInt(n.total_carbohydrates) || 0,
        sugar: parseFloat(n.sugar) || 0,
        totalFat: parseFloat(n.total_fat) || 0,
        saturatedFat: parseFloat(n.saturated_fat) || 0,
        cholesterol: parseFloat(n.cholesterol) || 0,
        dietaryFiber: parseFloat(n.dietary_fiber) || 0,
        sodium: parseFloat(n.sodium) || 0,
        potassium: parseFloat(n.potassium) || 0,
        calcium: parseFloat(n.calcium) || 0,
        iron: parseFloat(n.iron) || 0,
        transFat: parseFloat(n.trans_fat) || 0,
        vitaminD: n.vitamin_d || '-',
        vitaminA: n.vitamin_a || '-',
        vitaminC: n.vitamin_c,
        saturatedAndTransFat: n.saturated_and_trans_fat || '-'
      });
    });

    return Object.values(stationMap);
  };

  // Utility to get local date string in YYYY-MM-DD format
  function getLocalDateString(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  const [diningHall, setDiningHall] = useState("Urban Bytes @ Kahlert Village")
  const [mealType, setMealType] = useState("Breakfast")
  const [foodStations, setFoodStations] = useState([])
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [isCustomMealFormOpen, setIsCustomMealFormOpen] = useState(false)
  const fetchWithAuth = useFetchWithAuth();
  const { user } = useAuth();
  const[allStations, setAllStations] = useState([])

  useEffect(() => {
    const params = new URLSearchParams({
      dining_hall: diningHall,
      meal_name: mealType,
      date: getLocalDateString(date),
    });

    fetch(`http://localhost:8000/foods?${params}`)
      .then((res) => {
        // console.log("Fetch response:", res);
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        // console.log("Raw fetched data:", data);
        const stations = transformFoodData(data);
        setFoodStations(stations);
      })
      .catch((err) => {
        console.error('Failed to fetch foods:', err);
        const stations = transformFoodData(mockFoodStations.flatMap(station => station.items.map(item => ({...item, station: station.name}))));
        setFoodStations(stations);
      });
  }, [diningHall, date, mealType]);

  useEffect(() => {
    const params = new URLSearchParams({
      dining_hall: diningHall,
      date: getLocalDateString(date),
    });
    fetch(`http://localhost:8000/foods?${params}`)
    .then((res) => {
      // console.log("Fetch response:", res);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then((data) => {
      const stations = transformFoodData(data);
      setAllStations(stations);
    })
    .catch((err) => {
      console.error('Failed to fetch foods:', err);
      const stations = transformFoodData(mockFoodStations.flatMap(station => station.items.map(item => ({...item, station: station.name}))));
      setAllStations(stations);
    });
  }, [date]);

  useEffect(() => {
    console.log('Updated food stations:', foodStations);
  }, [foodStations]);

  useEffect(() => {
    console.log('allStations', allStations);
  }, [allStations]);

  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant)
  }

  // Load plate on date or foodStations change
  useEffect(() => {

    if (user && user.guest) {
      setTrackedItems([]);
      return;
    }
    if (!allStations.length) return; // Wait until foodStations is loaded
    const loadPlateForDate = async () => {
      const dateStr = getLocalDateString(date);
      const { data, error } = await fetchWithAuth(`/api/plate?date=${dateStr}`);
      if (data && data.items && data.items.length > 0) {
        // Flatten all food items from all stations
        const allFoods = allStations.flatMap(station => station.items);
        console.log('allFoods', allFoods);
        // Debug log for ID matching
        // data.items.forEach(item => {
        //   console.log('Plate item food_id:', item.food_id, 'All foods:', allFoods.map(f => f.id || f._id));
        // });
        // Reconstruct trackedItems
        const loadedItems = data.items.map(item => {
          if (item.custom_macros) {
            // Handle custom food
            return {
              id: item.food_id || `custom-${crypto.randomUUID()}`,
              name: item.name || 'Custom Food',
              ...item.custom_macros,
              quantity: item.quantity,
              uniqueId: crypto.randomUUID(),
              isCustom: true
            };
          } else {
            // Standard food
            const food = allFoods.find(f => f.id === item.food_id || f._id === item.food_id);
            if (!food) return null;
            return {
              ...food,
              quantity: item.quantity,
              uniqueId: crypto.randomUUID()
            };
          }
        }).filter(Boolean);
        setTrackedItems(loadedItems);
      } else {
        setTrackedItems([]);
      }
    };
    loadPlateForDate();
    // eslint-disable-next-line
  }, [date, user, allStations]);

  const handleSavePlate = async () => {
    const plateItems = trackedItems.map(item => {
      const foodId = item.id || item._id;
      const isCustom = String(foodId).startsWith('custom-');
      const base = {
        food_id: foodId,
        quantity: item.quantity || 1
      };
      if (isCustom) {
        if (!item.custom_macros || typeof item.custom_macros !== 'object') {
          // console.warn('Custom food missing valid custom_macros:', item);
          // Optionally, show a UI error here
          return null; // Mark as invalid
        }
        base.custom_macros = {
          calories: item.custom_macros.calories,
          protein: item.custom_macros.protein,
          carbs: item.custom_macros.carbs,
          fat: item.custom_macros.fat
        };
        base.name = item.name || 'Custom Food';
      }
      return base;
    }).filter(Boolean); // Remove any nulls
    // Only save if all items are valid
    if (plateItems.some(i => i === null)) {
      alert('One or more custom foods are missing valid macros. Please fix before saving.');
      return;
    }
    // ... existing code ...
  }

  return (
    <div className="flex flex-col flex-grow w-full md:w-3/4 p-4 bg-white rounded-lg">
      <Filter
        diningHall={diningHall}
        setDiningHall={setDiningHall}
        date={date}
        setDate={setDate}
        mealType={mealType}
        setMealType={setMealType}
      />
      <div className="md:hidden mt-4 border rounded-lg flex flex-col flex-grow">
          <NutrientTracker
            trackedItems={trackedItems}
            removeItem={removeItem}
            clearItems={clearItems}
            selectedDate={getLocalDateString(date)}
            onSavePlate={onSavePlate}
          />
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div>
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
        <button
          onClick={() => setIsCustomMealFormOpen(true)}
          className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <PlusCircleIcon size={20} className="mr-2" />
          <span>Add Custom Meal</span>
        </button>
      </div>
      <div className="mt-4">
        <FoodStations stations={foodStations} addToTracker={addToTracker} />
      </div>
      <CustomMealForm
        isOpen={isCustomMealFormOpen}
        onClose={() => setIsCustomMealFormOpen(false)}
        onAddItem={addToTracker}
      />
      {/* Mobile AI Assistant FAB */}
      {/* <button
        onClick={toggleAIAssistant}
        className="md:hidden fixed right-4 bottom-20 bg-blue-600 text-white p-3 rounded-full shadow-lg z-10"
      >
        <MessageCircleIcon size={24} />
      </button> */}
      {/* Desktop AI Assistant Panel */}
      <div className="hidden md:block mt-6">
        <AIAssistant
          addToTracker={addToTracker}
          diningHall={diningHall}
          mealType={mealType}
          date={date}
        />
      </div>
      {/* Mobile AI Assistant Panel (when active) */}
      {/* {showAIAssistant && (
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
            <AIAssistant
              isMobile={true}
              addToTracker={addToTracker}
              diningHall={diningHall}
              mealType={mealType}
              date={date}
            />
          </div>
        </div>
      )} */}
    </div>
  )
}
export default Dashboard
