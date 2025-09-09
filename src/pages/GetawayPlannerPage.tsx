import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { generateGetawaySuggestions } from '../services/geminiService.ts';
import type { GetawayCandidate } from '../types.ts';
import DestinationCandidateCard from '../components/getaway/DestinationCandidateCard.tsx';

type PlannerForm = {
    days: number;
    budget: number;
    style: string;
};

const styles = ['Relajado', 'Cultural', 'Aventura', 'Gastronómico', 'Fiesta'];

const GetawayPlannerPage: React.FC = () => {
    const { register, handleSubmit } = useForm<PlannerForm>({
        defaultValues: { days: 2, budget: 300, style: 'Relajado' }
    });
    const [step, setStep] = useState<'form' | 'loading' | 'results'>('form');
    const [candidates, setCandidates] = useState<GetawayCandidate[]>([]);

    const onSubmit = async (data: PlannerForm) => {
        setStep('loading');
        try {
            const results = await generateGetawaySuggestions(data);
            setCandidates(results);
            setStep('results');
        } catch (error) {
            console.error(error);
            // Handle error state, maybe show a toast
            setStep('form');
        }
    };
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Planificador de Escapadas IA</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Tu próxima aventura, a solo un clic.</p>
            </header>
            
            <AnimatePresence mode="wait">
                {step === 'form' && (
                    /* @ts-ignore */
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg space-y-6">
                            <div>
                                <label htmlFor="days" className="block text-lg font-semibold">¿Cuántos días libres tenés?</label>
                                <input type="number" id="days" {...register('days', { valueAsNumber: true, min: 1 })} className="mt-2 w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="budget" className="block text-lg font-semibold">¿Cuál es tu presupuesto total (USD)?</label>
                                <input type="number" id="budget" {...register('budget', { valueAsNumber: true, min: 50 })} className="mt-2 w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-lg font-semibold">¿Qué estilo de viaje preferís?</label>
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {styles.map(style => (
                                        <label key={style} className="p-3 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 dark:has-[:checked]:bg-blue-900/50 cursor-pointer">
                                            <input type="radio" {...register('style')} value={style} className="sr-only" />
                                            <span>{style}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-purple-700 transition-transform hover:scale-105 text-lg">
                                Encontrar mi Escapada
                            </button>
                        </form>
                    </motion.div>
                )}

                {step === 'loading' && (
                     <motion.div key="loading" className="text-center p-10">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 font-semibold">Analizando las mejores opciones para vos...</p>
                        <p className="text-sm text-gray-500">Esto puede tardar unos segundos.</p>
                     </motion.div>
                )}

                {step === 'results' && (
                    /* @ts-ignore */
                    <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">¡Encontramos 3 escapadas perfectas para vos!</h2>
                            <button onClick={() => setStep('form')} className="text-blue-600 hover:underline mt-2">Ajustar búsqueda</button>
                        </div>
                        {candidates.map(candidate => (
                            <DestinationCandidateCard key={candidate.id} candidate={candidate} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GetawayPlannerPage;