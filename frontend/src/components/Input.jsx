import React from 'react';

export default function Input({
  label,
  error,
  leftIcon,
  className = '',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-gray-400">{leftIcon}</span>
        )}
        <input
          className={`w-full rounded-md border border-gray-300 focus:border-[#C33332] focus:ring-2 focus:ring-[#C33332]/20 py-2 px-3 ${
            leftIcon ? 'pl-10' : ''
          } text-base outline-none ${error ? 'border-red-500' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
} 