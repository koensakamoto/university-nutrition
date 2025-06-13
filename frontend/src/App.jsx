import React, { useState } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import NutrientTracker from './components/NutrientTracker'

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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <div className="flex flex-grow w-full">
          <Routes>
            <Route
              path="/dashboard"
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
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route
              path="*"
              element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  )
}
