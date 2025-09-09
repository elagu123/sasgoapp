import React from 'react';
import type { TripDocument } from '../../types.ts';

interface DocumentCardProps {
    document: TripDocument;
    onDelete: () => void;
}

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    return '📎';
};

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
    const objectUrl = React.useMemo(() => URL.createObjectURL(document.file), [document.file]);

    React.useEffect(() => {
        // Clean up the object URL when the component unmounts
        return () => URL.revokeObjectURL(objectUrl);
    }, [objectUrl]);

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm p-4 flex flex-col justify-between group">
            <div>
                <div className="flex items-start justify-between">
                    <div className="text-4xl">{getFileIcon(document.fileType)}</div>
                     <button
                        onClick={onDelete}
                        className="p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/50"
                        aria-label="Eliminar documento"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                <p className="mt-2 font-semibold text-gray-800 dark:text-white break-all">{document.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Subido: {new Date(document.uploadedAt).toLocaleDateString()}
                </p>
            </div>
            <a
                href={objectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full text-center bg-white dark:bg-gray-700 font-semibold text-sm py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border dark:border-gray-600"
            >
                Ver Documento
            </a>
        </div>
    );
};

export default DocumentCard;
