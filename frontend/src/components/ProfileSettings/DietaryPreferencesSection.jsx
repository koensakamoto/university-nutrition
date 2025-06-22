import React from 'react';
import { Info, Utensils } from 'lucide-react';

export const DietaryPreferencesSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Dietary Preferences</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        Set your dietary preferences to help us customize your meal recommendations.
      </p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Diet Type</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent">
            <option value="regular">Regular (No Restrictions)</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="pescatarian">Pescatarian</option>
            <option value="keto">Ketogenic</option>
            <option value="paleo">Paleo</option>
            <option value="mediterranean">Mediterranean</option>
            <option value="low-carb">Low Carb</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">Meal Preferences</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
              <span className="ml-2">Low Sodium</span>
            </label>
            <label className="flex items-center bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
              <span className="ml-2">Low Sugar</span>
            </label>
            <label className="flex items-center bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
              <span className="ml-2">High Protein</span>
            </label>
            <label className="flex items-center bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
              <span className="ml-2">High Fiber</span>
            </label>
            <label className="flex items-center bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
              <span className="ml-2">Gluten-Free</span>
            </label>
            <label className="flex items-center bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
              <span className="ml-2">Dairy-Free</span>
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">Cultural Preferences</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent">
            <option value="none">No Specific Preference</option>
            <option value="halal">Halal</option>
            <option value="kosher">Kosher</option>
            <option value="hindu">Hindu Dietary Customs</option>
            <option value="buddhist">Buddhist Dietary Customs</option>
          </select>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg flex items-center">
          <Utensils size={24} className="text-[#c41e3a] mr-3" />
          <div>
            <div className="font-medium text-gray-800">Your meal plans will be customized based on these preferences</div>
            <p className="text-sm text-gray-600">You can update these settings any time</p>
          </div>
        </div>
      </div>
    </div>
  );
};
