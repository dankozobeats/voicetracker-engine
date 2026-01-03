import { useQuery } from '@tanstack/react-query';
import type { MonthProjection } from '@/lib/types';

interface EnginePayload {
    months: MonthProjection[];
    alertTexts: Array<{
        severity: 'INFO' | 'WARNING' | 'CRITICAL';
        title: string;
        message: string;
    }>;
}

export type TimeRange = 3 | 6 | 12;

async function fetchProjection(account: string, months: TimeRange) {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const res = await fetch(`/api/engine/projection?account=${account}&month=${monthStr}&months=${months}`);
    if (!res.ok) {
        throw new Error('Erreur lors de la récupération des données');
    }
    const json = await res.json();
    return json.payload as EnginePayload;
}

export function useProjection(account: 'SG' | 'FLOA', months: TimeRange) {
    return useQuery({
        queryKey: ['projection', account, months],
        queryFn: () => fetchProjection(account, months),
        staleTime: 60 * 1000, // 1 minute stale time
        refetchOnWindowFocus: false, // Don't refetch just by clicking back on the tab to avoid engine spam
    });
}
