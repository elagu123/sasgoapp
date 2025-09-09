
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await register(name, email, password);
            addToast('¡Registro exitoso! Por favor, inicia sesión.', 'success');
            navigate('/login');
        } catch (error: any) {
            addToast(error.message || 'No se pudo completar el registro.', 'error');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center mb-6">Crear Cuenta</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">Nombre</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium">Contraseña</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                        {isSubmitting ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>
                 <p className="text-center mt-4 text-sm">
                    ¿Ya tenés cuenta? <Link to="/login" className="text-blue-600 hover:underline">Iniciá Sesión</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
