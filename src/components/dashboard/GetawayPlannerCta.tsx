import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GetawayPlannerCta: React.FC = () => {
    return (
        /* @ts-ignore */
        <motion.section 
            className="p-8 rounded-2xl bg-cover bg-center text-white relative overflow-hidden" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1470')" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative z-10 text-center">
                <h2 className="text-3xl font-extrabold mb-2">¿Tenés unos días libres?</h2>
                <p className="mb-6 max-w-lg mx-auto">
                    Dejanos planificar tu próxima escapada. Respondé unas pocas preguntas y te daremos un plan completo, de puerta a puerta.
                </p>
                <Link 
                    to="/app/getaway-planner" 
                    className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-700 transition-transform hover:scale-105 shadow-lg inline-block"
                >
                    ✨ Armarme una Escapada
                </Link>
            </div>
        </motion.section>
    );
};

export default GetawayPlannerCta;