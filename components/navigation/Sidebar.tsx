'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

const SECTIONS = [
  {
    label: 'Analyse',
    items: [
      { label: 'Vue Financière', href: '/overview' },
      { label: 'Projection de solde', href: '/projection' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Mes transactions', href: '/transactions' },
      { label: 'Charges récurrentes', href: '/recurring-charges' },
      { label: 'Règles de plafond', href: '/ceiling-rules' },
      { label: 'Soldes d\'ouverture', href: '/account-balances' },
      { label: 'Suivi des dettes', href: '/debts' },
      { label: 'Checklist d\'import', href: '/import-checklist' },
    ],
  },
  {
    label: 'Budgets',
    items: [
      { label: 'Gérer mes budgets', href: '/budgets/manage' },
      { label: 'Résultats', href: '/budgets' },
    ],
  },
  {
    label: 'Alertes',
    items: [{ label: 'Alertes avancées', href: '/alerts' }],
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    SECTIONS.reduce((acc, section) => ({ ...acc, [section.label]: true }), {})
  );

  const toggle = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">Voicetracker</h1>
        <p className="text-xs text-slate-400 mt-1">Lecture seule</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            {/* Section Header */}
            <button
              onClick={() => toggle(section.label)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span>{section.label}</span>
              {openSections[section.label] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Section Items */}
            {openSections[section.label] && (
              <ul className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={`${section.label}-${item.label}`}>
                      <Link
                        href={item.href}
                        className={`
                          block px-3 py-2 rounded-md text-sm transition-colors
                          ${
                            isActive
                              ? 'bg-slate-800 text-white font-medium'
                              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>

      {/* Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href="/transactions/new"
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une transaction</span>
        </Link>
        <Link
          href="/budgets/new"
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un budget</span>
        </Link>
      </div>
    </aside>
  );
};