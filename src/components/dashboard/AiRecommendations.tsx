import React from 'react';
import { useRecommendations } from '../../hooks/useRecommendations.ts';
import RecommendationCard from './RecommendationCard.tsx';

const RecommendationSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
    </div>
);

const AiRecommendations: React.FC = () => {
    const { data: recommendations, isLoading, error } = useRecommendations();

    if (isLoading) {
        return (
            <section>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Inspiración para tu Próximo Viaje</h2>
                <RecommendationSkeleton />
            </section>
        );
    }

    if (error || !recommendations || recommendations.length === 0) {
        // Don't show the section if there's an error or no recommendations
        return null;
    }

    return (
        <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Inspiración para tu Próximo Viaje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map(rec => (
                    <RecommendationCard key={rec.tripId} recommendation={rec} />
                ))}
            </div>
        </section>
    );
};

export default AiRecommendations;
