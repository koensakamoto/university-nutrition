import React from 'react';

export const DateRangeSelector = ({ value, onChange }) => {
  return (
    <div className="flex items-center space-x-2 mt-3 md:mt-0">
      <select
        className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="last-week">Last 7 days</option>
        <option value="last-two-weeks">Last 14 days</option>
        <option value="last-month">Last 30 days</option>
        <option value="last-three-months">Last 3 months</option>
        <option value="last-six-months">Last 6 months</option>
        <option value="custom">Custom Range</option>
      </select>

      <button className="text-[#c41e3a] hover:text-[#a41930] ml-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};
