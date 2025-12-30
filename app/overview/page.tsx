import OverviewClient from './OverviewClient';

// Cache 60 secondes pour optimiser les performances
export const revalidate = 60;

export default function OverviewPage() {
  return <OverviewClient />;
}
