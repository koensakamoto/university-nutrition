import React from 'react';
import PropTypes from 'prop-types';

export const FilterControl = ({ viewMode, onViewModeChange }) => {
  return (
    <>
      <div className="flex">
        <button
          className={`px-4 py-1 text-sm font-medium ${
            viewMode === 'daily'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => onViewModeChange('daily')}
          style={{ borderRadius: viewMode === 'monthly' ? '4px 0 0 4px' : '' }}
        >
          Daily
        </button>

        <button
          className={`px-4 py-1 text-sm font-medium ${
            viewMode === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => onViewModeChange('weekly')}
          style={{ borderRadius: '0' }}
        >
          Weekly
        </button>

        <button
          className={`px-4 py-1 text-sm font-medium rounded-r-md ${
            viewMode === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => onViewModeChange('monthly')}
        >
          Monthly
        </button>
      </div>
    </>
  );
};
