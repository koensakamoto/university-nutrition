import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const AllergensSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Food Allergies & Intolerances</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              For severe allergies, please also notify the campus dining staff directly.
            </p>
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        Select any allergies or intolerances to help us mark foods that may be unsafe for you.
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Common Allergens</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Milk</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Eggs</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Fish</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Shellfish</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Tree Nuts</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Peanuts</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Wheat</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Soybeans</span>
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Other Food Sensitivities</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Gluten</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Lactose</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">MSG</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Sulfites</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">FODMAP</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#c41e3a] rounded" />
                <span className="ml-2">Histamine</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-gray-700 font-medium mb-2">Additional Allergies or Notes</label>
          <textarea 
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" 
            rows={3}
            placeholder="List any other food allergies or special considerations..."
          ></textarea>
        </div>
        
        <div className="flex justify-end mt-4">
          <button className="bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition">
            Save Allergen Information
          </button>
        </div>
      </div>
    </div>
  );
};
