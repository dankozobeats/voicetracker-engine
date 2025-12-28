'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AnalysisHeader } from '@/components/analysis/AnalysisHeader';
import { EmptyState } from '@/components/analysis/EmptyState';
import { KpiRow } from '@/components/analysis/KpiRow';
import { AlertsList } from '@/components/analysis/AlertsList';
import { TrendsList } from '@/components/analysis/TrendsList';
import { formatCurrency } from '@/lib/format';
import type { EmptyStateOutput } from '@/lib/types';
import type { FinancialAnalysisResult } from '@/analysis/engine/financial-analysis.engine';

interface AnalysisData {
  userId: string;
  month: string;
  emptyState: EmptyStateOutput;
  analysis?: FinancialAnalysisResult;
}

export const AnalysisClient = () => {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError('Vous devez être connecté pour voir l&apos;analyse');
          setLoading(false);
          return;
        }

        // Utiliser le mois courant par défaut
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const response = await fetch(`/api/analysis?month=${month}`);

        if (!response.ok) {
          throw new Error('Erreur lors du chargement de l&apos;analyse');
        }

        const analysisData = (await response.json()) as AnalysisData;
        setData(analysisData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <main className="bg-slate-50 text-slate-900 min-h-screen py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-600">Chargement de l&apos;analyse...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-slate-50 text-slate-900 min-h-screen py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-center py-20">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  // Si l'état est vide, afficher l'état vide
  if (data.emptyState.isEmpty) {
    return (
      <main className="bg-slate-50 text-slate-900 min-h-screen py-12">
        <div className="mx-auto max-w-5xl px-6">
          <AnalysisHeader
            title="Analyse mensuelle"
            period={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            statuses={['Lecture seule']}
          />
          <EmptyState reason={data.emptyState.emptyReason} />
        </div>
      </main>
    );
  }

  // Afficher l'analyse complète depuis l'engine
  if (!data.analysis) {
    return (
      <main className="bg-slate-50 text-slate-900 min-h-screen py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-600">Aucune analyse disponible</p>
          </div>
        </div>
      </main>
    );
  }

  const { summary, alerts, trends } = data.analysis;

  // Mapper les KPI depuis le résumé
  const kpiItems = [
    {
      title: 'Solde d&apos;ouverture',
      value: formatCurrency(summary.openingBalance),
      description: 'Snapshot garanti',
    },
    {
      title: 'Revenus',
      value: formatCurrency(summary.income),
      description: 'Total des revenus',
    },
    {
      title: 'Dépenses',
      value: formatCurrency(summary.expenses),
      description: 'Total des dépenses',
    },
    {
      title: 'Solde net',
      value: formatCurrency(summary.net),
      description: 'Revenus - Dépenses',
      accent: summary.net >= 0 ? ('positive' as const) : ('negative' as const),
    },
  ];

  // Mapper les alertes depuis l'engine
  const alertItems = alerts.map((alert) => ({
    domain: alert.type === 'NEGATIVE_NET' ? 'Solde' : 'Dépense',
    category: alert.category ?? 'Général',
    severity: alert.severity === 'CRITICAL' ? ('CRITICAL' as const) : ('WARNING' as const),
    ruleId: alert.id,
  }));

  // Mapper les tendances depuis l'engine
  const trendItems = trends.map((trend) => ({
    category: trend.category,
    variation: `${trend.percentChange >= 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%`,
    direction:
      trend.direction === 'INCREASING'
        ? ('up' as const)
        : trend.direction === 'DECREASING'
          ? ('down' as const)
          : ('stable' as const),
  }));

  return (
    <main className="bg-slate-50 text-slate-900 min-h-screen py-12">
      <div className="mx-auto max-w-5xl space-y-10 px-6">
        <AnalysisHeader
          title="Analyse mensuelle"
          period={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          statuses={['Lecture seule']}
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

        {alertItems.length > 0 && (
          <section aria-labelledby="alertes" className="space-y-6">
            <header>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Alertes avancées</p>
              <h2 id="alertes" className="mt-2 text-2xl font-semibold text-slate-900">
                Priorités observationnelles
              </h2>
            </header>
            <AlertsList alerts={alertItems} />
          </section>
        )}

        {trendItems.length > 0 && (
          <section aria-labelledby="tendances" className="space-y-6 pb-10">
            <header>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tendances</p>
              <h2 id="tendances" className="mt-2 text-2xl font-semibold text-slate-900">
                Directions observées
              </h2>
            </header>
            <TrendsList trends={trendItems} />
          </section>
        )}
      </div>
    </main>
  );
};

