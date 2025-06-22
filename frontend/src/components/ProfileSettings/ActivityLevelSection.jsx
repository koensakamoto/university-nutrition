import React from 'react';
import { Activity, Info } from 'lucide-react';

export const ActivityLevelSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Activity Level</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        Your activity level helps us calculate your daily energy requirements more accurately.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <input 
            type="radio" 
            id="sedentary" 
            name="activity" 
            className="mt-1 form-radio h-4 w-4 text-[#c41e3a]" 
          />
          <div>
            <label htmlFor="sedentary" className="font-medium text-gray-800 block">Sedentary</label>
            <p className="text-sm text-gray-600">Little to no exercise, desk job</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <input 
            type="radio" 
            id="light" 
            name="activity" 
            className="mt-1 form-radio h-4 w-4 text-[#c41e3a]" 
          />
          <div>
            <label htmlFor="light" className="font-medium text-gray-800 block">Lightly Active</label>
            <p className="text-sm text-gray-600">Light exercise 1-3 days/week</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <input 
            type="radio" 
            id="moderate" 
            name="activity" 
            className="mt-1 form-radio h-4 w-4 text-[#c41e3a]" 
            defaultChecked
          />
          <div>
            <label htmlFor="moderate" className="font-medium text-gray-800 block">Moderately Active</label>
            <p className="text-sm text-gray-600">Moderate exercise 3-5 days/week</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <input 
            type="radio" 
            id="very" 
            name="activity" 
            className="mt-1 form-radio h-4 w-4 text-[#c41e3a]" 
          />
          <div>
            <label htmlFor="very" className="font-medium text-gray-800 block">Very Active</label>
            <p className="text-sm text-gray-600">Hard exercise 6-7 days/week</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <input 
            type="radio" 
            id="extra" 
            name="activity" 
            className="mt-1 form-radio h-4 w-4 text-[#c41e3a]" 
          />
          <div>
            <label htmlFor="extra" className="font-medium text-gray-800 block">Extremely Active</label>
            <p className="text-sm text-gray-600">Very hard exercise, physical job or training twice a day</p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center bg-gray-50 p-4 rounded-lg">
            <Activity size={24} className="text-[#c41e3a] mr-3" />
            <div>
              <div className="font-medium">Daily activity multiplier: <span className="text-[#c41e3a]">1.55x</span></div>
              <p className="text-sm text-gray-600">This affects your calorie needs calculation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
