/**
 * Consumer analytique qui détecte l'état "Aucune donnée"
 *
 * Ce consumer est purement analytique (lecture seule) :
 * - Il observe les données fournies
 * - Il ne modifie jamais les données
 * - Il ne calcule aucune règle métier
 * - Il expose uniquement un état booléen et une raison
 */

export type EmptyStateReason = 'NO_TRANSACTIONS' | 'NO_DATA';

export interface EmptyStateInput {
  transactions: unknown[];
  budgets?: unknown[];
  recurringCharges?: unknown[];
}

export interface EmptyStateOutput {
  isEmpty: boolean;
  emptyReason?: EmptyStateReason;
}

/**
 * Détermine si l'état est vide en analysant les données fournies.
 *
 * Règles :
 * - Si aucune transaction n'existe → isEmpty = true, reason = 'NO_TRANSACTIONS'
 * - Si aucune donnée du tout → isEmpty = true, reason = 'NO_DATA'
 * - Sinon → isEmpty = false
 *
 * @param input - Les données à analyser
 * @returns L'état vide avec la raison si applicable
 */
export const emptyStateConsumer = (input: EmptyStateInput): EmptyStateOutput => {
  const { transactions, budgets = [], recurringCharges = [] } = input;

  // Si aucune transaction n'existe, l'état est vide
  if (!transactions || transactions.length === 0) {
    return {
      isEmpty: true,
      emptyReason: 'NO_TRANSACTIONS',
    };
  }

  // Si aucune donnée du tout (transactions, budgets, charges)
  const hasAnyData = transactions.length > 0 || budgets.length > 0 || recurringCharges.length > 0;

  if (!hasAnyData) {
    return {
      isEmpty: true,
      emptyReason: 'NO_DATA',
    };
  }

  // L'état n'est pas vide
  return {
    isEmpty: false,
  };
};

