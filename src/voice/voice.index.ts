export type {
  ParsedVoiceTransaction,
  TransactionCreateInput,
  VoiceAccount,
  VoiceTransactionContext,
  VoiceTransactionType,
  VoiceDateToken,
  VoiceMonthName,
} from './voice.contract';

export { VoiceTransactionError, isVoiceTransactionError } from './voice.errors';
export { parseVoiceTransactionText } from './voice.parser';
export { normalizeVoiceTransaction } from './voice.normalizer';

import type { TransactionCreateInput, VoiceTransactionContext } from './voice.contract';
import { parseVoiceTransactionText } from './voice.parser';
import { normalizeVoiceTransaction } from './voice.normalizer';

/**
 * Facade for the required pipeline:
 * text → parser → normalizer → TransactionCreateInput (or typed error).
 */
export function voiceToTransactionCreateInput(
  text: string,
  context: VoiceTransactionContext
): TransactionCreateInput {
  const parsed = parseVoiceTransactionText(text);
  return normalizeVoiceTransaction(parsed, context);
}
