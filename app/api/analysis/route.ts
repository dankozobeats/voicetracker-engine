import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorized } from '@/lib/api/auth';
import { normalizeMonth } from '@/lib/api/validators';
import { getEngineProjection } from '@/lib/engine-service';

const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  try {
    const user = await getAuthenticatedUser();
    const month = normalizeMonth(searchParams.get('month'), 'month');

    // Call the production Engine for 12 months projection (for trends analysis)
    const payload = await getEngineProjection(user.id, 'SG', month, 12);

    // Check if we have data (at least one month with transactions)
    const isEmpty = payload.months.length === 0 || (payload.months[0].income === 0 && payload.months[0].expenses === 0);

    // Build a response compatible with AnalysisClient
    return NextResponse.json({
      userId: user.id,
      month,
      emptyState: {
        isEmpty,
        emptyReason: isEmpty ? 'NO_TRANSACTIONS' : undefined,
      },
      analysis: isEmpty
        ? undefined
        : {
            summary: {
              openingBalance: payload.months[0].openingBalance,
              income: payload.months[0].income,
              expenses: payload.months[0].expenses,
              net: payload.months[0].endingBalance - payload.months[0].openingBalance,
            },
            alerts: payload.alertTexts.map((alert) => ({
              id: alert.groupId,
              type: alert.severity === 'CRITICAL' ? 'NEGATIVE_NET' : 'HIGH_SPENDING',
              category: alert.title,
              severity: alert.severity,
              message: alert.message,
            })),
            trends: payload.trends,
          },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return unauthorized();
    }
    return jsonError((error as Error).message);
  }
}
