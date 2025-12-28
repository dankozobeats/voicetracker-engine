import { BalanceProjection } from '@/components/projection/BalanceProjection';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getEngineProjection } from '@/lib/engine-service';

async function getProjectionData() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const user = await getAuthenticatedUser();

  // Call the production Engine for 12-month projection (max)
  const payload = await getEngineProjection(user.id, 'SG', month, 12);

  return { payload };
}

export default async function ProjectionPage() {
  const { payload } = await getProjectionData();

  return (
    <main className="page-shell">
      <section className="overview-card">
        <p className="eyebrow">Projection financière</p>
        <h1>Analyse de projection avancée</h1>
        <p>
          Projection détaillée avec métriques financières, indicateurs de santé, et analyse comparative.
          Visualise l&apos;effet &quot;boule de neige&quot; du report des excédents/déficits sur 3, 6 ou 12 mois.
        </p>
      </section>

      <BalanceProjection projections={payload.months} />
    </main>
  );
}
