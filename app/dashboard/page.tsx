import { AlertPanel } from '@/components/alerts/AlertPanel';
import { mockedEnginePayload } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

const latestMonth = mockedEnginePayload.months[0];

export default function DashboardPage() {
  return (
    <main className="page-shell dashboard-shell">
      
      <section className="overview-card">
        <p className="eyebrow">Vue mensuelle</p>
        <h1>Résumé — {latestMonth.month}</h1>
        <div className="metric-row">
          <div>
            <p className="metric-label">Solde d’ouverture</p>
            <p className="metric-value">{formatCurrency(latestMonth.openingBalance)}</p>
          </div>
          <div>
            <p className="metric-label">Revenus</p>
            <p className="metric-value">{formatCurrency(latestMonth.income)}</p>
          </div>
          <div>
            <p className="metric-label">Dépenses</p>
            <p className="metric-value">{formatCurrency(latestMonth.expenses)}</p>
          </div>
        </div>
      </section>
      <AlertPanel alertTexts={mockedEnginePayload.alertTexts} />
    </main>
  );
}
