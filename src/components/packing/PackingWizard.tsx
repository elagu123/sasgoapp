import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trip, PackingListItem } from '../../types';

interface PackingWizardProps {
  trip: Trip;
  onComplete: (packingList: PackingListItem[]) => void;
  onClose: () => void;
}

interface WizardStep {
  step: number;
  title: string;
  description: string;
  isComplete: boolean;
}

interface TripContext {
  destination: string;
  duration: number;
  durationType: 'weekend' | 'week' | 'extended';
  accommodationType: 'hotel' | 'airbnb' | 'hostel' | 'camping';
  packingStyle: 'minimalist' | 'standard' | 'prepared';
  climate: {
    temperature: number;
    condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
    season: 'spring' | 'summer' | 'fall' | 'winter';
  };
}

interface ActivitySelection {
  id: string;
  name: string;
  icon: string;
  category: 'outdoor' | 'cultural' | 'business' | 'leisure' | 'sports';
  selected: boolean;
  packingWeight: number; // Impacto en la lista de equipaje (1-5)
}

interface PersonalPreferences {
  baggageRestriction: 'carry-on' | 'checked' | 'unlimited';
  specialNeeds: string[];
  preparationLevel: 'basic' | 'intermediate' | 'exhaustive';
  travelExperience: 'first-time' | 'occasional' | 'frequent';
}

