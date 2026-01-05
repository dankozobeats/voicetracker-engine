import { describe, it, expect, vi } from 'vitest';

import type { SpeechRecognizer, VoiceASRInput } from '../asr/asr.contract';
import {
  ASRUnavailableError,
  UnsupportedLocaleError,
  InvalidCapturedAtError,
  EmptyTranscriptError,
  ASRRuntimeError,
} from '../asr/asr.errors';

import { transcribeFromMicrophone } from '../asr/asr.adapter';

function makeRecognizer(overrides?: Partial<SpeechRecognizer>): SpeechRecognizer {
  return {
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    getTranscript: vi.fn(async () => ({ text: 'Courses 45,90 euros hier', confidence: 0.91 })),
    ...overrides,
  };
}

describe('mobile/asr/transcribeFromMicrophone', () => {
  const baseInput: VoiceASRInput = {
    locale: 'fr-FR',
    capturedAt: '2026-01-05T12:00:00.000Z',
  };

  it('throws ASRUnavailableError when recognizer is missing', async () => {
    // @ts-expect-error intentional: missing recognizer
    await expect(transcribeFromMicrophone(undefined, baseInput)).rejects.toBeInstanceOf(
      ASRUnavailableError,
    );
  });

  it('throws UnsupportedLocaleError for unsupported locale', async () => {
    const recognizer = makeRecognizer();

    const bad = {
      ...baseInput,
      // @ts-expect-error intentional: unsupported locale
      locale: 'es-ES',
    };

    await expect(transcribeFromMicrophone(recognizer, bad)).rejects.toBeInstanceOf(
      UnsupportedLocaleError,
    );
  });

  it('throws InvalidCapturedAtError for invalid capturedAt', async () => {
    const recognizer = makeRecognizer();

    await expect(
      transcribeFromMicrophone(recognizer, { ...baseInput, capturedAt: 'not-a-date' }),
    ).rejects.toBeInstanceOf(InvalidCapturedAtError);
  });

  it('throws EmptyTranscriptError when transcript text is empty/blank', async () => {
    const recognizer = makeRecognizer({
      getTranscript: vi.fn(async () => ({ text: '   ' })),
    });

    await expect(transcribeFromMicrophone(recognizer, baseInput)).rejects.toBeInstanceOf(
      EmptyTranscriptError,
    );
  });

  it('wraps recognizer.start failure in ASRRuntimeError', async () => {
    const recognizer = makeRecognizer({
      start: vi.fn(async () => {
        throw new Error('mic denied');
      }),
    });

    await expect(transcribeFromMicrophone(recognizer, baseInput)).rejects.toBeInstanceOf(
      ASRRuntimeError,
    );
  });

  it('returns exact ASRResult for valid transcript (no mutation)', async () => {
    const recognizer = makeRecognizer({
      getTranscript: vi.fn(async () => ({ text: 'Restaurant 32 euros carte FLOA aujourd’hui' })),
    });

    const input = { ...baseInput };
    const result = await transcribeFromMicrophone(recognizer, input);

    expect(result).toEqual({
      text: 'Restaurant 32 euros carte FLOA aujourd’hui',
      locale: 'fr-FR',
      capturedAt: '2026-01-05T12:00:00.000Z',
      confidence: undefined,
    });

    // ensure we did not mutate input
    expect(input).toEqual(baseInput);
  });

  it('calls recognizer.start then stop then getTranscript (strict order)', async () => {
    const calls: string[] = [];

    const recognizer = makeRecognizer({
      start: vi.fn(async () => {
        calls.push('start');
      }),
      stop: vi.fn(async () => {
        calls.push('stop');
      }),
      getTranscript: vi.fn(async () => {
        calls.push('getTranscript');
        return { text: 'Carburant 20 euros aujourd’hui carte SG', confidence: 0.7 };
      }),
    });

    const result = await transcribeFromMicrophone(recognizer, baseInput);

    expect(calls).toEqual(['start', 'stop', 'getTranscript']);
    expect(result.text).toBe('Carburant 20 euros aujourd’hui carte SG');
    expect(result.confidence).toBe(0.7);
  });
});