import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page-shell">
      <p className="eyebrow">Voicetracker UI</p>
      <h1>Interface lecture seule</h1>
      <p>Utilisez le dashboard pour visualiser les alertes et les métriques fournies par l’engine.</p>
      <Link href="/dashboard" className="cta">
        Aller au dashboard
      </Link>
    </main>
  );
}
