import React, { useState } from 'react';
import NutritionChart from './NutritionChart';
import { WeightChart } from './WeightChart';
import { MacroChart } from './MacroChart';
import { NutritionSummary } from './NutritionSummary';
import { DateRangeSelector } from './DateRangeSelector';
import { FilterControl } from './FilterControl';

export default function NutritionHistory(props) {
  const [dateRange, setDateRange] = useState('last-week');
  const [viewMode, setViewMode] = useState('daily');

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nutrition History</h1>
              <p className="text-gray-600">Track your eating patterns and nutritional progress</p>
            </div>
            
            <DateRangeSelector 
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {/* Content starts directly with the summary */}

          {/* Nutrition Summary */}
          <NutritionSummary />
          
          {/* Energy Consumed Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Energy Consumed</h2>
                <p className="text-sm text-gray-500">Jun 15 - Jun 21, 2025</p>
              </div>
              
              <div className="flex space-x-2 mt-3 md:mt-0">
                <FilterControl
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>
            </div>
            
            <MacroChart unit="kcal" viewMode={viewMode} />
          </div>
          
          {/* Weight Tracking Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Weight Progress</h2>
                <p className="text-sm text-gray-500">Dec 24, 2024 to Jun 21, 2025</p>
              </div>
              
              <div className="flex space-x-2 mt-3 md:mt-0">
                <button className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium text-gray-700">
                  Last 6 months ▾
                </button>
                <button className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium text-gray-700">
                  All Days ▾
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <WeightChart />
            
            <div className="flex justify-end mt-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <span className="w-3 h-3 inline-block rounded-full bg-[#c41e3a] mr-1"></span>
                  <span className="text-sm text-gray-600">Weight</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 inline-block rounded-full bg-[#b7e4c7] mr-1"></span>
                  <span className="text-sm text-gray-600">Goal Weight</span>
                </div>
                
              </div>
            </div>
          </div>
          
          {/* Additional Nutrition Charts */}
          <NutritionChart />
        </div>
      </div>
    </div>
  );
}
