import React, { useState, useMemo } from 'react'
import FoodItem from './FoodItem'
import { ChevronDownIcon, ChevronUpIcon, SearchIcon, XIcon } from 'lucide-react'
const FoodStations = ({ stations, addToTracker }) => {
  console.log("stations", stations)

  const [expandedStations, setExpandedStations] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  
  // Auto-collapse: only allow one station to be expanded at a time
  const toggleStation = (stationId) => {
    setExpandedStations((prev) => {
      const isCurrentlyExpanded = prev[stationId]
      if (isCurrentlyExpanded) {
        // Collapse current station
        return { [stationId]: false }
      } else {
        // Expand this station and collapse all others
        return { [stationId]: true }
      }
    })
  }
  
  // Filter stations and items based on search query
  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations
    
    return stations.map(station => {
      const filteredItems = station.items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags && item.tags.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )) ||
        (item.ingredients && item.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      )
      
      return {
        ...station,
        items: filteredItems
      }
    }).filter(station => station.items.length > 0)
  }, [stations, searchQuery])
  
  const clearSearch = () => {
    setSearchQuery('')
  }
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search food items, ingredients, or dietary tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            Found {filteredStations.reduce((total, station) => total + station.items.length, 0)} items
            {filteredStations.length < stations.length && ` across ${filteredStations.length} stations`}
          </div>
        )}
      </div>
      
      {filteredStations.map((station) => (
        <div
          key={station.station_id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          <button
            onClick={() => toggleStation(station.station_id)}
            className="w-full flex justify-between items-center p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {station.name}
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {station.items.length} item{station.items.length !== 1 ? 's' : ''}
                </span>
              </div>
              {station.description && (
                <p className="text-sm text-gray-600 mt-1">{station.description}</p>
              )}
            </div>
            <div className="ml-4">
              {expandedStations[station.station_id] ? (
                <ChevronUpIcon size={24} className="text-gray-400" />
              ) : (
                <ChevronDownIcon size={24} className="text-gray-400" />
              )}
            </div>
          </button>
          {expandedStations[station.station_id] && (
            <div className="border-t border-gray-100">
              <div className="divide-y divide-gray-100">
                {station.items.map((item) => (
                  <FoodItem
                    key={item.id}
                    item={item}
                    addToTracker={addToTracker}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
export default FoodStations
