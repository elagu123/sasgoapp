import React from 'react';
import { Link } from 'react-router-dom';
import type { Gear } from '../types.ts';
import { useGears } from '../hooks/useGears.ts';

const GearCard: React.FC<{ gear: Gear }> = ({ gear }) => {
    const isWarrantyActive = new Date(gear.warrantyExpiresAt) > new Date();

    return (
        <Link to={`/app/gear/${gear.id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{gear.modelName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{gear.color} / {gear.size}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isWarrantyActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                        {isWarrantyActive ? 'En Garantía' : 'Vencida'}
                    </span>
                </div>
                <p className="mt-2 font-mono text-xs text-gray-400 dark:text-gray-500">{gear.serial}</p>
            </div>
        </Link>
    );
};

const GearDashboardPage: React.FC = () => {
    const { data: gearList = [], isLoading, error } = useGears();

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Mi Equipaje Registrado</h1>
                <Link to="/app/gear/new" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    + Registrar Nuevo
                </Link>
            </div>
            
            {isLoading && <p>Cargando equipaje...</p>}
            {error && <p className="text-red-500">Error: {error.message}</p>}

            {gearList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gearList.map(gear => (
                        <GearCard key={gear.id} gear={gear} />
                    ))}
                </div>
            ) : (
                !isLoading && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                        <div className="text-5xl mb-4">🛡️</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Registrá tu equipaje</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Aún no registraste ningún producto. Hacelo para activar tu garantía y acceder al servicio técnico.</p>
                        <Link to="/app/gear/new" className="bg-blue-600 text-white font-bold py-3 px-5 rounded-xl hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg">
                            Registrar mi primer producto
                        </Link>
                    </div>
                )
            )}
        </div>
    );
};

export default GearDashboardPage;