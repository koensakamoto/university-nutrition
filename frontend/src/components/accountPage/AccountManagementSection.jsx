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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
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

        <div className="p-6 space-y-6 lg:space-y-8">
          {/* Session Management */}
          <div>
            <h3 className="text-xs lg:text-sm font-semibold text-gray-700 mb-3 lg:mb-4">Session</h3>
            <button
              className="w-full flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm lg:text-base border border-gray-200 group"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-3 lg:gap-4">
                <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors lg:w-5 lg:h-5" />
                <span>Log Out</span>
              </div>
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Data & Privacy */}
          <div>
            <h3 className="text-xs lg:text-sm font-semibold text-gray-700 mb-3 lg:mb-4">Data & Privacy</h3>
            <div className="space-y-2 lg:space-y-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm lg:text-base border border-gray-200 group"
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <Download size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors lg:w-5 lg:h-5" />
                  <span>Export Data</span>
                </div>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm lg:text-base border border-gray-200 group"
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <Trash2 size={18} className="text-gray-400 group-hover:text-red-500 transition-colors lg:w-5 lg:h-5" />
                  <span>Delete Account</span>
                </div>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-xs lg:text-sm font-semibold text-gray-700 mb-3 lg:mb-4">Support</h3>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfwEZ3ODAkAfoF7HQ0Xg1YMACf85FvpUSZehwipqvWZ4mOhlg/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm lg:text-base border border-gray-200 group"
            >
              <div className="flex items-center gap-3 lg:gap-4">
                <CircleHelp size={18} className="text-gray-400 group-hover:text-green-500 transition-colors lg:w-5 lg:h-5" />
                <span>Contact Support</span>
              </div>
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-5 text-gray-900">Export Your Data</h2>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Format</label>
              <div className="flex gap-2">
                {['csv', 'pdf', 'json'].map((fmt) => (
                  <label key={fmt} className={`flex-1 px-3 py-2 rounded-lg cursor-pointer border text-center text-sm font-medium transition-colors ${exportFormat === fmt ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
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
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">What to export?</label>
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportSelections.weight} onChange={() => handleExportCheckbox('weight')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-900">Weight History</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportSelections.meals} onChange={() => handleExportCheckbox('meals')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-900">Meal Logs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exportSelections.profile} onChange={() => handleExportCheckbox('profile')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-900">Profile Info</span>
                </label>
              </div>
            </div>
            {exportError && (
              <div className="text-red-600 text-sm mb-3">{exportError}</div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors text-sm font-medium"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors ${!canExport ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle size={20} className="mr-2" />
              <h3 className="text-lg font-semibold">Delete Account</h3>
            </div>

            <p className="text-gray-700 text-sm mb-5 leading-relaxed">
              This action cannot be undone. All your nutrition data, meal history, and profile information will be permanently removed.
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE"
              />
            </div>

            {deleteError && (
              <div className="text-red-600 text-sm mb-3">{deleteError}</div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || deleteLoading}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                  deleteConfirmation === 'DELETE' && !deleteLoading
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-300 cursor-not-allowed'
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
