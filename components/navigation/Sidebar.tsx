'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Plus, User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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
  {
    label: 'Aide',
    items: [{ label: 'Guide de démarrage', href: '/auth/welcome' }],
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    SECTIONS.reduce((acc, section) => ({ ...acc, [section.label]: false }), {})
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggle = (label: string) => {
    setOpenSections((prev) => {
      // Si la section est déjà ouverte, on la ferme
      if (prev[label]) {
        return { ...prev, [label]: false };
      }
      // Sinon, on ferme toutes les sections et on ouvre celle-ci
      const allClosed = SECTIONS.reduce((acc, section) => ({ ...acc, [section.label]: false }), {});
      return { ...allClosed, [label]: true };
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40
        w-64 bg-slate-900 text-slate-100 h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">Voicetracker</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                          onClick={() => setMobileMenuOpen(false)}
                          className={`
                          block px-3 py-2 rounded-md text-sm transition-colors
                          ${isActive
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
        <div className="p-4 border-t border-slate-800 space-y-2 flex-shrink-0">
          <Link
            href="/transactions/new"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une transaction</span>
          </Link>
          <Link
            href="/budgets/new"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un budget</span>
          </Link>
        </div>

        {/* User Profile & Logout */}
        {userEmail && (
          <div className="p-4 border-t border-slate-800 space-y-2 flex-shrink-0">
            {/* User Info */}
            <Link
              href="/profile"
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {userEmail}
                </p>
                <p className="text-xs text-slate-400">Voir le profil</p>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};