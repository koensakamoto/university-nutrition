import React, {useState, useEffect} from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

const commonAllergens = [
  { id: 'milk', label: 'Milk' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'fish', label: 'Fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'tree_nuts', label: 'Tree Nuts' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'soybeans', label: 'Soybeans' },
];
const otherSensitivities = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'lactose', label: 'Lactose' },
  { id: 'msg', label: 'MSG' },
  { id: 'sulfites', label: 'Sulfites' },
  { id: 'fodmap', label: 'FODMAP' },
  { id: 'histamine', label: 'Histamine' },
];

export const AllergensSection = () => {
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [originalAllergens, setOriginalAllergens] = useState([]);
  const [selectedSensitivities, setSelectedSensitivities] = useState([]);
  const [originalSensitivities, setOriginalSensitivities] = useState([]);
  const [allergyNotes, setAllergyNotes] = useState("");
  const [originalNotes, setOriginalNotes] = useState("");
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(profile => {
        const allergens = profile.allergens || [];
        const sensitivities = profile.food_sensitivities || [];
        const notes = profile.allergy_notes || "";
        setSelectedAllergens(allergens);
        setOriginalAllergens(allergens);
        setSelectedSensitivities(sensitivities);
        setOriginalSensitivities(sensitivities);
        setAllergyNotes(notes);
        setOriginalNotes(notes);
        setFetchError(null);
      })
      .catch(err => {
        setFetchError('Could not load profile.');
        setSelectedAllergens([]);
        setOriginalAllergens([]);
        setSelectedSensitivities([]);
        setOriginalSensitivities([]);
        setAllergyNotes("");
        setOriginalNotes("");
      });
  }, []);

  const handleAllergenChange = (e) => {
    const allergen = e.target.value;
    let updated;
    if (e.target.checked) {
      updated = [...selectedAllergens, allergen];
    } else {
      updated = selectedAllergens.filter(a => a !== allergen);
    }
    setSelectedAllergens(updated);
    setShowSaveButton(
      JSON.stringify(updated) !== JSON.stringify(originalAllergens) ||
      JSON.stringify(selectedSensitivities) !== JSON.stringify(originalSensitivities) ||
      allergyNotes !== originalNotes
    );
    setSaveSuccess(false);
  };

  const handleSensitivityChange = (e) => {
    const sensitivity = e.target.value;
    let updated;
    if (e.target.checked) {
      updated = [...selectedSensitivities, sensitivity];
    } else {
      updated = selectedSensitivities.filter(a => a !== sensitivity);
    }
    setSelectedSensitivities(updated);
    setShowSaveButton(
      JSON.stringify(selectedAllergens) !== JSON.stringify(originalAllergens) ||
      JSON.stringify(updated) !== JSON.stringify(originalSensitivities) ||
      allergyNotes !== originalNotes
    );
    setSaveSuccess(false);
  };

  const handleNotesChange = (e) => {
    const notes = e.target.value;
    setAllergyNotes(notes);
    setShowSaveButton(
      JSON.stringify(selectedAllergens) !== JSON.stringify(originalAllergens) ||
      JSON.stringify(selectedSensitivities) !== JSON.stringify(originalSensitivities) ||
      notes !== originalNotes
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
          allergens: selectedAllergens,
          food_sensitivities: selectedSensitivities,
          allergy_notes: allergyNotes
        })
      });
      if (!res.ok) throw new Error('Failed to update sensitivities');
      setOriginalAllergens(selectedAllergens);
      setOriginalSensitivities(selectedSensitivities);
      setOriginalNotes(allergyNotes);
      setShowSaveButton(false);
      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
      setSaveSuccess(false);
    }
  };

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
      {fetchError && (
        <div className="text-red-600 mb-4">{fetchError}</div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Common Allergens</h3>
            <div className="space-y-3">
              {commonAllergens.map(option => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-[#c41e3a] rounded"
                    value={option.id}
                    checked={selectedAllergens.includes(option.id)}
                    onChange={handleAllergenChange}
                  />
                  <span className="ml-2">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Other Food Sensitivities</h3>
            <div className="space-y-3">
              {otherSensitivities.map(option => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-[#c41e3a] rounded"
                    value={option.id}
                    checked={selectedSensitivities.includes(option.id)}
                    onChange={handleSensitivityChange}
                  />
                  <span className="ml-2">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-gray-700 font-medium mb-2">Additional Allergies or Notes</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
            rows={3}
            placeholder="List any other food allergies or special considerations..."
            value={allergyNotes}
            onChange={handleNotesChange}
          ></textarea>
        </div>
        <div className="flex justify-end mt-4">
          {showSaveButton && (
            <button
              className="bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
              onClick={handleSave}
            >
              Save Allergen Information
            </button>
          )}
        </div>
        {saveSuccess && (
          <div className="flex items-center text-green-600 bg-green-50 p-2 rounded my-2">
            <CheckCircle size={16} className="mr-1" />
            <span>Allergen information saved successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};
