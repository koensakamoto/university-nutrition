import React, { useState, useEffect } from 'react';
import { Info, Utensils, CheckCircle } from 'lucide-react';
import { ProfileInfoTooltip } from './ProfileInfoTooltip';

const mealPreferenceOptions = [
  "Low Sodium", "Low Sugar", "High Protein", "High Fiber", "Gluten-Free", "Dairy-Free"
];

const dietTypes = [
  { value: "regular", label: "Regular (No Restrictions)" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Ketogenic" },
  { value: "paleo", label: "Paleo" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "low-carb", label: "Low Carb" }
];

const culturalPreferences = [
  { value: "none", label: "No Specific Preference" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "hindu", label: "Hindu Dietary Customs" },
  { value: "buddhist", label: "Buddhist Dietary Customs" }
];

export const DietaryPreferencesSection = () => {
  const [dietType, setDietType] = useState("regular");
  const [mealPreferences, setMealPreferences] = useState([]);
  const [culturalPreference, setCulturalPreference] = useState("none");
  const [original, setOriginal] = useState({});
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(data => {
        setDietType(data.profile.diet_type || "regular");
        setMealPreferences(data.profile.meal_preference || []);
        setCulturalPreference(data.profile.cultural_preference || "none");
        setOriginal({
          dietType: data.profile.diet_type || "regular",
          mealPreferences: data.profile.meal_preference || [],
          culturalPreference: data.profile.cultural_preference || "none"
        });
        setFetchError(null);
      })
      .catch(err => {
        setFetchError('Could not load profile.');
        setDietType("regular");
        setMealPreferences([]);
        setCulturalPreference("none");
        setOriginal({
          dietType: "regular",
          mealPreferences: [],
          culturalPreference: "none"
        });
      });
  }, []);

  const handleDietTypeChange = (e) => {
    setDietType(e.target.value);
    setShowSaveButton(
      e.target.value !== original.dietType ||
      JSON.stringify(mealPreferences) !== JSON.stringify(original.mealPreferences) ||
      culturalPreference !== original.culturalPreference
    );
    setSaveSuccess(false);
  };

  const handleMealPreferenceChange = (e) => {
    const value = e.target.value;
    let updated;
    if (e.target.checked) {
      updated = [...mealPreferences, value];
    } else {
      updated = mealPreferences.filter(p => p !== value);
    }
    setMealPreferences(updated);
    setShowSaveButton(
      dietType !== original.dietType ||
      JSON.stringify(updated) !== JSON.stringify(original.mealPreferences) ||
      culturalPreference !== original.culturalPreference
    );
    setSaveSuccess(false);
  };

  const handleCulturalPreferenceChange = (e) => {
    setCulturalPreference(e.target.value);
    setShowSaveButton(
      dietType !== original.dietType ||
      JSON.stringify(mealPreferences) !== JSON.stringify(original.mealPreferences) ||
      e.target.value !== original.culturalPreference
    );
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          diet_type: dietType,
          meal_preference: mealPreferences,
          cultural_preference: culturalPreference
        })
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      setOriginal({
        dietType,
        mealPreferences,
        culturalPreference
      });
      setShowSaveButton(false);
      setSaveSuccess(true);
    } catch (err) {
      setSaveSuccess(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Dietary Preferences</h2>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowTooltip(true)}
            aria-label="Show dietary preferences info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>
      <p className="text-gray-600 mb-6">
        Set your dietary preferences to help us customize your meal recommendations.
      </p>
      {fetchError && (
        <div className="text-red-600 mb-4">{fetchError}</div>
      )}
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Diet Type</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
            value={dietType}
            onChange={handleDietTypeChange}
          >
            {dietTypes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Meal Preferences</label>
          <div className="grid grid-cols-2 gap-3">
            {mealPreferenceOptions.map(opt => (
              <label key={opt} className="flex items-center bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-[#c41e3a] rounded"
                  value={opt}
                  checked={mealPreferences.includes(opt)}
                  onChange={handleMealPreferenceChange}
                />
                <span className="ml-2">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Cultural Preferences</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
            value={culturalPreference}
            onChange={handleCulturalPreferenceChange}
          >
            {culturalPreferences.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg flex items-center">
          <Utensils size={24} className="text-[#c41e3a] mr-3" />
          <div>
            <div className="font-medium text-gray-800">Your meal plans will be customized based on these preferences</div>
            <p className="text-sm text-gray-600">You can update these settings any time</p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          {showSaveButton && (
            <button
              className="bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
              onClick={handleSave}
            >
              Save Preferences
            </button>
          )}
        </div>
        {saveSuccess && (
          <div className="flex items-center text-green-600 bg-green-50 p-2 rounded my-2">
            <CheckCircle size={16} className="mr-1" />
            <span>Preferences saved successfully!</span>
          </div>
        )}
      </div>
      <ProfileInfoTooltip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="dietary"
      />
    </div>
  );
};
