'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';

const SECTIONS = [
  {
    label: 'Analyse',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Analyse mensuelle', href: '/analysis' },
    ],
  },
  {
 label: 'Budgets',
  items: [
    { label: 'Par catégorie', href: '/budgets#category' },
    { label: 'Glissants', href: '/budgets#rolling' },
    { label: 'Multi-mois', href: '/budgets#multi-month' },
    { label: 'Tendances', href: '/budgets#trends' },
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
    </aside>
  );
};