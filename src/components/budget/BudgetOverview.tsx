

import React from 'react';
import { motion } from 'framer-motion';

interface BudgetOverviewProps {
    totalBudget: number; // in cents
    totalSpent: number;  // in cents
    currency: string;
}

const formatCurrency = (amountInCents: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
    }).format(amountInCents / 100);
};

const StatCard: React.FC<{ title: string, value: string, colorClass: string }> = ({ title, value, colorClass }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ totalBudget, totalSpent, currency }) => {
    const remaining = totalBudget - totalSpent;
    const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    let progressColorClass = 'bg-blue-600';
    if (progress > 80) progressColorClass = 'bg-yellow-500';
    if (progress > 100) progressColorClass = 'bg-red-600';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Resumen del Presupuesto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <StatCard title="Presupuesto Total" value={formatCurrency(totalBudget, currency)} colorClass="text-gray-800 dark:text-gray-200" />
                <StatCard title="Total Gastado" value={formatCurrency(totalSpent, currency)} colorClass="text-red-600 dark:text-red-400" />
                <StatCard title="Restante" value={formatCurrency(remaining, currency)} colorClass="text-green-600 dark:text-green-400" />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progreso del Gasto</span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    {/* @ts-ignore */}
                    <motion.div 
                        className={`h-2.5 rounded-full ${progressColorClass}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%`}}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>
            </div>
        </div>
    );
};

export default BudgetOverview;