const PackingWizard: React.FC<PackingWizardProps> = ({ trip, onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [tripContext, setTripContext] = useState<TripContext>({
    destination: Array.isArray(trip.destination) ? trip.destination[0] : trip.destination,
    duration: Math.ceil((new Date(trip.endDate || trip.dates?.end || '').getTime() - new Date(trip.startDate || trip.dates?.start || '').getTime()) / (1000 * 60 * 60 * 24)),
    durationType: 'week',
    accommodationType: 'hotel',
    packingStyle: 'standard',
    climate: {
      temperature: trip.weather?.averageTemp || 20,
      condition: trip.weather?.condition || 'sunny',
      season: 'summer'
    }
  });

  const [activities, setActivities] = useState<ActivitySelection[]>([
    { id: 'beach', name: 'Playa/Piscina', icon: '🏖️', category: 'leisure', selected: false, packingWeight: 4 },
    { id: 'hiking', name: 'Hiking/Trekking', icon: '🥾', category: 'outdoor', selected: false, packingWeight: 5 },
    { id: 'cultural', name: 'Turismo cultural', icon: '🏛️', category: 'cultural', selected: false, packingWeight: 2 },
    { id: 'business', name: 'Negocios/Trabajo', icon: '💼', category: 'business', selected: false, packingWeight: 3 },
    { id: 'nightlife', name: 'Nightlife', icon: '🎉', category: 'leisure', selected: false, packingWeight: 3 },
    { id: 'sports', name: 'Deportes', icon: '🏃', category: 'sports', selected: false, packingWeight: 4 },
    { id: 'photography', name: 'Fotografía', icon: '📸', category: 'leisure', selected: false, packingWeight: 4 },
    { id: 'wellness', name: 'Wellness/Spa', icon: '🧘', category: 'leisure', selected: false, packingWeight: 2 }
  ]);

  const [preferences, setPreferences] = useState<PersonalPreferences>({
    baggageRestriction: 'checked',
    specialNeeds: [],
    preparationLevel: 'intermediate',
    travelExperience: 'occasional'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const steps: WizardStep[] = [
    {
      step: 1,
      title: 'Contexto del Viaje',
      description: 'Configuración básica de tu viaje',
      isComplete: currentStep > 1
    },
    {
      step: 2,
      title: 'Actividades Planeadas',
      description: 'Qué planeas hacer en tu viaje',
      isComplete: currentStep > 2
    },
    {
      step: 3,
      title: 'Preferencias Personales',
      description: 'Personaliza tu lista de equipaje',
      isComplete: currentStep > 3
    }
  ];

  useEffect(() => {
    // Auto-detectar tipo de duración
    if (tripContext.duration <= 3) {
      setTripContext(prev => ({ ...prev, durationType: 'weekend' }));
    } else if (tripContext.duration <= 14) {
      setTripContext(prev => ({ ...prev, durationType: 'week' }));
    } else {
      setTripContext(prev => ({ ...prev, durationType: 'extended' }));
    }
  }, [tripContext.duration]);

  const handleActivityToggle = (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, selected: !activity.selected }
          : activity
      )
    );
  };

  const handleSpecialNeedToggle = (need: string) => {
    setPreferences(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(need)
        ? prev.specialNeeds.filter(n => n !== need)
        : [...prev.specialNeeds, need]
    }));
  };

  const generatePackingList = async (): Promise<PackingListItem[]> => {
    setIsGenerating(true);
    
    // Simular generación con IA (en producción llamaría a Gemini API)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const selectedActivities = activities.filter(a => a.selected);
    const baseItems: Partial<PackingListItem>[] = [];

    // Documentos esenciales
    baseItems.push(
      { name: 'Pasaporte', category: 'documentos', priority: 1, qty: 1 },
      { name: 'Seguro de viaje', category: 'documentos', priority: 1, qty: 1 },
      { name: 'Reservas impresas', category: 'documentos', priority: 2, qty: 1 }
    );

    // Ropa base según duración y clima
    const clothingMultiplier = Math.max(1, Math.floor(tripContext.duration / 3));
    baseItems.push(
      { name: 'Camisetas', category: 'ropa', priority: 1, qty: 2 + clothingMultiplier },
      { name: 'Pantalones', category: 'ropa', priority: 1, qty: Math.min(3, 1 + clothingMultiplier) },
      { name: 'Ropa interior', category: 'ropa', priority: 1, qty: tripContext.duration + 1 },
      { name: 'Medias', category: 'ropa', priority: 1, qty: tripContext.duration + 1 }
    );

    // Ropa según clima
    if (tripContext.climate.temperature < 15) {
      baseItems.push(
        { name: 'Abrigo', category: 'ropa', priority: 1, qty: 1 },
        { name: 'Suéter', category: 'ropa', priority: 2, qty: 1 }
      );
    }

    if (tripContext.climate.condition === 'rainy') {
      baseItems.push(
        { name: 'Impermeable', category: 'ropa', priority: 2, qty: 1 },
        { name: 'Paraguas', category: 'otros', priority: 2, qty: 1 }
      );
    }

    // Items según actividades seleccionadas
    selectedActivities.forEach(activity => {
      switch (activity.id) {
        case 'beach':
          baseItems.push(
            { name: 'Traje de baño', category: 'ropa', priority: 1, qty: 2 },
            { name: 'Protector solar', category: 'higiene', priority: 1, qty: 1 },
            { name: 'Toalla de playa', category: 'otros', priority: 2, qty: 1 }
          );
          break;
        case 'hiking':
          baseItems.push(
            { name: 'Botas de trekking', category: 'calzado', priority: 1, qty: 1 },
            { name: 'Mochila pequeña', category: 'otros', priority: 2, qty: 1 },
            { name: 'Botella de agua', category: 'otros', priority: 1, qty: 1 }
          );
          break;
        case 'business':
          baseItems.push(
            { name: 'Traje/Ropa formal', category: 'ropa', priority: 1, qty: 1 },
            { name: 'Zapatos formales', category: 'calzado', priority: 1, qty: 1 },
            { name: 'Laptop', category: 'electrónica', priority: 2, qty: 1 }
          );
          break;
        case 'nightlife':
          baseItems.push(
            { name: 'Ropa de noche', category: 'ropa', priority: 2, qty: 2 },
            { name: 'Zapatos elegantes', category: 'calzado', priority: 2, qty: 1 }
          );
          break;
        case 'photography':
          baseItems.push(
            { name: 'Cámara', category: 'electrónica', priority: 2, qty: 1 },
            { name: 'Baterías extra', category: 'electrónica', priority: 2, qty: 2 },
            { name: 'Tarjetas de memoria', category: 'electrónica', priority: 2, qty: 2 }
          );
          break;
      }
    });

    // Electrónicos esenciales
    baseItems.push(
      { name: 'Cargador de teléfono', category: 'electrónica', priority: 1, qty: 1 },
      { name: 'Power bank', category: 'electrónica', priority: 2, qty: 1 }
    );

    // Higiene personal
    baseItems.push(
      { name: 'Cepillo de dientes', category: 'higiene', priority: 1, qty: 1 },
      { name: 'Pasta dental', category: 'higiene', priority: 1, qty: 1 },
      { name: 'Shampoo', category: 'higiene', priority: 1, qty: 1 },
      { name: 'Desodorante', category: 'higiene', priority: 1, qty: 1 }
    );

    // Ajustar según preferencias
    if (preferences.preparationLevel === 'exhaustive') {
      baseItems.push(
        { name: 'Kit de primeros auxilios', category: 'salud', priority: 2, qty: 1 },
        { name: 'Adaptador universal', category: 'electrónica', priority: 2, qty: 1 },
        { name: 'Candado para equipaje', category: 'otros', priority: 3, qty: 1 }
      );
    }

    // Convertir a PackingListItem completo
    const packingList: PackingListItem[] = baseItems.map((item, index) => ({
      id: `item-${index}`,
      name: item.name!,
      qty: item.qty!,
      category: item.category!,
      packed: false,
      priority: item.priority as 1 | 2 | 3,
      autoSuggested: true,
      relatedActivities: selectedActivities
        .filter(a => {
          // Lógica para relacionar items con actividades
          if (item.name?.toLowerCase().includes('traje de baño') && a.id === 'beach') return true;
          if (item.name?.toLowerCase().includes('bota') && a.id === 'hiking') return true;
          if (item.name?.toLowerCase().includes('formal') && a.id === 'business') return true;
          return false;
        })
        .map(a => a.id),
      weatherRelevant: item.name?.toLowerCase().includes('abrigo') || 
                     item.name?.toLowerCase().includes('impermeable') ||
                     item.name?.toLowerCase().includes('protector')
    }));

    setIsGenerating(false);
    return packingList;
  };

  const handleComplete = async () => {
    const generatedList = await generatePackingList();
    onComplete(generatedList);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🎒 Generador Inteligente de Equipaje</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  currentStep === step.step 
                    ? 'bg-white text-blue-600' 
                    : step.isComplete 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/20 text-white/70'
                }`}>
                  {step.isComplete ? '✓' : step.step}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-white/70">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-4 w-8 h-0.5 bg-white/30" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Contexto del Viaje
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Destino y Duración */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Destino
                      </label>
                      <input
                        type="text"
                        value={tripContext.destination}
                        onChange={(e) => setTripContext(prev => ({ ...prev, destination: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="París, Francia"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duración ({tripContext.duration} días)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'weekend', label: 'Weekend', desc: '1-3 días' },
                          { value: 'week', label: 'Semana', desc: '4-14 días' },
                          { value: 'extended', label: '2+ semanas', desc: '15+ días' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setTripContext(prev => ({ ...prev, durationType: option.value as any }))}
                            className={`p-3 rounded-lg border text-center transition-colors ${
                              tripContext.durationType === option.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Alojamiento y Estilo */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de alojamiento
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'hotel', label: 'Hotel ⭐', desc: 'Servicios incluidos' },
                          { value: 'airbnb', label: 'Airbnb 🏠', desc: 'Apartamento privado' },
                          { value: 'hostel', label: 'Hostel 🛏️', desc: 'Compartido/económico' },
                          { value: 'camping', label: 'Camping ⛺', desc: 'Al aire libre' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setTripContext(prev => ({ ...prev, accommodationType: option.value as any }))}
                            className={`p-3 rounded-lg border text-center transition-colors ${
                              tripContext.accommodationType === option.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estilo de equipaje
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'minimalist', label: 'Minimalista', desc: 'Solo lo esencial' },
                          { value: 'standard', label: 'Estándar', desc: 'Equilibrio perfecto' },
                          { value: 'prepared', label: 'Preparado para todo', desc: 'Mejor prevenir' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setTripContext(prev => ({ ...prev, packingStyle: option.value as any }))}
                            className={`w-full p-3 rounded-lg border text-left transition-colors ${
                              tripContext.packingStyle === option.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Actividades Planeadas
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Selecciona las actividades que planeas hacer. Esto nos ayuda a sugerir el equipaje específico que necesitarás.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {activities.map((activity) => (
                    <motion.button
                      key={activity.id}
                      onClick={() => handleActivityToggle(activity.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                        activity.selected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 scale-105'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:scale-102'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-3xl mb-2">{activity.icon}</div>
                      <div className="font-medium text-sm">{activity.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Impacto: {'⭐'.repeat(activity.packingWeight)}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                    <span>💡</span>
                    <span className="font-medium">
                      Actividades seleccionadas: {activities.filter(a => a.selected).length}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Cada actividad añadirá items específicos a tu lista de equipaje
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Preferencias Personales
                </h3>

                <div className="space-y-6">
                  {/* Restricciones de equipaje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Restricciones de equipaje
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'carry-on', label: 'Solo carry-on', desc: 'Equipaje de mano únicamente' },
                        { value: 'checked', label: 'Con maleta facturada', desc: 'Equipaje completo' },
                        { value: 'unlimited', label: 'Sin límite', desc: 'Múltiples maletas' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setPreferences(prev => ({ ...prev, baggageRestriction: option.value as any }))}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            preferences.baggageRestriction === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <div className="font-medium text-sm">{option.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Necesidades especiales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Necesidades especiales
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        'Medicamentos',
                        'Equipamiento bebé',
                        'Dieta especial',
                        'Accesibilidad',
                        'Mascotas',
                        'Deportes acuáticos',
                        'Instrumentos',
                        'Trabajo remoto'
                      ].map((need) => (
                        <button
                          key={need}
                          onClick={() => handleSpecialNeedToggle(need)}
                          className={`p-2 rounded-lg border text-sm transition-colors ${
                            preferences.specialNeeds.includes(need)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {need}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nivel de preparación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Nivel de preparación
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'basic', label: 'Básico', desc: 'Solo lo indispensable' },
                        { value: 'intermediate', label: 'Intermedio', desc: 'Equilibrio entre necesidad y preparación' },
                        { value: 'exhaustive', label: 'Exhaustivo', desc: 'Preparado para cualquier situación' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setPreferences(prev => ({ ...prev, preparationLevel: option.value as any }))}
                          className={`w-full p-3 rounded-lg border text-left transition-colors ${
                            preferences.preparationLevel === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Anterior
          </button>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Paso {currentStep} de 3</span>
          </div>

          <button
            onClick={nextStep}
            disabled={isGenerating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isGenerating && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {currentStep === 3 
                ? (isGenerating ? 'Generando...' : 'Generar Lista') 
                : 'Siguiente'
              }
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PackingWizard;