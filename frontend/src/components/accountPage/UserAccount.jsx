import React, { useState } from 'react';
import { AccountSection } from './AccountSection';
import { AccountManagementSection } from './AccountManagementSection';

export default function UserAccount(props) {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <div className="max-w-3xl px-4 py-8 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account details, security, and preferences</p>
        </div>
        <div className="space-y-6">
          <AccountSection />
          <AccountManagementSection />
        </div>
      </div>
    </div>
  );
}
