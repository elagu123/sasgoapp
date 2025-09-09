import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../hooks/useToast.ts';
import { NOTIFICATIONS_STORAGE_KEY } from '../constants.ts';

const ProfilePage: React.FC = () => {
    const { user, updatePreferences } = useAuth();
    const { addToast } = useToast();
    const [prefs, setPrefs] = useState(user?.preferences);
    const [notifSettings, setNotifSettings] = useState(() => {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : { enabled: true, daysBefore: 3 };
    });

    if (!prefs) return <div>Cargando perfil...</div>;

    const handlePrefsChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setPrefs(p => ({ ...p!, [name]: value }));
    };

    const handleSavePrefs = () => {
        updatePreferences(prefs);
        addToast('Preferencias guardadas!', 'success');
    };

    const handleNotifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setNotifSettings((s: any) => ({
            ...s,
            [name]: type === 'checkbox' ? checked : Number(value)
        }));
    };

    const handleSaveNotifs = async () => {
        if (notifSettings.enabled) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                addToast('Permiso de notificaciones denegado.', 'error');
                setNotifSettings((s: any) => ({ ...s, enabled: false }));
                return;
            }
        }
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifSettings));
        addToast('Ajustes de notificación guardados.', 'success');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Información</h2>
                <p><strong>Nombre:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
            </section>

            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Preferencias de Viaje</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="travelStyle" className="block text-sm font-medium">Estilo de Viaje</label>
                        <select name="travelStyle" id="travelStyle" value={prefs.travelStyle} onChange={handlePrefsChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 capitalize">
                            <option value="backpacker">Mochilero</option>
                            <option value="balanced">Equilibrado</option>
                            <option value="comfort">Confort</option>
                            <option value="luxury">Lujo</option>
                        </select>
                    </div>
                </div>
                <button onClick={handleSavePrefs} className="mt-6 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Guardar Preferencias</button>
            </section>

            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Notificaciones</h2>
                <div className="space-y-4">
                     <div className="flex items-center">
                        <input type="checkbox" id="enabled" name="enabled" checked={notifSettings.enabled} onChange={handleNotifChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="enabled" className="ml-2 block text-sm">Activar notificaciones de próximos viajes</label>
                    </div>
                    {notifSettings.enabled && (
                        <div>
                            <label htmlFor="daysBefore" className="block text-sm font-medium">Avisarme con (días de antelación)</label>
                            <input type="number" id="daysBefore" name="daysBefore" value={notifSettings.daysBefore} onChange={handleNotifChange} min="1" max="14" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    )}
                </div>
                 <button onClick={handleSaveNotifs} className="mt-6 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Guardar Ajustes de Notificación</button>
            </section>
        </div>
    );
};

export default ProfilePage;
