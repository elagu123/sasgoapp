import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Trip } from '../../types';

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

interface FormData {
  // Básicos
  daysAvailable: number;
  maxBudget: number;
  startingPoint: string;
  
  // Avanzados
  climatePreference: 'sun' | 'cool' | 'any';
  experienceType: 'relax' | 'adventure' | 'cultural' | 'gastronomic' | 'romantic' | 'mixed';
  maxDistance: number; // en km o horas
  restrictions: string[];
  avoidPlaces: string[];
}

interface EnhancedGetawayPlannerProps {
  onPlanSelected: (plan: GetawayOption) => void;
  userLocation?: string;
}

const EnhancedGetawayPlanner: React.FC<EnhancedGetawayPlannerProps> = ({ 
  onPlanSelected,
  userLocation = "Buenos Aires, Argentina"
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [surpriseMode, setSurpriseMode] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<GetawayOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    daysAvailable: 3,
    maxBudget: 800,
    startingPoint: userLocation,
    climatePreference: 'any',
    experienceType: 'mixed',
    maxDistance: 1000,
    restrictions: [],
    avoidPlaces: []
  });

  const experienceTypes = [
    { id: 'relax', label: 'Relax', icon: '🏖️', desc: 'Descanso y tranquilidad' },
    { id: 'adventure', label: 'Aventura', icon: '🏔️', desc: 'Deportes y actividades' },
    { id: 'cultural', label: 'Cultural', icon: '🏛️', desc: 'Museos y patrimonio' },
    { id: 'gastronomic', label: 'Gastronómica', icon: '🍷', desc: 'Comida y bebidas' },
    { id: 'romantic', label: 'Romántica', icon: '💕', desc: 'Para parejas' },
    { id: 'mixed', label: 'Mixta', icon: '🎭', desc: 'Un poco de todo' }
  ];

  const restrictionOptions = [
    'pet-friendly', 'accessible', 'family-friendly', 'vegan-options', 
    'no-flights', 'budget-conscious', 'luxury-only', 'eco-friendly'
  ];

  const generateSuggestions = async (): Promise<GetawayOption[]> => {
    // Simular llamada a IA (en producción sería Gemini API)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockOptions: GetawayOption[] = [
      {
        id: '1',
        title: 'Escapada Costera a Montevideo',
        destination: 'Montevideo',
        country: 'Uruguay',
        flag: '🇺🇾',
        matchScore: 94,
        estimatedBudget: Math.round(formData.maxBudget * 0.8),
        budgetStatus: 'under',
        highlights: ['Ciudad Vieja histórica', 'Rambla de 22km', 'Gastronomía excepcional'],
        itinerary: [
          { day: 1, activities: ['Llegada y check-in', 'Recorrido Ciudad Vieja', 'Cena en Puerto del Buceo'] },
          { day: 2, activities: ['Playa Pocitos', 'Mercado del Puerto', 'Museo del Carnaval'] },
          { day: 3, activities: ['Rambla en bicicleta', 'Compras en Punta Carretas', 'Ferry de regreso'] }
        ],
        packingItems: ['Ropa casual', 'Zapatos cómodos', 'Cámara', 'Protector solar'],
        bestTimeToGo: 'now',
        image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=80&w=800',
        pros: ['Muy cerca (3h en ferry)', 'Excelente gastronomía', 'Ciudad muy segura'],
        cons: ['Puede hacer frío', 'Precios similares a Buenos Aires'],
        weatherForecast: { temp: 18, condition: 'cloudy' }
      },
      {
        id: '2',
        title: 'Aventura en Bariloche',
        destination: 'San Carlos de Bariloche',
        country: 'Argentina',
        flag: '🇦🇷',
        matchScore: 87,
        estimatedBudget: formData.maxBudget,
        budgetStatus: 'on',
        highlights: ['Lagos cristalinos', 'Cerro Catedral', 'Chocolate artesanal'],
        itinerary: [
          { day: 1, activities: ['Vuelo a Bariloche', 'Centro Cívico', 'Chocolate y cerveza'] },
          { day: 2, activities: ['Cerro Campanario', 'Lago Nahuel Huapi', 'Cena con vista'] },
          { day: 3, activities: ['Villa La Angostura', 'Cerro Bayo', 'Vuelo de regreso'] }
        ],
        packingItems: ['Ropa de abrigo', 'Botas trekking', 'Gorro y guantes', 'Cámara'],
        bestTimeToGo: 'seasonal',
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?q=80&w=800',
        pros: ['Paisajes increíbles', 'Actividades outdoor', 'Buena gastronomía'],
        cons: ['Vuelo necesario', 'Clima impredecible'],
        weatherForecast: { temp: 12, condition: 'sunny' }
      },
      {
        id: '3',
        title: 'Relax en Colonia del Sacramento',
        destination: 'Colonia del Sacramento',
        country: 'Uruguay',
        flag: '🇺🇾',
        matchScore: 91,
        estimatedBudget: Math.round(formData.maxBudget * 0.7),
        budgetStatus: 'under',
        highlights: ['Patrimonio UNESCO', 'Cobblestone streets', 'Sunset sobre Río de la Plata'],
        itinerary: [
          { day: 1, activities: ['Ferry desde Buenos Aires', 'Barrio Histórico', 'Cena romántica'] },
          { day: 2, activities: ['Playa Real de San Carlos', 'Museo Portugués', 'Bodegas locales'] },
          { day: 3, activities: ['Faro de Colonia', 'Shopping', 'Ferry de regreso'] }
        ],
        packingItems: ['Ropa cómoda', 'Zapatos para caminar', 'Cámara', 'Ropa de lluvia'],
        bestTimeToGo: 'now',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=800',
        pros: ['Muy romántico', 'Historia fascinante', 'Muy accesible'],
        cons: ['Pequeño para 3 días', 'Limitadas opciones nocturnas'],
        weatherForecast: { temp: 16, condition: 'sunny' }
      }
    ];

    return mockOptions;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const options = await generateSuggestions();
      setGeneratedOptions(options);
      setShowResults(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSurpriseMe = async () => {
    setSurpriseMode(true);
    // Set random preferences for surprise mode
    setFormData(prev => ({
      ...prev,
      climatePreference: ['sun', 'cool', 'any'][Math.floor(Math.random() * 3)] as any,
      experienceType: experienceTypes[Math.floor(Math.random() * experienceTypes.length)].id as any,
      maxDistance: [500, 1000, 2000][Math.floor(Math.random() * 3)]
    }));
    
    await handleGenerate();
  };

  const handleOptionSelect = (option: GetawayOption) => {
    setSelectedOptionId(option.id);
    // Convert to Trip format and call parent
    const trip: Partial<Trip> = {
      title: option.title,
      destination: option.destination,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
      endDate: new Date(Date.now() + (7 + formData.daysAvailable) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: option.estimatedBudget,
      travelers: 2, // Default
      pace: 'moderate',
      interests: option.highlights,
      weather: option.weatherForecast
    };
    
    onPlanSelected(option);
  };

  const resetForm = () => {
    setShowResults(false);
    setSurpriseMode(false);
    setSelectedOptionId(null);
    setCurrentStep(1);
  };

  if (showResults) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">✨</span>
              {surpriseMode ? '¡Sorpresa! Tus opciones únicas' : 'Escapadas Personalizadas'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Generadas especialmente para ti • {formData.daysAvailable} días • Hasta ${formData.maxBudget}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Modificar búsqueda
            </button>
            <button
              onClick={handleSurpriseMe}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🎲 Sorpréndeme otra vez
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {generatedOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300 ${
                selectedOptionId === option.id
                  ? 'border-blue-500 ring-4 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {/* Image Header */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={option.image} 
                  alt={option.destination}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Match Score */}
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {option.matchScore}% Match ⭐⭐⭐⭐⭐
                </div>
                
                {/* Best Time Badge */}
                <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-medium ${
                  option.bestTimeToGo === 'now' ? 'bg-green-500 text-white' :
                  option.bestTimeToGo === 'soon' ? 'bg-yellow-500 text-black' :
                  'bg-blue-500 text-white'
                }`}>
                  {option.bestTimeToGo === 'now' ? '✅ Mejor época: Ahora' :
                   option.bestTimeToGo === 'soon' ? '⏰ Mejor época: Pronto' :
                   '📅 Mejor época: Estacional'}
                </div>
                
                {/* Title Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {option.title}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {option.destination} {option.flag}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Budget Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${option.estimatedBudget}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    option.budgetStatus === 'under' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    option.budgetStatus === 'on' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {option.budgetStatus === 'under' ? '20% bajo tu límite' :
                     option.budgetStatus === 'on' ? 'Dentro del presupuesto' :
                     'Excede presupuesto'}
                  </div>
                </div>

                {/* Highlights */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                    🌟 Highlights:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {option.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Weather */}
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">
                      {option.weatherForecast.condition === 'sunny' ? '☀️' :
                       option.weatherForecast.condition === 'cloudy' ? '☁️' :
                       option.weatherForecast.condition === 'rainy' ? '🌧️' : '❄️'}
                    </span>
                    <span>{option.weatherForecast.temp}°C</span>
                  </div>
                  <div className="text-xs">
                    Pronóstico favorable
                  </div>
                </div>

                {/* Quick Itinerary Preview */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                    📅 Itinerario (expandible):
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    {option.itinerary.slice(0, 2).map((day, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400 min-w-[45px]">
                          Día {day.day}:
                        </span>
                        <span>{day.activities.slice(0, 2).join(', ')}</span>
                      </div>
                    ))}
                    {option.itinerary.length > 2 && (
                      <div className="text-blue-600 dark:text-blue-400 text-xs">
                        Ver itinerario completo →
                      </div>
                    )}
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div>
                    <h5 className="font-medium text-green-600 dark:text-green-400 mb-1">✅ Pros:</h5>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {option.pros.slice(0, 2).map((pro, idx) => (
                        <li key={idx}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-600 dark:text-red-400 mb-1">⚠️ Cons:</h5>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {option.cons.slice(0, 2).map((con, idx) => (
                        <li key={idx}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOptionSelect(option)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    ✨ Seleccionar
                  </button>
                  <button className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                    📋 Personalizar
                  </button>
                  <button className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                    🔗 Compartir
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Actions */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm mb-4">
              Ajusta tus preferencias o déjanos sorprenderte con opciones completamente diferentes
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔍 Ajustar búsqueda
              </button>
              <button
                onClick={handleSurpriseMe}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🎯 Más sorpresas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
        >
          🌟 Escapadas Inteligentes con IA
        </motion.h1>
        <p className="text-gray-600 dark:text-gray-300">
          Deja que nuestra IA diseñe la escapada perfecta para ti
        </p>
      </div>

      {/* Surprise Me Button */}
      <div className="text-center mb-8">
        <motion.button
          onClick={handleSurpriseMe}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          whileTap={{ scale: 0.98 }}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generando sorpresa...
            </>
          ) : (
            <>
              🎲 ¡SORPRÉNDEME!
              <div className="text-sm opacity-90 mt-1">
                Input mínimo • 5 opciones radicalmente diferentes
              </div>
            </>
          )}
        </motion.button>
      </div>

      <div className="text-center text-gray-500 dark:text-gray-400 mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1 max-w-32"></div>
          <span className="text-sm">o personaliza tu búsqueda</span>
          <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1 max-w-32"></div>
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Step 1: Básicos */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📅 Información Básica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Días disponibles
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={formData.daysAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, daysAvailable: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1 día</span>
                  <span className="font-bold text-blue-600">{formData.daysAvailable} días</span>
                  <span>2 semanas</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Presupuesto máximo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxBudget: parseInt(e.target.value) || 0 }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="800"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Incluye transporte, alojamiento y comidas
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Punto de partida
              </label>
              <input
                type="text"
                value={formData.startingPoint}
                onChange={(e) => setFormData(prev => ({ ...prev, startingPoint: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Buenos Aires, Argentina"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Preferencias Avanzadas */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Preferencias Avanzadas
          </h3>

          {/* Climate Preference */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Preferencia de clima
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'sun', label: 'Sol', icon: '☀️', desc: 'Calor y sol' },
                { id: 'cool', label: 'Fresco', icon: '🌤️', desc: 'Templado' },
                { id: 'any', label: 'No importa', icon: '🌍', desc: 'Cualquier clima' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFormData(prev => ({ ...prev, climatePreference: option.id as any }))}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.climatePreference === option.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs opacity-75">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Experience Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tipo de experiencia
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {experienceTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData(prev => ({ ...prev, experienceType: type.id as any }))}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.experienceType === type.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs opacity-75">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Distance */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Distancia máxima
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { km: 500, label: 'Cerca', desc: 'Hasta 500km' },
                { km: 1000, label: 'Medio', desc: 'Hasta 1000km' },
                { km: 2000, label: 'Lejos', desc: 'Hasta 2000km' }
              ].map((option) => (
                <button
                  key={option.km}
                  onClick={() => setFormData(prev => ({ ...prev, maxDistance: option.km }))}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.maxDistance === option.km
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs opacity-75">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Restricciones */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⚙️ Restricciones (Opcional)
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {restrictionOptions.map((restriction) => (
              <button
                key={restriction}
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    restrictions: prev.restrictions.includes(restriction)
                      ? prev.restrictions.filter(r => r !== restriction)
                      : [...prev.restrictions, restriction]
                  }));
                }}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  formData.restrictions.includes(restriction)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                {restriction.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-5 h-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando opciones personalizadas...
              </>
            ) : (
              '🚀 Generar Escapadas Personalizadas'
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
            La IA analizará tus preferencias y generará 3 opciones únicas
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGetawayPlanner;