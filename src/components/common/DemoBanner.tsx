import React from 'react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-center text-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
        <span className="font-semibold">🚀 SASGOAPP Demo</span>
        <span>|</span>
        <span>Aplicación Full-Stack completa con datos simulados</span>
        <span>|</span>
        <span className="hidden sm:inline">🗄️ PostgreSQL + 🔐 JWT + ⚡ React 18</span>
      </div>
    </div>
  );
};