import React, { useState } from 'react';
import { Info, Minimize, TrendingDown, TrendingUp } from 'lucide-react';

export const WeightGoalRateSection = () => {
  const [goalType, setGoalType] = useState('lose');
  const [rateOption, setRateOption] = useState('moderate');
  
  // Calculate values based on selected options
  const getRateValues = () => {
    if (goalType === 'maintain') {
      return {
        lbsPerWeek: 0,
        calorieAdjustment: 0,
        estimatedTime: 'N/A'
      };
    }
    
    const direction = goalType === 'lose' ? -1 : 1;
    let lbsPerWeek = 0;
    
    switch (rateOption) {
      case 'slow':
        lbsPerWeek = 0.5;
        break;
      case 'moderate':
        lbsPerWeek = 1;
        break;
      case 'fast':
        lbsPerWeek = 1.5;
        break;
    }
    
    // 3500 calories roughly equals 1 pound of fat
    const calorieAdjustment = Math.round(lbsPerWeek * 3500 / 7) * direction;
    const estimatedTime = goalType === 'lose' ? '10 weeks' : '8 weeks'; // Mock values
    
    return {
      lbsPerWeek: lbsPerWeek * direction,
      calorieAdjustment,
      estimatedTime
    };
  };
  
  const values = getRateValues();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Weight Goal Rate</h2>
          <Info size={16} className="ml-2 text-gray-400" />
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        Select your weight goal and preferred rate of progress. This will adjust your daily calorie target.
      </p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-3">Weight Goal Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setGoalType('lose')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                goalType === 'lose' 
                  ? 'border-[#c41e3a] bg-[#c41e3a]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TrendingDown size={20} className={goalType === 'lose' ? 'text-[#c41e3a] mr-2' : 'text-gray-500 mr-2'} />
              <span className={goalType === 'lose' ? 'font-medium text-[#c41e3a]' : 'text-gray-700'}>Lose Weight</span>
            </button>
            
            <button
              onClick={() => setGoalType('maintain')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                goalType === 'maintain' 
                  ? 'border-[#4CAF50] bg-[#4CAF50]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Minimize size={20} className={goalType === 'maintain' ? 'text-[#4CAF50] mr-2' : 'text-gray-500 mr-2'} />
              <span className={goalType === 'maintain' ? 'font-medium text-[#4CAF50]' : 'text-gray-700'}>Maintain</span>
            </button>
            
            <button
              onClick={() => setGoalType('gain')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                goalType === 'gain' 
                  ? 'border-[#2196F3] bg-[#2196F3]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TrendingUp size={20} className={goalType === 'gain' ? 'text-[#2196F3] mr-2' : 'text-gray-500 mr-2'} />
              <span className={goalType === 'gain' ? 'font-medium text-[#2196F3]' : 'text-gray-700'}>Gain Weight</span>
            </button>
          </div>
        </div>
        
        {goalType !== 'maintain' && (
          <div>
            <label className="block text-gray-700 font-medium mb-3">Progress Rate</label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    name="rate" 
                    checked={rateOption === 'slow'} 
                    onChange={() => setRateOption('slow')}
                    className="form-radio h-4 w-4 text-[#c41e3a]" 
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-800 block">Slow</span>
                    <span className="text-sm text-gray-500">0.5 lbs per week</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {goalType === 'lose' ? '~250 fewer calories/day' : '~250 extra calories/day'}
                </span>
              </label>
              
              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    name="rate" 
                    checked={rateOption === 'moderate'} 
                    onChange={() => setRateOption('moderate')}
                    className="form-radio h-4 w-4 text-[#c41e3a]" 
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-800 block">Moderate</span>
                    <span className="text-sm text-gray-500">1 lb per week</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {goalType === 'lose' ? '~500 fewer calories/day' : '~500 extra calories/day'}
                </span>
              </label>
              
              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    name="rate" 
                    checked={rateOption === 'fast'} 
                    onChange={() => setRateOption('fast')}
                    className="form-radio h-4 w-4 text-[#c41e3a]" 
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-800 block">Fast</span>
                    <span className="text-sm text-gray-500">1.5 lbs per week</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {goalType === 'lose' ? '~750 fewer calories/day' : '~750 extra calories/day'}
                </span>
              </label>
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Your Weight Goal Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Rate</div>
                <div className="font-medium text-lg">
                  {goalType === 'maintain' ? (
                    '0 lbs per week'
                  ) : (
                    `${Math.abs(values.lbsPerWeek)} lbs per week`
                  )}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Calorie Adjustment</div>
                <div className="font-medium text-lg">
                  {values.calorieAdjustment === 0 ? (
                    '0 calories'
                  ) : values.calorieAdjustment < 0 ? (
                    `${Math.abs(values.calorieAdjustment)} fewer calories`
                  ) : (
                    `${values.calorieAdjustment} extra calories`
                  )}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Estimated Time</div>
                <div className="font-medium text-lg">
                  {values.estimatedTime}
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-sm text-gray-600">
              <p>These are general estimates. Individual results may vary based on many factors including metabolism, activity level, and adherence to your plan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
