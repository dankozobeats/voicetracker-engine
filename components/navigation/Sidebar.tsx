'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
      { label: 'Budgets par catégorie', href: '/budgets' },
      { label: 'Budgets glissants', href: '/budgets' },
      { label: 'Budgets multi-mois', href: '/budgets' },
      { label: 'Tendances', href: '/budgets' },
    ],
  },
  {
    label: 'Alertes',
    items: [{ label: 'Alertes avancées', href: '/alerts' }],
  },
];

export const Sidebar = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    SECTIONS.reduce((acc, section) => ({ ...acc, [section.label]: true }), {})
  );

  const toggle = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <p>Voicetracker</p>
        <span>Lecture seule</span>
      </div>
      <nav>
        {SECTIONS.map((section) => (
          <div key={section.label} className="sidebar-section">
            <button className="sidebar-section__header" type="button" onClick={() => toggle(section.label)}>
              <span>{section.label}</span>
              <span>{openSections[section.label] ? '−' : '+'}</span>
            </button>

            {openSections[section.label] && (
              <ul>
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};
