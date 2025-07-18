import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import HomeLayout from './components/HomeLayout'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import NutrientTracker from './components/NutrientTracker'
import ProfileSettings from "./components/ProfileSettings/ProfileSettings"
import NutritionHistory from './components/nutritionHistory/NutritionHistory.jsx'
import UserAccount from './components/accountPage/UserAccount'
import Register from './components/Register'
import { useAuth } from './AuthProvider'

// Utility to get local date string in YYYY-MM-DD format
function getLocalDateString(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

// Add a PrivateRoute component for authenticated, non-guest users
function PrivateRoute({ children }) {
  const { user, loading, error } = useAuth(); 


  if(loading){
    return <div>Loading...</div>;
  }

  if (!user || user.guest) {
    return <Navigate to="/login" replace />;
  }
  return children;
}


export default function App() {
  const { user, logout } = useAuth();
  const [trackedItems, setTrackedItems] = React.useState([])
  const [date, setDate] = React.useState(new Date())
  
  

  const addToTracker = (item, quantity = 1) => {
    const newItem = {
      ...item,
      quantity: quantity,
      uniqueId: crypto.randomUUID()
    };
    setTrackedItems((prev) => [...prev, newItem]);
  }

  const removeFromTracker = (itemId) => {
    setTrackedItems(prev => prev.filter(item => item.uniqueId !== itemId));
  };

  const clearTracker = () => {
    setTrackedItems([])
  }

  const handleSavePlate = async () => {

    console.log('handleSavePlate called');
    const plateItems = trackedItems.map(item => {
      console.log('item', item);

      const foodId = item.id || item._id;
      const isCustom = String(foodId).startsWith('custom-');
      const base = {
        food_id: foodId,
        quantity: item.quantity || 1
      };
      if (isCustom) {
        base.custom_macros = {
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          totalFat: item.totalFat,
          name: item.name
        };
      }
      return base;
    });
    console.log('plateItems', plateItems);
    const res = await fetch('/api/plate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        date: getLocalDateString(date),
        items: plateItems
      })
    });
    if (res.ok) {
      console.log('Plate saved successfully');
    } else {
      console.error('Failed to save plate');
    }
  }

  return (
      <Routes>
        <Route 
          path="/" 
          element={<HomeLayout isLoggedIn={!!user} onLogout={logout} />}
        >
          <Route index element={<Navigate to={user ? 'dashboard' : 'login'} />} />
          <Route
            path="dashboard"
            element={
              <div className="flex flex-col md:flex-row w-full flex-grow p-4 gap-4">
                <Dashboard
                  addToTracker={addToTracker}
                  trackedItems={trackedItems}
                  setTrackedItems={setTrackedItems}
                  removeItem={removeFromTracker}
                  clearItems={clearTracker}
                  date={date}
                  setDate={setDate}
                  onSavePlate={handleSavePlate}
                />
                <div className="hidden md:block md:w-1/4">
                  <NutrientTracker
                    trackedItems={trackedItems}
                    removeItem={removeFromTracker}
                    clearItems={clearTracker}
                    selectedDate={getLocalDateString(date)}
                    onSavePlate={handleSavePlate}
                  />
                </div>
              </div>
            }
          />

          <Route path="login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="register" element={<Register />} />
          <Route path="profile" element={<PrivateRoute><ProfileSettings /></PrivateRoute>} />
          <Route path="account" element={<PrivateRoute><UserAccount /></PrivateRoute>} />
          <Route path="history" element={<PrivateRoute><NutritionHistory /></PrivateRoute>} />
          <Route 
            path="*"
            element={<Navigate to="/" />}
          />
        </Route>
      </Routes>
  )
}
