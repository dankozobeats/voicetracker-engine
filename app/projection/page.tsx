import { BalanceProjection } from '@/components/projection/BalanceProjection';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getEngineProjection } from '@/lib/engine-service';

async function getProjectionData() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const user = await getAuthenticatedUser();

  // Call the production Engine for 6-month projection
  const payload = await getEngineProjection(user.id, 'SG', month, 6);

  return { payload };
}

export default async function ProjectionPage() {
  const { payload } = await getProjectionData();

  return (
    <main className="page-shell">
      <section className="overview-card">
        <p className="eyebrow">Projection financière</p>
        <h1>Projection de solde sur 6 mois</h1>
        <p>
          Visualisation de l&apos;évolution de ton solde avec report automatique des excédents et
          déficits (effet &quot;boule de neige&quot;).
        </p>
      </section>

      <BalanceProjection projections={payload.months} />
    </main>
  );
}
