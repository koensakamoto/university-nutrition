import React, { useState } from 'react'
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
import {ProfileSettings} from "./components/ProfileSettings/ProfileSettings"
import {NutritionHistory} from "./components/nutritionHistory/NutritionHistory"
import UserAccount from './components/accountPage/UserAccount';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [trackedItems, setTrackedItems] = useState([])
  const handleLogin = () => {
    setIsLoggedIn(true)
  }
  const handleLogout = () => {
    setIsLoggedIn(false)
  }
  const addToTracker = (item, quantity = 1) => {
    const newItem = {
      ...item,
      quantity: quantity,
      uniqueId: crypto.randomUUID()
    };
    setTrackedItems((prev) => [...prev, newItem]);
  }
 const removeFromTracker = (itemId) => {
  console.log("Before removal:", trackedItems);
  setTrackedItems(prev => {
    const updated = prev.filter(item => item.id !== itemId);
    console.log("After removal:", updated);
    return updated;
  });
};
  const clearTracker = () => {
    setTrackedItems([])
  }
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<HomeLayout isLoggedIn={isLoggedIn} onLogout={handleLogout} />}
        >
          <Route index element={<Navigate to={isLoggedIn ? 'dashboard' : 'login'} />} />
          <Route
            path="dashboard"
            element={
              <div className="flex flex-col md:flex-row w-full flex-grow p-4 gap-4">
                <Dashboard
                  isLoggedIn={isLoggedIn}
                  addToTracker={addToTracker}
                  trackedItems={trackedItems}
                  removeItem={removeFromTracker}
                  clearItems={clearTracker}
                />
                <div className="hidden md:block md:w-1/4">
                  <NutrientTracker
                    trackedItems={trackedItems}
                    removeItem={removeFromTracker}
                    clearItems={clearTracker}
                  />
                </div>
              </div>
            }
          />

          <Route path="login" element={<Login onLogin={handleLogin} />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="history" element={<NutritionHistory/> }/>
          <Route path="account" element={<UserAccount/>}/>
          
          <Route 
            path="*"
            element={<Navigate to="/" />}
          />
        </Route>
      </Routes>
    </Router>
  )
}
