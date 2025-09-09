

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickFiltersBarProps {
    activeFilter: string | null;
    onClear: () => void;
}

const QuickFiltersBar: React.FC<QuickFiltersBarProps> = ({ activeFilter, onClear }) => {
    if (!activeFilter) {
        return null;
    }

    return (
        <AnimatePresence>
            {/* @ts-ignore */}
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center space-x-2"
            >
                <span className="text-sm font-semibold">Filtro activo:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                    {activeFilter.replace(/([A-Z])/g, ' $1')}
                    <button onClick={onClear} className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white">
                        <span className="sr-only">Quitar filtro</span>
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                    </button>
                </span>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuickFiltersBar;