import { describe, expect, it } from 'vitest';
import { normalizeVoiceTransaction } from '@/src/voice/voice.index';
import { VoiceTransactionError, isVoiceTransactionError } from '@/src/voice/voice.errors';
import type { ParsedVoiceTransaction, VoiceTransactionContext } from '@/src/voice/voice.contract';

describe('voice.normalizer (strict, no silent fallback)', () => {
  it('builds a TransactionCreateInput for an expense using context defaults', () => {
    const parsed: ParsedVoiceTransaction = {
      rawText: 'Courses 45,90 euros hier',
      label: 'Courses',
      amount: 45.9,
      dateToken: { kind: 'RELATIVE_YESTERDAY' },
    };

    const context: VoiceTransactionContext = {
      defaultDate: '2026-01-05',
      defaultAccount: 'SG',
      defaultType: 'EXPENSE',
    };

    const input = normalizeVoiceTransaction(parsed, context);
    expect(input).toEqual({
      date: '2026-01-04',
      label: 'Courses',
      amount: 45.9,
      category: 'Courses',
      account: 'SG',
      type: 'EXPENSE',
    });
  });

  it('resolves "le 1 janvier" using the year from context.defaultDate', () => {
    const parsed: ParsedVoiceTransaction = {
      rawText: 'Salaire 1800 euros le 1 janvier',
      label: 'Salaire',
      amount: 1800,
      dateToken: { kind: 'DAY_MONTH', day: 1, month: 'janvier' },
    };

    const input = normalizeVoiceTransaction(parsed, {
      defaultDate: '2026-01-05',
      defaultAccount: 'SG',
      defaultType: 'INCOME',
    });

    expect(input.date).toBe('2026-01-01');
  });

  it('throws a typed error when date is missing from both text and context', () => {
    const parsed: ParsedVoiceTransaction = { rawText: 'x', label: 'Courses', amount: 10 };

    try {
      normalizeVoiceTransaction(parsed, { defaultAccount: 'SG', defaultType: 'EXPENSE' });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceTransactionError(error)).toBe(true);
      if (isVoiceTransactionError(error)) {
        expect(error.code).toBe('VOICE_MISSING_DATE');
      }
    }
  });

  it('throws a typed error when account is missing from both text and context', () => {
    const parsed: ParsedVoiceTransaction = {
      rawText: 'Courses 10 euros aujourd’hui',
      label: 'Courses',
      amount: 10,
      dateToken: { kind: 'RELATIVE_TODAY' },
    };

    try {
      normalizeVoiceTransaction(parsed, { defaultDate: '2026-01-05', defaultType: 'EXPENSE' });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceTransactionError(error)).toBe(true);
      if (isVoiceTransactionError(error)) {
        expect(error.code).toBe('VOICE_MISSING_ACCOUNT');
      }
    }
  });

  it('throws a typed error when type is missing from both text and context', () => {
    const parsed: ParsedVoiceTransaction = {
      rawText: 'Courses 10 euros aujourd’hui',
      label: 'Courses',
      amount: 10,
      dateToken: { kind: 'RELATIVE_TODAY' },
      accountToken: 'SG',
    };

    try {
      normalizeVoiceTransaction(parsed, { defaultDate: '2026-01-05' });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceTransactionError(error)).toBe(true);
      if (isVoiceTransactionError(error)) {
        expect(error.code).toBe('VOICE_MISSING_TYPE');
      }
    }
  });

  it('throws a typed error when category cannot be derived from the V1 label rules', () => {
    const parsed: ParsedVoiceTransaction = {
      rawText: 'Bijoux 10 euros aujourd’hui',
      label: 'Bijoux',
      amount: 10,
      dateToken: { kind: 'RELATIVE_TODAY' },
      accountToken: 'SG',
    };

    try {
      normalizeVoiceTransaction(parsed, {
        defaultDate: '2026-01-05',
        defaultAccount: 'SG',
        defaultType: 'EXPENSE',
      });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(VoiceTransactionError);
      if (isVoiceTransactionError(error)) {
        expect(error.code).toBe('VOICE_MISSING_CATEGORY');
      }
    }
  });
});
