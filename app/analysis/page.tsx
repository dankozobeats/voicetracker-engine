import { AnalysisClient } from './AnalysisClient';

// Cache cette page pendant 60 secondes
export const revalidate = 60;

export default function AnalysisPage() {
  return <AnalysisClient />;
}
