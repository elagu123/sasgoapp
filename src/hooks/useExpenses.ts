import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpenses, createExpense as apiCreateExpense, deleteExpense as apiDeleteExpense } from '../services/api';
import type { Expense } from '../types';
import { useToast } from './useToast';
import { v4 as uuidv4 } from 'uuid';
import { EXPENSES_QUERY_KEY } from '../queryKeys';

export const useExpenses = (tripId: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const queryKey = [EXPENSES_QUERY_KEY, tripId];

    const { data: expenses, isLoading, error } = useQuery<Expense[], Error>({
        queryKey,
        queryFn: () => getExpenses(tripId),
        enabled: !!tripId,
    });

    const createExpense = useMutation<Expense, Error, Omit<Expense, 'id'>, { previousExpenses: Expense[] }>({
        mutationFn: apiCreateExpense,
        onMutate: async (newExpense) => {
            await queryClient.cancelQueries({ queryKey });
            const previousExpenses = queryClient.getQueryData<Expense[]>(queryKey) || [];
            
            const optimisticExpense: Expense = { ...newExpense, id: uuidv4() };

            queryClient.setQueryData<Expense[]>(queryKey, [...previousExpenses, optimisticExpense]);
            
            return { previousExpenses };
        },
        onError: (_err, _newExpense, context) => {
            if (context?.previousExpenses) {
                queryClient.setQueryData(queryKey, context.previousExpenses);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteExpense = useMutation<void, Error, string, { previousExpenses: Expense[] }>({
        mutationFn: apiDeleteExpense,
         onMutate: async (expenseId) => {
            await queryClient.cancelQueries({ queryKey });
            const previousExpenses = queryClient.getQueryData<Expense[]>(queryKey) || [];

            queryClient.setQueryData<Expense[]>(
                queryKey,
                old => old?.filter(e => e.id !== expenseId) ?? []
            );
            
            return { previousExpenses };
        },
        // FIX: Correctly type the `context` parameter in the onError callback.
        onError: (_err, _expenseId, context: { previousExpenses: Expense[] } | undefined) => {
             if (context?.previousExpenses) {
                queryClient.setQueryData(queryKey, context.previousExpenses);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
    
    // updateExpense mutation can be added here following the same pattern

    return { expenses, isLoading, error, createExpense, deleteExpense };
};