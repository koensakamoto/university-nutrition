import React from 'react';

// Base skeleton component for consistent animations
const SkeletonBase = ({ className = "", children }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

// Skeleton for summary cards
export const SummarySkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
    <SkeletonBase>
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </SkeletonBase>
  </div>
);

// Skeleton for chart sections
export const ChartSkeleton = ({ title = "Chart" }) => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
    <SkeletonBase>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-56"></div>
        </div>
        <div className="flex space-x-2 mt-3 md:mt-0">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      
      {/* Chart area */}
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </SkeletonBase>
  </div>
);

// Skeleton for nutrition insights
export const InsightsSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
    <SkeletonBase>
      {/* Header */}
      <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
      
      {/* Insights grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macro distribution chart */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-36 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
          </div>
        </div>
        
        {/* Meal timing chart */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="space-y-2 w-full px-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-300 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonBase>
  </div>
);

// Skeleton for weight chart
export const WeightSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
    <SkeletonBase>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <div className="h-6 bg-gray-200 rounded w-36 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-6 w-6 bg-gray-200 rounded mt-3 md:mt-0"></div>
      </div>
      
      {/* Chart area */}
      <div className="h-72 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
        <div className="flex items-center space-x-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-2 bg-gray-300 rounded-full w-48"></div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-end">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </SkeletonBase>
  </div>
);