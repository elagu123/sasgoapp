import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { generateFullGetawayPlan } from '../services/geminiService.ts';
import type { GetawayPlan } from '../types.ts';

const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold flex items-center mb-4">
            <span className="text-2xl mr-3">{icon}</span>
            {title}
        </h3>
        {children}
    </div>
);

const GetawayPlanPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [plan, setPlan] = useState<GetawayPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const result = await generateFullGetawayPlan(id);
                setPlan(result);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlan();
    }, [id]);

    if (isLoading) {
        return <div className="text-center p-10">Generando tu plan de escapada...</div>;
    }

    if (!plan) {
        return <div className="text-center p-10">No se pudo cargar el plan.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                <img src={plan.candidate.imageUrl} alt={plan.candidate.destination} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                    <Link to="/app/getaway-planner" className="text-sm hover:underline opacity-80">&larr; Volver a sugerencias</Link>
                    <h1 className="text-4xl font-extrabold mt-1">{plan.candidate.destination}</h1>
                    <p>{plan.candidate.weather}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                    <p className="text-sm text-gray-500">Transporte</p><p className="font-bold">{plan.transportPlan.duration}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                    <p className="text-sm text-gray-500">Estadía</p><p className="font-bold">{plan.hotelPlan.name}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                    <p className="text-sm text-gray-500">Actividades</p><p className="font-bold">{plan.itinerary.flatMap(d => d.blocks).length} planeadas</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                    <p className="text-sm text-gray-500">Costo Total</p><p className="font-bold text-green-600">${plan.totalEstimatedCost} USD</p>
                </div>
            </div>

            <SectionCard title="Transporte" icon="🚗">
                <p><strong>Modo:</strong> <span className="capitalize">{plan.transportPlan.mode}</span></p>
                <p><strong>Detalles:</strong> {plan.transportPlan.details}</p>
            </SectionCard>
            
            <SectionCard title="Alojamiento" icon="🏨">
                <p><strong>Sugerencia:</strong> {plan.hotelPlan.name} ({plan.hotelPlan.type})</p>
                <p><strong>Costo Estimado:</strong> ${plan.hotelPlan.estimatedCost} USD (total)</p>
            </SectionCard>

            <SectionCard title="Itinerario Express" icon="🗺️">
                <div className="space-y-4">
                    {plan.itinerary.map(day => (
                        <div key={day.date}>
                            <h4 className="font-bold border-b dark:border-gray-700 pb-1 mb-2">{day.date}</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {day.blocks.map(block => (
                                    <li key={block.id}><strong>{block.startTime}-{block.endTime}:</strong> {block.title}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Lista de Empaque" icon="🧳">
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {plan.packingList.map(item => (
                        <li key={item.name} className="bg-gray-100 dark:bg-gray-700 rounded-md p-2">{item.name} (x{item.qty})</li>
                    ))}
                </ul>
            </SectionCard>

            <SectionCard title="Presupuesto Estimado" icon="💰">
                <ul className="space-y-1">
                    {plan.budgetBreakdown.map(item => (
                        <li key={item.category} className="flex justify-between">
                            <span>{item.category}</span>
                            <span className="font-mono">${item.amount}</span>
                        </li>
                    ))}
                    <li className="flex justify-between font-bold border-t dark:border-gray-700 pt-2 mt-2">
                        <span>Total</span>
                        <span className="font-mono">${plan.totalEstimatedCost}</span>
                    </li>
                </ul>
            </SectionCard>
            
            {/* Sticky CTA Bar */}
             <div className="sticky bottom-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-2xl max-w-lg mx-auto flex justify-around">
                <button className="font-semibold hover:text-blue-600">Guardar Escapada</button>
                <button className="font-semibold hover:text-blue-600">Exportar PDF</button>
                <button className="font-semibold hover:text-blue-600">Añadir a Calendar</button>
            </div>
        </div>
    );
};

export default GetawayPlanPage;
