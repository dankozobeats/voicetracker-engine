import { describe, expect, it } from 'vitest';
import {
  VoiceMobileAdapterError,
  isVoiceMobileAdapterError,
  voiceMobileToTransactionCreateInput,
} from '@/src/voice/adapters/mobile.adapter';
import { isVoiceTransactionError } from '@/src/voice/voice.errors';

describe('voice mobile adapter', () => {
  it('throws a typed error for invalid input (empty text)', () => {
    const input = { text: '   ', locale: 'fr-FR', capturedAt: '2026-01-05T10:00:00Z' };

    try {
      voiceMobileToTransactionCreateInput(input, { defaultAccount: 'SG', defaultType: 'EXPENSE' });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceMobileAdapterError(error)).toBe(true);
      if (isVoiceMobileAdapterError(error)) {
        expect(error.code).toBe('VOICE_MOBILE_INVALID_INPUT');
      }
    }
  });

  it('throws a typed error for unsupported locale', () => {
    const input = { text: 'Coffee 3 dollars today', locale: 'en-US', capturedAt: '2026-01-05T10:00:00Z' };

    try {
      voiceMobileToTransactionCreateInput(input, { defaultAccount: 'SG', defaultType: 'EXPENSE' });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(VoiceMobileAdapterError);
      if (isVoiceMobileAdapterError(error)) {
        expect(error.code).toBe('VOICE_MOBILE_UNSUPPORTED_LOCALE');
      }
    }
  });

  it('throws a typed error for invalid capturedAt', () => {
    const input = { text: 'Courses 10 euros aujourd’hui', locale: 'fr-FR', capturedAt: '2026-01-05' };

    try {
      voiceMobileToTransactionCreateInput(input, { defaultAccount: 'SG', defaultType: 'EXPENSE' });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceMobileAdapterError(error)).toBe(true);
      if (isVoiceMobileAdapterError(error)) {
        expect(error.code).toBe('VOICE_MOBILE_INVALID_CAPTURED_AT');
      }
    }
  });

  it('produces a TransactionCreateInput for valid V1 french input, deriving defaultDate from capturedAt', () => {
    const text = 'Courses 45,90 euros hier';
    const input = { text, locale: 'fr-FR', capturedAt: '2026-01-05T10:00:00Z' as const };

    const output = voiceMobileToTransactionCreateInput(input, {
      defaultAccount: 'SG',
      defaultType: 'EXPENSE',
    });

    expect(output).toEqual({
      date: '2026-01-04',
      label: 'Courses',
      amount: 45.9,
      category: 'Courses',
      account: 'SG',
      type: 'EXPENSE',
    });
  });

  it('does not mutate input text', () => {
    const text = 'Carburant 20 euros aujourd’hui carte SG';
    const input = { text, locale: 'fr-FR', capturedAt: '2026-01-05T10:00:00Z' as const };

    voiceMobileToTransactionCreateInput(input, { defaultType: 'EXPENSE' });
    expect(input.text).toBe(text);
  });

  it('does not fallback missing context (propagates typed voice errors)', () => {
    const input = { text: 'Courses 10 euros aujourd’hui', locale: 'fr-FR', capturedAt: '2026-01-05T10:00:00Z' };

    try {
      voiceMobileToTransactionCreateInput(input, { defaultAccount: 'SG' });
      expect.unreachable('expected a thrown error');
    } catch (error) {
      expect(isVoiceTransactionError(error)).toBe(true);
      if (isVoiceTransactionError(error)) {
        expect(error.code).toBe('VOICE_MISSING_TYPE');
      }
    }
  });
});

