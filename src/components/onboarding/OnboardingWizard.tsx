import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useToast } from '../../hooks/useToast.ts';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, Trip } from '../../types.ts';
import { createTrip } from '../../services/api.ts';
import { v4 as uuidv4 } from 'uuid';

interface OnboardingData {
  travelStyle: UserProfile['travelStyle'];
  preferredCategories: string[];
  budgetRange: 'low' | 'medium' | 'high' | 'luxury';
  interests: string[];
  firstTrip?: {
    title: string;
    destination: string[];
    dates: { start: string; end: string };
    travelers: number;
    budget: number;
  };
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TRAVEL_STYLES: Array<{ value: UserProfile['travelStyle']; label: string; description: string; emoji: string }> = [
  { value: 'backpacker', label: 'Mochilero', description: 'Aventurero, económico, experiencias auténticas', emoji: '🎒' },
  { value: 'balanced', label: 'Equilibrado', description: 'Balance entre comodidad y aventura', emoji: '⚖️' },
  { value: 'comfort', label: 'Confortable', description: 'Comodidad moderada, planificación cuidadosa', emoji: '🛏️' },
  { value: 'luxury', label: 'Lujo', description: 'Experiencias premium, servicios de alta gama', emoji: '✨' }
];

const INTERESTS_OPTIONS = [
  { value: 'sightseeing', label: 'Turismo y Monumentos', emoji: '🏛️' },
  { value: 'food', label: 'Gastronomía', emoji: '🍽️' },
  { value: 'culture', label: 'Arte y Cultura', emoji: '🎭' },
  { value: 'outdoors', label: 'Actividades al Aire Libre', emoji: '🏔️' },
  { value: 'nightlife', label: 'Vida Nocturna', emoji: '🌃' },
  { value: 'shopping', label: 'Compras', emoji: '🛍️' },
  { value: 'adventure', label: 'Deportes Extremos', emoji: '🪂' },
  { value: 'wellness', label: 'Bienestar y Relajación', emoji: '🧘' },
  { value: 'photography', label: 'Fotografía', emoji: '📸' },
  { value: 'history', label: 'Historia', emoji: '📚' }
];

const BUDGET_RANGES = [
  { value: 'low' as const, label: 'Económico', description: 'Hasta $500 por persona', emoji: '💰' },
  { value: 'medium' as const, label: 'Medio', description: '$500 - $1500 por persona', emoji: '💳' },
  { value: 'high' as const, label: 'Alto', description: '$1500 - $3000 por persona', emoji: '💎' },
  { value: 'luxury' as const, label: 'Lujo', description: 'Más de $3000 por persona', emoji: '👑' }
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updatePreferences } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    travelStyle: 'balanced',
    preferredCategories: [],
    budgetRange: 'medium',
    interests: []
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  }, []);

  const steps = [
    { title: 'Bienvenido a SAS Go', subtitle: 'Tu asistente inteligente para viajes' },
    { title: 'Tu Estilo de Viaje', subtitle: '¿Cómo prefieres viajar?' },
    { title: 'Tus Intereses', subtitle: '¿Qué te gusta hacer cuando viajas?' },
    { title: 'Presupuesto Preferido', subtitle: '¿Cuál es tu rango de presupuesto típico?' },
    { title: 'Crea tu Primer Viaje', subtitle: 'Comencemos con tu próxima aventura' }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Update user preferences
      const newPreferences: UserProfile = {
        travelStyle: onboardingData.travelStyle,
        preferredCategories: onboardingData.interests,
        budgetHistory: []
      };

      await updatePreferences(newPreferences);

      // Create first trip if provided
      if (onboardingData.firstTrip) {
        const tripData: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'members' | 'privacy'> = {
          title: onboardingData.firstTrip.title,
          destination: onboardingData.firstTrip.destination,
          dates: onboardingData.firstTrip.dates,
          travelers: onboardingData.firstTrip.travelers,
          pace: onboardingData.travelStyle === 'backpacker' ? 'intense' : 
                onboardingData.travelStyle === 'luxury' ? 'relaxed' : 'moderate',
          budget: onboardingData.firstTrip.budget,
          interests: onboardingData.interests
        };

        const newTrip = await createTrip(tripData);
        addToast('¡Perfil configurado y primer viaje creado!', 'success');
        navigate(`/app/trips/${newTrip.id}`);
      } else {
        addToast('¡Perfil configurado exitosamente!', 'success');
        navigate('/app/dashboard');
      }

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      addToast('Error al configurar el perfil', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStep} onSkip={onSkip} userName={user?.name} />;
      case 1:
        return (
          <TravelStyleStep 
            selected={onboardingData.travelStyle}
            onSelect={(style) => updateData({ travelStyle: style })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <InterestsStep 
            selected={onboardingData.interests}
            onSelect={(interests) => updateData({ interests })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <BudgetStep 
            selected={onboardingData.budgetRange}
            onSelect={(range) => updateData({ budgetRange: range })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <FirstTripStep 
            data={onboardingData}
            onUpdate={(tripData) => updateData({ firstTrip: tripData })}
            onComplete={handleComplete}
            onSkip={() => {
              updateData({ firstTrip: undefined });
              handleComplete();
            }}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Paso {currentStep + 1} de {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {steps[currentStep].title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {steps[currentStep].subtitle}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual step components
const WelcomeStep: React.FC<{ onNext: () => void; onSkip: () => void; userName?: string }> = ({ onNext, onSkip, userName }) => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-6">🧳</div>
    <div className="space-y-4">
      <h2 className="text-xl text-gray-800 dark:text-gray-200">
        {userName ? `¡Hola ${userName}!` : '¡Hola!'} 👋
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
        Te ayudaremos a configurar tu perfil de viajero para ofrecerte recomendaciones personalizadas 
        y crear itinerarios perfectos para ti.
      </p>
    </div>
    <div className="flex gap-4 justify-center pt-6">
      <button
        onClick={onSkip}
        className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        Omitir configuración
      </button>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
      >
        Comenzar configuración
      </button>
    </div>
  </div>
);

const TravelStyleStep: React.FC<{
  selected: UserProfile['travelStyle'];
  onSelect: (style: UserProfile['travelStyle']) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ selected, onSelect, onNext, onBack }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {TRAVEL_STYLES.map((style) => (
        <motion.button
          key={style.value}
          onClick={() => onSelect(style.value)}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            selected === style.value 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{style.emoji}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{style.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{style.description}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
    <div className="flex justify-between pt-6">
      <button onClick={onBack} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
        Atrás
      </button>
      <button 
        onClick={onNext}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
      >
        Siguiente
      </button>
    </div>
  </div>
);

const InterestsStep: React.FC<{
  selected: string[];
  onSelect: (interests: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ selected, onSelect, onNext, onBack }) => {
  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      onSelect(selected.filter(i => i !== interest));
    } else {
      onSelect([...selected, interest]);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-gray-600 dark:text-gray-400">
        Selecciona todas las actividades que te interesan (mínimo 3):
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {INTERESTS_OPTIONS.map((interest) => (
          <motion.button
            key={interest.value}
            onClick={() => toggleInterest(interest.value)}
            className={`p-3 rounded-lg border text-center transition-all ${
              selected.includes(interest.value)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl mb-1">{interest.emoji}</div>
            <div className="text-xs font-medium">{interest.label}</div>
          </motion.button>
        ))}
      </div>
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          Atrás
        </button>
        <button 
          onClick={onNext}
          disabled={selected.length < 3}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente ({selected.length}/3+)
        </button>
      </div>
    </div>
  );
};

const BudgetStep: React.FC<{
  selected: 'low' | 'medium' | 'high' | 'luxury';
  onSelect: (range: 'low' | 'medium' | 'high' | 'luxury') => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ selected, onSelect, onNext, onBack }) => (
  <div className="space-y-6">
    <div className="space-y-3">
      {BUDGET_RANGES.map((range) => (
        <motion.button
          key={range.value}
          onClick={() => onSelect(range.value)}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            selected === range.value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{range.emoji}</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{range.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{range.description}</p>
              </div>
            </div>
            {selected === range.value && <span className="text-blue-500">✓</span>}
          </div>
        </motion.button>
      ))}
    </div>
    <div className="flex justify-between pt-6">
      <button onClick={onBack} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
        Atrás
      </button>
      <button 
        onClick={onNext}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
      >
        Siguiente
      </button>
    </div>
  </div>
);

const FirstTripStep: React.FC<{
  data: OnboardingData;
  onUpdate: (tripData: OnboardingData['firstTrip']) => void;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}> = ({ data, onUpdate, onComplete, onSkip, onBack, isSubmitting }) => {
  const [tripData, setTripData] = useState<NonNullable<OnboardingData['firstTrip']>>({
    title: '',
    destination: [''],
    dates: { 
      start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
      end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]  // Two weeks from now
    },
    travelers: 2,
    budget: data.budgetRange === 'low' ? 500 : data.budgetRange === 'medium' ? 1000 : data.budgetRange === 'high' ? 2000 : 3500
  });

  const handleSubmit = () => {
    if (tripData.title.trim() && tripData.destination[0].trim()) {
      onUpdate(tripData);
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
          ¡Opcional! Puedes crear tu primer viaje ahora o saltar este paso.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Título del viaje</label>
          <input
            type="text"
            value={tripData.title}
            onChange={(e) => setTripData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="ej: Vacaciones en Bariloche"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Destino</label>
          <input
            type="text"
            value={tripData.destination[0]}
            onChange={(e) => setTripData(prev => ({ ...prev, destination: [e.target.value] }))}
            placeholder="ej: Bariloche, Argentina"
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha inicio</label>
            <input
              type="date"
              value={tripData.dates.start}
              onChange={(e) => setTripData(prev => ({ ...prev, dates: { ...prev.dates, start: e.target.value } }))}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha fin</label>
            <input
              type="date"
              value={tripData.dates.end}
              onChange={(e) => setTripData(prev => ({ ...prev, dates: { ...prev.dates, end: e.target.value } }))}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Viajeros</label>
            <input
              type="number"
              min="1"
              max="20"
              value={tripData.travelers}
              onChange={(e) => setTripData(prev => ({ ...prev, travelers: parseInt(e.target.value) || 1 }))}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Presupuesto (USD)</label>
            <input
              type="number"
              min="100"
              value={tripData.budget}
              onChange={(e) => setTripData(prev => ({ ...prev, budget: parseInt(e.target.value) || 500 }))}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          Atrás
        </button>
        <div className="flex gap-3">
          <button 
            onClick={onSkip}
            disabled={isSubmitting}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Saltar por ahora
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !tripData.title.trim() || !tripData.destination[0].trim()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creando...' : 'Crear mi primer viaje'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;