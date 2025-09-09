import React from 'react';
import { Link } from 'react-router-dom';
import type { PackingList } from '../types.ts';
import { usePackingLists } from '../hooks/usePackingLists.ts'; // Import the new hook

const PackingListCard: React.FC<{ list: PackingList }> = ({ list }) => {
    const totalItems = list.items?.length || 0;
    const packedItems = list.items?.filter(item => item.packed).length || 0;
    const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

    // The delete functionality will be handled by a mutation inside the hook later
    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`¿Estás seguro de que deseas eliminar la lista "${list.title}"?`)) {
            // onDelete(list.id);
            alert("Delete functionality coming soon!");
        }
    };

    return (
        <div className="relative group">
            <Link to={`/app/packing/${list.id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{list.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Viaje a {list.trip?.destination[0]}</p>
                        </div>
                        <span className="text-2xl">🏔️</span>
                    </div>
                    
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</span>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{packedItems}/{totalItems}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </Link>
             <button
                onClick={handleDelete}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900"
                aria-label="Eliminar lista"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};


const PackingDashboardPage: React.FC = () => {
    const { data: lists, isLoading, error } = usePackingLists();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Listas de Empaque</h1>
        <Link to="/app/packing/new" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          + Nueva Lista
        </Link>
      </div>

        {isLoading && <div className="text-center">Cargando listas...</div>}
        {error && <div className="text-center text-red-500">Error: {error.message}</div>}

        {lists && lists.length === 0 && (
             <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <div className="text-5xl mb-4">🧳</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">¡Organizá tu equipaje!</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Aún no tenés listas de empaque. Creá una para tu próximo viaje.</p>
                <Link to="/app/packing/new" className="bg-blue-600 text-white font-bold py-3 px-5 rounded-xl hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg">
                    Crear mi primer lista
                </Link>
            </div>
        )}

        {lists && lists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lists.map(list => (
                    <PackingListCard key={list.id} list={list} />
                ))}
            </div>
        )}
    </div>
  );
};

export default PackingDashboardPage;