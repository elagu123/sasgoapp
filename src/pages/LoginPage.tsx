
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../hooks/useToast.ts';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { addToast } = useToast();
    const [email, setEmail] = useState('viajero@sasgo.com');
    const [password, setPassword] = useState('password123');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const from = location.state?.from?.pathname || "/app/dashboard";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const userData = await login(email, password);
            addToast('¡Bienvenido de nuevo!', 'success');
            
            // Check if user needs onboarding
            const hasCompletedOnboarding = localStorage.getItem(`onboarding-completed-${userData.id}`);
            const hasPreferences = userData.preferences && 
                userData.preferences.travelStyle && 
                userData.preferences.preferredCategories.length > 0;

            if (!hasCompletedOnboarding && !hasPreferences) {
                navigate('/onboarding', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        } catch (error: any) {
            addToast(error.message || 'Credenciales inválidas. Por favor, intenta de nuevo.', 'error');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center mb-6">Iniciar Sesión</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium">Contraseña</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                        {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
                <p className="text-center mt-4 text-sm">
                    ¿No tenés cuenta? <Link to="/register" className="text-blue-600 hover:underline">Registrate</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
