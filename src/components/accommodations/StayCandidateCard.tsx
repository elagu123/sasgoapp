import React from 'react';
import type { StayCandidate } from '../../types';

interface StayCandidateCardProps {
    stay: StayCandidate;
    onSetAsBase: (stay: StayCandidate) => void;
    isBase: boolean;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};


const StayCandidateCard: React.FC<StayCandidateCardProps> = ({ stay, onSetAsBase, isBase }) => {
    const isBestValue = stay.value_score > 9.0;

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex relative border-2 ${isBase ? 'border-green-500' : 'border-transparent'}`}>
            {isBestValue && !isBase && (
                <div className="absolute top-0 left-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
                    ✨ Mejor Valor
                </div>
            )}
            <div className="w-1/3 min-w-[120px]">
                <img src={stay.imageUrl} alt={stay.name} className="w-full h-full object-cover" />
            </div>
            <div className="w-2/3 p-4 flex flex-col justify-between">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{stay.neighborhood} • {stay.type}</p>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{stay.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={stay.rating} />
                        <span className="text-xs text-gray-600 dark:text-gray-300">{stay.rating.toFixed(1)} ({stay.reviews_count} reseñas)</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-1">
                        {stay.amenities.slice(0, 3).map(amenity => (
                            <span key={amenity} className="bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">{amenity}</span>
                        ))}
                    </div>
                </div>
                <div className="mt-3 flex justify-between items-end">
                     <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Desde</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">${stay.price_estimate_nightly}<span className="text-sm font-normal">/noche</span></p>
                    </div>
                    {isBase ? (
                         <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 font-bold py-2 px-3 rounded-lg text-sm flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                             Base del Viaje
                         </div>
                    ) : (
                        <button 
                            onClick={() => onSetAsBase(stay)}
                            className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            Vincular como Base
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StayCandidateCard;