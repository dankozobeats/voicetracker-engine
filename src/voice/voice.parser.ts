import type { ParsedVoiceTransaction, VoiceDateToken, VoiceMonthName } from './voice.contract';
import { VoiceTransactionError } from './voice.errors';

/**
 * Collapses whitespace and trims the final text.
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes common apostrophe variants to ASCII apostrophe.
 */
function toAsciiApostrophes(text: string): string {
  return text.replace(/[’`´]/g, "'");
}

/**
 * Extracts all "X euros" amount matches from the input.
 */
function findAmountMatches(text: string): RegExpMatchArray[] {
  const regex = /(\d+(?:[,.]\d{1,2})?)\s*euros?\b/gi;
  return Array.from(text.matchAll(regex));
}

/**
 * Converts a matched "X euros" into a positive number.
 */
function parseAmountFromMatch(match: RegExpMatchArray, text: string): number {
  const raw = match[1];
  const normalized = raw.replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    throw new VoiceTransactionError({ code: 'VOICE_INVALID_AMOUNT', text, value: raw });
  }
  return value;
}

/**
 * Extracts an optional account token from the trailing part of the string.
 */
function parseAccountToken(textAfterAmount: string, fullText: string): 'SG' | 'FLOA' | undefined {
  const regex = /\bcarte\s+(SG|FLOA)\b/gi;
  const matches = Array.from(textAfterAmount.matchAll(regex));
  if (matches.length === 0) return undefined;
  const accounts = new Set(matches.map(m => String(m[1]).toUpperCase()));
  if (accounts.size !== 1) {
    throw new VoiceTransactionError({ code: 'VOICE_AMBIGUOUS_ACCOUNT', text: fullText });
  }
  const only = Array.from(accounts)[0];
  if (only !== 'SG' && only !== 'FLOA') {
    throw new VoiceTransactionError({ code: 'VOICE_UNSUPPORTED_FORMAT', text: fullText });
  }
  return only;
}

/**
 * Converts a French month string to a supported month token.
 * This is intentionally strict: unknown month names are not accepted in V1.
 */
function toVoiceMonthName(value: string): VoiceMonthName | undefined {
  const lowered = value.toLowerCase();
  const supported: VoiceMonthName[] = [
    'janvier',
    'fevrier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'aout',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'decembre',
    'décembre',
  ];
  return supported.includes(lowered as VoiceMonthName) ? (lowered as VoiceMonthName) : undefined;
}

/**
 * Extracts an optional V1 date token from the trailing part of the string.
 */
function parseDateToken(textAfterAmount: string): VoiceDateToken | undefined {
  const lowered = toAsciiApostrophes(textAfterAmount).toLowerCase();
  if (/\baujourd'hui\b/.test(lowered)) {
    return { kind: 'RELATIVE_TODAY' };
  }
  if (/\bhier\b/.test(lowered)) {
    return { kind: 'RELATIVE_YESTERDAY' };
  }

  const dayMonth = /\ble\s+(\d{1,2})\s+([a-zàâçéèêëîïôùûüœ]+)\b/i.exec(textAfterAmount);
  if (!dayMonth) return undefined;

  const day = Number(dayMonth[1]);
  const month = toVoiceMonthName(String(dayMonth[2]));
  if (!month) return undefined;
  return { kind: 'DAY_MONTH', day, month };
}

/**
 * Checks whether the trailing part strictly matches the supported V1 grammar.
 */
function assertV1TrailingGrammar(textAfterAmount: string, fullText: string): void {
  const normalized = normalizeWhitespace(toAsciiApostrophes(textAfterAmount)).toLowerCase();
  if (!normalized) {
    throw new VoiceTransactionError({ code: 'VOICE_UNSUPPORTED_FORMAT', text: fullText });
  }

  const monthToken = '(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)';
  const dateToken = `(aujourd'hui|hier|le\\s+\\d{1,2}\\s+${monthToken})`;
  const accountToken = '(carte\\s+(sg|floa))';

  const patterns = [
    new RegExp(`^${dateToken}$`, 'i'),
    new RegExp(`^${dateToken}\\s+${accountToken}$`, 'i'),
    new RegExp(`^${accountToken}\\s+${dateToken}$`, 'i'),
  ];

  if (!patterns.some(pattern => pattern.test(normalized))) {
    throw new VoiceTransactionError({ code: 'VOICE_UNSUPPORTED_FORMAT', text: fullText });
  }
}

/**
 * Parses a voice transcript into an intermediate representation.
 * V1 is intentionally strict: any unsupported format throws a typed error (no fallback).
 */
export function parseVoiceTransactionText(text: string): ParsedVoiceTransaction {
  const rawText = text;
  const cleaned = normalizeWhitespace(rawText);
  if (cleaned.length === 0) {
    throw new VoiceTransactionError({ code: 'VOICE_UNSUPPORTED_FORMAT', text: rawText });
  }

  const amountMatches = findAmountMatches(cleaned);
  if (amountMatches.length === 0) {
    throw new VoiceTransactionError({ code: 'VOICE_MISSING_AMOUNT', text: rawText });
  }
  if (amountMatches.length !== 1) {
    throw new VoiceTransactionError({ code: 'VOICE_AMBIGUOUS_AMOUNT', text: rawText });
  }

  const match = amountMatches[0];
  const amount = parseAmountFromMatch(match, rawText);

  const amountIndex = match.index;
  if (amountIndex === undefined) {
    throw new VoiceTransactionError({ code: 'VOICE_UNSUPPORTED_FORMAT', text: rawText });
  }

  const beforeAmount = normalizeWhitespace(cleaned.slice(0, amountIndex));
  const afterAmount = normalizeWhitespace(cleaned.slice(amountIndex + match[0].length));

  if (beforeAmount.length === 0) {
    throw new VoiceTransactionError({ code: 'VOICE_MISSING_LABEL', text: rawText });
  }

  assertV1TrailingGrammar(afterAmount, rawText);

  const label = beforeAmount;
  const dateToken = parseDateToken(afterAmount);
  const accountToken = parseAccountToken(afterAmount, rawText);

  if (!dateToken) throw new VoiceTransactionError({ code: 'VOICE_UNSUPPORTED_FORMAT', text: rawText });

  return {
    rawText,
    label,
    amount,
    dateToken,
    accountToken,
  };
}
