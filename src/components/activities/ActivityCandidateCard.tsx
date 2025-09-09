
import React from 'react';
import type { ActivityCandidate } from '../../types.ts';

interface ActivityCandidateCardProps {
    activity: ActivityCandidate;
    onAddToItinerary: () => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const ActivityCandidateCard: React.FC<ActivityCandidateCardProps> = ({ activity, onAddToItinerary }) => {
    const isBestValue = activity.value_score > 9.0;
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col relative">
            {isBestValue && (
                <div className="absolute top-0 left-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
                    ✨ Mejor Valor
                </div>
            )}
            <img src={activity.imageUrl} alt={activity.name} className="w-full h-40 object-cover" />
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{activity.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={activity.rating} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{activity.rating.toFixed(1)} ({activity.reviews_count} reseñas)</span>
                </div>
                
                <div className="mt-4 border-t dark:border-gray-700 pt-3 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <div className="text-green-600 dark:text-green-400 font-bold text-lg">
                        {activity.price_estimate > 0 ? `$${activity.price_estimate} ${activity.currency}` : 'Gratis'}
                    </div>
                    <div><strong>Pros:</strong> {activity.top_review_summary.pros.join(', ')}.</div>
                    <div><strong>Contras:</strong> {activity.top_review_summary.cons.join(', ')}.</div>
                </div>

                <div className="mt-auto pt-4">
                     <button
                        onClick={onAddToItinerary}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Añadir al Itinerario
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityCandidateCard;
