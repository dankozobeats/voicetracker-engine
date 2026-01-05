import type { ParsedVoiceTransaction, VoiceTransactionContext } from './voice.contract';

export type VoiceErrorCode =
  | 'VOICE_UNSUPPORTED_FORMAT'
  | 'VOICE_MISSING_AMOUNT'
  | 'VOICE_AMBIGUOUS_AMOUNT'
  | 'VOICE_INVALID_AMOUNT'
  | 'VOICE_MISSING_LABEL'
  | 'VOICE_MISSING_DATE'
  | 'VOICE_INVALID_DATE'
  | 'VOICE_MISSING_ACCOUNT'
  | 'VOICE_AMBIGUOUS_ACCOUNT'
  | 'VOICE_MISSING_TYPE'
  | 'VOICE_MISSING_CATEGORY'
  | 'VOICE_AMBIGUOUS_CATEGORY';

export type VoiceErrorDetails =
  | { code: 'VOICE_UNSUPPORTED_FORMAT'; text: string }
  | { code: 'VOICE_MISSING_AMOUNT'; text: string }
  | { code: 'VOICE_AMBIGUOUS_AMOUNT'; text: string }
  | { code: 'VOICE_INVALID_AMOUNT'; text: string; value: string }
  | { code: 'VOICE_MISSING_LABEL'; text: string }
  | { code: 'VOICE_MISSING_DATE'; text: string; context: VoiceTransactionContext }
  | { code: 'VOICE_INVALID_DATE'; text: string; value: string }
  | { code: 'VOICE_MISSING_ACCOUNT'; text: string; context: VoiceTransactionContext }
  | { code: 'VOICE_AMBIGUOUS_ACCOUNT'; text: string }
  | { code: 'VOICE_MISSING_TYPE'; text: string; context: VoiceTransactionContext }
  | { code: 'VOICE_MISSING_CATEGORY'; text: string; label: string }
  | { code: 'VOICE_AMBIGUOUS_CATEGORY'; text: string; label: string };

/**
 * Typed error for the Voice Transaction module.
 * No silent fallback is allowed: any invalid/missing information must throw a typed error.
 */
export class VoiceTransactionError extends Error {
  public readonly code: VoiceErrorCode;
  public readonly details: VoiceErrorDetails;

  public constructor(details: VoiceErrorDetails, message?: string) {
    super(message ?? details.code);
    this.name = 'VoiceTransactionError';
    this.code = details.code;
    this.details = details;
  }
}

/**
 * Type guard for narrowing unknown errors.
 */
export function isVoiceTransactionError(error: unknown): error is VoiceTransactionError {
  return error instanceof VoiceTransactionError;
}

/**
 * Helper to build consistent "missing X" messages without leaking implementation details.
 */
export function voiceErrorSummary(error: VoiceTransactionError): string {
  return error.message || error.code;
}

/**
 * Helper to attach parser/normalizer context in tests without relying on implementation internals.
 */
export function describeVoiceInputs(args: {
  text: string;
  parsed?: ParsedVoiceTransaction;
  context?: VoiceTransactionContext;
}): Record<string, unknown> {
  const { text, parsed, context } = args;
  return { text, parsed, context };
}
