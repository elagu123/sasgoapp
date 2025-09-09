import React, { useRef } from 'react';
import type { Trip } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useTripDocuments } from '../../hooks/useTripDocuments.ts';
import DocumentCard from './DocumentCard.tsx';

interface DocumentsTabProps {
    trip: Trip;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ trip }) => {
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { documents, addDocument, deleteDocument, isLoading } = useTripDocuments(trip.id);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                addToast('El archivo es demasiado grande (máx. 10MB).', 'error');
                return;
            }
            addDocument({
                name: file.name,
                fileType: file.type,
                file: file,
            }, {
                onSuccess: () => addToast('Documento subido con éxito.', 'success'),
                onError: () => addToast('No se pudo subir el documento.', 'error'),
            });
        }
        // Reset file input to allow uploading the same file again
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Documentos del Viaje</h2>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="application/pdf,image/*"
                    />
                    <button 
                        onClick={handleUploadClick}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Subir Documento
                    </button>
                </div>

                {isLoading ? (
                    <p>Cargando documentos...</p>
                ) : documents.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">Aún no tenés documentos guardados.</p>
                        <p className="mt-2 text-sm">Subí tus pasaportes, reservas y entradas para tenerlos offline.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                onDelete={() => deleteDocument(doc.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentsTab;
