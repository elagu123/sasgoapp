import React, { useMemo } from 'react';

interface DaysBadgeProps {
    startDate: string;
    endDate: string;
}

const DaysBadge: React.FC<DaysBadgeProps> = ({ startDate, endDate }) => {
    const badgeInfo = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(startDate + "T00:00:00-03:00");
        const end = new Date(endDate + "T00:00:00-03:00");

        const isOngoing = today >= start && today <= end;
        if (isOngoing) {
            return { text: 'En curso', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
        }

        const isFinished = today > end;
        if (isFinished) {
            return { text: 'Finalizado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
        }
        
        const diffTime = start.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return { text: `Falta 1 día`, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
        }
        if (diffDays <= 7) {
            return { text: `Faltan ${diffDays} días`, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
        }
        return { text: `En ${diffDays} días`, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };

    }, [startDate, endDate]);

    return (
        <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeInfo.color}`}>
            {badgeInfo.text}
        </div>
    );
};

export default DaysBadge;