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
import { useAuth } from './AuthProvider'

export default function App() {
  const { user, logout } = useAuth();
  const [trackedItems, setTrackedItems] = React.useState([])

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

  return (
    <Router>
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
                  removeItem={removeFromTracker}
                  clearItems={clearTracker}
                />
                <div className="hidden md:block md:w-1/4">
                  <NutrientTracker
                    key={trackedItems.length} 
                    trackedItems={trackedItems}
                    removeItem={removeFromTracker}
                    clearItems={clearTracker}
                  />
                </div>
              </div>
            }
          />

          <Route path="login" element={<Login />} />
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
