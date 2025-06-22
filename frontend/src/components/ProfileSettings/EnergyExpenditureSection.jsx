import React from 'react';
import { Activity, Info, Zap, ZapOff } from 'lucide-react';

export const EnergyExpenditureSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Energy Expenditure</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        Select your preferences to determine the amount of energy you burn daily.
      </p>
      
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Baseline Activity</label>
            <p className="text-sm text-gray-600 mb-2">
              This setting will be replaced throughout the day with imported activity when you connect an App or Device.
            </p>
            <button className="text-[#2e7d32] font-medium hover:underline">UPDATE</button>
          </div>
          <div className="text-right">
            <div className="font-medium">Moderately Active - 907</div>
            <div className="text-sm text-gray-500">kcal</div>
          </div>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Basal Metabolic Rate (BMR)</label>
            <p className="text-sm text-gray-600 mb-4">
              The amount of energy that a person needs to keep the body functioning when at rest.
            </p>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input type="radio" name="bmr" className="form-radio h-4 w-4 text-[#c41e3a]" defaultChecked />
                <span className="ml-2">Default</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="bmr" className="form-radio h-4 w-4 text-[#c41e3a]" />
                <span className="ml-2">Custom</span>
              </label>
            </div>
          </div>
          <div className="text-right font-medium">1814 kcal</div>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Thermic Effect of Food (TEF)</label>
            <p className="text-sm text-gray-600">
              Your energy burned will factor in the energy required for food digestion.
            </p>
          </div>
          <div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input type="checkbox" name="toggle" id="tef" className="outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
              <label htmlFor="tef" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-4">Today's Energy Overview</label>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-20 h-20 transform -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E0E0E0"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="2"
                    strokeDasharray="75, 100"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-bold">2720</div>
                  <div className="text-xs text-gray-500">kcal</div>
                </div>
              </div>
              
              <div className="ml-6 space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#9C27B0] mr-2"></div>
                  <div className="flex-1">
                    <div className="font-medium">Basal Metabolic Rate (BMR)</div>
                    <div className="text-sm text-gray-500">1814 kcal</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#4CAF50] mr-2"></div>
                  <div className="flex-1">
                    <div className="font-medium">Baseline Activity</div>
                    <div className="text-sm text-gray-500">907 kcal</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                  <div className="flex-1">
                    <div className="font-medium">Exercise</div>
                    <div className="text-sm">Added when logged</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                  <div className="flex-1">
                    <div className="font-medium">Tracker Activity</div>
                    <div className="text-sm">Added when logged</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                  <div className="flex-1">
                    <div className="font-medium">Thermic Effect of Food (TEF)</div>
                    <div className="text-sm">Added when logged</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
