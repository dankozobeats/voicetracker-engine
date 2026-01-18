import OverviewClient from './OverviewClient';
import { getEngineProjection } from '@/lib/engine-service';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { redirect } from 'next/navigation';

// Cache 60 secondes pour optimiser les performances
export const revalidate = 60;

export default async function OverviewPage() {
  let initialData = null;

  try {
    const user = await getAuthenticatedUser();
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Initial fetch: SG account, current month, 3 months projection
    initialData = await getEngineProjection(user.id, 'SG', monthStr, 3);
  } catch (error) {
    console.error('[OverviewPage] SSR Error:', error);
    // If unauthorized, redirect to sign-in
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/auth/sign-in');
    }
  }

  return <OverviewClient initialData={initialData} />;
}
