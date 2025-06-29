import React, { useState, useCallback, useEffect } from 'react';
import { ProfileSection } from './ProfileSection';
import { WeightGoalSection } from './WeightGoalSection';
import { MacroTargetsSection } from './MacroTargetsSection';
// import { EnergyExpenditureSection } from './EnergyExpenditureSection';
import { ActivityLevelSection } from './ActivityLevelSection';
import { DietaryPreferencesSection } from './DietaryPreferencesSection';
import { AllergensSection } from './AllergensSection';
import { WeightGoalRateSection } from './WeightGoalRateSection';

export default function ProfileSettings(props) {
  const [energyTarget, setEnergyTarget] = useState(null);

  const fetchEnergyTarget = useCallback(() => {
    fetch('/api/profile/energy-target', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setEnergyTarget(data.energy_target));
  }, []);

  useEffect(() => {
    fetchEnergyTarget();
  }, [fetchEnergyTarget]);

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information and nutrition targets</p>
          </div>
          
          <ProfileSection refreshEnergyTarget={fetchEnergyTarget} />
          <WeightGoalSection energyTarget={energyTarget} refreshEnergyTarget={fetchEnergyTarget} />
          <WeightGoalRateSection energyTarget={energyTarget} refreshEnergyTarget={fetchEnergyTarget} />
          <ActivityLevelSection refreshEnergyTarget={fetchEnergyTarget} />
          <MacroTargetsSection energyTarget={energyTarget} refreshEnergyTarget={fetchEnergyTarget} />
          {/* <EnergyExpenditureSection /> */}
          <DietaryPreferencesSection />
          <AllergensSection />
        </div>
      </div>
    </div>
  );
}
