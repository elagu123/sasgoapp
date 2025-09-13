import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTrips } from '../../hooks/useTrips';
import type { Trip } from '../../types';

// Hero Section - Próximo Viaje
const HeroTripCard: React.FC<{ trip: Trip }> = ({ trip }) => {
  const daysUntil = Math.ceil((new Date(trip.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  const progressRings = [
    { label: 'Itinerario', value: trip.itineraryProgress || 0, color: 'text-blue-500' },
    { label: 'Equipaje', value: trip.packingProgress || 0, color: 'text-green-500' },
    { label: 'Reservas', value: trip.bookingProgress || 0, color: 'text-purple-500' },
    { label: 'Documentos', value: trip.documentsProgress || 0, color: 'text-orange-500' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-blue-900 rounded-3xl p-8 mb-8 overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src={trip.image || `https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800`}
          alt={trip.destination}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
      </div>

      <div className="relative z-10">
        {/* Header with Countdown */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h2 
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {trip.destination} {trip.country && `🇫🇷`} {/* Dynamic country flag */}
            </motion.h2>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {daysUntil > 0 ? `Faltan ${daysUntil} días` : 'Tu viaje es hoy! 🎉'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(trip.startDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </div>
            </motion.div>
          </div>

          {/* Weather Widget */}
          <motion.div 
            className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">☀️</div>
              <div className="text-lg font-bold">{trip.weather?.averageTemp || 22}°C</div>
              <div className="text-xs text-gray-500">Forecast 5 días</div>
              <div className="flex space-x-1 mt-2">
                {['☀️', '⛅', '🌧️', '☀️', '☀️'].map((icon, i) => (
                  <span key={i} className="text-xs">{icon}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress Rings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {progressRings.map((ring, index) => (
            <motion.div
              key={ring.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-300 dark:text-gray-600"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    className={ring.color}
                    initial={{ strokeDasharray: "175.93 175.93", strokeDashoffset: 175.93 }}
                    animate={{ 
                      strokeDashoffset: 175.93 - (175.93 * ring.value) / 100 
                    }}
                    transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{ring.value}%</span>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {ring.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to={`/app/trips/${trip.id}/timeline`}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 text-center text-sm"
          >
            🚀 Timeline
          </Link>
          <Link
            to={`/app/trips/${trip.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 text-center text-sm"
          >
            📋 Planificar
          </Link>
          <Link
            to={`/app/trips/${trip.id}/packing-v2`}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 text-center text-sm relative"
          >
            🎒 Equipaje
            {trip.packingProgress < 100 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                !
              </span>
            )}
          </Link>
          <Link
            to={`/app/trips/${trip.id}/saver`}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 text-center text-sm"
          >
            💰 Ofertas
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// Quick Actions Hub - FAB Expandible
const QuickActionsHub: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    { icon: '🆕', label: 'Planear Nuevo Viaje', to: '/app/trip/create', color: 'bg-blue-500' },
    { icon: '⚡', label: 'Escapada Express IA', to: '/app/getaway-v2', color: 'bg-green-500' },
    { icon: '🎒', label: 'Mi Equipaje Universal', to: '/app/packing', color: 'bg-purple-500' },
    { icon: '📋', label: 'Plantillas de Viaje', to: '/app/templates', color: 'bg-orange-500' },
    { icon: '🔍', label: 'Explorar Destinos', to: '/app/explore', color: 'bg-pink-500' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="mb-4 space-y-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={action.to}
                  className={`${action.color} hover:scale-110 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center space-x-3 pr-4`}
                  onClick={() => setIsExpanded(false)}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isExpanded ? 45 : 0 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </motion.button>
    </div>
  );
};

// Smart Tips Widget con IA
const SmartInsightsWidget: React.FC<{ trips: Trip[] }> = ({ trips }) => {
  const insights = useMemo(() => {
    const tips = [];
    
    // Generar insights inteligentes basados en los viajes
    trips.forEach(trip => {
      const daysUntil = Math.ceil((new Date(trip.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 30 && daysUntil > 0) {
        if (!trip.documentsProgress || trip.documentsProgress < 100) {
          tips.push({
            type: 'alert',
            icon: '⚠️',
            message: `Visa requerida para tu viaje a ${trip.destination} - gestionar ahora`,
            action: 'Revisar documentos',
            link: `/trip/${trip.id}/documents`
          });
        }
        
        if (daysUntil <= 7 && trip.packingProgress < 50) {
          tips.push({
            type: 'reminder',
            icon: '🎒',
            message: `Tiempo de preparar equipaje para ${trip.destination}`,
            action: 'Preparar ahora',
            link: `/trip/${trip.id}/packing`
          });
        }
      }
    });

    // Tips generales
    if (tips.length === 0) {
      tips.push({
        type: 'tip',
        icon: '💡',
        message: 'Black Friday detectado - 30% off en vuelos internacionales',
        action: 'Ver ofertas',
        link: '/deals'
      });
    }

    return tips.slice(0, 3); // Máximo 3 insights
  }, [trips]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="mr-2">🧠</span>
        Insights Inteligentes
      </h3>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-xl border-l-4 ${
              insight.type === 'alert' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
              insight.type === 'reminder' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
              'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{insight.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {insight.message}
                </span>
              </div>
              <Link
                to={insight.link}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
              >
                {insight.action}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Dashboard Principal Mejorado
const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: trips = [], isLoading } = useTrips();

  const nextTrip = useMemo(() => {
    return trips
      .filter(trip => new Date(trip.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  }, [trips]);

  const otherTrips = useMemo(() => {
    return trips.filter(trip => trip.id !== nextTrip?.id);
  }, [trips, nextTrip]);

  if (isLoading) {
    return <div className="p-6">Cargando dashboard inteligente...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Hola, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Aquí está tu resumen inteligente de viajes
          </p>
        </motion.div>

        {/* Hero Trip */}
        {nextTrip && <HeroTripCard trip={nextTrip} />}

        {/* Smart Insights */}
        <SmartInsightsWidget trips={trips} />

        {/* Other Trips */}
        {otherTrips.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Otros Viajes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {trip.destination}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {new Date(trip.startDate) > new Date() ? 'Planificando' : 'Completado'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Fecha:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(trip.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progreso:</span>
                      <span className="text-gray-900 dark:text-white">
                        {Math.round((trip.itineraryProgress + trip.packingProgress) / 2)}%
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/trip/${trip.id}`}
                    className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg transition-colors"
                  >
                    Ver Detalles
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {trips.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Tu primera aventura te espera!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Comenzá planificando tu próximo viaje con nuestra IA
            </p>
            <Link
              to="/trip/create"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <span className="mr-2">🆕</span>
              Planear Mi Primer Viaje
            </Link>
          </motion.div>
        )}

        {/* Quick Actions Hub */}
        <QuickActionsHub />
      </div>
    </div>
  );
};

export default EnhancedDashboard;