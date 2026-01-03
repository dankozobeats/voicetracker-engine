'use client';

import { motion } from 'framer-motion';

interface AlertCenterProps {
    alerts: Array<{
        severity: 'INFO' | 'WARNING' | 'CRITICAL';
        title: string;
        message: string;
    }>;
}

export function AlertCenter({ alerts }: AlertCenterProps) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
                Alertes et Notifications
            </h2>
            <div className="space-y-3">
                {alerts.map((alert, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 rounded-lg border-2 ${alert.severity === 'CRITICAL'
                                ? 'bg-red-50 border-red-200'
                                : alert.severity === 'WARNING'
                                    ? 'bg-orange-50 border-orange-200'
                                    : 'bg-blue-50 border-blue-200'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">
                                {alert.severity === 'CRITICAL' ? '🚨' :
                                    alert.severity === 'WARNING' ? '⚠️' : 'ℹ️'}
                            </span>
                            <div className="flex-1">
                                <h3 className={`font-semibold ${alert.severity === 'CRITICAL' ? 'text-red-900' :
                                        alert.severity === 'WARNING' ? 'text-orange-900' :
                                            'text-blue-900'
                                    }`}>
                                    {alert.title}
                                </h3>
                                <p className={`text-sm mt-1 ${alert.severity === 'CRITICAL' ? 'text-red-700' :
                                        alert.severity === 'WARNING' ? 'text-orange-700' :
                                            'text-blue-700'
                                    }`}>
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
