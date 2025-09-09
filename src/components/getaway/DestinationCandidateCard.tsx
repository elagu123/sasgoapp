import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { GetawayCandidate } from '../../types.ts';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 z-10 opacity-100 transition-opacity">
        {text}
    </div>
);

const DestinationCandidateCard: React.FC<{ candidate: GetawayCandidate }> = ({ candidate }) => {
    const [isTooltipVisible, setTooltipVisible] = useState(false);

    return (
        /* @ts-ignore */
        <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
            <img src={candidate.imageUrl} alt={candidate.destination} className="w-full md:w-1/3 h-48 md:h-auto object-cover" />
            <div className="p-6 flex flex-col justify-between flex-1 relative">
                {candidate.valueScore && candidate.valueScore > 9 && (
                    <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                        ✨ Mejor Valor
                    </div>
                )}
                <div>
                    <h3 className="text-2xl font-bold">{candidate.destination}</h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{candidate.weather}</span>
                        <div
                            className="relative"
                            onMouseEnter={() => setTooltipVisible(true)}
                            onMouseLeave={() => setTooltipVisible(false)}
                        >
                            <span className="cursor-help text-blue-500">ⓘ</span>
                            <AnimatePresence>
                                {/* @ts-ignore */}
                                {isTooltipVisible && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Tooltip text={candidate.explanation} /></motion.div>}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t dark:border-gray-700 pt-4">
                    <div>
                        <p className="text-sm text-gray-500">Tiempo de viaje</p>
                        <p className="font-bold text-lg">{candidate.travelTime}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Costo Estimado</p>
                        <p className="font-bold text-lg text-green-600">${candidate.estimatedCost} USD</p>
                    </div>
                </div>
                
                <Link to={`/app/getaway/${candidate.id}`} className="mt-6 w-full text-center bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors">
                    Ver Plan Completo
                </Link>
            </div>
        </motion.div>
    );
};

export default DestinationCandidateCard;