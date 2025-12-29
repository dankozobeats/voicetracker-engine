import Link from 'next/link';
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { TransactionsClient } from './TransactionsClient';

// Cache cette page pendant 30 secondes (données modifiées plus fréquemment)
export const revalidate = 30;

type Transaction = {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: string;
  account: 'SG' | 'FLOA';
  type: 'INCOME' | 'EXPENSE';
  is_deferred: boolean;
  deferred_to: string | null;
  priority: number;
  budget_id: string | null;
};

export default async function TransactionsPage() {
  let transactions: Transaction[] = [];
  let error: string | null = null;

  try {
    const user = await getAuthenticatedUser();
    const supabase = serverSupabaseAdmin();

    const { data, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100);

    if (fetchError) {
      error = 'Erreur lors du chargement des transactions';
    } else {
      transactions = (data || []) as Transaction[];
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Une erreur est survenue';
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mes Transactions</h1>
            <p className="mt-2 text-slate-600">
              Transactions ponctuelles que vous saisissez manuellement
            </p>
          </div>
          <Link
            href="/transactions/new"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nouvelle transaction
          </Link>
        </header>

        {/* Lien vers charges récurrentes */}
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-4xl">💡</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900">Charges fixes mensuelles</h3>
              <p className="mt-1 text-sm text-amber-800">
                Pour vos dépenses qui reviennent chaque mois (loyer, Netflix, assurances, etc.),
                utilisez les <strong>Charges Récurrentes</strong>. Elles seront automatiquement
                ajoutées chaque mois sans avoir à les ressaisir!
              </p>
              <Link
                href="/recurring-charges"
                className="mt-3 inline-block rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
              >
                Gérer mes charges récurrentes (loyer, abonnements...)
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        {!error && transactions.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-slate-900">Aucune transaction</p>
            <p className="mt-2 text-sm text-slate-500">
              Ajoutez votre première transaction pour commencer
            </p>
            <Link
              href="/transactions/new"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Créer une transaction
            </Link>
          </div>
        ) : (
          <TransactionsClient initialTransactions={transactions} />
        )}
      </div>
    </main>
  );
}
