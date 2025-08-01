import React, { useState } from 'react';
import { AlertTriangle, Download, CircleHelp, Info, LogOut, Trash2 } from 'lucide-react';
import { useAuth, useFetchWithAuth } from '../../AuthProvider';
import { useNavigate } from 'react-router-dom'
import { AccountInfoToolTip } from './AccountInfoToolTip';

export const AccountManagementSection = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const fetchWithAuth = useFetchWithAuth();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportSelections, setExportSelections] = useState({ weight: false, meals: false, profile: false });
  const [exportError, setExportError] = useState("");

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

  const canExport = Object.values(exportSelections).some(Boolean);
  const handleExportCheckbox = (key) => {
    setExportSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate('/login');
    }
  };

  const handleExport = async () => {
    setExportError("");
    try {
      const { format, selections } = { format: exportFormat, selections: exportSelections };
      const res = await fetch('/api/export-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ format, selections })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setExportError(err.error || 'Failed to export data.');
        return false;
      }
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const blob = await res.blob();
        if (blob.type !== 'application/pdf') {
          setExportError('Failed to generate PDF.');
          return false;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      return true;
    } catch (err) {
      setExportError('Failed to export data.');
      return false;
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8" style={{width: '100%', maxWidth: 'none'}}>
        <div className="flex items-center justify-between mb-6 w-full max-w-2xl">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">Account Management</h2>
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              onClick={() => setShowTooltip(true)}
              aria-label="Show account management info"
            >
              <Info size={18} />
            </button>
          </div>
        </div>
        
        <AccountInfoToolTip
          isOpen={showTooltip}
          onClose={() => setShowTooltip(false)}
          section="management"
        />
        
        <div className="space-y-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Session Management</h3>
            <button className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
            <p className="text-sm text-gray-600 mt-3">
              Sign out from your current session on this device.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Data & Privacy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center justify-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 px-6 py-4 rounded-lg transition-colors font-medium border border-blue-200">
                <Download size={20} />
                <span>Export Your Data</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)} 
                className="flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-4 rounded-lg transition-colors font-medium border border-red-200"
              >
                <Trash2 size={20} />
                <span>Delete Account</span>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              You can export all your nutrition data and account information in a portable format.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Help & Support</h3>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSfwEZ3ODAkAfoF7HQ0Xg1YMACf85FvpUSZehwipqvWZ4mOhlg/viewform?usp=header" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <CircleHelp size={20} />
              <span>Contact Support via Google Form</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
            <p className="text-sm text-gray-600 mt-3">
              Our support team will respond to your inquiry within 24 hours.
            </p>
          </div>
        </div>
      </div>
      
      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Export Your Data</h2>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Format</label>
              <div className="flex space-x-4">
                {['csv', 'pdf', 'json'].map((fmt) => (
                  <label key={fmt} className={`px-4 py-2 rounded-lg cursor-pointer border ${exportFormat === fmt ? 'bg-red-100 border-red-400 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    <input
                      type="radio"
                      name="format"
                      value={fmt}
                      checked={exportFormat === fmt}
                      onChange={() => setExportFormat(fmt)}
                      className="hidden"
                    />
                    {fmt.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">What do you want to export?</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={exportSelections.weight} onChange={() => handleExportCheckbox('weight')} />
                  <span>Weight History</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={exportSelections.meals} onChange={() => handleExportCheckbox('meals')} />
                  <span>Meal Logs</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={exportSelections.profile} onChange={() => handleExportCheckbox('profile')} />
                  <span>Profile Info</span>
                </label>
              </div>
            </div>
            {exportError && (
              <div className="text-red-600 text-sm mb-2">{exportError}</div>
            )}
            <div className="flex justify-end space-x-2 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition ${!canExport ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canExport}
                onClick={async () => {
                  const success = await handleExport();
                  if (success) {
                    setShowExportModal(false);
                  }
                }}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full p-6">
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
