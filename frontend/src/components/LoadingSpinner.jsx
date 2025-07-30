import React from 'react';

export const LoadingSpinner = ({ size = 'md', message, className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div 
        className={`animate-spin rounded-full border-b-2 border-red-600 ${sizeClasses[size]}`}
        role="status"
        aria-live="polite"
        aria-label="Loading"
      ></div>
      {message && <p className="mt-2 text-sm text-gray-500" aria-live="polite">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;