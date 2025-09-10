import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Left Column - Content */}
            <div className="max-w-md mx-auto lg:mx-0 lg:max-w-none">
              <div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  Viajá{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    inteligente
                  </span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  La primera plataforma que combina planificación automática, 
                  gestión de equipaje y colaboración en tiempo real. 
                  <span className="text-blue-600 dark:text-blue-400 font-semibold"> Potenciada por IA.</span>
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/register" 
                    className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Comenzar gratis
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  
                  <Link 
                    to="/login" 
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-lg font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>

                {/* Social Proof */}
                <div className="mt-12">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Confiado por viajeros como vos</p>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">4.9</span>
                      <div className="ml-2 flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">+2,500 viajes organizados</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="mt-12 lg:mt-0 relative">
              <div className="relative max-w-lg mx-auto lg:max-w-none">
                {/* Main app preview */}
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-1 transition-transform duration-500">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800" 
                      alt="Dashboard Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="mt-4 space-y-3">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-green-400 to-blue-500 text-white p-3 rounded-xl shadow-lg transform -rotate-12">
                  <span className="text-sm font-semibold">✓ Lista lista</span>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-400 to-pink-500 text-white p-3 rounded-xl shadow-lg transform rotate-12">
                  <span className="text-sm font-semibold">🎯 IA activa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Todo lo que necesitás para viajar mejor
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Desde la planificación hasta el regreso, SASGO te acompaña en cada paso del viaje
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🤖"
              title="Planificación con IA"
              description="Creá itinerarios personalizados en segundos. La IA analiza tus preferencias, presupuesto y fechas para sugerir el viaje perfecto."
              highlights={["Itinerarios inteligentes", "Sugerencias en tiempo real", "Optimización automática"]}
            />
            
            <FeatureCard
              icon="🧳"
              title="Listas inteligentes"
              description="Nunca más olvides nada. Generamos listas de empaque específicas según tu destino, clima y actividades planificadas."
              highlights={["Basado en el clima", "Por tipo de viaje", "Recordatorios automáticos"]}
            />
            
            <FeatureCard
              icon="👥"
              title="Colaboración grupal"
              description="Organizá viajes grupales sin caos. Todos pueden ver, editar y contribuir al plan en tiempo real."
              highlights={["Edición colaborativa", "Chat integrado", "División de gastos"]}
            />
            
            <FeatureCard
              icon="💰"
              title="Control de gastos"
              description="Mantené el presupuesto bajo control. Registrá gastos, dividí cuentas y recibí alertas cuando te acerques al límite."
              highlights={["División automática", "Múltiples monedas", "Reportes detallados"]}
            />
            
            <FeatureCard
              icon="📱"
              title="Acceso offline"
              description="Tu información siempre disponible. Accedé a itinerarios, listas y mapas sin conexión a internet."
              highlights={["Mapas offline", "Sincronización automática", "PWA optimizada"]}
            />
            
            <FeatureCard
              icon="🔒"
              title="Privacidad total"
              description="Tus datos son tuyos. Encriptación de extremo a extremo y control total sobre qué compartís y con quién."
              highlights={["Encriptación E2E", "Control granular", "Sin ads ni tracking"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  highlights: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, highlights }) => (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center mb-6">
      <div className="text-4xl mr-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    
    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{description}</p>
    
    <ul className="space-y-2">
      {highlights.map((highlight, index) => (
        <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {highlight}
        </li>
      ))}
    </ul>
  </div>
);

export default HomePage;