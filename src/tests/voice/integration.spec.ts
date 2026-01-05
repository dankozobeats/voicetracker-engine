import { describe, expect, it } from 'vitest';
import { voiceToTransactionCreateInput } from '@/src/voice/voice.index';
import { isVoiceTransactionError } from '@/src/voice/voice.errors';

describe('voice (parser → normalizer → facade)', () => {
  it('produces a TransactionCreateInput for example 1', () => {
    const input = voiceToTransactionCreateInput('Carburant 20 euros aujourd’hui carte SG', {
      defaultDate: '2026-01-05',
      defaultType: 'EXPENSE',
    });

    expect(input).toEqual({
      date: '2026-01-05',
      label: 'Carburant',
      amount: 20,
      category: 'Carburant',
      account: 'SG',
      type: 'EXPENSE',
    });
  });

  it('produces a TransactionCreateInput for example 2 (account via context)', () => {
    const input = voiceToTransactionCreateInput('Courses 45,90 euros hier', {
      defaultDate: '2026-01-05',
      defaultAccount: 'SG',
      defaultType: 'EXPENSE',
    });

    expect(input).toEqual({
      date: '2026-01-04',
      label: 'Courses',
      amount: 45.9,
      category: 'Courses',
      account: 'SG',
      type: 'EXPENSE',
    });
  });

  it('produces a TransactionCreateInput for example 3 (income inferred from label)', () => {
    const input = voiceToTransactionCreateInput('Salaire 1800 euros le 1 janvier', {
      defaultDate: '2026-01-05',
      defaultAccount: 'SG',
    });

    expect(input).toEqual({
      date: '2026-01-01',
      label: 'Salaire',
      amount: 1800,
      category: 'Salaire',
      account: 'SG',
      type: 'INCOME',
    });
  });

  it('produces a TransactionCreateInput for example 4', () => {
    const input = voiceToTransactionCreateInput('Netflix abonnement 15 euros le 3 janvier', {
      defaultDate: '2026-01-05',
      defaultAccount: 'SG',
      defaultType: 'EXPENSE',
    });

    expect(input).toEqual({
      date: '2026-01-03',
      label: 'Netflix abonnement',
      amount: 15,
      category: 'Abonnement',
      account: 'SG',
      type: 'EXPENSE',
    });
  });

  it('produces a TransactionCreateInput for example 5 (account from text)', () => {
    const input = voiceToTransactionCreateInput('Restaurant 32 euros carte FLOA aujourd’hui', {
      defaultDate: '2026-01-05',
      defaultType: 'EXPENSE',
    });

    expect(input).toEqual({
      date: '2026-01-05',
      label: 'Restaurant',
      amount: 32,
      category: 'Restaurant',
      account: 'FLOA',
      type: 'EXPENSE',
    });
  });

  it('throws a typed error if required info is missing from both text and context', () => {
    try {
      voiceToTransactionCreateInput('Courses 45,90 euros hier', { defaultDate: '2026-01-05' });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceTransactionError(error)).toBe(true);
      if (isVoiceTransactionError(error)) {
        expect(error.code).toBe('VOICE_MISSING_ACCOUNT');
      }
    }
  });
});
