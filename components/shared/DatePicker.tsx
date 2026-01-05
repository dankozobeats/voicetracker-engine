'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label,
    placeholder = 'Sélectionner une date',
    required = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedDate = value ? new Date(value) : null;
    const [viewDate, setViewDate] = useState(selectedDate || new Date());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust to Monday start
    };

    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];

        // Padding from prev month
        const prevMonthDays = getDaysInMonth(year, month - 1);
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, monthOffset: -1 });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, monthOffset: 0 });
        }

        // Padding from next month
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, monthOffset: 1 });
        }

        return days;
    };

    const handleDateClick = (dayObj: { day: number, monthOffset: number }) => {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + dayObj.monthOffset, dayObj.day);
        const formatted = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        onChange(formatted);
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const formatDateLabel = (date: Date) => {
        return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
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
                    <CalendarIcon className={cn("h-4 w-4 text-slate-400 transition-colors", isOpen && "text-indigo-500")} />
                    <span className={cn(!value && "text-slate-400 font-medium")}>
                        {selectedDate ? formatDateLabel(selectedDate) : placeholder}
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
                        className="absolute left-0 top-full z-[110] mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900">
                                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => changeMonth(-1)}
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => changeMonth(1)}
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-2 grid grid-cols-7 gap-1">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                                <div key={i} className="text-center text-[10px] font-black uppercase text-slate-400">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {renderDays().map((dayObj, i) => {
                                const isSelected = selectedDate &&
                                    selectedDate.getDate() === dayObj.day &&
                                    selectedDate.getMonth() === (viewDate.getMonth() + dayObj.monthOffset) &&
                                    selectedDate.getFullYear() === viewDate.getFullYear();
                                const isCurrentMonth = dayObj.monthOffset === 0;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleDateClick(dayObj)}
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all",
                                            !isCurrentMonth && "text-slate-300",
                                            isCurrentMonth && "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600",
                                            isSelected && "bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-900 hover:text-white"
                                        )}
                                    >
                                        {dayObj.day}
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
