

import React, { useState, useMemo } from 'react';
import type { Trip, Expense } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';
import BudgetOverview from './BudgetOverview.tsx';
import ExpenseList from './ExpenseList.tsx';
import AddExpenseDialog from './AddExpenseDialog.tsx';
import { useExpenses } from '../../hooks/useExpenses.ts';

interface ExpensesTabProps {
    trip: Trip;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ trip }) => {
    const { addToast } = useToast();
    const [isAddOpen, setAddOpen] = useState(false);
    
    const { expenses = [], createExpense, deleteExpense } = useExpenses(trip.id);

    const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'tripId'>) => {
        createExpense.mutate({ ...expenseData, tripId: trip.id }, {
            onSuccess: () => {
                setAddOpen(false);
                addToast('Gasto añadido con éxito.', 'success');
            },
            onError: () => {
                 addToast('No se pudo añadir el gasto.', 'error');
            }
        });
    };
    
    // TODO: Add editing functionality
    const handleUpdateExpense = (updatedExpense: Expense) => {
        // updateExpense.mutate(updatedExpense)
        addToast('La edición de gastos estará disponible próximamente.', 'info');
    };

    const handleDeleteExpense = (expenseId: string) => {
        deleteExpense.mutate(expenseId, {
            onSuccess: () => {
                 addToast('Gasto eliminado.', 'info');
            },
             onError: () => {
                 addToast('No se pudo eliminar el gasto.', 'error');
            }
        });
    };

    const totalSpent = useMemo(() => {
        // This is a simplification. A real app would handle currency conversion.
        // We assume all expenses are in the same currency as the budget (USD).
        return expenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);

    return (
        <div className="space-y-6">
            <AddExpenseDialog
                isOpen={isAddOpen}
                onClose={() => setAddOpen(false)}
                onAddExpense={handleAddExpense}
                isSubmitting={createExpense.isPending}
            />
            
            <BudgetOverview 
                totalBudget={trip.budget * 100} // Convert dollars to cents
                totalSpent={totalSpent} 
                currency="USD"
            />

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Registro de Gastos</h2>
                    <button 
                        onClick={() => setAddOpen(true)}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Añadir Gasto
                    </button>
                </div>
                <ExpenseList 
                    expenses={expenses}
                    onUpdate={handleUpdateExpense}
                    onDelete={handleDeleteExpense}
                />
            </div>
        </div>
    );
};

export default ExpensesTab;