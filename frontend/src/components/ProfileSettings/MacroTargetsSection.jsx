import React, { useState, useEffect } from 'react';
import { Info, Lock, Unlock } from 'lucide-react';
import { ProfileInfoTooltip } from './ProfileInfoTooltip';

export const MacroTargetsSection = ({ energyTarget, refreshEnergyTarget }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState('ratios');

  const [proteinRatio, setProteinRatio] = useState(29);
  const [carbRatio, setCarbRatio] = useState(58);
  const [fatRatio, setFatRatio] = useState(12);
  
  // Fixed targets state
  const [proteinTargetGrams, setProteinGrams] = useState(172);
  const [carbTargetGrams, setCarbGrams] = useState(344);
  const [fatTargetGrams, setFatGrams] = useState(73);
  
  // Use energyTarget prop instead of internal state
  const baseEnergyTarget = energyTarget;
  
  // Lock state for each macro
  const [proteinLocked, setProteinLocked] = useState(false);
  const [carbLocked, setCarbLocked] = useState(false);
  const [fatLocked, setFatLocked] = useState(false);

  // Helper: count locked macros
  const lockedCount = [proteinLocked, carbLocked, fatLocked].filter(Boolean).length;

  // Utility: Calculate grams from ratio and calories per gram
  const calculateRatioGrams = (ratio, caloriesPerGram) => {
    return Math.round((baseEnergyTarget * (ratio / 100)) / caloriesPerGram);
  };

  // Robust ratio change handler: keeps sum at 100% and respects locks
  const handleRatioChange = (macro, value) => {
    value = Math.max(0, Math.min(100, Number(value)));
    let newProtein = proteinRatio;
    let newCarb = carbRatio;
    let newFat = fatRatio;

    // If two macros are locked, return
    if (lockedCount === 2) {
      return;
    }

    // If this macro is locked, do nothing
    if ((macro === 'protein' && proteinLocked) || (macro === 'carb' && carbLocked) || (macro === 'fat' && fatLocked)) {
      return;
    }

    // If one macro is locked, adjust the other two
    if (lockedCount === 1) {
      if (proteinLocked) {
        if (macro === 'carb') {
          newCarb = value;
          newFat = 100 - proteinRatio - newCarb;
        } else if (macro === 'fat') {
          newFat = value;
          newCarb = 100 - proteinRatio - newFat;
        }
      } else if (carbLocked) {
        if (macro === 'protein') {
          newProtein = value;
          newFat = 100 - carbRatio - newProtein;
        } else if (macro === 'fat') {
          newFat = value;
          newProtein = 100 - carbRatio - newFat;
        }
      } else if (fatLocked) {
        if (macro === 'protein') {
          newProtein = value;
          newCarb = 100 - fatRatio - newProtein;
        } else if (macro === 'carb') {
          newCarb = value;
          newProtein = 100 - fatRatio - newCarb;
        }
      }
    } else {
      // No locks: adjust as before
      if (macro === 'protein') {
        const remaining = 100 - value;
        const total = carbRatio + fatRatio;
        if (total === 0) {
          newCarb = Math.round(remaining / 2);
          newFat = remaining - newCarb;
        } else {
          newCarb = Math.round((carbRatio / total) * remaining);
          newFat = remaining - newCarb;
        }
        newProtein = value;
      } else if (macro === 'carb') {
        const remaining = 100 - value;
        const total = proteinRatio + fatRatio;
        if (total === 0) {
          newProtein = Math.round(remaining / 2);
          newFat = remaining - newProtein;
        } else {
          newProtein = Math.round((proteinRatio / total) * remaining);
          newFat = remaining - newProtein;
        }
        newCarb = value;
      } else if (macro === 'fat') {
        const remaining = 100 - value;
        const total = proteinRatio + carbRatio;
        if (total === 0) {
          newProtein = Math.round(remaining / 2);
          newCarb = remaining - newProtein;
        } else {
          newProtein = Math.round((proteinRatio / total) * remaining);
          newCarb = remaining - newProtein;
        }
        newFat = value;
      }
    }

    setProteinRatio(newProtein);
    setCarbRatio(newCarb);
    setFatRatio(newFat);
    checkShowSave(newProtein, newCarb, newFat, proteinTargetGrams, carbTargetGrams, fatTargetGrams);
  };
  


  // Lock button handler: only allow two locks at a time
  const handleLockToggle = (macro) => {
    if (macro === 'protein') {
      if (!proteinLocked && lockedCount === 2) return; // Don't allow all three locked
      setProteinLocked(!proteinLocked);
    } else if (macro === 'carb') {
      if (!carbLocked && lockedCount === 2) return;
      setCarbLocked(!carbLocked);
    } else if (macro === 'fat') {
      if (!fatLocked && lockedCount === 2) return;
      setFatLocked(!fatLocked);
    }
  };

  // --- FIXED TARGETS LOGIC START ---
  // In the Fixed Targets section, add lock/unlock buttons and logic

  // Utility: Calculate total energy for fixed method
  const calculateEnergy = () => {
    if (calculationMethod === 'fixed') {
      return (proteinTargetGrams * 4) + (carbTargetGrams * 4) + (fatTargetGrams * 9);
    }
    // For ratios and keto, use the base energy target
    return baseEnergyTarget;
  };

  // Helper: calculate which macro is unlocked in fixed mode
  const getFixedUnlockedMacro = () => {
    if (!proteinLocked && carbLocked && fatLocked) return 'protein';
    if (proteinLocked && !carbLocked && fatLocked) return 'carb';
    if (proteinLocked && carbLocked && !fatLocked) return 'fat';
    return null;
  };

  // Helper: calculate the value for the unlocked macro in fixed mode
  const getFixedAutoValue = () => {
    const energy = calculateEnergy();
    if (!proteinLocked && carbLocked && fatLocked) {
      // protein is unlocked
      return Math.max(0, Math.round((energy - (carbTargetGrams * 4 + fatTargetGrams * 9)) / 4));
    }
    if (proteinLocked && !carbLocked && fatLocked) {
      // carb is unlocked
      return Math.max(0, Math.round((energy - (proteinTargetGrams * 4 + fatTargetGrams * 9)) / 4));
    }
    if (proteinLocked && carbLocked && !fatLocked) {
      // fat is unlocked
      return Math.max(0, Math.round((energy - (proteinTargetGrams * 4 + carbTargetGrams * 4)) / 9));
    }
    return null;
  };

  const fixedUnlockedMacro = getFixedUnlockedMacro();
  const fixedAutoValue = getFixedAutoValue();

  // --- FIXED TARGETS LOGIC END ---

  // Add state for originals, save button, and success
  const [original, setOriginal] = useState({});
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Fetch macro targets from profile on mount
  useEffect(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(profile => {
        setProteinRatio(profile.protein_ratio ?? 30);
        setCarbRatio(profile.carb_ratio ?? 50);
        setFatRatio(profile.fat_ratio ?? 20);
        setProteinGrams(profile.fixed_protein ?? 150);
        setCarbGrams(profile.fixed_carb ?? 300);
        setFatGrams(profile.fixed_fat ?? 70);
        setOriginal({
          protein_ratio: profile.protein_ratio ?? 30,
          carb_ratio: profile.carb_ratio ?? 50,
          fat_ratio: profile.fat_ratio ?? 20,
          fixed_protein: profile.fixed_protein ?? 150,
          fixed_carb: profile.fixed_carb ?? 300,
          fixed_fat: profile.fixed_fat ?? 70,
        });
        setFetchError(null);
      })
      .catch(err => {
        setFetchError('Could not load macro targets.');
      });
  }, []);

  useEffect(() => {
    fetch('/api/profile/energy-target', { credentials: 'include' })
      .then(res => res.json())
      .then(data => refreshEnergyTarget(data.energy_target));
  }, [refreshEnergyTarget]);

  // Helper to check if values changed
  const checkShowSave = (pr, cr, fr, fp, cc, ff) => {
    if (calculationMethod === 'ratios') {
      setShowSaveButton(
        pr !== original.protein_ratio ||
        cr !== original.carb_ratio ||
        fr !== original.fat_ratio
      );
    } else if (calculationMethod === 'fixed') {
      setShowSaveButton(
        fp !== original.fixed_protein ||
        cc !== original.fixed_carb ||
        ff !== original.fixed_fat
      );
    }
    setSaveSuccess(false);
  };

  // For fixed targets
  const handleProteinGrams = (val) => {
    setProteinGrams(val);
    checkShowSave(proteinRatio, carbRatio, fatRatio, val, carbTargetGrams, fatTargetGrams);
  };
  const handleCarbGrams = (val) => {
    setCarbGrams(val);
    checkShowSave(proteinRatio, carbRatio, fatRatio, proteinTargetGrams, val, fatTargetGrams);
  };
  const handleFatGrams = (val) => {
    setFatGrams(val);
    checkShowSave(proteinRatio, carbRatio, fatRatio, proteinTargetGrams, carbTargetGrams, val);
  };

  // Save handler
  const handleSave = async () => {
    let body = {};
    if (calculationMethod === 'ratios') {
      body = {
        protein_ratio: proteinRatio,
        carb_ratio: carbRatio,
        fat_ratio: fatRatio,
      };
    } else if (calculationMethod === 'fixed') {
      body = {
        fixed_protein: proteinTargetGrams,
        fixed_carb: carbTargetGrams,
        fixed_fat: fatTargetGrams,
      };
    }
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to update macro targets');
      setOriginal((prev) => ({
        ...prev,
        ...body
      }));
      setShowSaveButton(false);
      setSaveSuccess(true);
    } catch (err) {
      setSaveSuccess(false);
    }
  };

  if (baseEnergyTarget === null) {
    return <div>Loading energy target...</div>;
  }

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
              <button 
                className={`${calculationMethod === 'ratios' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-4 py-2 rounded-full text-sm transition-colors`}
                onClick={() => setCalculationMethod('ratios')}
              >
                Ratios
              </button>
              <button 
                className={`${calculationMethod === 'fixed' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-4 py-2 rounded-full text-sm transition-colors`}
                onClick={() => setCalculationMethod('fixed')}
              >
                Fixed Targets
              </button>
              {/* <button 
                className={`${calculationMethod === 'keto' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-4 py-2 rounded-full text-sm transition-colors`}
                onClick={() => setCalculationMethod('keto')}
              >
                Keto Calculator
              </button> */}
            </div>
          </div>
          
          {calculationMethod === 'ratios' && (
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
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-gray-700"
                        onClick={() => handleLockToggle('protein')}
                        aria-label={proteinLocked ? 'Unlock protein' : 'Lock protein'}
                      >
                        {proteinLocked ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="range" 
                        min="10" 
                        max="50" 
                        value={proteinRatio} 
                        onChange={(e) => handleRatioChange('protein', e.target.value)}
                        className="w-32 mr-2 accent-[#4CAF50]" 
                        disabled={lockedCount === 2 && !proteinLocked}
                      />
                      <span>{proteinRatio}%</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${proteinRatio * 2}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#4CAF50]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{calculateRatioGrams(proteinRatio, 4)}g</span>
                      <span className="text-gray-500">{proteinRatio ? Math.round(baseEnergyTarget * (proteinRatio / 100)) : 0} kcal</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#2196F3] mr-2"></div>
                      <span className="font-medium">Net Carbs</span>
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-gray-700"
                        onClick={() => handleLockToggle('carb')}
                        aria-label={carbLocked ? 'Unlock carbs' : 'Lock carbs'}
                      >
                        {carbLocked ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="range" 
                        min="5" 
                        max="70" 
                        value={carbRatio} 
                        onChange={(e) => handleRatioChange('carb', e.target.value)}
                        className="w-32 mr-2 accent-[#2196F3]" 
                        disabled={lockedCount === 2 && !carbLocked}
                      />
                      <span>{carbRatio}%</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${carbRatio * 1.4}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#2196F3]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{calculateRatioGrams(carbRatio, 4)}g</span>
                      <span className="text-gray-500">{carbRatio ? Math.round(baseEnergyTarget * (carbRatio / 100)) : 0} kcal</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#FFC107] mr-2"></div>
                      <span className="font-medium">Fat</span>
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-gray-700"
                        onClick={() => handleLockToggle('fat')}
                        aria-label={fatLocked ? 'Unlock fat' : 'Lock fat'}
                      >
                        {fatLocked ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="range" 
                        min="5" 
                        max="70" 
                        value={fatRatio} 
                        onChange={(e) => handleRatioChange('fat', e.target.value)}
                        className="w-32 mr-2 accent-[#FFC107]" 
                        disabled={lockedCount === 2 && !fatLocked}
                      />
                      <span>{fatRatio}%</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${fatRatio * 1.4}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#FFC107]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{calculateRatioGrams(fatRatio, 9)}g</span>
                      <span className="text-gray-500">{fatRatio ? Math.round(baseEnergyTarget * (fatRatio / 100)) : 0} kcal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {calculationMethod === 'fixed' && (
            <div className="mb-4">
              <div className="flex items-center mb-1">
                <h3 className="font-medium text-gray-800">Fixed Macro Targets</h3>
                <Info size={14} className="ml-2 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Set specific gram targets for each macro. Your energy target will be calculated automatically.
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#4CAF50] mr-2"></div>
                      <span className="font-medium">Protein</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="50"
                        max="300"
                        value={proteinTargetGrams}
                        onChange={(e) => handleProteinGrams(parseInt(e.target.value) || 0)}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-right"
                      />
                      <span className="ml-2">grams</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${(proteinTargetGrams / 300) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#4CAF50]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{proteinTargetGrams * 4} kcal</span>
                      <span className="text-gray-500">{Math.round((proteinTargetGrams / calculateEnergy()) * 100)}% of total</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#2196F3] mr-2"></div>
                      <span className="font-medium">Net Carbs</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="20"
                        max="500"
                        value={carbTargetGrams}
                        onChange={(e) => handleCarbGrams(parseInt(e.target.value) || 0)}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-right"
                      />
                      <span className="ml-2">grams</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${(carbTargetGrams / 500) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#2196F3]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{carbTargetGrams * 4} kcal</span>
                      <span className="text-gray-500">{Math.round((carbTargetGrams * 4 / calculateEnergy()) * 100)}% of total</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#FFC107] mr-2"></div>
                      <span className="font-medium">Fat</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={fatTargetGrams}
                        onChange={(e) => handleFatGrams(parseInt(e.target.value) || 0)}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-right"
                      />
                      <span className="ml-2">grams</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${(fatTargetGrams / 200) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#FFC107]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{fatTargetGrams * 9} kcal</span>
                      <span className="text-gray-500">{Math.round((fatTargetGrams * 9 / calculateEnergy()) * 100)}% of total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* {calculationMethod === 'keto' && (
            <div className="mb-4">
              <div className="flex items-center mb-1">
                <h3 className="font-medium text-gray-800">Keto Calculator</h3>
                <Info size={14} className="ml-2 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                The ketogenic diet is a high-fat, adequate-protein, low-carbohydrate diet. Adjust the ratios to fit your keto goals.
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#FFC107] mr-2"></div>
                      <span className="font-medium">Fat</span>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="range" 
                        min="55" 
                        max="80" 
                        value={ketoFatRatio} 
                        onChange={(e) => handleKetoRatioChange('fat', e.target.value)}
                        className="w-32 mr-2 accent-[#FFC107]" 
                      />
                      <span>{ketoFatRatio}%</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${ketoFatRatio}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#FFC107]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{calculateKetoGrams(ketoFatRatio, 9)}g</span>
                      <span className="text-gray-500">{Math.round(baseEnergyTarget * (ketoFatRatio/100))} kcal</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#4CAF50] mr-2"></div>
                      <span className="font-medium">Protein</span>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="range" 
                        min="15" 
                        max="35" 
                        value={ketoProteinRatio} 
                        onChange={(e) => handleKetoRatioChange('protein', e.target.value)}
                        className="w-32 mr-2 accent-[#4CAF50]" 
                      />
                      <span>{ketoProteinRatio}%</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${ketoProteinRatio * 2}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#4CAF50]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{calculateKetoGrams(ketoProteinRatio, 4)}g</span>
                      <span className="text-gray-500">{Math.round(baseEnergyTarget * (ketoProteinRatio/100))} kcal</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#2196F3] mr-2"></div>
                      <span className="font-medium">Net Carbs</span>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="range" 
                        min="5" 
                        max="15" 
                        value={ketoCarbRatio} 
                        onChange={(e) => handleKetoRatioChange('carbs', e.target.value)}
                        className="w-32 mr-2 accent-[#2196F3]" 
                      />
                      <span>{ketoCarbRatio}%</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${ketoCarbRatio * 4}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#2196F3]"></div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>{calculateKetoGrams(ketoCarbRatio, 4)}g</span>
                      <span className="text-gray-500">{Math.round(baseEnergyTarget * (ketoCarbRatio/100))} kcal</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Keto Guidelines</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                    <li>Keep net carbs under 50g for ketosis (under 20g for strict keto)</li>
                    <li>Moderate protein to prevent gluconeogenesis</li>
                    <li>Fat is a lever - adjust based on your weight goals</li>
                    <li>Increase electrolytes to combat "keto flu"</li>
                  </ul>
                </div>
              </div>
            </div>
          )} */}
          
          <div>
            <div className="mb-1">Energy Target</div>
            <p className="text-xs text-gray-500 mb-2">
              {calculationMethod === 'fixed' 
                ? 'Calculated from your macro inputs.' 
                : 'Calculated from your Weight Goal.'}
            </p>
            <div className="text-3xl font-bold text-gray-800">{calculateEnergy()} kcal</div>
          </div>
        </div>
      </div>
      
      <ProfileInfoTooltip 
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="macros"
      />

      <div className="flex justify-end mt-4">
        {showSaveButton && (
          <button
            className="bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
            onClick={handleSave}
          >
            Save Macro Targets
          </button>
        )}
      </div>
      {saveSuccess && (
        <div className="flex items-center text-green-600 bg-green-50 p-2 rounded my-2">
          <span>Macro targets saved successfully!</span>
        </div>
      )}
    </div>
  );
};
