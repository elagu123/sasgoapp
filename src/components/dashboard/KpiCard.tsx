import React from 'react';
import { motion } from 'framer-motion';
import { trackEvent } from '../../lib/telemetry.js';

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: string;
    filterKey: string;
    onClick: (filterKey: string) => void;
    isActive: boolean;
}

const KpiCard: React.FC<KpiCardProps> = React.memo((props) => {
    const { title, value, icon, filterKey, onClick, isActive } = props;
    
    const handleClick = () => {
        trackEvent('kpi_clicked', { kpi: filterKey });
        onClick(filterKey);
    };

    return (
        /* @ts-ignore */
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={handleClick}
            className={`kpi-card cursor-pointer bg-white dark:bg-gray-800 p-5 flex items-center space-x-4 transition-all ${isActive ? 'ring-2 ring-blue-500' : 'ring-0 ring-transparent'}`}
        >
            <div className="text-3xl bg-gray-100 dark:bg-gray-700 p-4 rounded-full">{icon}</div>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium" style={{color: 'var(--text-secondary)'}}>{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100" style={{color: 'var(--text-primary)'}}>{value}</p>
            </div>
        </motion.div>
    );
});

export default KpiCard;