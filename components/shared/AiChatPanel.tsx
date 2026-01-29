'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Move, Send, Sparkles } from 'lucide-react';
import type {
  AiChatResponse,
  AiContextWindow,
  AiInsight,
  AiPlanStep,
  AiProposedAction,
} from '@/lib/ai/ai.types';
import type { TransactionCreateInput } from '@/src/voice/voice.index';
import { voiceToTransactionCreateInput, isVoiceTransactionError } from '@/src/voice/voice.index';
import { createVoiceTransaction } from '@/lib/api/voice';
import { AiInsights } from '@/components/ai/AiInsights';
import { AiActionsList } from '@/components/ai/AiActionsList';
import { AiPlanStepper } from '@/components/ai/AiPlanStepper';

interface AiChatPanelProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  insights?: AiInsight[];
  proposedActions?: AiProposedAction[];
  planId?: string;
  planSteps?: AiPlanStep[];
  transaction?: TransactionCreateInput;
  transactionConfirmed?: boolean;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AiChatPanel({ onClose }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextWindow] = useState<AiContextWindow>(6);

  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const addMessage = (msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID() }]);
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
    );
  };

  // --- Chat IA ---
  const handleChat = async (text: string) => {
    addMessage({ role: 'user', content: text });
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, contextWindowMonths: contextWindow }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        addMessage({
          role: 'assistant',
          content: (err as { error?: string } | null)?.error ?? `Erreur ${res.status}`,
        });
        return;
      }
      const data = (await res.json()) as AiChatResponse;
      addMessage({
        role: 'assistant',
        content: data.reply,
        insights: data.insights,
        proposedActions: data.proposedActions,
      });
    } catch {
      addMessage({ role: 'assistant', content: 'Erreur de connexion.' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Transaction via voice parser ---
  const handleTransaction = (text: string) => {
    addMessage({ role: 'user', content: `/tx ${text}` });
    try {
      const tx = voiceToTransactionCreateInput(text, {
        defaultDate: todayISO(),
        defaultAccount: 'SG',
        defaultType: 'EXPENSE',
      });
      addMessage({
        role: 'system',
        content: `${tx.label} — ${tx.amount} € (${tx.account}, ${tx.type})`,
        transaction: tx,
        transactionConfirmed: false,
      });
    } catch (err: unknown) {
      const msg = isVoiceTransactionError(err) ? err.message : 'Format non reconnu.';
      addMessage({ role: 'assistant', content: msg });
    }
  };

  const confirmTransaction = async (msgId: string, tx: TransactionCreateInput) => {
    setIsLoading(true);
    try {
      await createVoiceTransaction(tx);
      updateMessage(msgId, {
        transactionConfirmed: true,
        content: `${tx.label} — ${tx.amount} € enregistrée.`,
      });
    } catch {
      addMessage({ role: 'assistant', content: "Erreur lors de l'enregistrement." });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelTransaction = (msgId: string) => {
    updateMessage(msgId, { transactionConfirmed: true, content: 'Transaction annulée.' });
  };

  // --- Plan IA ---
  const handlePlan = async (text: string) => {
    addMessage({ role: 'user', content: `/plan ${text}` });
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, contextWindowMonths: contextWindow }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        addMessage({
          role: 'assistant',
          content: (err as { error?: string } | null)?.error ?? `Erreur ${res.status}`,
        });
        return;
      }
      const data = (await res.json()) as {
        planId?: string;
        steps?: AiPlanStep[];
        reply?: string;
        error?: string;
      };
      if (data.planId && data.steps) {
        addMessage({
          role: 'assistant',
          content: `Plan de ${data.steps.length} action${data.steps.length > 1 ? 's' : ''}.`,
          planId: data.planId,
          planSteps: data.steps,
        });
      } else {
        addMessage({
          role: 'assistant',
          content: data.reply ?? data.error ?? 'Impossible de générer un plan.',
        });
      }
    } catch {
      addMessage({ role: 'assistant', content: 'Erreur de connexion.' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Dispatch ---
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');

    if (trimmed.startsWith('/tx ')) {
      handleTransaction(trimmed.slice(4));
    } else if (trimmed.startsWith('/plan ')) {
      handlePlan(trimmed.slice(6));
    } else {
      handleChat(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

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
        className="fixed bottom-24 right-6 z-50 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        style={{ maxHeight: 'min(560px, calc(100vh - 120px))' }}
      >
        {/* Header */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="p-3 bg-blue-600 flex justify-between items-center text-white cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <Move size={14} className="text-blue-200" />
            <span className="text-xs font-bold uppercase tracking-widest">Assistant IA</span>
          </div>
          <button
            onClick={onClose}
            className="hover:text-blue-200 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <Sparkles size={28} className="mx-auto text-blue-400" />
              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-500">Commandes :</p>
                <p>Tapez une question pour l&apos;IA</p>
                <p>
                  <span className="font-mono bg-slate-100 px-1 rounded">/tx</span> Courses 45
                  euros aujourd&apos;hui
                </p>
                <p>
                  <span className="font-mono bg-slate-100 px-1 rounded">/plan</span> Optimise mon
                  budget
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-xl px-3 py-2 text-xs max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.role === 'system'
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Transaction confirmation */}
                {msg.transaction && !msg.transactionConfirmed && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => confirmTransaction(msg.id, msg.transaction!)}
                      disabled={isLoading}
                      className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => cancelTransaction(msg.id)}
                      className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded-md hover:bg-slate-300"
                    >
                      Annuler
                    </button>
                  </div>
                )}

                {msg.transactionConfirmed && msg.transaction && (
                  <p className="mt-1 text-emerald-600 text-[10px] font-medium">Enregistrée</p>
                )}

                {/* AI insights */}
                {msg.insights && msg.insights.length > 0 && (
                  <div className="mt-2">
                    <AiInsights insights={msg.insights} />
                  </div>
                )}

                {/* AI actions */}
                {msg.proposedActions && msg.proposedActions.length > 0 && (
                  <div className="mt-2">
                    <AiActionsList actions={msg.proposedActions} />
                  </div>
                )}

                {/* AI plan stepper */}
                {msg.planId && msg.planSteps && (
                  <div className="mt-2">
                    <AiPlanStepper planId={msg.planId} steps={msg.planSteps} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-xl px-3 py-2">
                <p className="text-xs text-slate-400 animate-pulse">Analyse en cours...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 border-t border-slate-100 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Question, /tx ou /plan..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
