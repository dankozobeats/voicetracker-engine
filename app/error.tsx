'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log typical errors to console for easier debugging
        console.error('[Global Error Cache]', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center border border-slate-100"
            >
                <div className="mb-8 relative inline-block">
                    <motion.div
                        animate={{
                            rotate: [0, -10, 10, -10, 10, 0],
                            y: [0, -5, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3
                        }}
                        className="text-6xl"
                    >
                        ⚠️
                    </motion.div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    Oups ! Quelque chose s'est mal passé.
                </h1>

                <p className="text-slate-600 mb-8 leading-relaxed">
                    Une erreur inattendue est survenue lors du traitement de votre demande. Ne vous inquiétez pas, vos données sont en sécurité.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-blue-200 active:transform active:scale-[0.98]"
                    >
                        Réessayer 🔄
                    </button>

                    <Link
                        href="/"
                        className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all active:transform active:scale-[0.98]"
                    >
                        Retour à l'accueil
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50">
                    <p className="text-xs text-slate-400 font-mono">
                        ID de l'erreur : {error.digest || 'N/A'}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
