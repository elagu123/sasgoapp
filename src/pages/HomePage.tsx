import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="text-center">
      <div className="py-20 bg-cover bg-center rounded-lg shadow-lg" style={{ backgroundImage: "url('https://picsum.photos/1200/400?blur=5')" }}>
        <div className="bg-black bg-opacity-50 p-10 rounded-lg">
          <h1 className="text-5xl font-extrabold text-white mb-4">Tu Viaje, Simplificado.</h1>
          <p className="text-xl text-gray-200 mb-8">
            SAS Go App es tu copiloto inteligente para planificar, empacar y disfrutar tus aventuras sin estrés.
          </p>
           <Link to="/register" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg">
              Empezá a Planificar Gratis
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        <ActionCard
          title="Listas de Empaque Inteligentes"
          description="Crea una lista de empaque perfecta en segundos con IA."
          linkTo="/app/packing"
          icon="🧳"
        />
        <ActionCard
          title="Itinerarios Flexibles"
          description="Planifica tu próxima aventura y ajústala sobre la marcha."
          linkTo="/app/dashboard"
          icon="✈️"
        />
        <ActionCard
          title="Copiloto Personalizado"
          description="Deja que la IA te sugiera un destino o te ayude a decidir."
          linkTo="/app/dashboard"
          icon="🗺️"
        />
        <ActionCard
          title="Ahorro Inteligente"
          description="Encuentra las mejores combinaciones de vuelos y hoteles."
          linkTo="/app/dashboard"
          icon="💰"
        />
      </div>
    </div>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  linkTo: string;
  icon: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, linkTo, icon }) => (
  <Link to={linkTo} className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </Link>
);

export default HomePage;