import React, { useState, useEffect } from 'react';
import { Info, Minimize, TrendingDown, TrendingUp } from 'lucide-react';
import { ProfileInfoTooltip } from './ProfileInfoTooltip';

export const WeightGoalRateSection = ({ energyTarget, refreshEnergyTarget }) => {
  const [goalType, setGoalType] = useState('lose');
  const [rateOption, setRateOption] = useState('moderate');
  const [customRate, setCustomRate] = useState('');
  const [original, setOriginal] = useState({});
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(profile => {
        setGoalType(profile.weight_goal_type || 'lose');
        setRateOption(profile.weight_goal_rate || 'moderate');
        setCustomRate(profile.weight_goal_custom_rate ? String(profile.weight_goal_custom_rate) : '');
        setOriginal({
          goalType: profile.weight_goal_type || 'lose',
          rateOption: profile.weight_goal_rate || 'moderate',
          customRate: profile.weight_goal_custom_rate ? String(profile.weight_goal_custom_rate) : '',
        });
        setFetchError(null);
      })
      .catch(err => {
        setFetchError('Could not load weight goal info.');
      });
  }, []);

  // Helper to check if values changed
  const checkShowSave = (newGoalType, newRateOption, newCustomRate) => {
    setShowSaveButton(
      newGoalType !== original.goalType ||
      newRateOption !== original.rateOption ||
      (newRateOption === 'custom' && newCustomRate !== original.customRate)
    );
    setSaveSuccess(false);
  };

  // Handlers
  const handleGoalType = (type) => {
    setGoalType(type);
    if (type === 'maintain') {
      setRateOption('maintain');
      setCustomRate('');
    }
    checkShowSave(type, rateOption, customRate);
  };
  const handleRateOption = (option) => {
    setRateOption(option);
    checkShowSave(goalType, option, customRate);
  };
  const handleCustomRate = (val) => {
    setCustomRate(val);
    checkShowSave(goalType, rateOption, val);
  };

  // Save handler
  const handleSave = async () => {
    const body = {
      weight_goal_type: goalType,
      weight_goal_rate: rateOption,
    };
    if (rateOption === 'custom') {
      body.weight_goal_custom_rate = parseFloat(customRate) || 0;
    } else {
      body.weight_goal_custom_rate = 0; // Always send this to clear custom if not used
    }
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to update weight goal info');
      setOriginal({
        goalType: body.weight_goal_type,
        rateOption: body.weight_goal_rate,
        customRate: body.weight_goal_custom_rate ? String(body.weight_goal_custom_rate) : '',
      });
      setShowSaveButton(false);
      setSaveSuccess(true);
      if (refreshEnergyTarget) refreshEnergyTarget(); // Always fetch new energy target after save
    } catch (err) {
      setSaveSuccess(false);
    }
  };

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
    if (rateOption === 'custom') {
      lbsPerWeek = Math.abs(parseFloat(customRate)) || 0;
    } else {
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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Weight Goal Rate</h2>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowTooltip(true)}
            aria-label="Show weight goal rate info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>
      <ProfileInfoTooltip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="weight_goal_rate"
      />
      
      <p className="text-gray-600 mb-6">
        Select your weight goal and preferred rate of progress. This will adjust your daily calorie target.
      </p>
      
      {fetchError && <div className="text-red-600 mb-4">{fetchError}</div>}
      
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-3">Weight Goal Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleGoalType('lose')}
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
              onClick={() => handleGoalType('gain')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                goalType === 'gain' 
                  ? 'border-[#2196F3] bg-[#2196F3]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TrendingUp size={20} className={goalType === 'gain' ? 'text-[#2196F3] mr-2' : 'text-gray-500 mr-2'} />
              <span className={goalType === 'gain' ? 'font-medium text-[#2196F3]' : 'text-gray-700'}>Gain Weight</span>
            </button>
            <button
              onClick={() => handleGoalType('maintain')}
              className={`flex items-center justify-center p-4 rounded-lg border-2 ${
                goalType === 'maintain'
                  ? 'border-[#4CAF50] bg-[#4CAF50]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Minimize size={20} className={goalType === 'maintain' ? 'text-[#4CAF50] mr-2' : 'text-gray-500 mr-2'} />
              <span className={goalType === 'maintain' ? 'font-medium text-[#4CAF50]' : 'text-gray-700'}>Maintain Weight</span>
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
                    onChange={() => handleRateOption('slow')}
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
                    onChange={() => handleRateOption('moderate')}
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
                    onChange={() => handleRateOption('fast')}
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
              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="rate"
                    checked={rateOption === 'custom'}
                    onChange={() => handleRateOption('custom')}
                    className="form-radio h-4 w-4 text-[#c41e3a]"
                  />
                  <div className="ml-3 flex items-center">
                    <span className="font-medium text-gray-800 block">Custom</span>
                    {rateOption === 'custom' && (
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="ml-2 w-20 border border-gray-300 rounded px-2 py-1"
                        placeholder="lbs/wk"
                        value={customRate}
                        onChange={e => handleCustomRate(e.target.value)}
                      />
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {goalType === 'lose' ? 'Enter lbs/week to lose' : 'Enter lbs/week to gain'}
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
                  {`${Math.abs(values.lbsPerWeek)} lbs per week`}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Calorie Adjustment</div>
                <div className="font-medium text-lg">
                  {values.calorieAdjustment < 0 ? (
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
        <div className="flex justify-end mt-2" style={{ minHeight: '40px' }}>
          {showSaveButton ? (
            <button
              className="bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
              onClick={handleSave}
            >
              Save
            </button>
          ) : (
            <span style={{ visibility: 'hidden' }}>Save</span>
          )}
        </div>
        {showSaveButton && (
          <div className="text-sm text-gray-500 mt-2">Save to update your energy target.</div>
        )}
        {saveSuccess && (
          <div className="flex items-center text-green-600 bg-green-50 p-2 rounded my-2">
            <span>Weight goal saved successfully!</span>
          </div>
        )}
        {energyTarget && (
          <div className="mt-4 mb-2">
            <span className="font-medium">Your current daily energy target: </span>
            <span className="text-xl font-bold">{energyTarget} kcal</span>
          </div>
        )}
      </div>
    </div>
  );
};
