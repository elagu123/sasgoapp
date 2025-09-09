import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePackingListFromAI } from '../services/geminiService.ts';
// FIX: Add PackingCategory to import to be used in type casting.
import type { PackingList, PackingListItem, PackingCategory } from '../types.ts';
import { useToast } from '../hooks/useToast.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPackingList } from '../services/api.ts';
import { PACKING_LISTS_QUERY_KEY } from '../queryKeys.ts';


const NewPackingListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    bagType: 'carry-on',
    tripType: [] as string[],
    plannedActivities: '',
    expectedWeather: '',
    useAI: true,
  });
  
  // This page needs a tripId to associate the list with.
  // In a real app, this would come from the URL or state. We'll use a placeholder.
  // TODO: Select a trip to create the list for.
  const tripId = 'trip1';

  const { mutate: createList, isPending: isLoading } = useMutation<PackingList, Error, { tripId: string, title: string, items: Omit<PackingListItem, 'id' | 'packed'>[] }>({
    mutationFn: (newList: { tripId: string, title: string, items: Omit<PackingListItem, 'id' | 'packed'>[] }) => createPackingList(newList),
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [PACKING_LISTS_QUERY_KEY] });
        addToast('Nueva lista creada con éxito!', 'success');
        navigate(`/app/packing/${data.id}`);
    },
    onError: () => {
        addToast('No se pudo crear la lista.', 'error');
    }
  });


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'tripType') => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentValues = prev[field];
      if (checked) {
        return { ...prev, [field]: [...currentValues, value] };
      } else {
        return { ...prev, [field]: currentValues.filter(item => item !== value) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newListRequest = {
        title: formData.title,
        destination: formData.destination,
        dates: { start: formData.startDate, end: formData.endDate },
        bagType: formData.bagType,
        tripType: formData.tripType,
        plannedActivities: formData.plannedActivities,
        expectedWeather: formData.expectedWeather,
    };

    let items: Omit<PackingListItem, 'id' | 'packed'>[] = [];
    if (formData.useAI) {
      addToast('Generando sugerencias con IA...', 'info');
      try {
        const aiResult = await generatePackingListFromAI(newListRequest);
        // FIX: Cast the 'category' string from the AI response to the specific 'PackingCategory' type
        // to match the expected type for creating a packing list.
        items = aiResult.items.map(item => ({
          ...item,
          category: item.category as PackingCategory,
        }));
      } catch (error) {
        addToast('No se pudieron generar sugerencias de IA.', 'error');
      }
    }
    
    createList({ tripId, title: formData.title, items });
  };

  const tripTypes = ['Vacaciones', 'Trabajo', 'Aventura', 'Familiar', 'Playa', 'Montaña'];

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Crear Nueva Lista de Empaque</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título de la Lista</label>
          <input type="text" name="title" id="title" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destino</label>
          <input type="text" name="destination" id="destination" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" onChange={handleInputChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio</label>
            <input type="date" name="startDate" id="startDate" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Fin</label>
            <input type="date" name="endDate" id="endDate" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" onChange={handleInputChange} />
          </div>
        </div>
        <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Equipaje</span>
            <div className="mt-2 flex space-x-4">
              {['carry-on', 'checked', 'mochila'].map(type => (
                <label key={type} className="inline-flex items-center">
                  <input type="radio" className="form-radio" name="bagType" value={type} checked={formData.bagType === type} onChange={handleInputChange} />
                  <span className="ml-2 capitalize">{type}</span>
                </label>
              ))}
            </div>
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Viaje</span>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
            {tripTypes.map(type => (
                <label key={type} className="inline-flex items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                    <input type="checkbox" className="form-checkbox" value={type.toLowerCase()} onChange={e => handleCheckboxChange(e, 'tripType')} />
                    <span className="ml-2">{type}</span>
                </label>
            ))}
          </div>
        </div>

        <div>
            <label htmlFor="expectedWeather" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Clima Esperado</label>
            <input type="text" name="expectedWeather" id="expectedWeather" placeholder="Ej: Soleado con noches frescas, 25°C" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" onChange={handleInputChange} />
        </div>

        <div>
            <label htmlFor="plannedActivities" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Actividades Planeadas</label>
            <textarea name="plannedActivities" id="plannedActivities" placeholder="Ej: Trekking en la montaña, cenas elegantes, día de playa" rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" onChange={handleInputChange}></textarea>
        </div>
        
        <div className="flex items-start">
            <div className="flex items-center h-5">
                <input id="useAI" name="useAI" type="checkbox" checked={formData.useAI} onChange={e => setFormData(p => ({...p, useAI: e.target.checked}))} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor="useAI" className="font-medium text-gray-700 dark:text-gray-300">✨ Usar IA para sugerencias</label>
                <p className="text-gray-500 dark:text-gray-400">Genera una lista de ítems inicial basada en los detalles de tu viaje.</p>
            </div>
        </div>
        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
          {isLoading ? 'Creando...' : 'Crear Lista'}
        </button>
      </form>
    </div>
  );
};

export default NewPackingListPage;