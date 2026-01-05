import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { VoiceTransactionError } from '@/src/voice/voice.errors';

vi.mock('@/lib/api/voice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/voice')>();
  return {
    ...actual,
    createVoiceTransaction: vi.fn(),
  };
});

vi.mock('@/src/voice/voice.index', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/voice/voice.index')>();
  return {
    ...actual,
    voiceToTransactionCreateInput: vi.fn(),
  };
});

describe('VoiceTransactionInput', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an explicit error for invalid text (typed voice error)', async () => {
    const { voiceToTransactionCreateInput } = await import('@/src/voice/voice.index');
    vi.mocked(voiceToTransactionCreateInput).mockImplementation(() => {
      throw new VoiceTransactionError({ code: 'VOICE_UNSUPPORTED_FORMAT', text: 'x' });
    });

    const { VoiceTransactionInput } = await import('./VoiceTransactionInput');
    render(<VoiceTransactionInput />);

    fireEvent.change(screen.getByLabelText('Raw text'), { target: { value: 'payer 20 balles stp' } });
    fireEvent.change(screen.getByLabelText('Base date (required)'), { target: { value: '2026-01-05' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('VOICE_UNSUPPORTED_FORMAT');
    expect(screen.getByRole('button', { name: 'Confirm & submit' })).toBeDisabled();
  });

  it('renders a read-only preview for valid text', async () => {
    const { voiceToTransactionCreateInput } = await import('@/src/voice/voice.index');
    vi.mocked(voiceToTransactionCreateInput).mockReturnValue({
      date: '2026-01-04',
      label: 'Courses',
      amount: 45.9,
      category: 'Courses',
      account: 'SG',
      type: 'EXPENSE',
    });

    const { VoiceTransactionInput } = await import('./VoiceTransactionInput');
    render(<VoiceTransactionInput />);

    fireEvent.change(screen.getByLabelText('Raw text'), { target: { value: 'Courses 45,90 euros hier' } });
    fireEvent.change(screen.getByLabelText('Base date (required)'), { target: { value: '2026-01-05' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    const previewHeading = await screen.findByRole('heading', { level: 3, name: 'Preview' });
    const previewBox = previewHeading.parentElement as HTMLElement;

    expect(within(previewBox).getByText('2026-01-04')).toBeInTheDocument();
    expect(within(previewBox).getAllByText('Courses')).toHaveLength(2);
    expect(within(previewBox).getByText('45.9')).toBeInTheDocument();
    expect(within(previewBox).getByText('SG')).toBeInTheDocument();
    expect(within(previewBox).getByText('EXPENSE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm & submit' })).toBeEnabled();
  });

  it('keeps confirm disabled if base date is missing', async () => {
    const { VoiceTransactionInput } = await import('./VoiceTransactionInput');
    render(<VoiceTransactionInput />);

    fireEvent.change(screen.getByLabelText('Raw text'), { target: { value: 'Courses 45,90 euros hier' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Base date is required');
    expect(screen.getByRole('button', { name: 'Confirm & submit' })).toBeDisabled();
  });

  it('submits the exact payload to the voice API when confirmed', async () => {
    const { voiceToTransactionCreateInput } = await import('@/src/voice/voice.index');
    const { createVoiceTransaction } = await import('@/lib/api/voice');

    const payload = {
      date: '2026-01-04',
      label: 'Courses',
      amount: 45.9,
      category: 'Courses',
      account: 'SG',
      type: 'EXPENSE',
    } as const;

    vi.mocked(voiceToTransactionCreateInput).mockReturnValue(payload);
    vi.mocked(createVoiceTransaction).mockResolvedValue({ transaction: { id: 'tx-1' } });

    const { VoiceTransactionInput } = await import('./VoiceTransactionInput');
    render(<VoiceTransactionInput />);

    fireEvent.change(screen.getByLabelText('Raw text'), { target: { value: 'Courses 45,90 euros hier' } });
    fireEvent.change(screen.getByLabelText('Base date (required)'), { target: { value: '2026-01-05' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm & submit' }));

    expect(createVoiceTransaction).toHaveBeenCalledWith(payload);
    expect(await screen.findByRole('status')).toHaveTextContent('Transaction saved');
  });

  it('does not import engine from the UI component', async () => {
    // If this test ever fails, it indicates an accidental dependency added to the UI layer.
    vi.resetModules();
    vi.doMock('engine/types', () => {
      throw new Error('engine import is forbidden in UI');
    });

    const module = await import('./VoiceTransactionInput');
    expect(module.VoiceTransactionInput).toBeDefined();
  });
});
