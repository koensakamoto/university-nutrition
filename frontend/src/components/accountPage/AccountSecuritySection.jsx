import React, { useState } from 'react';
import { Info, Key, Lock, ShieldCheck } from 'lucide-react';
import { AccountInfoToolTip } from './AccountInfoToolTip';

export const AccountSecuritySection = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('••••••••••••');
  const [isEditing, setIsEditing] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

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
    const res = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: tempPassword
      })
    });
    if (res.ok) {
      setIsEditing(false);
      setPasswordError('');
      setPasswordSuccess('Password updated successfully!');
      setTempPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } else {
      const data = await res.json();
      setPasswordError(data.detail || 'Failed to update password');
      setPasswordSuccess('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Account Security</h2>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowTooltip(true)}
            aria-label="Show account security info"
          >
            <Info size={16} />
          </button>
        </div>
      </div>
      <AccountInfoToolTip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="security"
      />
      
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Password</label>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={tempPassword} 
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
                  />
                </div>
              </div>
              
              {passwordError && (
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}
              
              {passwordSuccess && (
                <div className="text-green-600 text-sm mb-2">{passwordSuccess}</div>
              )}
              
              <div className="flex space-x-2">
                <button 
                  onClick={handlePasswordUpdate} 
                  className="bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
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
                  }} 
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock size={18} className="text-gray-400 mr-2" />
                <span className="text-gray-800">{password}</span>
              </div>
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-[#c41e3a] hover:text-[#a41930] flex items-center"
              >
                <Key size={16} className="mr-1" />
                Change Password
              </button>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
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
                className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${twoFactorEnabled ? 'bg-[#c41e3a]' : 'bg-gray-300'}`}
              >
                <span 
                  className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                ></span>
              </label>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add an extra layer of security to your account by requiring a verification code in addition to your password.
          </p>
          
          {twoFactorEnabled && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium text-gray-800 mb-2">Two-Factor Authentication is enabled</div>
              <p className="text-sm text-gray-600">
                NutriSync supports two-factor authentication with the Google Authenticator app. For campus-related security concerns, please also check with your university IT department.
              </p>
              <button className="mt-3 text-[#c41e3a] hover:underline text-sm font-medium">
                Configure 2FA Settings
              </button>
            </div>
          )}
        </div>
        
      
      </div>
    </div>
  );
};
