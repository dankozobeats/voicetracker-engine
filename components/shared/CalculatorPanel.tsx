'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Equal, Move } from 'lucide-react';

interface CalculatorPanelProps {
  onClose: () => void;
}

export default function CalculatorPanel({ onClose }: CalculatorPanelProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const calculate = useCallback(() => {
    try {
      const sanitizedEquation = (equation + display)
        .replace(/[^-+*/.0-9]/g, '')
        .replace(/--/g, '+');

      const result = new Function(`return ${sanitizedEquation}`)();
      const finalResult = Number.isInteger(result)
        ? result.toString()
        : result.toFixed(2).replace(/\.?0+$/, '');

      setDisplay(finalResult);
      setEquation('');
      setShouldReset(true);
    } catch {
      setDisplay('Error');
    }
  }, [equation, display]);

  const handleAction = useCallback(
    (value: string) => {
      if (value === 'C') {
        setDisplay('0');
        setEquation('');
        setShouldReset(false);
        return;
      }

      if (value === '=') {
        calculate();
        return;
      }

      if (['+', '-', '*', '/'].includes(value)) {
        setEquation((prev) => prev + display + value);
        setShouldReset(true);
        return;
      }

      if (shouldReset) {
        setDisplay(value === '.' ? '0.' : value);
        setShouldReset(false);
      } else {
        setDisplay((prev) => (prev === '0' && value !== '.' ? value : prev + value));
      }
    },
    [calculate, display, shouldReset],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleAction(e.key);
      if (e.key === '.') handleAction('.');
      if (e.key === '+') handleAction('+');
      if (e.key === '-') handleAction('-');
      if (e.key === '*') handleAction('*');
      if (e.key === '/') handleAction('/');
      if (e.key === 'Enter' || e.key === '=') handleAction('=');
      if (e.key === 'Escape') onClose();
      if (e.key === 'Backspace' || e.key === 'Delete') handleAction('C');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, onClose]);

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[49]" />

      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
        className="fixed bottom-24 right-6 z-50 w-72 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="p-4 bg-slate-900 flex justify-between items-center text-white cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2">
            <Move size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Calculatrice</span>
          </div>
          <button
            onClick={onClose}
            className="hover:text-rose-400 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <X size={16} />
          </button>
        </div>

        {/* Display */}
        <div className="p-6 text-right">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest h-4 mb-1 truncate">
            {equation}
          </div>
          <div className="text-4xl font-black text-slate-900 tracking-tighter truncate">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 grid grid-cols-4 gap-2 bg-slate-50/50">
          {['C', '/', '*', '-'].map((op) => (
            <button
              key={op}
              onClick={() => handleAction(op)}
              className={`p-4 rounded-xl font-black text-sm transition-all active:scale-95 ${
                op === 'C'
                  ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white'
                  : 'bg-slate-200/50 text-slate-600 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {op === '*' ? '×' : op === '/' ? '÷' : op}
            </button>
          ))}
          {[7, 8, 9, '+'].map((val) => (
            <button
              key={val}
              onClick={() => handleAction(val.toString())}
              className={`p-4 rounded-xl font-black text-sm transition-all active:scale-95 ${
                val === '+'
                  ? 'bg-slate-200/50 text-slate-600 row-span-2 flex items-center justify-center hover:bg-slate-900 hover:text-white'
                  : 'bg-white text-slate-900 shadow-sm border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              {val}
            </button>
          ))}
          <div className="col-span-3 grid grid-cols-3 gap-2">
            {[4, 5, 6, 1, 2, 3, 0, '.'].map((val) => (
              <button
                key={val}
                onClick={() => handleAction(val.toString())}
                className={`p-4 rounded-xl font-black text-sm transition-all active:scale-95 bg-white text-slate-900 shadow-sm border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 ${
                  val === 0 ? 'col-span-2' : ''
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleAction('=')}
            className="p-4 rounded-xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center"
          >
            <Equal size={24} />
          </button>
        </div>
      </motion.div>
    </>
  );
}
