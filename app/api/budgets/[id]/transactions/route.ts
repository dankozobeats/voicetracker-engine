import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET /api/budgets/[id]/transactions - Récupérer toutes les transactions ponctuelles liées à un budget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: budgetId } = await params;

    // Récupérer le paramètre de mois optionnel (format YYYY-MM)
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    // Vérifier que le budget appartient à l'utilisateur
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single();

    if (budgetError || !budget) {
      return NextResponse.json({ error: 'Budget non trouvé' }, { status: 404 });
    }

    // Construire la requête de base
    let query = supabase
      .from('transactions')
      .select('id, label, amount, date, category, account, type')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id);

    // Filtrer par mois si le paramètre est fourni
    if (month) {
      // Calculer le début et la fin du mois
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0); // Dernier jour du mois

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      query = query.gte('date', start).lte('date', end);
    }

    // Exécuter la requête avec tri
    const { data: transactions, error: transactionsError } = await query.order('date', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching budget transactions:', transactionsError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des transactions' }, { status: 500 });
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error('Error in GET /api/budgets/[id]/transactions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
