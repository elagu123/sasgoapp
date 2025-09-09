import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Recommendation } from '../../types';

interface RecommendationCardProps {
    recommendation: Recommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
    const { tripId, title, destination, durationDays, imageUrl, explanation } = recommendation;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        /* @ts-ignore */
        <motion.div
            layout
            variants={cardVariants}
            className="group relative overflow-hidden rounded-2xl shadow-lg"
        >
            <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-5 text-white w-full">
                <div className="bg-purple-600/80 backdrop-blur-sm p-3 rounded-lg mb-3">
                    <p className="text-xs font-semibold flex items-center">
                        <span className="mr-2 text-lg">✨</span>
                        {explanation}
                    </p>
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-sm opacity-90">{destination.join(', ')} • {durationDays} días</p>
                <Link 
                    to={`/app/trips/${tripId}`} // This will lead to a 404 for now, but it's the right structure
                    className="mt-3 inline-block bg-white/20 backdrop-blur-sm text-white font-bold py-2 px-4 rounded-lg hover:bg-white/30 transition-colors text-sm"
                >
                    Ver Itinerario
                </Link>
            </div>
        </motion.div>
    );
};

export default RecommendationCard;