import { AnalysisHeader } from '@/components/analysis/AnalysisHeader';
import { KpiRow } from '@/components/analysis/KpiRow';
import { AlertsList } from '@/components/analysis/AlertsList';
import { TrendsList } from '@/components/analysis/TrendsList';

const kpiItems = [
  { title: 'Solde d’ouverture', value: '€ 152 400', description: 'Snapshot garanti' },
  { title: 'Revenus', value: '€ 118 000', description: 'Contrat mensuel' },
  { title: 'Dépenses', value: '€ 85 200', description: 'Charges figées' },
  { title: 'Variation nette', value: '+€ 32 800', description: 'Croissance mensuelle', accent: 'positive' as const },
];

const alerts = [
  {
    domain: 'Budget',
    category: 'Alimentation',
    severity: 'CRITICAL' as const,
    ruleId: 'BUDGET:ALIMENTATION:2024-03',
  },
  {
    domain: 'Tendance',
    category: 'Marketing',
    severity: 'WARNING' as const,
    ruleId: 'TREND:MARKETING:2024-Q1',
  },
  {
    domain: 'Budget',
    category: 'Transport',
    severity: 'OK' as const,
    ruleId: 'BUDGET:TRANSPORT:2024-03',
  },
];

const trends = [
  { category: 'Alimentation', variation: '+11.5%', direction: 'up' as const },
  { category: 'Transport', variation: '-8.7%', direction: 'down' as const },
  { category: 'Marketing', variation: '+2.0%', direction: 'stable' as const },
  { category: 'Souscriptions', variation: '+3.4%', direction: 'up' as const },
];

export default function AnalysisPage() {
  return (
    <main className="bg-slate-50 text-slate-900 min-h-screen py-12">
      <div className="mx-auto max-w-5xl space-y-10 px-6">
        <AnalysisHeader
          title="Analyse mensuelle"
          period="Mars 2024"
          statuses={['Lecture seule', 'Snapshot', 'Premium']}
        />

        <section aria-labelledby="resume-executif" className="space-y-6">
          <header>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Résumé exécutif</p>
            <h2 id="resume-executif" className="mt-2 text-2xl font-semibold text-slate-900">
              KPI principaux
            </h2>
          </header>
          <KpiRow items={kpiItems} />
        </section>

        <section aria-labelledby="alertes" className="space-y-6">
          <header>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Alertes avancées</p>
            <h2 id="alertes" className="mt-2 text-2xl font-semibold text-slate-900">
              Priorités observationnelles
            </h2>
          </header>
          <AlertsList alerts={alerts} />
        </section>

        <section aria-labelledby="tendances" className="space-y-6 pb-10">
          <header>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tendances</p>
            <h2 id="tendances" className="mt-2 text-2xl font-semibold text-slate-900">
              Directions observées
            </h2>
          </header>
          <TrendsList trends={trends} />
        </section>
      </div>
    </main>
  );
}
