import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('Sidebar', () => {
  it('renders sections and key action links', async () => {
    const { Sidebar } = await import('./Sidebar');
    render(<Sidebar />);

    expect(screen.getByText('Voicetracker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyse' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gestion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Budgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alertes' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Ajouter une transaction' })).toHaveAttribute('href', '/transactions/new');
    expect(screen.getByRole('link', { name: 'Créer un budget' })).toHaveAttribute('href', '/budgets/new');
  });
});
