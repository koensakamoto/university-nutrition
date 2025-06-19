import React, { useState } from 'react'
import FoodItem from './FoodItem'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
const FoodStations = ({ stations, addToTracker }) => {
  console.log("stations", stations)


  const [expandedStations, setExpandedStations] = useState({})
  const toggleStation = (stationId) => {
    setExpandedStations((prev) => ({
      ...prev,
      [stationId]: !prev[stationId],
    }))
  }
  return (
    <div className="space-y-4">
      {stations.map((station) => (
        <div
          key={station.station_id}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <button
            onClick={() => toggleStation(station.station_id)}
            className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                {station.name}
              </h3>
              <p className="text-sm text-gray-500">{station.description}</p>
            </div>
            {expandedStations[station.station_id] ? (
              <ChevronUpIcon size={20} className="text-gray-500" />
            ) : (
              <ChevronDownIcon size={20} className="text-gray-500" />
            )}
          </button>
          {expandedStations[station.station_id] && (
            <div className="border-t border-gray-200 divide-y divide-gray-200">
              {station.items.map((item) => (
                <FoodItem
                  key={item.id}
                  item={item}
                  addToTracker={addToTracker}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
export default FoodStations
