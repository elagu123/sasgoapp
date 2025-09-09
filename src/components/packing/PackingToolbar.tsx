import React from 'react';
import type { PackingCategory } from '../../types.ts';

interface Props {
  onSearch: (term: string) => void;
  onCategoryFilter: (categories: PackingCategory[]) => void;
  onPackedFilter: (filter: 'todos' | 'pendientes' | 'empacados') => void;
  onAddItem: () => void;
  onApplyTemplate: (templateKey: string) => void;
  onExportPdf: () => void;
}

const PackingToolbar: React.FC<Props> = ({ onSearch, onCategoryFilter, onPackedFilter, onAddItem, onApplyTemplate, onExportPdf }) => {
  // In a real app, category filter would be a multi-select dropdown.
  // For simplicity, we use buttons.

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4" role="region" aria-label="Herramientas de lista de equipaje">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="search"
          placeholder="Buscar ítems..."
          onChange={e => onSearch(e.target.value)}
          className="md:col-span-2 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
        <select onChange={e => onPackedFilter(e.target.value as any)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
          <option value="todos">Todos los ítems</option>
          <option value="pendientes">Solo pendientes</option>
          <option value="empacados">Solo empacados</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onAddItem} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">+ Añadir Ítem</button>
        <select onChange={e => onApplyTemplate(e.target.value)} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-gray-50 text-sm">
          <option value="">Usar Plantilla...</option>
          <option value="playa_basico">Básico de Playa</option>
        </select>
        <button onClick={onExportPdf} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Exportar PDF</button>
      </div>
    </div>
  );
};

export default PackingToolbar;