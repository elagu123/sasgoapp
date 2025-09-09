


import React from 'react';

export interface Filters {
    indoorOutdoor: 'all' | 'indoor' | 'outdoor';
    price: 'all' | 'free' | 'under20' | '20-50' | 'over50';
    duration: 'all' | 'under1h' | '1-3h' | 'over3h';
    lowQueueOnly: boolean;
    accessibleOnly: boolean;
    familyFriendlyOnly: boolean;
}

interface ActivityFiltersProps {
    filters: Filters;
    onFilterChange: React.Dispatch<React.SetStateAction<Filters>>;
    onClearFilters: () => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({ filters, onFilterChange, onClearFilters }) => {
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        onFilterChange(prev => ({ ...prev, [name]: checked }));
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Indoor/Outdoor Filter */}
                <div>
                    <label htmlFor="indoorOutdoor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                    <select
                        id="indoorOutdoor"
                        name="indoorOutdoor"
                        value={filters.indoorOutdoor}
                        onChange={handleSelectChange}
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                    >
                        <option value="all">Todos</option>
                        <option value="indoor">Interior</option>
                        <option value="outdoor">Exterior</option>
                    </select>
                </div>
                {/* Price Filter */}
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio</label>
                    <select
                        id="price"
                        name="price"
                        value={filters.price}
                        onChange={handleSelectChange}
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                    >
                        <option value="all">Todos</option>
                        <option value="free">Gratis</option>
                        <option value="under20">Menos de $20</option>
                        <option value="20-50">$20 - $50</option>
                        <option value="over50">Más de $50</option>
                    </select>
                </div>
                {/* Duration Filter */}
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duración</label>
                    <select
                        id="duration"
                        name="duration"
                        value={filters.duration}
                        onChange={handleSelectChange}
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700"
                    >
                        <option value="all">Todas</option>
                        <option value="under1h">Menos de 1h</option>
                        <option value="1-3h">1-3 horas</option>
                        <option value="over3h">Más de 3 horas</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button onClick={onClearFilters} className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded-lg transition-colors">
                        Limpiar
                    </button>
                </div>
            </div>
             <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center space-x-2">
                    <input type="checkbox" name="lowQueueOnly" checked={filters.lowQueueOnly} onChange={handleCheckboxChange} className="form-checkbox rounded text-blue-600" />
                    <span>Baja espera</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" name="accessibleOnly" checked={filters.accessibleOnly} onChange={handleCheckboxChange} className="form-checkbox rounded text-blue-600" />
                    <span>Accesible</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" name="familyFriendlyOnly" checked={filters.familyFriendlyOnly} onChange={handleCheckboxChange} className="form-checkbox rounded text-blue-600" />
                    <span>Apto para familias</span>
                </label>
            </div>
        </div>
    );
};

export default ActivityFilters;