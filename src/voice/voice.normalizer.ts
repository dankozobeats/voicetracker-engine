import type {
  ParsedVoiceTransaction,
  TransactionCreateInput,
  VoiceTransactionContext,
  VoiceTransactionType,
  VoiceMonthName,
  VoiceDateToken,
} from './voice.contract';
import { VoiceTransactionError } from './voice.errors';

/**
 * Validates a YYYY-MM-DD date string.
 */
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const [y, m, d] = value.split('-').map(Number);
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() + 1 === m &&
    date.getUTCDate() === d
  );
}

/**
 * Adds a day delta to a YYYY-MM-DD (UTC-safe).
 */
function addDays(isoDate: string, deltaDays: number): string {
  const base = new Date(`${isoDate}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + deltaDays);
  const year = base.getUTCFullYear();
  const month = String(base.getUTCMonth() + 1).padStart(2, '0');
  const day = String(base.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a V1 month name to a month index (1-12).
 */
function monthNameToNumber(month: VoiceMonthName): number {
  const normalized = month
    .toLowerCase()
    .replace('é', 'e')
    .replace('è', 'e')
    .replace('ê', 'e')
    .replace('à', 'a')
    .replace('ù', 'u')
    .replace('û', 'u')
    .replace('ô', 'o')
    .replace('î', 'i')
    .replace('ï', 'i')
    .replace('ç', 'c');

  const map: Record<string, number> = {
    janvier: 1,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12,
  };

  const value = map[normalized];
  if (!value) {
    throw new VoiceTransactionError({ code: 'VOICE_INVALID_DATE', text: month, value: month });
  }
  return value;
}

/**
 * Resolves a parsed date token into an ISO date, using explicit context.
 */
function resolveDate(dateToken: VoiceDateToken | undefined, rawText: string, context: VoiceTransactionContext): string {
  const base = context.defaultDate;
  if (!dateToken) {
    if (!base) {
      throw new VoiceTransactionError({ code: 'VOICE_MISSING_DATE', text: rawText, context });
    }
    if (!isIsoDate(base)) {
      throw new VoiceTransactionError({ code: 'VOICE_INVALID_DATE', text: rawText, value: base });
    }
    return base;
  }

  if (!base) {
    throw new VoiceTransactionError({ code: 'VOICE_MISSING_DATE', text: rawText, context });
  }
  if (!isIsoDate(base)) {
    throw new VoiceTransactionError({ code: 'VOICE_INVALID_DATE', text: rawText, value: base });
  }

  if (dateToken.kind === 'RELATIVE_TODAY') return base;
  if (dateToken.kind === 'RELATIVE_YESTERDAY') return addDays(base, -1);

  const year = base.slice(0, 4);
  const month = String(monthNameToNumber(dateToken.month)).padStart(2, '0');
  const day = String(dateToken.day).padStart(2, '0');
  const iso = `${year}-${month}-${day}`;
  if (!isIsoDate(iso)) {
    throw new VoiceTransactionError({ code: 'VOICE_INVALID_DATE', text: rawText, value: iso });
  }
  return iso;
}

/**
 * Resolves the transaction type. V1 supports:
 * - INCOME when the label contains "salaire"
 * - otherwise, explicit context.defaultType is required
 */
function resolveType(label: string, rawText: string, context: VoiceTransactionContext): VoiceTransactionType {
  if (/\bsalaire\b/i.test(label)) return 'INCOME';
  if (context.defaultType) return context.defaultType;
  throw new VoiceTransactionError({ code: 'VOICE_MISSING_TYPE', text: rawText, context });
}

/**
 * Derives the category from the V1 label rules. Any other label is rejected.
 */
function resolveCategory(label: string, rawText: string): string {
  const normalized = label.toLowerCase();
  const candidates: Array<{ keyword: RegExp; category: string }> = [
    { keyword: /\bcarburant\b/i, category: 'Carburant' },
    { keyword: /\bcourses\b/i, category: 'Courses' },
    { keyword: /\brestaurant\b/i, category: 'Restaurant' },
    { keyword: /\bsalaire\b/i, category: 'Salaire' },
    { keyword: /\babonnement\b/i, category: 'Abonnement' },
  ];

  const matches = candidates.filter(c => c.keyword.test(normalized));
  if (matches.length === 0) {
    throw new VoiceTransactionError({ code: 'VOICE_MISSING_CATEGORY', text: rawText, label });
  }
  const uniqueCategories = Array.from(new Set(matches.map(m => m.category)));
  if (uniqueCategories.length !== 1) {
    throw new VoiceTransactionError({ code: 'VOICE_AMBIGUOUS_CATEGORY', text: rawText, label });
  }
  return uniqueCategories[0];
}

/**
 * Normalizes a parsed voice transaction into the immutable TransactionCreateInput payload.
 * This function is strict: any missing information from both text and context throws a typed error.
 */
export function normalizeVoiceTransaction(
  parsed: ParsedVoiceTransaction,
  context: VoiceTransactionContext
): TransactionCreateInput {
  const { rawText, label, amount } = parsed;
  if (!label.trim()) {
    throw new VoiceTransactionError({ code: 'VOICE_MISSING_LABEL', text: rawText });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new VoiceTransactionError({ code: 'VOICE_INVALID_AMOUNT', text: rawText, value: String(amount) });
  }

  const date = resolveDate(parsed.dateToken, rawText, context);
  const account = parsed.accountToken ?? context.defaultAccount;
  if (!account) {
    throw new VoiceTransactionError({ code: 'VOICE_MISSING_ACCOUNT', text: rawText, context });
  }

  const type = resolveType(label, rawText, context);
  const category = resolveCategory(label, rawText);

  return {
    date,
    label,
    amount,
    category,
    account,
    type,
  };
}
