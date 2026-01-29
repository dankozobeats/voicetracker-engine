import { BalanceProjection } from '@/components/projection/BalanceProjection';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getConsolidatedProjection } from '@/lib/engine-service';

// Cache cette page pendant 60 secondes (projection 12 mois = calcul lourd)
export const revalidate = 60;

async function getProjectionData() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const user = await getAuthenticatedUser();

  // Call the production Engine for 12-month consolidated projection (SG + FLOA)
  const payload = await getConsolidatedProjection(user.id, month, 12);

  return { payload };
}

export default async function ProjectionPage() {
  const { payload } = await getProjectionData();

  return (
    <div className="page-shell">
      <section className="overview-card">
        <p className="eyebrow">Projection financière</p>
        <h1>Analyse de projection avancée</h1>
        <p>
          Projection détaillée avec métriques financières, indicateurs de santé, et analyse comparative.
          Visualise l&apos;effet &quot;boule de neige&quot; du report des excédents/déficits sur 3, 6 ou 12 mois.
        </p>
      </section>

      <BalanceProjection projections={payload.months} />
    </div>
  );
}
