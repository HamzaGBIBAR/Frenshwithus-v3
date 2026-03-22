import React from 'react';

export default function SkeletonLoader({ className = '' }) {
  return (
    <div className={`flex flex-col space-y-4 p-4 w-full h-full min-h-[50vh] animate-pulse ${className}`}>
      {/* Header skeleton */}
      <div className="h-10 bg-gray-200 dark:bg-gray-700/50 rounded-lg w-1/3 mb-4"></div>
      
      {/* Content lines skeleton */}
      <div className="space-y-3 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-4/6"></div>
      </div>

      {/* Grid boxes skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700/50 rounded-xl"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700/50 rounded-xl"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700/50 rounded-xl"></div>
      </div>
    </div>
  );
}
