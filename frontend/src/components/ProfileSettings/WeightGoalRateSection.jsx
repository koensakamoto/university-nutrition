import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Info, Minimize, TrendingDown, TrendingUp } from 'lucide-react';
import { ProfileInfoTooltip } from './ProfileInfoTooltip';

export const WeightGoalRateSection = ({ energyTarget, refreshEnergyTarget, profileRefreshTrigger }) => {
  const [rateOption, setRateOption] = useState('moderate');
  const [customRate, setCustomRate] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [weightGoal, setWeightGoal] = useState('');
  const [original, setOriginal] = useState({});
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Auto-detect goal direction based on current vs target weight
  const goalDirection = useMemo(() => {
    const current = parseFloat(currentWeight);
    const goal = parseFloat(weightGoal);
    
    if (!current || !goal) return null;
    
    if (goal > current + 1) return 'gaining'; // 1lb threshold for maintain weight
    if (goal < current - 1) return 'losing';
    return 'maintaining';
  }, [currentWeight, weightGoal]);

  // Get appropriate rate options based on goal direction
  const rateOptions = useMemo(() => {
    if (goalDirection === 'gaining') {
      return [
        { value: 'slow', label: 'Slow', lbsPerWeek: 0.5, description: '0.5 lbs per week', calories: '~250 extra calories/day' },
        { value: 'moderate', label: 'Moderate', lbsPerWeek: 1, description: '1 lb per week', calories: '~500 extra calories/day' },
        { value: 'fast', label: 'Fast', lbsPerWeek: 1.5, description: '1.5 lbs per week', calories: '~750 extra calories/day' },
        { value: 'custom', label: 'Custom', description: 'Enter lbs/week to gain' }
      ];
    } else if (goalDirection === 'losing') {
      return [
        { value: 'slow', label: 'Slow', lbsPerWeek: 0.5, description: '0.5 lbs per week', calories: '~250 fewer calories/day' },
        { value: 'moderate', label: 'Moderate', lbsPerWeek: 1, description: '1 lb per week', calories: '~500 fewer calories/day' },
        { value: 'fast', label: 'Fast', lbsPerWeek: 1.5, description: '1.5 lbs per week', calories: '~750 fewer calories/day' },
        { value: 'custom', label: 'Custom', description: 'Enter lbs/week to lose' }
      ];
    } else if (goalDirection === 'maintaining') {
      return [
        { value: 'maintain', label: 'Maintain Weight', lbsPerWeek: 0, description: '0 lbs per week', calories: 'No calorie adjustment' }
      ];
    }
    return [];
  }, [goalDirection]);

  // Fetch profile data
  const fetchProfileData = useCallback(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(data => {
        setCurrentWeight(data.profile.weight ? data.profile.weight.toString() : '');
        setWeightGoal(data.profile.weight_goal ? data.profile.weight_goal.toString() : '');
        setRateOption(data.profile.weight_goal_rate || 'moderate');
        setCustomRate(data.profile.weight_goal_custom_rate ? String(data.profile.weight_goal_custom_rate) : '');
        setOriginal({
          rateOption: data.profile.weight_goal_rate || 'moderate',
          customRate: data.profile.weight_goal_custom_rate ? String(data.profile.weight_goal_custom_rate) : '',
          goalType: data.profile.weight_goal_type || null,
        });
        setFetchError(null);
      })
      .catch(err => {
        setFetchError('Could not load weight goal info.');
      });
  }, []);

  // Fetch profile data when component mounts
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Re-fetch profile data when energy target changes (indicates activity level or other profile changes)
  useEffect(() => {
    if (energyTarget) {
      fetchProfileData();
    }
  }, [energyTarget, fetchProfileData]);

  // Re-fetch profile data when profile refresh trigger changes (indicates weight goal changes)
  useEffect(() => {
    if (profileRefreshTrigger) {
      fetchProfileData();
    }
  }, [profileRefreshTrigger, fetchProfileData]);

  // Auto-update weight_goal_type when goalDirection changes to 'maintaining'
  useEffect(() => {
    if (goalDirection === 'maintaining' && currentWeight && weightGoal) {
      // Only auto-update if we haven't already set it to maintain
      if (original.goalType !== 'maintain') {
        const autoSave = async () => {
          try {
            const body = {
              weight_goal_type: 'maintain',
              weight_goal_rate: 'maintain',
            };
            const res = await fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(body)
            });
            if (res.ok) {
              setOriginal(prev => ({
                ...prev,
                goalType: 'maintain',
                rateOption: 'maintain'
              }));
              setRateOption('maintain');
              if (refreshEnergyTarget) {
                setTimeout(() => {
                  refreshEnergyTarget();
                }, 500);
              }
            }
          } catch (err) {
            console.error('Failed to auto-update maintenance goal:', err);
          }
        };
        autoSave();
      }
    }
  }, [goalDirection, currentWeight, weightGoal, original.goalType, refreshEnergyTarget]);

  // Helper to check if values changed
  const checkShowSave = (newRateOption, newCustomRate) => {
    setShowSaveButton(
      newRateOption !== original.rateOption ||
      (newRateOption === 'custom' && newCustomRate !== original.customRate)
    );
    setSaveSuccess(false);
  };

  // Handlers
  const handleRateOption = (option) => {
    setRateOption(option);
    if (option !== 'custom') {
      setCustomRate('');
    }
    checkShowSave(option, customRate);
  };
  const handleCustomRate = (val) => {
    // Prevent negative values
    const numVal = parseFloat(val);
    if (val !== '' && (isNaN(numVal) || numVal < 0)) {
      return; // Don't update if negative or invalid
    }
    setCustomRate(val);
    checkShowSave(rateOption, val);
  };

  // Save handler
  const handleSave = async () => {
    // For maintaining weight, auto-set rate to 'maintain'
    const finalRateOption = goalDirection === 'maintaining' ? 'maintain' : rateOption;
    
    const body = {
      weight_goal_type: goalDirection === 'losing' ? 'lose' : goalDirection === 'gaining' ? 'gain' : goalDirection === 'maintaining' ? 'maintain' : goalDirection, // Convert to backend format
      weight_goal_rate: finalRateOption,
    };
    if (finalRateOption === 'custom') {
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
        rateOption: body.weight_goal_rate,
        customRate: body.weight_goal_custom_rate !== undefined ? String(body.weight_goal_custom_rate) : '',
        goalType: body.weight_goal_type,
      });
      setShowSaveButton(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (refreshEnergyTarget) {
        console.log('Refreshing energy target after weight goal rate change');
        // Add a small delay to allow backend to recalculate
        setTimeout(() => {
          refreshEnergyTarget(); // Always fetch new energy target after save
        }, 500);
      }
    } catch (err) {
      setSaveSuccess(false);
    }
  };

  // Calculate values based on selected options
  const getRateValues = () => {
    if (goalDirection === 'maintaining' || rateOption === 'maintain') {
      return {
        lbsPerWeek: 0,
        calorieAdjustment: 0,
        estimatedTime: 'N/A'
      };
    }
    
    const direction = goalDirection === 'losing' ? -1 : 1;
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
    
    // Calculate estimated time based on current vs goal weight
    const current = parseFloat(currentWeight);
    const goal = parseFloat(weightGoal);
    const totalWeightChange = Math.abs(goal - current);
    const estimatedWeeks = lbsPerWeek > 0 ? totalWeightChange / lbsPerWeek : 0;
    
    let estimatedTime = 'N/A';
    if (estimatedWeeks > 0) {
      if (estimatedWeeks < 1) {
        const estimatedDays = Math.ceil(estimatedWeeks * 7);
        estimatedTime = estimatedDays === 1 ? '1 day' : `${estimatedDays} days`;
      } else {
        const roundedWeeks = Math.ceil(estimatedWeeks);
        estimatedTime = roundedWeeks === 1 ? '1 week' : `${roundedWeeks} weeks`;
      }
    }
    
    return {
      lbsPerWeek: lbsPerWeek * direction,
      calorieAdjustment,
      estimatedTime
    };
  };
  
  const values = getRateValues();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
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
        Select your preferred rate of progress. This will adjust your daily calorie target.
      </p>
      
      {fetchError && <div className="text-red-600 mb-4">{fetchError}</div>}
      
      {/* Goal Summary */}
      {goalDirection && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center mb-2">
            {goalDirection === 'losing' && <TrendingDown size={20} className="text-blue-600 mr-2" />}
            {goalDirection === 'gaining' && <TrendingUp size={20} className="text-blue-600 mr-2" />}
            {goalDirection === 'maintaining' && <Minimize size={20} className="text-blue-600 mr-2" />}
            <h4 className="font-medium text-blue-800">Your Goal</h4>
          </div>
          <div className="text-blue-700">
            <p className="mb-2">
              {goalDirection === 'gaining' && `Gain ${(parseFloat(weightGoal) - parseFloat(currentWeight)).toFixed(1)} lbs (${currentWeight} → ${weightGoal} lbs)`}
              {goalDirection === 'losing' && `Lose ${(parseFloat(currentWeight) - parseFloat(weightGoal)).toFixed(1)} lbs (${currentWeight} → ${weightGoal} lbs)`}
              {goalDirection === 'maintaining' && `Maintain current weight (~${currentWeight} lbs)`}
            </p>
            {goalDirection !== 'maintaining' && rateOption && (
              <p className="text-sm text-blue-600">
                <strong>Estimated time:</strong> {(() => {
                  const current = parseFloat(currentWeight);
                  const goal = parseFloat(weightGoal);
                  const totalWeightChange = Math.abs(goal - current);
                  
                  let lbsPerWeek = 0;
                  if (rateOption === 'custom') {
                    lbsPerWeek = Math.abs(parseFloat(customRate)) || 0;
                  } else {
                    switch (rateOption) {
                      case 'slow': lbsPerWeek = 0.5; break;
                      case 'moderate': lbsPerWeek = 1; break;
                      case 'fast': lbsPerWeek = 1.5; break;
                    }
                  }
                  
                  if (lbsPerWeek === 0) return 'N/A';
                  
                  const estimatedWeeks = totalWeightChange / lbsPerWeek;
                  
                  if (estimatedWeeks < 1) {
                    const estimatedDays = Math.ceil(estimatedWeeks * 7);
                    return estimatedDays === 1 ? '1 day' : `${estimatedDays} days`;
                  } else {
                    const roundedWeeks = Math.ceil(estimatedWeeks);
                    return roundedWeeks === 1 ? '1 week' : `${roundedWeeks} weeks`;
                  }
                })()}
              </p>
            )}
          </div>
        </div>
      )}

      {!goalDirection && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-gray-600">Please set your current weight and weight goal in the Profile section first.</p>
        </div>
      )}
      
      <div className="space-y-6">
        
        {goalDirection && goalDirection !== 'maintaining' && rateOptions.length > 0 && (
          <div>
            <label className="block text-gray-700 font-medium mb-3">Progress Rate</label>
            <div className="space-y-3">
              {rateOptions.map((option) => (
                <label key={option.value} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="rate" 
                      checked={rateOption === option.value} 
                      onChange={() => handleRateOption(option.value)}
                      className="form-radio h-4 w-4 text-[#c41e3a]" 
                    />
                    <div className="ml-3 flex items-center">
                      <div>
                        <span className="font-medium text-gray-800 block">{option.label}</span>
                        <span className="text-sm text-gray-500">{option.description}</span>
                      </div>
                      {option.value === 'custom' && rateOption === 'custom' && (
                        <input
                          type="number"
                          min="0.1"
                          max="10"
                          step="0.1"
                          className="ml-2 w-20 border border-gray-300 rounded px-2 py-1"
                          placeholder="lbs/wk"
                          value={customRate}
                          onChange={e => handleCustomRate(e.target.value)}
                          onKeyDown={e => {
                            // Prevent minus key
                            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {option.calories}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-gray-100">
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
        {energyTarget && goalDirection && (
          <div className="flex flex-col items-center mt-6 mb-0">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow p-8 text-center border border-gray-200">
              <span className="block text-lg font-medium mb-2 text-gray-700">Your current daily energy target</span>
              <span className="text-4xl font-extrabold text-[#c41e3a] tracking-tight">{energyTarget} kcal</span>
            </div>
            {goalDirection && showSaveButton && (
              <button
                className="mt-6 bg-[#c41e3a] text-white px-8 py-3 rounded-lg font-semibold shadow hover:bg-[#a41930] transition"
                onClick={handleSave}
              >
                Save
              </button>
            )}
            {showSaveButton && (
              <div className="text-sm text-gray-500 mt-3 text-center">Save to update your energy target.</div>
            )}
            {saveSuccess && (
              <div className="flex flex-col items-center mt-4 animate-fade-in">
                <svg className="w-7 h-7 text-green-500 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="text-green-600 font-medium text-base">Weight goal saved successfully!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

<style jsx>{`
  .animate-fade-in {
    animation: fadeIn 0.5s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`}</style>
