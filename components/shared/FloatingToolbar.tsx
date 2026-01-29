'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calculator, MessageCircle } from 'lucide-react';

import CalculatorPanel from './CalculatorPanel';
import AiChatPanel from './AiChatPanel';

type ActivePanel = 'none' | 'calculator' | 'chat';

export default function FloatingToolbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<ActivePanel>('none');

  const openPanel = (panel: 'calculator' | 'chat') => {
    setActive(panel);
    setMenuOpen(false);
  };

  const closePanel = () => {
    setActive('none');
  };

  // When a panel is open, the FAB becomes a close / back-to-menu button
  const handleFabClick = () => {
    if (active !== 'none') {
      closePanel();
    } else {
      setMenuOpen((prev) => !prev);
    }
  };

  const showMenu = menuOpen && active === 'none';

  return (
    <>
      {/* Backdrop to close menu on outside click */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[48]"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sub-buttons (expand upward from FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {showMenu && (
            <>
              {/* AI Chat button */}
              <motion.button
                key="chat"
                initial={{ opacity: 0, scale: 0.3, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.3, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.05 }}
                onClick={() => openPanel('chat')}
                className="flex items-center gap-2.5 group"
              >
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Assistant IA
                </span>
                <div className="p-3 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-colors">
                  <MessageCircle size={20} />
                </div>
              </motion.button>

              {/* Calculator button */}
              <motion.button
                key="calc"
                initial={{ opacity: 0, scale: 0.3, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.3, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={() => openPanel('calculator')}
                className="flex items-center gap-2.5 group"
              >
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Calculatrice
                </span>
                <div className="p-3 rounded-full bg-slate-800 text-white shadow-lg shadow-slate-800/25 hover:bg-slate-700 transition-colors">
                  <Calculator size={20} />
                </div>
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={handleFabClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 ${
            active !== 'none'
              ? 'bg-slate-800 text-white shadow-slate-800/30'
              : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-600/30'
          }`}
          title="Outils"
        >
          <motion.div
            animate={{ rotate: showMenu || active !== 'none' ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Plus size={24} strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      </div>

      {/* Panels */}
      <AnimatePresence>
        {active === 'calculator' && <CalculatorPanel onClose={closePanel} />}
        {active === 'chat' && <AiChatPanel onClose={closePanel} />}
      </AnimatePresence>
    </>
  );
}
