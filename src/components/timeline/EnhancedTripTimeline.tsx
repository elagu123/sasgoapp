import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon, 
  UsersIcon, 
  CameraIcon, 
  HeartIcon,
  ShareIcon,
  StarIcon,
  SunIcon,
  CloudIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
  PlayIcon as PlayIconSolid
} from '@heroicons/react/24/solid';
import type { Trip, ItineraryDay, ItineraryBlock, WeatherForecastDay } from '../../types';

interface EnhancedTripTimelineProps {
  trip: Trip;
  weatherForecast?: WeatherForecastDay[] | null;
  onUpdateTrip: (updates: Partial<Trip>) => void;
}

interface TimelinePhase {
  id: string;
  type: 'preparation' | 'travel' | 'experience' | 'memory';
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  data: any;
}

const EnhancedTripTimeline: React.FC<EnhancedTripTimelineProps> = ({
  trip,
  weatherForecast,
  onUpdateTrip
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isFavorite, setIsFavorite] = useState(trip.isFavorite || false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const timelineProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Calculate trip phases with enhanced metadata
  const phases: TimelinePhase[] = [
    {
      id: 'preparation',
      type: 'preparation',
      title: 'Preparación del Viaje',
      subtitle: 'Planificación y anticipación',
      icon: CalendarIcon,
      color: 'from-blue-500 to-purple-600',
      data: {
        daysUntil: Math.max(0, Math.ceil((new Date(trip.dates.start).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
        packingProgress: trip.packingListId ? 75 : 0,
        documentsReady: trip.documents?.length || 0,
        reservations: trip.accommodations?.length || 0
      }
    },
    {
      id: 'departure',
      type: 'travel',
      title: 'Día de Partida',
      subtitle: 'El viaje comienza',
      icon: PlayIcon,
      color: 'from-green-500 to-teal-600',
      data: {
        departureTime: '06:00',
        destination: trip.destination[0],
        excitement: 'high'
      }
    },
    ...trip.itinerary?.map((day, index) => ({
      id: `day-${day.dayIndex}`,
      type: 'experience' as const,
      title: `Día ${day.dayIndex}`,
      subtitle: formatDate(day.date),
      icon: SunIcon,
      color: index % 2 === 0 ? 'from-orange-500 to-red-600' : 'from-pink-500 to-rose-600',
      data: {
        date: day.date,
        blocks: day.blocks,
        weather: weatherForecast?.find(w => w.date === day.date),
        highlights: day.blocks.filter(b => b.type === 'activity').length
      }
    })) || [],
    {
      id: 'return',
      type: 'travel',
      title: 'Regreso a Casa',
      subtitle: 'Vuelta a la realidad',
      icon: HeartIcon,
      color: 'from-indigo-500 to-blue-600',
      data: {
        memories: trip.itinerary?.reduce((acc, day) => acc + day.blocks.length, 0) || 0,
        photos: Math.floor(Math.random() * 200) + 100,
        experience: 'unforgettable'
      }
    }
  ];

  // Auto-advance timeline
  useEffect(() => {
    if (!isAutoplay) return;
    
    const interval = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % phases.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoplay, phases.length]);

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    onUpdateTrip({ isFavorite: !isFavorite });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00-03:00');
    return new Intl.DateTimeFormat('es-AR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }).format(date);
  };

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('sun') || condition.includes('clear')) return SunIcon;
    return CloudIcon;
  };

  const renderPhaseContent = (phase: TimelinePhase) => {
    const Icon = phase.icon;
    
    switch (phase.type) {
      case 'preparation':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Countdown */}
            <div className="text-center">
              <motion.div
                className="text-6xl font-bold text-white mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {phase.data.daysUntil}
              </motion.div>
              <p className="text-xl text-white/80">
                {phase.data.daysUntil === 0 ? '¡HOY ES EL DÍA!' : 
                 phase.data.daysUntil === 1 ? 'día restante' : 'días restantes'}
              </p>
            </div>

            {/* Preparation Progress */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{phase.data.packingProgress}%</div>
                <div className="text-sm text-white/80">Equipaje</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{phase.data.documentsReady}</div>
                <div className="text-sm text-white/80">Documentos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{phase.data.reservations}</div>
                <div className="text-sm text-white/80">Reservas</div>
              </div>
            </div>

            {/* Excitement Meter */}
            <div className="text-center">
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid 
                    key={i} 
                    className="w-8 h-8 text-yellow-400 mx-1"
                  />
                ))}
              </div>
              <p className="text-white/80">Nivel de emoción: ¡MÁXIMO!</p>
            </div>
          </motion.div>
        );

      case 'travel':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {phase.id === 'departure' ? (
              <>
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="mx-auto w-20 h-20 mb-4"
                  >
                    <PlayIconSolid className="w-full h-full text-white" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white mb-2">¡El viaje comienza!</h3>
                  <p className="text-xl text-white/80">Destino: {phase.data.destination}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                  <ClockIcon className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-white">Hora de salida: {phase.data.departureTime}</p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <HeartIconSolid className="w-20 h-20 text-red-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Vuelta a casa</h3>
                  <p className="text-xl text-white/80">Con el corazón lleno de recuerdos</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <CameraIcon className="w-8 h-8 text-white mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{phase.data.photos}</div>
                    <div className="text-sm text-white/80">Fotos tomadas</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <StarIconSolid className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{phase.data.memories}</div>
                    <div className="text-sm text-white/80">Momentos únicos</div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        );

      case 'experience':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Day Header */}
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                Día {phase.id.split('-')[1]}
              </div>
              <p className="text-xl text-white/80">{phase.subtitle}</p>
            </div>

            {/* Weather */}
            {phase.data.weather && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                {React.createElement(getWeatherIcon(phase.data.weather.condition), {
                  className: "w-8 h-8 text-white mx-auto mb-2"
                })}
                <div className="text-white">
                  {phase.data.weather.high}°C / {phase.data.weather.low}°C
                </div>
                <div className="text-sm text-white/80 capitalize">
                  {phase.data.weather.condition}
                </div>
              </div>
            )}

            {/* Activities Timeline */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {phase.data.blocks.map((block: ItineraryBlock, index: number) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <ClockIcon className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white/60">
                          {block.startTime} - {block.endTime}
                        </span>
                      </div>
                      <h4 className="text-white font-semibold mb-1">{block.title}</h4>
                      {block.location && (
                        <div className="flex items-center space-x-1">
                          <MapPinIcon className="w-4 h-4 text-white/60" />
                          <span className="text-sm text-white/80">{block.location}</span>
                        </div>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      block.type === 'activity' 
                        ? 'bg-green-500/20 text-green-300'
                        : block.type === 'accommodation'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {block.type}
                    </div>
                  </div>
                  {block.description && (
                    <p className="text-sm text-white/70 mt-2">{block.description}</p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Day Summary */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{phase.data.highlights}</div>
              <div className="text-sm text-white/80">actividades planificadas</div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{ y: backgroundY }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{ repeat: Infinity, duration: 8, delay: 4 }}
        />
      </motion.div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex justify-between items-start">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white mb-2"
            >
              {trip.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/80"
            >
              {trip.destination.join(' → ')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4 mt-2 text-white/60"
            >
              <div className="flex items-center space-x-1">
                <CalendarIcon className="w-4 h-4" />
                <span>{trip.dates.start} - {trip.dates.end}</span>
              </div>
              <div className="flex items-center space-x-1">
                <UsersIcon className="w-4 h-4" />
                <span>{trip.travelers} viajeros</span>
              </div>
            </motion.div>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFavoriteToggle}
              className={`p-3 rounded-full transition-colors ${
                isFavorite 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {isFavorite ? (
                <HeartIconSolid className="w-6 h-6" />
              ) : (
                <HeartIcon className="w-6 h-6" />
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAutoplay(!isAutoplay)}
              className={`p-3 rounded-full transition-colors ${
                isAutoplay 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {isAutoplay ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-full bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <ShareIcon className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Timeline Progress Bar */}
      <div className="relative z-10 px-6">
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full"
            style={{ width: `${((currentPhase + 1) / phases.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {phases.map((phase, index) => (
            <motion.button
              key={phase.id}
              onClick={() => setCurrentPhase(index)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                index <= currentPhase 
                  ? 'text-white bg-white/20' 
                  : 'text-white/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {phase.title}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
              transition={{ duration: 0.6, type: "spring" }}
              className={`bg-gradient-to-br ${phases[currentPhase].color} rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <motion.div
                  className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full border border-white/20"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                />
              </div>

              <div className="relative z-10">
                {/* Phase Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8"
                >
                  <motion.div
                    className="inline-block p-4 bg-white/20 rounded-full mb-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    {React.createElement(phases[currentPhase].icon, {
                      className: "w-12 h-12 text-white"
                    })}
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {phases[currentPhase].title}
                  </h2>
                  <p className="text-xl text-white/80">
                    {phases[currentPhase].subtitle}
                  </p>
                </motion.div>

                {/* Phase Content */}
                {renderPhaseContent(phases[currentPhase])}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Navigation */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <motion.button
          onClick={() => setCurrentPhase(Math.max(0, currentPhase - 1))}
          disabled={currentPhase === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Anterior</span>
        </motion.button>

        <div className="flex items-center space-x-2">
          {phases.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentPhase(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentPhase 
                  ? 'bg-white' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        <motion.button
          onClick={() => setCurrentPhase(Math.min(phases.length - 1, currentPhase + 1))}
          disabled={currentPhase === phases.length - 1}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>Siguiente</span>
          <ChevronRightIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

export default EnhancedTripTimeline;