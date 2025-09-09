
import React from 'react';
import type { Expense, ExpenseCategory } from '../../types';

interface ExpenseListProps {
    expenses: Expense[];
    onUpdate: (expense: Expense) => void;
    onDelete: (expenseId: string) => void;
}

const categoryIcons: Record<ExpenseCategory, string> = {
    alojamiento: '🏨',
    comida: '🍔',
    transporte: '🚗',
    ocio: '🎭',
    compras: '🛍️',
    otros: '💸',
};

const formatCurrency = (amountInCents: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
    }).format(amountInCents / 100);
};

const ExpenseItem: React.FC<{ expense: Expense; onDelete: (id: string) => void }> = ({ expense, onDelete }) => (
    <div className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group">
        <div className="text-2xl mr-4">{categoryIcons[expense.category]}</div>
        <div className="flex-grow">
            <p className="font-semibold text-gray-800 dark:text-gray-200">{expense.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {expense.date} • <span className="capitalize">{expense.category}</span>
            </p>
        </div>
        <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(expense.amount, expense.currency)}</p>
        </div>
        <div className="pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => onDelete(expense.id)}
                className="text-red-500 hover:text-red-700 p-1"
                aria-label={`Eliminar gasto ${expense.title}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </button>
        </div>
    </div>
);


const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onUpdate, onDelete }) => {
    const sortedExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

    if (expenses.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Aún no hay gastos registrados.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedExpenses.map(expense => (
                <ExpenseItem key={expense.id} expense={expense} onDelete={onDelete} />
            ))}
        </div>
    );
};

export default ExpenseList;
