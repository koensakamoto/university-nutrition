import React from 'react';
import { Info } from 'lucide-react';

export const MacroTargetsSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Macro & Energy Targets</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        Targets for protein, carbs, fat and energy.
      </p>
      
      <div className="space-y-6">
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Set macro targets using</label>
            <div className="flex space-x-2">
              <button className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm">Ratios</button>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm">Fixed Targets</button>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm">Keto Calculator</button>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <h3 className="font-medium text-gray-800">Macro Ratios</h3>
              <Info size={14} className="ml-2 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Macro Ratios divides energy into protein, carbs, and fat. As your weight changes, so do your targets to keep your ratios steady.
            </p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#4CAF50] mr-2"></div>
                    <span className="font-medium">Protein</span>
                  </div>
                  <span>29%</span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div style={{ width: "58%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#4CAF50]"></div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>172g</span>
                    <span className="text-gray-500">225g</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#2196F3] mr-2"></div>
                    <span className="font-medium">Net Carbs</span>
                  </div>
                  <span>58%</span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div style={{ width: "76%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#2196F3]"></div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>344g</span>
                    <span className="text-gray-500">450g</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#FFC107] mr-2"></div>
                    <span className="font-medium">Fat</span>
                  </div>
                  <span>12%</span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div style={{ width: "77%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#FFC107]"></div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>73g</span>
                    <span className="text-gray-500">95g</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="mb-1">Energy Target</div>
            <p className="text-xs text-gray-500 mb-2">Calculated from your Weight Goal.</p>
            <div className="text-3xl font-bold text-gray-800">2721 kcal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
