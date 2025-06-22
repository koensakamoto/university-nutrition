import React from 'react';
import { Info } from 'lucide-react';

export const ProfileSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Sex</label>
          <p className="text-sm text-gray-500 mb-2">
            Nutrient targets can vary based on sex. Update your profile when pregnant or breastfeeding to reconfigure your default nutrient targets.
          </p>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input type="radio" name="sex" className="form-radio h-4 w-4 text-[#c41e3a]" defaultChecked />
              <span className="ml-2">Male</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="sex" className="form-radio h-4 w-4 text-[#c41e3a]" />
              <span className="ml-2">Female</span>
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">Birthday</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Day</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent">
                <option>17</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Month</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent">
                <option>May</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Year</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent">
                <option>2005</option>
              </select>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">Height</label>
          <div className="flex items-center">
            <input type="text" defaultValue="6" className="w-16 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" />
            <span className="mx-2">ft</span>
            <input type="text" defaultValue="0" className="w-16 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" />
            <span className="mx-2">in</span>
            <a href="#" className="text-[#c41e3a] text-sm ml-2 hover:underline">Use Metric (cm)</a>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Current Weight</label>
            <div className="flex items-center">
              <input type="text" defaultValue="169.7" className="w-24 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" />
              <span className="mx-2">lbs</span>
              <button className="text-[#2e7d32] text-sm font-medium hover:underline">UPDATE</button>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            Last updated on Jun 13, 2025
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Body Fat %</label>
            <div className="flex items-center">
              <input type="text" defaultValue="15.3" className="w-24 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" />
              <span className="mx-2">%</span>
              <button className="text-[#2e7d32] text-sm font-medium hover:underline">UPDATE</button>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            Last updated on Jun 13, 2025
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">BMI</label>
          <p className="text-sm text-gray-500 mb-2">
            Your BMI can't be edited as it is a function of your weight & height.
          </p>
          <div className="bg-gray-100 rounded px-3 py-2 w-24 text-gray-700">
            23.0
          </div>
        </div>
      </div>
    </div>
  );
};
