
import React from 'react';
import { durationMin } from '../../lib/itinerary-time.ts';
import type { HHMM } from '../../types';

interface GapCardProps {
    gap: { start: HHMM, end: HHMM };
    onSuggest: () => void;
}

const GapCard: React.FC<GapCardProps> = ({ gap, onSuggest }) => {
    const duration = durationMin(gap.start, gap.end) || 0;

    return (
        <div className="mb-6 relative" role="listitem" aria-label={`Hueco de tiempo libre de ${duration} minutos`}>
            {/* Dotted line connecting the previous and next blocks */}
            <div className="absolute -left-[1.25rem] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-[1px]"></div>
            
            <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{duration} minutos de tiempo libre</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{gap.start} - {gap.end}</p>
                    <button 
                        onClick={onSuggest}
                        className="mt-3 text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 rounded-full px-4 py-1.5 hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors shadow-sm"
                    >
                        ✨ Sugerir Actividad
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GapCard;
