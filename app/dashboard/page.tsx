import { AlertPanel } from '@/components/alerts/AlertPanel';
import { formatCurrency } from '@/lib/format';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getEngineProjection } from '@/lib/engine-service';

async function getDashboardData() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const user = await getAuthenticatedUser();

  // Call the production Engine for the current month
  const payload = await getEngineProjection(user.id, 'SG', month, 1);

  return { payload };
}

export default async function DashboardPage() {
  const { payload } = await getDashboardData();
  const latestMonth = payload.months[0];
  const soldeActuel = latestMonth.endingBalance;
  const variation = soldeActuel - latestMonth.openingBalance;

  return (
    <main className="page-shell dashboard-shell space-y-6">
      <section className="overview-card">
        <p className="eyebrow">Dashboard Financier</p>
        <h1>Résumé du mois — {latestMonth.month}</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Solde début</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(latestMonth.openingBalance)}</p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-700">Revenus</p>
            <p className="mt-2 text-2xl font-bold text-green-600">+{formatCurrency(latestMonth.income)}</p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-red-700">Dépenses</p>
            <p className="mt-2 text-2xl font-bold text-red-600">-{formatCurrency(latestMonth.expenses)}</p>
          </div>

          <div className={`rounded-lg border p-4 ${variation >= 0 ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-700">Solde actuel</p>
            <p className={`mt-2 text-2xl font-bold ${variation >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(soldeActuel)}
            </p>
            <p className={`text-xs mt-1 ${variation >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {variation >= 0 ? '+' : ''}{formatCurrency(variation)} ce mois
            </p>
          </div>
        </div>

        {latestMonth.fixedCharges > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-700">Charges fixes du mois</p>
            <p className="mt-2 text-xl font-bold text-amber-600">{formatCurrency(latestMonth.fixedCharges)}</p>
          </div>
        )}

        {latestMonth.deferredIn > 0 && (
          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-purple-700">Transactions différées reportées</p>
            <p className="mt-2 text-xl font-bold text-purple-600">{formatCurrency(latestMonth.deferredIn)}</p>
          </div>
        )}
      </section>

      {payload.categoryBudgets.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Budgets par catégorie</h2>
          <div className="mt-4 space-y-3">
            {payload.categoryBudgets.slice(0, 5).map((budget) => {
              const percentUsed = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
              const isOverBudget = percentUsed > 100;

              return (
                <div key={budget.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{budget.category}</span>
                    <span className="text-sm text-slate-600">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                  {isOverBudget && (
                    <p className="text-xs text-red-600">Dépassement de {formatCurrency(budget.spent - budget.budget)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <AlertPanel alertTexts={payload.alertTexts} />
    </main>
  );
}
