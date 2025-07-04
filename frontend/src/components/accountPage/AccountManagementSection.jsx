import React, { useState } from 'react';
import { AlertTriangle, Download, CircleHelp, Info, LogOut, Trash2 } from 'lucide-react';
import { useAuth, useFetchWithAuth } from '../../AuthProvider';
import { Link } from 'react-router-dom'
import { AccountInfoToolTip } from './AccountInfoToolTip';

export const AccountManagementSection = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { logout } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const fetchWithAuth = useFetchWithAuth();

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const { data, error } = await fetchWithAuth('/api/account', {
        method: 'DELETE',
      });
      if (!error) {
        await logout();
        window.location.href = '/login';
      } else {
        setDeleteError(data?.detail || 'Failed to delete account');
      }
    } catch (err) {
      setDeleteError('Failed to delete account');
    }
    setDeleteLoading(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">Account Management</h2>
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
              onClick={() => setShowTooltip(true)}
              aria-label="Show account management info"
            >
              <Info size={16} />
            </button>
          </div>
        </div>
        
        <AccountInfoToolTip
          isOpen={showTooltip}
          onClose={() => setShowTooltip(false)}
          section="management"
        />
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Session Management</h3>
            <Link to="/login"  className="hover:text-red-200 flex items-center">
            <button className="flex items-center text-[#c41e3a] hover:text-[#a41930]" onClick={logout}>
              <LogOut size={18} className="mr-2" />
              <span>Log Out</span>
            </button>
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              Sign out from your current session on this device.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Data & Privacy</h3>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <button className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition">
                <Download size={18} className="mr-2" />
                <span>Export Your Data</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)} 
                className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md transition"
              >
                <Trash2 size={18} className="mr-2" />
                <span>Delete Account</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              You can export all your nutrition data and account information in a portable format.
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-medium text-gray-800 mb-3">Help & Support</h3>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSfwEZ3ODAkAfoF7HQ0Xg1YMACf85FvpUSZehwipqvWZ4mOhlg/viewform?usp=header" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-[#c41e3a] hover:underline"
            >
              <CircleHelp size={18} className="mr-2" />
              <span>Contact Support via Google Form</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
            <p className="text-sm text-gray-500 mt-1">
              Our support team will respond to your inquiry within 24 hours.
            </p>
          </div>
        </div>
      </div>
      
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle size={24} className="mr-2" />
              <h3 className="text-xl font-bold">Delete Account</h3>
            </div>
            
            <p className="text-gray-700 mb-4">
              This action cannot be undone. All your nutrition data, meal history, and profile information will be permanently removed.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE"
              />
            </div>
            
            {deleteError && (
              <div className="text-red-600 text-sm mb-2">{deleteError}</div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || deleteLoading}
                className={`px-4 py-2 rounded-md text-white ${
                  deleteConfirmation === 'DELETE' && !deleteLoading
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
