import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../hooks/useTrips';
import EnhancedGetawayPlanner from '../components/ai-suggestions/EnhancedGetawayPlanner';
import type { Trip } from '../types';

interface GetawayOption {
  id: string;
  title: string;
  destination: string;
  country: string;
  flag: string;
  matchScore: number;
  estimatedBudget: number;
  budgetStatus: 'under' | 'on' | 'over';
  highlights: string[];
  itinerary: {
    day: number;
    activities: string[];
  }[];
  packingItems: string[];
  bestTimeToGo: 'now' | 'soon' | 'seasonal';
  image: string;
  pros: string[];
  cons: string[];
  weatherForecast: {
    temp: number;
    condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
  };
}

const EnhancedGetawayPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTrip } = useTrips();
  const [selectedPlan, setSelectedPlan] = useState<GetawayOption | null>(null);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  const handlePlanSelected = async (plan: GetawayOption) => {
    setSelectedPlan(plan);
    setIsCreatingTrip(true);

    try {
      // Convert GetawayOption to Trip format
      const tripData: Omit<Trip, 'id'> = {
        userId: 'current-user', // This would come from auth context
        title: plan.title,
        destination: plan.destination,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
        endDate: new Date(Date.now() + (7 + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days later
        travelers: 2,
        pace: 'moderate',
        budget: plan.estimatedBudget,
        spentBudget: 0,
        interests: plan.highlights,
        createdAt: new Date().toISOString(),
        members: [],
        privacy: 'private',
        weather: plan.weatherForecast,
        country: plan.country,
        image: plan.image,
        itineraryProgress: 0,
        packingProgress: 0,
        bookingProgress: 0,
        documentsProgress: 0,
        status: 'planning'
      };

      // Create the trip
      const newTrip = await createTrip.mutateAsync(tripData);
      setCreatedTripId(newTrip.id);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating trip:', error);
      // Handle error
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleGoToTrip = () => {
    if (createdTripId) {
      navigate(`/app/trips/${createdTripId}`);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/app/dashboard-v2');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
            <button 
              onClick={() => navigate('/app/dashboard')}
              className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Dashboard
            </button>
            <span>›</span>
            <span>Escapadas IA</span>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Escapadas{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  Inteligentes
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Nuestra IA diseña la escapada perfecta analizando tus preferencias, 
                presupuesto y deseos de aventura.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center space-x-8 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">15s</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tiempo promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">94%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Satisfacción</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">2.5K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Escapadas creadas</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <EnhancedGetawayPlanner 
          onPlanSelected={handlePlanSelected}
          userLocation="Buenos Aires, Argentina"
        />
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Por qué nuestras sugerencias son diferentes?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Combinamos inteligencia artificial avanzada con datos en tiempo real 
            para crear experiencias únicas y personalizadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: '🧠',
              title: 'IA Contextual',
              description: 'Analiza tu historial, preferencias y contexto personal para sugerencias únicas.'
            },
            {
              icon: '🌍',
              title: 'Datos en Tiempo Real',
              description: 'Clima, eventos, precios y disponibilidad actualizados al momento.'
            },
            {
              icon: '🎯',
              title: 'Match Scoring',
              description: 'Algoritmo que calcula compatibilidad basado en 50+ factores.'
            },
            {
              icon: '⚡',
              title: 'Modo Sorpresa',
              description: 'Input mínimo para descubrir destinos que nunca consideraste.'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Experiencias reales de viajeros
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "María González",
                location: "Buenos Aires",
                text: "En 2 minutos tenía 3 opciones perfectas para mi weekend. Elegí Colonia y fue exactamente lo que necesitaba.",
                rating: 5,
                trip: "Weekend en Colonia"
              },
              {
                name: "Carlos Mendez",
                location: "Córdoba", 
                text: "El modo sorpresa me llevó a lugares que jamás habría considerado. Terminé en Cafayate y fue increíble.",
                rating: 5,
                trip: "Aventura en Salta"
              },
              {
                name: "Laura Castro",
                location: "Rosario",
                text: "La IA entendió perfectamente que buscaba algo romántico pero accesible. Mendoza fue la elección perfecta.",
                rating: 5,
                trip: "Escapada romántica"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
              >
                <div className="flex text-yellow-400 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.location}
                    </div>
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                    {testimonial.trip}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      <AnimatePresence>
        {isCreatingTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center"
            >
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Creando tu viaje...
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Estamos preparando todo para tu escapada a {selectedPlan?.destination}
              </p>
              
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Configurando itinerario</span>
                </div>
                <div>📋 Generando lista de equipaje</div>
                <div>💰 Calculando presupuesto detallado</div>
                <div>🎯 Sincronizando con calendario</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg mx-4 text-center"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Tu escapada está lista!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Hemos creado tu viaje a <span className="font-semibold text-blue-600">{selectedPlan?.destination}</span>. 
                Ya puedes empezar a planificar los detalles.
              </p>

              {/* Quick Stats */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{selectedPlan?.matchScore}%</div>
                    <div className="text-xs text-gray-500">Match</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">${selectedPlan?.estimatedBudget}</div>
                    <div className="text-xs text-gray-500">Presupuesto</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">3</div>
                    <div className="text-xs text-gray-500">Días</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGoToTrip}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🚀 Ir al viaje
                </button>
                <button
                  onClick={handleGoToDashboard}
                  className="flex-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  📊 Ver dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedGetawayPage;