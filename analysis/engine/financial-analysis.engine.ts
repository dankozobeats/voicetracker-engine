/**
 * Engine analytique pur pour l'analyse financière
 *
 * Ce module est purement analytique (lecture seule) :
 * - Aucune mutation des données d'entrée
 * - Fonction déterministe (même entrée → même sortie)
 * - Aucun effet de bord
 * - Aucun accès réseau ou base de données
 */

export interface SupabaseTransaction {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  label: string;
  amount: number;
  category: string | null;
}

export interface FinancialSummary {
  openingBalance: number; // Toujours 0 pour l'instant (pas de solde initial géré)
  income: number;
  expenses: number;
  net: number; // income - expenses
}

export interface Alert {
  id: string;
  type: 'HIGH_EXPENSE' | 'NEGATIVE_NET';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  category?: string;
  amount?: number;
}

export interface Trend {
  category: string;
  current: number;
  previous: number;
  change: number; // current - previous
  percentChange: number; // ((current - previous) / previous) * 100
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export interface FinancialAnalysisResult {
  summary: FinancialSummary;
  alerts: Alert[];
  trends: Trend[];
}

// Seuil pour alerte de dépense élevée (hardcodé comme demandé)
const HIGH_EXPENSE_THRESHOLD = 1000;

// Seuil pour considérer une tendance comme stable (variation < 5%)
const STABLE_TREND_THRESHOLD = 5;

/**
 * Détermine le type de transaction depuis le label
 * Si le label contient "Revenu" ou "income", c'est un revenu
 * Sinon, c'est une dépense
 */
const determineTransactionType = (label: string): 'income' | 'expense' => {
  const lowerLabel = label.toLowerCase();
  return lowerLabel.includes('revenu') || lowerLabel.includes('income') ? 'income' : 'expense';
};

/**
 * Calcule le résumé financier à partir des transactions
 */
const calculateSummary = (transactions: SupabaseTransaction[]): FinancialSummary => {
  let income = 0;
  let expenses = 0;

  for (const transaction of transactions) {
    const type = determineTransactionType(transaction.label);
    if (type === 'income') {
      income += Math.abs(transaction.amount);
    } else {
      expenses += Math.abs(transaction.amount);
    }
  }

  return {
    openingBalance: 0, // Pas de solde initial géré pour l'instant
    income,
    expenses,
    net: income - expenses,
  };
};

/**
 * Génère les alertes à partir des transactions et du résumé
 */
const generateAlerts = (
  transactions: SupabaseTransaction[],
  summary: FinancialSummary,
): Alert[] => {
  const alerts: Alert[] = [];

  // Alerte si le net est négatif
  if (summary.net < 0) {
    alerts.push({
      id: 'negative-net',
      type: 'NEGATIVE_NET',
      severity: 'CRITICAL',
      message: `Le solde net est négatif : ${summary.net.toFixed(2)} €`,
    });
  }

  // Alertes pour dépenses élevées par transaction
  for (const transaction of transactions) {
    const type = determineTransactionType(transaction.label);
    if (type === 'expense' && Math.abs(transaction.amount) >= HIGH_EXPENSE_THRESHOLD) {
      alerts.push({
        id: `high-expense-${transaction.id}`,
        type: 'HIGH_EXPENSE',
        severity: 'WARNING',
        message: `Dépense élevée détectée : ${Math.abs(transaction.amount).toFixed(2)} €`,
        category: transaction.category ?? undefined,
        amount: Math.abs(transaction.amount),
      });
    }
  }

  return alerts;
};

/**
 * Calcule les tendances par catégorie
 * Pour l'instant, on compare simplement les montants totaux par catégorie
 * (pas de comparaison temporelle car on n'a qu'un mois de données)
 * On génère des tendances basiques basées sur la distribution
 */
const calculateTrends = (transactions: SupabaseTransaction[]): Trend[] => {
  const trends: Trend[] = [];

  // Grouper par catégorie
  const byCategory = new Map<string, number[]>();

  for (const transaction of transactions) {
    const category = transaction.category ?? 'Non catégorisé';
    const type = determineTransactionType(transaction.label);
    const amount = Math.abs(transaction.amount);

    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }

    // Pour les dépenses, on les compte négativement pour la tendance
    // Pour les revenus, positivement
    const signedAmount = type === 'expense' ? -amount : amount;
    byCategory.get(category)!.push(signedAmount);
  }

  // Calculer les tendances basiques
  // On compare avec une moyenne simple (pas de données historiques)
  const allAmounts = Array.from(byCategory.values()).flat();
  const average = allAmounts.length > 0 ? allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length : 0;

  for (const [category, amounts] of byCategory.entries()) {
    const current = amounts.reduce((sum, amount) => sum + amount, 0);
    const previous = average; // Utiliser la moyenne comme référence
    const change = current - previous;
    const percentChange = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;

    let direction: 'INCREASING' | 'DECREASING' | 'STABLE';
    if (Math.abs(percentChange) < STABLE_TREND_THRESHOLD) {
      direction = 'STABLE';
    } else if (change > 0) {
      direction = 'INCREASING';
    } else {
      direction = 'DECREASING';
    }

    trends.push({
      category,
      current,
      previous,
      change,
      percentChange,
      direction,
    });
  }

  return trends.sort((a, b) => a.category.localeCompare(b.category));
};

/**
 * Engine analytique principal
 *
 * @param transactions - Liste des transactions depuis Supabase
 * @returns Résultat de l'analyse financière
 */
export const analyzeFinancialData = (transactions: SupabaseTransaction[]): FinancialAnalysisResult => {
  // Créer une copie pour éviter toute mutation
  const safeTransactions = transactions.map((t) => ({ ...t }));

  const summary = calculateSummary(safeTransactions);
  const alerts = generateAlerts(safeTransactions, summary);
  const trends = calculateTrends(safeTransactions);

  return {
    summary,
    alerts,
    trends,
  };
};


