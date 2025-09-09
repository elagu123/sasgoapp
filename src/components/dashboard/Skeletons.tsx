
import React from 'react';

const SkeletonBox: React.FC<{ className: string }> = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ${className}`}></div>
);

export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-10">
        <header className="flex flex-wrap justify-between items-start gap-4">
            <div>
                <SkeletonBox className="h-10 w-48 mb-2" />
                <SkeletonBox className="h-4 w-80" />
            </div>
            <SkeletonBox className="h-12 w-44 rounded-xl" />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonBox className="h-24 rounded-lg" />
            <SkeletonBox className="h-24 rounded-lg" />
            <SkeletonBox className="h-24 rounded-lg" />
            <SkeletonBox className="h-24 rounded-lg" />
        </div>
        <section>
            <div className="flex items-center justify-between mb-4">
                <SkeletonBox className="h-8 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonBox className="h-56 rounded-lg" />
                <SkeletonBox className="h-56 rounded-lg" />
                <SkeletonBox className="h-56 rounded-lg" />
            </div>
        </section>
    </div>
);
