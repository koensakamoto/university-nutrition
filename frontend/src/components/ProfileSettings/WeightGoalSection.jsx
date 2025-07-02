import React, { useState, useEffect } from 'react';
import { Info, Scale } from 'lucide-react';
import { ProfileInfoTooltip } from './ProfileInfoTooltip';

export const WeightGoalSection = ({ energyTarget, refreshEnergyTarget }) => {
  const [currentWeight, setCurrentWeight] = useState('');
  const [weightGoal, setWeightGoal] = useState('');
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
      .then(data => {
        setCurrentWeight(data.profile.weight ? data.profile.weight.toString() : '');
        setWeightGoal(data.profile.weight_goal ? data.profile.weight_goal.toString() : '');
        setOriginal({
          currentWeight: data.profile.weight ? data.profile.weight.toString() : '',
          weightGoal: data.profile.weight_goal ? data.profile.weight_goal.toString() : '',
        });
        setFetchError(null);
      })
      .catch(err => {
        setFetchError('Could not load weight info.');
      });
  }, []);

  // Helper to check if values changed
  const checkShowSave = (newCurrent, newGoal) => {
    setShowSaveButton(
      newCurrent !== original.currentWeight ||
      newGoal !== original.weightGoal
    );
    setSaveSuccess(false);
  };

  // Handlers
  const handleCurrentWeight = (e) => {
    setCurrentWeight(e.target.value);
    checkShowSave(e.target.value, weightGoal);
  };
  const handleWeightGoal = (e) => {
    setWeightGoal(e.target.value);
    checkShowSave(currentWeight, e.target.value);
  };

  // Save handler
  const handleSave = async () => {
    const body = {
      weight: parseFloat(currentWeight),
      weight_goal: parseFloat(weightGoal),
    };
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to update weight info');
      setOriginal({
        currentWeight: body.weight.toString(),
        weightGoal: body.weight_goal.toString(),
      });
      setShowSaveButton(false);
      setSaveSuccess(true);
    } catch (err) {
      setSaveSuccess(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Weight Goal</h2>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowTooltip(true)}
            aria-label="Show weight goal info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>
      
      <p className="text-gray-600 mb-6">
        We will calculate your daily calorie budget based on your goal.
      </p>
      {fetchError && <div className="text-red-600 mb-4">{fetchError}</div>}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Current Weight</label>
            <input
              type="number"
              value={currentWeight}
              onChange={handleCurrentWeight}
              className="text-2xl font-semibold text-gray-800 border-b border-gray-300 focus:border-[#c41e3a] outline-none bg-transparent w-32"
              min="50"
              max="700"
            />
            <span className="ml-2 text-lg text-gray-500">lbs</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Weight Goal</label>
            <input
              type="number"
              value={weightGoal}
              onChange={handleWeightGoal}
              className="text-2xl font-semibold text-[#c41e3a] border-b border-gray-300 focus:border-[#c41e3a] outline-none bg-transparent w-32"
              min="50"
              max="700"
            />
            <span className="ml-2 text-lg text-gray-500">lbs</span>
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
        {saveSuccess && (
          <div className="flex items-center text-green-600 bg-green-50 p-2 rounded my-2">
            <span>Weight info saved successfully!</span>
          </div>
        )}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Weight Goal Overview</label>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-2">
              <Scale size={28} className="text-gray-600" />
            </div>
            <div className="font-medium text-gray-800 mb-1">Maintain Weight</div>
            <div className="text-sm text-gray-600 mb-2">Energy Target</div>
            <div className="text-2xl font-bold text-[#c41e3a]">
              {energyTarget === null && 'Loading...'}
              {energyTarget === 'error' && <span className="text-red-600">Could not load</span>}
              {typeof energyTarget === 'number' && `${energyTarget} kcal`}
            </div>
          </div>
        </div>
      </div>
      <ProfileInfoTooltip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="weight"
      />
    </div>
  );
};
