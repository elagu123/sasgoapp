
import React from 'react';

export const ActivitySkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col animate-pulse">
        <div className="w-full h-40 bg-gray-200 dark:bg-gray-700"></div>
        <div className="p-5 flex flex-col flex-grow">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>

            <div className="mt-auto pt-4">
                 <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
            </div>
        </div>
    </div>
);

export default ActivitySkeleton;
