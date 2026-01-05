import type { TransactionCreateInput, VoiceTransactionContext } from '../voice.contract';
import { VoiceTransactionError, isVoiceTransactionError } from '../voice.errors';
import { voiceToTransactionCreateInput } from '../voice.index';

export interface VoiceMobileInput {
  text: string;
  locale: 'fr-FR' | 'en-US';
  capturedAt: string; // ISO 8601
}

export type VoiceMobileAdapterErrorCode =
  | 'VOICE_MOBILE_INVALID_INPUT'
  | 'VOICE_MOBILE_UNSUPPORTED_LOCALE'
  | 'VOICE_MOBILE_INVALID_CAPTURED_AT';

export type VoiceMobileAdapterErrorDetails =
  | { code: 'VOICE_MOBILE_INVALID_INPUT'; reason: string; input: unknown }
  | { code: 'VOICE_MOBILE_UNSUPPORTED_LOCALE'; locale: string }
  | { code: 'VOICE_MOBILE_INVALID_CAPTURED_AT'; capturedAt: string };

/**
 * Typed error for the mobile adapter layer.
 * The adapter is strict: invalid inputs and unsupported locales must throw (no fallback).
 */
export class VoiceMobileAdapterError extends Error {
  public readonly code: VoiceMobileAdapterErrorCode;
  public readonly details: VoiceMobileAdapterErrorDetails;

  public constructor(details: VoiceMobileAdapterErrorDetails, message?: string) {
    super(message ?? details.code);
    this.name = 'VoiceMobileAdapterError';
    this.code = details.code;
    this.details = details;
  }
}

export function isVoiceMobileAdapterError(error: unknown): error is VoiceMobileAdapterError {
  return error instanceof VoiceMobileAdapterError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSupportedLocale(value: unknown): value is VoiceMobileInput['locale'] {
  return value === 'fr-FR' || value === 'en-US';
}

function isIsoDateTime(value: string): boolean {
  // Require an explicit timezone (Z or ±HH:MM) to avoid implicit local-time parsing.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }
  const time = Date.parse(value);
  return Number.isFinite(time);
}

function toIsoDateFromCapturedAt(capturedAt: string): string {
  // capturedAt is validated before calling this function.
  return capturedAt.slice(0, 10);
}

/**
 * Mobile adapter entrypoint.
 *
 * Responsibilities:
 * - Validate mobile input strictly (no fallback)
 * - Enforce supported locales (V1 expects French voice transcripts)
 * - Forward context explicitly into the existing voice pipeline
 *
 * Notes:
 * - The adapter does NOT perform speech-to-text.
 * - The adapter does NOT invent defaults; the only context it can derive is the date from capturedAt.
 *   This is explicit data provided by the mobile layer.
 */
export function voiceMobileToTransactionCreateInput(
  input: VoiceMobileInput,
  context: VoiceTransactionContext
): TransactionCreateInput {
  if (!isRecord(input)) {
    throw new VoiceMobileAdapterError({
      code: 'VOICE_MOBILE_INVALID_INPUT',
      reason: 'input must be an object',
      input,
    });
  }

  const { text, locale, capturedAt } = input as Record<string, unknown>;

  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new VoiceMobileAdapterError({
      code: 'VOICE_MOBILE_INVALID_INPUT',
      reason: 'text must be a non-empty string',
      input,
    });
  }

  if (!isSupportedLocale(locale)) {
    throw new VoiceMobileAdapterError({
      code: 'VOICE_MOBILE_INVALID_INPUT',
      reason: 'locale must be fr-FR or en-US',
      input,
    });
  }

  if (locale !== 'fr-FR') {
    throw new VoiceMobileAdapterError({
      code: 'VOICE_MOBILE_UNSUPPORTED_LOCALE',
      locale,
    });
  }

  if (typeof capturedAt !== 'string' || !isIsoDateTime(capturedAt)) {
    throw new VoiceMobileAdapterError({
      code: 'VOICE_MOBILE_INVALID_CAPTURED_AT',
      capturedAt: typeof capturedAt === 'string' ? capturedAt : String(capturedAt),
    });
  }

  const forwardedContext: VoiceTransactionContext = {
    ...context,
    defaultDate: context.defaultDate ?? toIsoDateFromCapturedAt(capturedAt),
  };

  try {
    return voiceToTransactionCreateInput(text, forwardedContext);
  } catch (error) {
    if (isVoiceTransactionError(error)) {
      throw error;
    }
    if (error instanceof Error) {
      throw new VoiceMobileAdapterError(
        { code: 'VOICE_MOBILE_INVALID_INPUT', reason: error.message, input },
        error.message
      );
    }
    throw new VoiceMobileAdapterError({
      code: 'VOICE_MOBILE_INVALID_INPUT',
      reason: 'Unknown error',
      input,
    });
  }
}

export { VoiceTransactionError };

