import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocumentsForTrip, addDocument, deleteDocument } from '../services/documentCache';
import type { TripDocument } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { DOCUMENTS_QUERY_KEY } from '../queryKeys';

export const useTripDocuments = (tripId: string) => {
    const queryClient = useQueryClient();
    const queryKey = [DOCUMENTS_QUERY_KEY, tripId];

    const { data: documents = [], isLoading, error } = useQuery<TripDocument[], Error>({
        queryKey,
        queryFn: () => getDocumentsForTrip(tripId),
        enabled: !!tripId,
    });

    const add = useMutation<void, Error, Omit<TripDocument, 'id' | 'tripId' | 'uploadedAt'>, { optimisticDocument: TripDocument }>({
        mutationFn: async (docData) => {
            const newDocument: TripDocument = {
                ...docData,
                id: uuidv4(),
                tripId,
                uploadedAt: new Date().toISOString(),
            };
            await addDocument(newDocument);
        },
        onMutate: async (docData) => {
            await queryClient.cancelQueries({ queryKey });
            const previousDocuments = queryClient.getQueryData<TripDocument[]>(queryKey) || [];
            
            const optimisticDocument: TripDocument = {
                ...docData,
                id: uuidv4(),
                tripId,
                uploadedAt: new Date().toISOString(),
            };

            queryClient.setQueryData<TripDocument[]>(queryKey, [...previousDocuments, optimisticDocument]);
            
            return { optimisticDocument };
        },
        onError: (_err, _newDoc, context) => {
            queryClient.setQueryData(queryKey, (old: TripDocument[] = []) => old.filter(d => d.id !== context?.optimisticDocument.id));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const remove = useMutation<void, Error, string, { previousDocuments: TripDocument[] }>({
        mutationFn: deleteDocument,
         onMutate: async (documentId) => {
            await queryClient.cancelQueries({ queryKey });
            const previousDocuments = queryClient.getQueryData<TripDocument[]>(queryKey) || [];

            queryClient.setQueryData<TripDocument[]>(
                queryKey,
                old => old?.filter(d => d.id !== documentId) ?? []
            );
            
            return { previousDocuments };
        },
        onError: (_err, _docId, context) => {
             if (context?.previousDocuments) {
                queryClient.setQueryData(queryKey, context.previousDocuments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return { documents, isLoading, error, addDocument: add.mutate, deleteDocument: remove.mutate };
};
