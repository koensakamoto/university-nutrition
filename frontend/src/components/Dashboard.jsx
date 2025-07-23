import React, { useEffect, useState, useCallback } from 'react'
import Filter from './Filter'
import FoodStations from './FoodStations'
import AIAssistant from './AIAssistant'
import CustomMealForm from './CustomMealForm'
import LoadingSpinner from './LoadingSpinner'
import { PlusCircleIcon, CalendarIcon, BuildingIcon, ClockIcon, UtensilsIcon, ArrowRightIcon } from 'lucide-react'
import NutrientTracker from './NutrientTracker'
import { useFetchWithAuth, useAuth } from '../AuthProvider'

const Dashboard = ({ addToTracker, trackedItems, setTrackedItems, removeItem, clearItems, date, setDate, onSavePlate }) => {

  // Helper function to safely parse nutrient values
  const parseNutrient = useCallback((value) => {
    if (value === null || value === undefined || value === '' || value === '-') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }, []);

  const transformFoodData = useCallback((data) => {
    if (!Array.isArray(data)) {
      console.warn("transformFoodData received invalid input:", data);
      return [];
    }

    const stationMap = {};

    data.forEach(item => {
      const stationName = item.station || "Other";
      const station_id = item.station_id || stationName;

      if (!stationMap[station_id]) {
        stationMap[station_id] = {
          name: stationName,
          description: "",
          items: [],
          station_id: station_id
        };
      }

      const n = item.nutrients || {};
      const transformedItem = {
        id: item.id || item._id,
        name: item.name,
        description: item.description,
        portionSize: item.portion_size || '1 serving',
        tags: item.labels || [],
        allergens: item.allergens || [],
        ingredients: item.ingredients,
        trackable: item.trackable, // Preserve trackable field from backend

        // Use parseNutrient helper to handle null/undefined values properly
        calories: parseNutrient(n.calories),
        protein: parseNutrient(n.protein),
        carbs: parseNutrient(n.total_carbohydrates),
        sugars: parseNutrient(n.sugars),
        totalFat: parseNutrient(n.total_fat),
        saturatedFat: parseNutrient(n.saturated_fat),
        cholesterol: parseNutrient(n.cholesterol),
        dietaryFiber: parseNutrient(n.dietary_fiber),
        sodium: parseNutrient(n.sodium),
        potassium: parseNutrient(n.potassium),
        calcium: parseNutrient(n.calcium),
        iron: parseNutrient(n.iron),
        transFat: parseNutrient(n.trans_fat),
        vitaminD: n.vitamin_d || null,
        vitaminA: n.vitamin_a || null,
        vitaminC: parseNutrient(n.vitamin_c),
        saturatedAndTransFat: parseNutrient(n.saturated_and_trans_fat)
      };
      
      
      stationMap[station_id].items.push(transformedItem);
    });

    return Object.values(stationMap);
  }, [parseNutrient]);

  const getLocalDateString = useCallback((date) => {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }, []);

  const [diningHall, setDiningHall] = useState("")
  const [mealType, setMealType] = useState("")
  const [foodStations, setFoodStations] = useState([])
  const [foodStationsLoading, setFoodStationsLoading] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [isCustomMealFormOpen, setIsCustomMealFormOpen] = useState(false)
  const [diningHalls, setDiningHalls] = useState([])
  const [mealTypesByHall, setMealTypesByHall] = useState({})
  const [plateLoading, setPlateLoading] = useState(false)
  const [plateSaving, setPlateSaving] = useState(false)

  const fetchWithAuth = useFetchWithAuth();
  const { user, isAuthenticated } = useAuth();

  // Auto-set today's date on mount if not set
  useEffect(() => {
    if (!date) {
      setDate(new Date());
    }
  }, [date, setDate]); // Include dependencies to prevent stale closures

  // Fetch food stations when all filters are selected
  useEffect(() => {
    if (!date || !diningHall || !mealType) {
      setFoodStations([]);
      setFoodStationsLoading(false);
      return;
    }

    setFoodStationsLoading(true);
    const controller = new AbortController();
    const params = new URLSearchParams({
      dining_hall: diningHall,
      meal_name: mealType,
      date: getLocalDateString(date),
    });

    fetch(`/foods?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        const stations = transformFoodData(data);
        setFoodStations(stations);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch foods:', err);
          setFoodStations([]);
        }
      })
      .finally(() => {
        setFoodStationsLoading(false);
      });

    return () => controller.abort();
  }, [diningHall, date, mealType, transformFoodData]);

  // Load plate on date change
  useEffect(() => {
    if (user && user.guest) {
      setTrackedItems([]);
      setPlateLoading(false);
      return;
    }
    if (!date) return;
    
    const loadPlateForDate = async () => {
      setPlateLoading(true);
      try {
        const dateStr = getLocalDateString(date);
        const { data } = await fetchWithAuth(`/api/plate?date=${dateStr}`);
        if (data && data.items && data.items.length > 0) {
          // Fetch all foods for this date (from all dining halls) to match saved items
          const allFoodsPromise = fetch(`/foods?date=${dateStr}`)
            .then(res => res.json())
            .then(data => transformFoodData(data).flatMap(station => station.items))
            .catch(() => []);
          
          const allFoods = await allFoodsPromise;
          
          const loadedItems = data.items.map(item => {
            if (item.custom_macros) {
              return {
                id: item.food_id || `custom-${crypto.randomUUID()}`,
                name: item.name || 'Custom Food',
                ...item.custom_macros,
                quantity: item.quantity,
                uniqueId: crypto.randomUUID(),
                isCustom: true
              };
            } else {
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
      } catch (err) {
        console.error('Failed to load plate:', err);
        setTrackedItems([]);
      } finally {
        setPlateLoading(false);
      }
    };
    loadPlateForDate();
  }, [date, user]); // Removed allStations from dependencies

  const handleSavePlate = async () => {
    setPlateSaving(true);
    try {
      const plateItems = trackedItems.map(item => {
        const foodId = item.id || item._id;
        const isCustom = String(foodId).startsWith('custom-');
        const base = {
          food_id: foodId,
          quantity: item.quantity || 1
        };
        if (isCustom) {
          if (!item.custom_macros || typeof item.custom_macros !== 'object') {
            return null;
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
      }).filter(Boolean);
      
      if (plateItems.some(i => i === null)) {
        alert('One or more custom foods are missing valid macros. Please fix before saving.');
        return;
      }

      // Call the save plate function passed from parent
      if (onSavePlate) {
        await onSavePlate();
      }
    } catch (error) {
      console.error('Failed to save plate:', error);
      alert('Failed to save plate. Please try again.');
    } finally {
      setPlateSaving(false);
    }
  }

  // Handle data updates from Filter component
  const handleDataUpdate = useCallback((halls, mealsByHall) => {
    setDiningHalls(halls);
    setMealTypesByHall(mealsByHall);
  }, []);

  // Progressive disclosure content rendering
  const renderContent = () => {
    if (!date) {
      return (
        <div className="text-center py-16">
          <CalendarIcon className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Select a date to get started</h3>
          <p className="mt-2 text-sm text-gray-500">
            Choose a date above to see what's available in the dining halls
          </p>
        </div>
      );
    }
    
    if (!diningHall) {
      return (
        <div className="py-8">
          <div className="text-center mb-8">
            <BuildingIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Choose a dining hall</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a dining hall to see today's menu options
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {diningHalls.map(hall => {
              const availableMeals = mealTypesByHall[hall] || [];
              return (
                <div 
                  key={hall} 
                  className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all duration-300 group shadow-sm touch-manipulation"
                  onClick={() => setDiningHall(hall)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                        {hall}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {availableMeals.length} meal{availableMeals.length !== 1 ? 's' : ''} available
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {availableMeals.slice(0, 3).map(meal => (
                          <span 
                            key={meal}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {meal}
                          </span>
                        ))}
                        {availableMeals.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{availableMeals.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    if (!mealType) {
      const availableMeals = mealTypesByHall[diningHall] || [];
      
      return (
        <div className="py-8">
          <div className="text-center mb-8">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Select a meal</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose which meal period you'd like to view at {diningHall}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {availableMeals.map(meal => {
              const currentHour = new Date().getHours();
              let isCurrentMeal = false;
              let timeRange = '';
              
              switch(meal) {
                case 'Breakfast':
                  isCurrentMeal = currentHour >= 7 && currentHour < 10;
                  timeRange = '7:00 AM - 10:00 AM';
                  break;
                case 'Lunch':
                  isCurrentMeal = currentHour >= 11 && currentHour < 15;
                  timeRange = '11:00 AM - 3:00 PM';
                  break;
                case 'Dinner':
                  isCurrentMeal = currentHour >= 17 && currentHour < 21;
                  timeRange = '5:00 PM - 9:00 PM';
                  break;
                case 'Everyday':
                  isCurrentMeal = true;
                  timeRange = 'All day';
                  break;
                default:
                  timeRange = 'Available';
              }
              
              return (
                <div 
                  key={meal}
                  className={`bg-white border rounded-xl p-6 sm:p-8 cursor-pointer transition-all duration-300 group shadow-sm touch-manipulation ${
                    isCurrentMeal 
                      ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  }`}
                  onClick={() => setMealType(meal)}
                >
                  <div className="text-center">
                    <UtensilsIcon className={`mx-auto h-8 w-8 mb-3 ${
                      isCurrentMeal ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <h3 className={`font-semibold ${
                      isCurrentMeal ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-600'
                    }`}>
                      {meal}
                      {isCurrentMeal && meal !== 'Everyday' && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Now serving
                        </span>
                      )}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      isCurrentMeal ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {timeRange}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 group-hover:text-gray-600">
                      Click to view menu →
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // All selections made - show the menu
    return (
      <div className="space-y-8">
        {/* Menu Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {/* Header with Add Custom Meal button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">
                {diningHall} - {mealType} Menu
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsCustomMealFormOpen(true)}
                className="flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-5 py-2.5 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap touch-manipulation"
              >
                <PlusCircleIcon size={18} className="mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Add Custom Meal</span>
                <span className="sm:hidden">Add Custom</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Info banner for non-trackable foods */}
        {!foodStationsLoading && foodStations.length > 0 && 
         foodStations.some(station => station.items.some(item => item.trackable === false)) && (
          <div className="bg-slate-50 border-l-2 border-slate-300 px-4 py-3 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              <p className="text-sm text-slate-600">
                Some items have limited nutrition data. Use <span className="font-medium text-slate-800">"Add Custom Meal"</span> for manual tracking.
              </p>
            </div>
          </div>
        )}
        
        {/* Food Stations */}
        {foodStationsLoading ? (
          <LoadingSpinner message="Loading menu items..." />
        ) : (
          <FoodStations stations={foodStations} addToTracker={addToTracker} />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-grow w-full p-2 sm:p-4 lg:p-6 bg-gray-50 rounded-lg">
      {/* Filter Section with Card Design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 sm:mb-6">
        <Filter
          diningHall={diningHall}
          setDiningHall={setDiningHall}
          date={date}
          setDate={setDate}
          mealType={mealType}
          setMealType={setMealType}
          // Pass callback to receive available options
          onDataUpdate={handleDataUpdate}
        />
      </div>
      
      {/* Mobile Nutrient Tracker with Card Design */}
      <div className="lg:hidden mb-4 sm:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <NutrientTracker
            trackedItems={trackedItems}
            removeItem={removeItem}
            clearItems={clearItems}
            selectedDate={getLocalDateString(date)}
            onSavePlate={handleSavePlate}
            plateLoading={plateLoading}
            plateSaving={plateSaving}
            isMobile={true}
          />
        </div>
      </div>
      
      {/* Content with Progressive Disclosure */}
      <div className="space-y-4">
        {plateLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <LoadingSpinner message="Loading your saved meals..." size="sm" />
          </div>
        )}
        {renderContent()}
      </div>
      
      <CustomMealForm
        isOpen={isCustomMealFormOpen}
        onClose={() => setIsCustomMealFormOpen(false)}
        onAddItem={addToTracker}
      />
      
      {/* Desktop AI Assistant Panel */}
      {isAuthenticated && !user.guest && diningHall && mealType && (
        <div className="hidden md:block mt-6">
          <AIAssistant
            addToTracker={addToTracker}
            diningHall={diningHall}
            mealType={mealType}
            date={date}
          />
        </div>
      )}
    </div>
  )
}

export default Dashboard