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
      </select>


    </div>
  );
};
