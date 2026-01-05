/**
 * Canonical transaction payload expected by the existing Transactions API.
 * This module is strictly a producer of this shape (no engine changes, no UI).
 */
export interface TransactionCreateInput {
  date: string; // YYYY-MM-DD
  label: string;
  amount: number; // positive numeric amount
  category: string;
  account: VoiceAccount;
  type: VoiceTransactionType;
}

export type VoiceAccount = 'SG' | 'FLOA';
export type VoiceTransactionType = 'INCOME' | 'EXPENSE';

/**
 * Explicit context provided by the caller.
 * No implicit defaults are allowed: if a value is missing from both text and context, we throw.
 */
export interface VoiceTransactionContext {
  defaultDate?: string; // YYYY-MM-DD, used for "aujourd'hui" and year inference (e.g. "le 1 janvier")
  defaultAccount?: VoiceAccount;
  defaultType?: VoiceTransactionType;
}

/**
 * Intermediate parsed result from the V1 supported voice formats.
 * Fields may be missing if absent from text; the normalizer resolves or rejects using context.
 */
export interface ParsedVoiceTransaction {
  rawText: string;
  label: string;
  amount: number;
  dateToken?: VoiceDateToken;
  accountToken?: VoiceAccount;
}

export type VoiceDateToken =
  | { kind: 'RELATIVE_TODAY' }
  | { kind: 'RELATIVE_YESTERDAY' }
  | { kind: 'DAY_MONTH'; day: number; month: VoiceMonthName };

export type VoiceMonthName =
  | 'janvier'
  | 'fevrier'
  | 'février'
  | 'mars'
  | 'avril'
  | 'mai'
  | 'juin'
  | 'juillet'
  | 'aout'
  | 'août'
  | 'septembre'
  | 'octobre'
  | 'novembre'
  | 'decembre'
  | 'décembre';
