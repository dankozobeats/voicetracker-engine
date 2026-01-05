'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MonthPickerProps {
    value: string; // YYYY-MM
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const MonthPicker: React.FC<MonthPickerProps> = ({
    value,
    onChange,
    label,
    placeholder = 'Sélectionner un mois',
    required = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedYear = value ? parseInt(value.split('-')[0]) : new Date().getFullYear();
    const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : new Date().getMonth();

    const [viewYear, setViewYear] = useState(selectedYear);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthClick = (monthIdx: number) => {
        const formattedMonth = (monthIdx + 1).toString().padStart(2, '0');
        onChange(`${viewYear}-${formattedMonth}`);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:border-indigo-500 hover:bg-white",
                    isOpen && "border-indigo-500 bg-white ring-4 ring-indigo-500/10"
                )}
            >
                <div className="flex items-center gap-3">
                    <Calendar className={cn("h-4 w-4 text-slate-400 transition-colors", isOpen && "text-indigo-500")} />
                    <span className={cn(!value && "text-slate-400 font-medium")}>
                        {value ? `${MONTHS[selectedMonth]} ${selectedYear}` : placeholder}
                    </span>
                </div>
                {value && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                        }}
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 top-full z-[110] mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900">{viewYear}</h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setViewYear(viewYear - 1)}
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewYear(viewYear + 1)}
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {MONTHS.map((month, idx) => {
                                const isSelected = value === `${viewYear}-${(idx + 1).toString().padStart(2, '0')}`;
                                const isCurrentMonth = new Date().getFullYear() === viewYear && new Date().getMonth() === idx;

                                return (
                                    <button
                                        key={month}
                                        onClick={() => handleMonthClick(idx)}
                                        className={cn(
                                            "flex items-center justify-center rounded-lg py-2 text-xs font-bold transition-all",
                                            "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600",
                                            isCurrentMonth && "border border-indigo-200 text-indigo-600",
                                            isSelected && "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-900 hover:text-white"
                                        )}
                                    >
                                        {month.substring(0, 3)}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
