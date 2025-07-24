import React, { useState, useCallback, useEffect } from 'react';
import { ProfileSection } from './ProfileSection';
import { MacroTargetsSection } from './MacroTargetsSection';
// import { EnergyExpenditureSection } from './EnergyExpenditureSection';
import { ActivityLevelSection } from './ActivityLevelSection';
import { DietaryPreferencesSection } from './DietaryPreferencesSection';
import { AllergensSection } from './AllergensSection';
import { WeightGoalRateSection } from './WeightGoalRateSection';
import { useFetchWithAuth } from '../../AuthProvider';

export default function ProfileSettings(props) {
  const [energyTarget, setEnergyTarget] = useState(null);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
  const fetchWithAuth = useFetchWithAuth();

  const fetchEnergyTarget = useCallback(() => {
    fetchWithAuth('/api/profile/energy-target')
      .then(({ data, error }) => {
        if (!error && data) {
          setEnergyTarget(data.energy_target);
        } else {
          console.error('Error fetching energy target:', error);
        }
      });
  }, [fetchWithAuth]);

  const triggerProfileRefresh = useCallback(() => {
    setProfileRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    fetchEnergyTarget();
  }, [fetchEnergyTarget]);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <div className="max-w-3xl px-4 py-8 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and nutrition targets</p>
        </div>
        <div className="space-y-6">
          <ProfileSection energyTarget={energyTarget} refreshEnergyTarget={fetchEnergyTarget} triggerProfileRefresh={triggerProfileRefresh} />
          <WeightGoalRateSection energyTarget={energyTarget} refreshEnergyTarget={fetchEnergyTarget} profileRefreshTrigger={profileRefreshTrigger} />
          <ActivityLevelSection energyTarget={energyTarget} refreshEnergyTarget={fetchEnergyTarget} triggerProfileRefresh={triggerProfileRefresh} />
          <MacroTargetsSection energyTarget={energyTarget} refreshEnergyTarget={fetchEnergyTarget} triggerProfileRefresh={triggerProfileRefresh} />
          {/* <EnergyExpenditureSection /> */}
          <DietaryPreferencesSection />
          <AllergensSection />
        </div>
      </div>
    </div>
  );
}
