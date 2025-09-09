import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundIllustration = () => (
    <svg viewBox="0 0 600 400" className="max-w-md w-full mx-auto mb-8">
        <g transform="translate(300, 200)">
            <path d="M-200,0 a200,150 0 1,0 400,0 a200,150 0 1,0 -400,0" fill="#f3f4f6" className="dark:fill-gray-800"/>
            <text x="0" y="-60" fontFamily="Arial, sans-serif" fontSize="90" fontWeight="bold" textAnchor="middle" fill="#3b82f6" className="dark:fill-blue-400">404</text>
            <circle cx="-90" cy="20" r="15" fill="#ef4444" className="animate-bounce" style={{animationDuration: '2s'}}/>
            <circle cx="90" cy="20" r="15" fill="#ef4444" className="animate-bounce" style={{animationDuration: '2s', animationDelay: '0.2s'}}/>
            <path d="M -60 60 Q 0 90 60 60" stroke="#3b82f6" strokeWidth="8" fill="none" className="dark:stroke-blue-400"/>
            <text x="0" y="140" fontFamily="Arial, sans-serif" fontSize="20" textAnchor="middle" fill="#6b7280" className="dark:fill-gray-400">Página no encontrada</text>
        </g>
    </svg>
);


const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-10 md:py-20">
      <NotFoundIllustration />
      <h2 className="text-3xl font-bold mt-4 mb-2">Oops! Te perdiste.</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
        La página que buscas parece haberse tomado unas vacaciones. No te preocupes, te ayudamos a volver al camino.
      </p>
      <Link 
        to="/" 
        className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
      >
        Volver al Inicio
      </Link>
    </div>
  );
};

export default NotFoundPage;