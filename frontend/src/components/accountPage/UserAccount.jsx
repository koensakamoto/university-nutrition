import React, { useState } from 'react';
import { AccountSection } from './AccountSection';
import { AccountSecuritySection } from './AccountSecuritySection';
import { AccountManagementSection } from './AccountManagementSection';

export default function UserAccount(props) {
  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600">Manage your account details, security, and preferences</p>
          </div>
          
          <AccountSection />
          <AccountSecuritySection />
          <AccountManagementSection />
        </div>
      </div>
    </div>
  );
}
