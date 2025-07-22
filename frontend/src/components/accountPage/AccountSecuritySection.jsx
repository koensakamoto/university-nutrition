import React, { useState } from 'react';
import { Info, Key, Lock, ShieldCheck } from 'lucide-react';
import { AccountInfoToolTip } from './AccountInfoToolTip';
import { useFetchWithAuth } from '../../AuthProvider';

export const AccountSecuritySection = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('••••••••••••');
  const [isEditing, setIsEditing] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const fetchWithAuth = useFetchWithAuth();

  const handlePasswordUpdate = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (tempPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (tempPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    // Call backend API
    const { data, error } = await fetchWithAuth('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: tempPassword
      })
    });
    if (!error) {
      setIsEditing(false);
      setPasswordError('');
      setPasswordSuccess('Password updated successfully!');
      setTempPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } else {
      setPasswordError((data && data.detail) || 'Failed to update password');
      setPasswordSuccess('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Account Security</h2>
          <button
            type="button"
            className="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            onClick={() => setShowTooltip(true)}
            aria-label="Show account security info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>
      <AccountInfoToolTip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="security"
      />
      
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <label className="block text-gray-800 font-semibold mb-3">Password</label>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">New Password</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={tempPassword} 
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              {passwordError && (
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}
              
              {passwordSuccess && (
                <div className="text-green-600 text-sm mb-2">{passwordSuccess}</div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={handlePasswordUpdate} 
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Update Password
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setTempPassword('');
                    setConfirmPassword('');
                    setCurrentPassword('');
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                  }} 
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock size={20} className="text-gray-500 mr-3" />
                <span className="text-gray-900 text-lg">{password}</span>
              </div>
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <Key size={16} />
                <span>Change Password</span>
              </button>
            </div>
          )}
        </div>
        
        <div>
          {/* <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <ShieldCheck size={18} className="text-gray-500 mr-2" />
              <label className="text-gray-700 font-medium">Two-Factor Authentication</label>
            </div>
            <div className="relative inline-block w-12 align-middle select-none">
              <input 
                type="checkbox" 
                id="toggle" 
                checked={twoFactorEnabled}
                onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className="sr-only"
              />
              <label 
                htmlFor="toggle" 
                className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${twoFactorEnabled ? 'bg-red-600' : 'bg-gray-300'}`}
              >
                <span 
                  className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                ></span>
              </label>
            </div>
          </div> */}
          {/* <p className="text-sm text-gray-600 mb-4">
            Add an extra layer of security to your account by requiring a verification code in addition to your password.
          </p> */}
          
          {/* {twoFactorEnabled && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium text-gray-800 mb-2">Two-Factor Authentication is enabled</div>
              <p className="text-sm text-gray-600">
                NutriSync supports two-factor authentication with the Google Authenticator app. For campus-related security concerns, please also check with your university IT department.
              </p>
              <button className="mt-3 text-red-600 hover:underline text-sm font-medium">
                Configure 2FA Settings
              </button>
            </div>
          )} */}
        </div>
        
      
      </div>
    </div>
  );
};
