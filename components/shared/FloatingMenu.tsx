'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Calculator, MessageCircle } from 'lucide-react';

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.08,
        type: 'spring' as const,
        stiffness: 320,
        damping: 22,
      },
    }),
    exit: { opacity: 0, y: 10, scale: 0.8, transition: { duration: 0.15 } },
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-slate-900 text-white shadow-2xl shadow-indigo-500/20 border border-white/10 backdrop-blur-md inline-flex items-center justify-center"
        title="Menu"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus size={24} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3 w-auto max-w-max">
            <motion.button
              custom={0}
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsOpen(false)}
              className="group inline-flex items-center gap-3 w-auto max-w-max"
              title="Calculatrice"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                Calculatrice
              </span>
              <div className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center shadow-xl border border-white/10 transition-colors shrink-0">
                <Calculator size={22} className="text-white" />
              </div>
            </motion.button>

            <motion.button
              custom={1}
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsOpen(false)}
              className="group inline-flex items-center gap-3 w-auto max-w-max"
              title="Chat IA"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                Chat IA
              </span>
              <div className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-xl border border-white/10 transition-colors shrink-0">
                <MessageCircle size={22} className="text-white" />
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
}
