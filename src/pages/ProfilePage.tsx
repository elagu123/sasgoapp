import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../hooks/useToast.ts';
import { NOTIFICATIONS_STORAGE_KEY } from '../constants.ts';
import { notificationService, type NotificationSettings } from '../services/notificationService.ts';

const ProfilePage: React.FC = () => {
    const { user, updatePreferences } = useAuth();
    const { addToast } = useToast();
    const [prefs, setPrefs] = useState(user?.preferences);
    const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => 
        notificationService.getSettings()
    );

    if (!prefs) return <div>Cargando perfil...</div>;

    const handlePrefsChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setPrefs(p => ({ ...p!, [name]: value }));
    };

    const handleSavePrefs = () => {
        updatePreferences(prefs);
        addToast('Preferencias guardadas!', 'success');
    };

    const handleNotifChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = 'checked' in e.target ? e.target.checked : undefined;
        
        if (name.includes('.')) {
            // Handle nested properties like 'reminderTypes.departure'
            const [parentKey, childKey] = name.split('.');
            setNotifSettings(s => ({
                ...s,
                [parentKey]: {
                    ...(s as any)[parentKey],
                    [childKey]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setNotifSettings(s => ({
                ...s,
                [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
            }));
        }
    };

    const handleSaveNotifs = async () => {
        try {
            await notificationService.updateSettings(notifSettings);
            addToast('Ajustes de notificación guardados.', 'success');
        } catch (error) {
            addToast('Error al guardar ajustes de notificación.', 'error');
        }
    };

    const handleTestNotification = () => {
        notificationService.sendTestNotification();
        addToast('Notificación de prueba enviada.', 'info');
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
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Notificaciones</h2>
                    <button 
                        onClick={handleTestNotification}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Enviar prueba
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* Main toggle */}
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            id="enabled" 
                            name="enabled" 
                            checked={notifSettings.enabled} 
                            onChange={handleNotifChange} 
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                        />
                        <label htmlFor="enabled" className="ml-2 block text-sm font-medium">Activar notificaciones de viajes</label>
                    </div>

                    {notifSettings.enabled && (
                        <div className="pl-6 border-l-2 border-blue-100 dark:border-blue-800 space-y-4">
                            {/* Days before */}
                            <div>
                                <label htmlFor="daysBefore" className="block text-sm font-medium mb-1">Días de antelación</label>
                                <input 
                                    type="number" 
                                    id="daysBefore" 
                                    name="daysBefore" 
                                    value={notifSettings.daysBefore} 
                                    onChange={handleNotifChange} 
                                    min="1" 
                                    max="14" 
                                    className="w-20 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" 
                                />
                                <p className="text-xs text-gray-500 mt-1">Te avisaremos hasta {notifSettings.daysBefore} días antes del viaje</p>
                            </div>

                            {/* Push notifications */}
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="pushNotifications" 
                                    name="pushNotifications" 
                                    checked={notifSettings.pushNotifications} 
                                    onChange={handleNotifChange} 
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                                />
                                <label htmlFor="pushNotifications" className="ml-2 block text-sm">Notificaciones push del navegador</label>
                            </div>

                            {/* Reminder types */}
                            <div>
                                <h4 className="text-sm font-medium mb-2">Tipos de recordatorios</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id="departure" 
                                            name="reminderTypes.departure" 
                                            checked={notifSettings.reminderTypes.departure} 
                                            onChange={handleNotifChange} 
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                                        />
                                        <label htmlFor="departure" className="ml-2 block text-sm">Recordatorio de salida</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id="packing" 
                                            name="reminderTypes.packing" 
                                            checked={notifSettings.reminderTypes.packing} 
                                            onChange={handleNotifChange} 
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                                        />
                                        <label htmlFor="packing" className="ml-2 block text-sm">Recordatorio de empaque (3 días antes)</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id="documents" 
                                            name="reminderTypes.documents" 
                                            checked={notifSettings.reminderTypes.documents} 
                                            onChange={handleNotifChange} 
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                                        />
                                        <label htmlFor="documents" className="ml-2 block text-sm">Verificación de documentos (2 días antes)</label>
                                    </div>
                                </div>
                            </div>

                            {/* Quiet hours */}
                            <div>
                                <div className="flex items-center mb-2">
                                    <input 
                                        type="checkbox" 
                                        id="quietHoursEnabled" 
                                        name="quietHours.enabled" 
                                        checked={notifSettings.quietHours.enabled} 
                                        onChange={handleNotifChange} 
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                                    />
                                    <label htmlFor="quietHoursEnabled" className="ml-2 block text-sm font-medium">Horario silencioso</label>
                                </div>
                                {notifSettings.quietHours.enabled && (
                                    <div className="pl-6 flex items-center space-x-2">
                                        <div>
                                            <label htmlFor="quietStart" className="block text-xs text-gray-500">Desde</label>
                                            <input 
                                                type="time" 
                                                id="quietStart" 
                                                name="quietHours.start" 
                                                value={notifSettings.quietHours.start} 
                                                onChange={handleNotifChange} 
                                                className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600" 
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="quietEnd" className="block text-xs text-gray-500">Hasta</label>
                                            <input 
                                                type="time" 
                                                id="quietEnd" 
                                                name="quietHours.end" 
                                                value={notifSettings.quietHours.end} 
                                                onChange={handleNotifChange} 
                                                className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={handleSaveNotifs} 
                    className="mt-6 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    Guardar Ajustes de Notificación
                </button>
            </section>
        </div>
    );
};

export default ProfilePage;
