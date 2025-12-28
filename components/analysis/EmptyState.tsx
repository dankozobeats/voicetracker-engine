import React from 'react';
import Link from 'next/link';
import type { EmptyStateReason } from '@/lib/types';

interface EmptyStateProps {
  reason?: EmptyStateReason;
}

const getMessage = (reason?: EmptyStateReason) => {
  switch (reason) {
    case 'NO_TRANSACTIONS':
      return {
        title: 'Aucune transaction enregistrée',
        description: 'Commencez par ajouter votre première transaction pour générer une analyse financière.',
        cta: 'Ajouter une transaction',
        href: '/transactions/new',
      };
    case 'NO_DATA':
      return {
        title: 'Aucune donnée disponible',
        description: 'Votre compte est vide. Ajoutez des transactions et des budgets pour commencer.',
        cta: 'Commencer',
        href: '/transactions/new',
      };
    default:
      return {
        title: 'Aucune donnée disponible',
        description: 'Commencez par ajouter vos premières données pour générer une analyse.',
        cta: 'Commencer',
        href: '/transactions/new',
      };
  }
};

export const EmptyState = ({ reason }: EmptyStateProps) => {
  const message = getMessage(reason);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-slate-900">{message.title}</h2>
        <p className="mb-6 text-slate-600">{message.description}</p>
        <Link
          href={message.href}
          className="inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          {message.cta}
        </Link>
      </div>
    </div>
  );
};

