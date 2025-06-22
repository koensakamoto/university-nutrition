import React from 'react';
import { Info, Scale } from 'lucide-react';

export const WeightGoalSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Weight Goal</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        We will calculate your daily calorie budget based on your goal.
      </p>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Current Weight</label>
            <div className="text-2xl font-semibold text-gray-800">170 lbs</div>
          </div>
          <button className="text-[#2e7d32] font-medium hover:underline">UPDATE</button>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Weight Goal</label>
            <div className="text-2xl font-semibold text-[#c41e3a]">170 lbs</div>
          </div>
          <button className="text-[#2e7d32] font-medium hover:underline">UPDATE</button>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">Weight Goal Overview</label>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-2">
              <Scale size={28} className="text-gray-600" />
            </div>
            <div className="font-medium text-gray-800 mb-1">Maintain Weight</div>
            <div className="text-sm text-gray-600 mb-2">Energy Target</div>
            <div className="text-2xl font-bold text-[#c41e3a]">2721 kcal</div>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">Weight Goal Timeline</label>
          <div className="h-32 bg-white relative border border-gray-100 rounded-lg p-3">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#4CAF50]"></div>
            <div className="absolute left-[10%] top-1/2 w-3 h-3 bg-[#4CAF50] rounded-full transform -translate-y-1/2"></div>
            <div className="absolute left-[35%] top-1/2 w-3 h-3 bg-[#4CAF50] rounded-full transform -translate-y-1/2"></div>
            <div className="absolute left-[60%] top-1/2 w-3 h-3 bg-[#4CAF50] rounded-full transform -translate-y-1/2"></div>
            <div className="absolute left-[85%] top-1/2 w-3 h-3 bg-[#4CAF50] rounded-full transform -translate-y-1/2"></div>
            
            <div className="absolute left-0 bottom-0 text-xs text-gray-500">23. Jun</div>
            <div className="absolute left-[30%] bottom-0 text-xs text-gray-500">25. Jun</div>
            <div className="absolute left-[55%] bottom-0 text-xs text-gray-500">27. Jun</div>
            <div className="absolute left-[80%] bottom-0 text-xs text-gray-500">30. Jun</div>
            
            <div className="absolute left-0 top-0 text-xs text-gray-500">170</div>
            <div className="absolute left-0 top-1/3 text-xs text-gray-500">169</div>
            <div className="absolute left-0 top-2/3 text-xs text-gray-500">168</div>
          </div>
        </div>
      </div>
    </div>
  );
};
