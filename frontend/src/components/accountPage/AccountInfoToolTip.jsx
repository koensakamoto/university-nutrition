import React from 'react';
import { X } from 'lucide-react';

export const AccountInfoToolTip = ({ isOpen, onClose, section }) => {
  if (!isOpen) return null;

  const tooltipContent = {
    info: {
      title: 'Account Information',
      content: (
        <div className="space-y-3">
          <p>This section displays your account details, including your name and email address.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can update your name and email here.</li>
            <li>Changing your email will affect how you log in.</li>
            <li>Keep your contact information up to date for important notifications.</li>
          </ul>
        </div>
      )
    },
    security: {
      title: 'Account Security',
      content: (
        <div className="space-y-3">
          <p>Manage your password and security settings here.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Change your password regularly to keep your account secure.</li>
            <li>Enable two-factor authentication if available for extra protection.</li>
            <li>Never share your password with anyone.</li>
          </ul>
        </div>
      )
    },
    management: {
      title: 'Account Management',
      content: (
        <div className="space-y-3">
          <p>Manage your session, data, and account status.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Log out of your account from this device.</li>
            <li>Export your nutrition data for your records.</li>
            <li>Delete your account if you no longer wish to use the service (this is permanent).</li>
          </ul>
        </div>
      )
    }
  };

  const content = tooltipContent[section] || tooltipContent.info;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">{content.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-4">
          {content.content}
        </div>
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
