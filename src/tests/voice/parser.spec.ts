import { describe, expect, it } from 'vitest';
import { parseVoiceTransactionText } from '@/src/voice/voice.index';
import { isVoiceTransactionError } from '@/src/voice/voice.errors';

describe('voice.parser (V1 formats only)', () => {
  it('parses amount, relative date token, and account token (example 1)', () => {
    const parsed = parseVoiceTransactionText('Carburant 20 euros aujourd’hui carte SG');
    expect(parsed.label).toBe('Carburant');
    expect(parsed.amount).toBe(20);
    expect(parsed.dateToken).toEqual({ kind: 'RELATIVE_TODAY' });
    expect(parsed.accountToken).toBe('SG');
  });

  it('parses decimal amount and relative date token (example 2)', () => {
    const parsed = parseVoiceTransactionText('Courses 45,90 euros hier');
    expect(parsed.label).toBe('Courses');
    expect(parsed.amount).toBe(45.9);
    expect(parsed.dateToken).toEqual({ kind: 'RELATIVE_YESTERDAY' });
    expect(parsed.accountToken).toBeUndefined();
  });

  it('parses day+month token (example 3)', () => {
    const parsed = parseVoiceTransactionText('Salaire 1800 euros le 1 janvier');
    expect(parsed.label).toBe('Salaire');
    expect(parsed.amount).toBe(1800);
    expect(parsed.dateToken).toEqual({ kind: 'DAY_MONTH', day: 1, month: 'janvier' });
  });

  it('parses multi-word label (example 4)', () => {
    const parsed = parseVoiceTransactionText('Netflix abonnement 15 euros le 3 janvier');
    expect(parsed.label).toBe('Netflix abonnement');
    expect(parsed.amount).toBe(15);
    expect(parsed.dateToken).toEqual({ kind: 'DAY_MONTH', day: 3, month: 'janvier' });
  });

  it('parses account token even when it comes before the date (example 5)', () => {
    const parsed = parseVoiceTransactionText('Restaurant 32 euros carte FLOA aujourd’hui');
    expect(parsed.label).toBe('Restaurant');
    expect(parsed.amount).toBe(32);
    expect(parsed.accountToken).toBe('FLOA');
    expect(parsed.dateToken).toEqual({ kind: 'RELATIVE_TODAY' });
  });

  it('throws a typed error for unsupported formats', () => {
    try {
      parseVoiceTransactionText('Courses 20 euros demain');
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceTransactionError(error)).toBe(true);
      if (isVoiceTransactionError(error)) {
        expect(error.code).toBe('VOICE_UNSUPPORTED_FORMAT');
      }
    }
  });

  it('throws a typed error when amount is missing', () => {
    try {
      parseVoiceTransactionText('payer 20 balles stp');
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceTransactionError(error)).toBe(true);
      if (isVoiceTransactionError(error)) {
        expect(error.code).toBe('VOICE_MISSING_AMOUNT');
      }
    }
  });
});
