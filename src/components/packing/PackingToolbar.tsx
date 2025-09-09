import React, { useState, useEffect } from 'react';
import type { PackingCategory } from '../../types.ts';
import { getSmartTemplateRecommendations } from '../../lib/packingTemplates.ts';

interface Props {
  onSearch: (term: string) => void;
  onCategoryFilter: (categories: PackingCategory[]) => void;
  onPackedFilter: (filter: 'todos' | 'pendientes' | 'empacados') => void;
  onAddItem: () => void;
  onApplyTemplate: (templateKey: string) => void;
  onExportPdf: () => void;
  tripData?: {
    destination?: string;
    pace?: string;
    tripType?: string[];
    expectedWeather?: string;
    plannedActivities?: string;
  };
}

const PackingToolbar: React.FC<Props> = ({ onSearch, onCategoryFilter, onPackedFilter, onAddItem, onApplyTemplate, onExportPdf, tripData }) => {
  const [smartTemplates, setSmartTemplates] = useState<any[]>([]);
  
  useEffect(() => {
    if (tripData) {
      const recommendations = getSmartTemplateRecommendations(tripData);
      setSmartTemplates(recommendations);
    }
  }, [tripData]);

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
        <select 
          onChange={e => onApplyTemplate(e.target.value)} 
          className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-gray-50 text-sm min-w-48"
        >
          <option value="">🎯 Usar Plantilla...</option>
          {smartTemplates.length > 0 && (
            <optgroup label="✨ Recomendadas para tu viaje">
              {smartTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.emoji} {template.name}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="📋 Todas las plantillas">
            <option value="playa_basico">🏖️ Básico de Playa</option>
            <option value="montana_aventura">🏔️ Aventura en Montaña</option>
            <option value="ciudad_trabajo">💼 Viaje de Negocios</option>
            <option value="familia_completo">👨‍👩‍👧‍👦 Viaje Familiar</option>
            <option value="invierno_frio">❄️ Destino Frío</option>
          </optgroup>
        </select>
        <button onClick={onExportPdf} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">📄 Exportar PDF</button>
      </div>
      
      {smartTemplates.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
            💡 Plantillas inteligentes sugeridas para tu viaje:
          </p>
          <div className="flex flex-wrap gap-2">
            {smartTemplates.slice(0, 3).map(template => (
              <button
                key={template.id}
                onClick={() => onApplyTemplate(template.id)}
                className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                {template.emoji} {template.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackingToolbar;