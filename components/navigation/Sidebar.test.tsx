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

import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders sections with navigation links and matches snapshot', () => {
    const { container } = render(<Sidebar />);

    expect(container).toMatchSnapshot();

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/dashboard');
  });
});
