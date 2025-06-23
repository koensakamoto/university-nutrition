import React from 'react';
import PropTypes from 'prop-types';

export const FilterControl = ({ viewMode, onViewModeChange }) => {
  return (
    <>
      <div className="flex">
        <button
          className={`px-4 py-1 text-sm font-medium ${
            viewMode === 'daily' 
              ? 'bg-[#c41e3a] text-white' 
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
              ? 'bg-[#c41e3a] text-white' 
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
              ? 'bg-[#c41e3a] text-white' 
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => onViewModeChange('monthly')}
        >
          Monthly
        </button>
      </div>
      
      <button className="text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </>
  );
};
