'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const WelcomePage = () => {
    const steps = [
        {
            icon: '💸',
            title: 'Suivez vos Transactions',
            description: 'Importez ou saisissez manuellement vos dépenses et revenus pour une vision claire.',
        },
        {
            icon: '🔄',
            title: 'Gérez le Récurrent',
            description: 'Configurez vos abonnements et revenus réguliers pour automatiser vos projections.',
        },
        {
            icon: '📈',
            title: 'Anticipez le Futur',
            description: 'Visualisez votre solde sur 3, 6 ou 12 mois et évitez les mauvaises surprises.',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-12 border border-slate-100"
            >
                <div className="text-center space-y-4 mb-12">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-block p-3 bg-blue-50 rounded-2xl mb-2"
                    >
                        <span className="text-4xl">🚀</span>
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                        Bienvenue sur <span className="text-blue-600">VoiceTracker</span>
                    </h1>
                    <p className="text-slate-600 text-lg max-w-md mx-auto">
                        Votre copilote financier est prêt. Voici comment bien démarrer votre expérience.
                    </p>
                </div>

                <div className="space-y-8 mb-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
                        >
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-xl text-2xl group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                                {step.icon}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-slate-900 text-lg leading-snug">
                                    {step.title}
                                </h3>
                                <p className="text-slate-500 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center"
                >
                    <Link
                        href="/overview"
                        className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
                    >
                        C'est parti ! 🚀
                    </Link>
                    <p className="text-slate-400 text-sm mt-6">
                        Vous pourrez modifier vos paramètres à tout moment.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default WelcomePage;
