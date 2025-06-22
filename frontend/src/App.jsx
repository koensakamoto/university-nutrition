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
import ProfilePage from './components/ProfilePage'
import {ProfileSettings} from "./components/ProfileSettings/ProfileSettings"

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [trackedItems, setTrackedItems] = useState([])
  const handleLogin = () => {
    setIsLoggedIn(true)
  }
  const handleLogout = () => {
    setIsLoggedIn(false)
  }
  const addToTracker = (item) => {
    setTrackedItems((prev) => [...prev, item])
  }
  const removeFromTracker = (itemId) => {
    setTrackedItems((prev) => prev.filter((item) => item.id !== itemId))
  }
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
              <div className="flex flex-col md:flex-row w-full">
                <Dashboard
                  isLoggedIn={isLoggedIn}
                  addToTracker={addToTracker}
                />
                <NutrientTracker
                  trackedItems={trackedItems}
                  removeItem={removeFromTracker}
                  clearItems={clearTracker}
                />
              </div>
            }
          />

          <Route path="login" element={<Login onLogin={handleLogin} />} />
          <Route path="profile" element={<ProfileSettings />} />
          
          <Route 
            path="*"
            element={<Navigate to="/" />}
          />
        </Route>
      </Routes>
    </Router>
  )
}
