import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET /api/budgets/[id]/charges - Récupérer toutes les charges récurrentes affectées à un budget
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

    // SECURITY: Verify budget ownership before returning charges
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single();

    if (budgetError || !budget) {
      return NextResponse.json({ error: 'Budget non trouvé ou accès non autorisé' }, { status: 404 });
    }

    // Récupérer les charges récurrentes liées à ce budget
    const { data: links, error: linksError } = await supabase
      .from('budget_recurring_charges')
      .select(
        `
        id,
        recurring_charge_id,
        recurring_charges (
          id,
          label,
          amount,
          account,
          type
        )
      `
      )
      .eq('budget_id', budgetId);

    if (linksError) {
      console.error('Error fetching budget charges:', linksError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des charges' }, { status: 500 });
    }

    // Formater les données
    const charges = links.map((link: any) => ({
      linkId: link.id,
      id: link.recurring_charges.id,
      label: link.recurring_charges.label,
      amount: link.recurring_charges.amount,
      account: link.recurring_charges.account,
      type: link.recurring_charges.type,
    }));

    return NextResponse.json({ charges });
  } catch (error) {
    console.error('Error in GET /api/budgets/[id]/charges:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/budgets/[id]/charges - Affecter une charge récurrente à un budget
export async function POST(
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
    const body = await request.json();
    const { recurringChargeId } = body;

    if (!recurringChargeId) {
      return NextResponse.json({ error: 'ID de charge récurrente requis' }, { status: 400 });
    }

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

    // Vérifier que la charge récurrente appartient à l'utilisateur
    const { data: charge, error: chargeError } = await supabase
      .from('recurring_charges')
      .select('id')
      .eq('id', recurringChargeId)
      .eq('user_id', user.id)
      .single();

    if (chargeError || !charge) {
      return NextResponse.json({ error: 'Charge récurrente non trouvée' }, { status: 404 });
    }

    // Créer la liaison
    const { data: link, error: linkError } = await supabase
      .from('budget_recurring_charges')
      .insert({
        budget_id: budgetId,
        recurring_charge_id: recurringChargeId,
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error creating budget-charge link:', linkError);
      if (linkError.code === '23505') {
        // Violation de contrainte unique
        return NextResponse.json({ error: 'Cette charge est déjà affectée à ce budget' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Erreur lors de la liaison' }, { status: 500 });
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/budgets/[id]/charges:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/budgets/[id]/charges - Retirer une charge récurrente d'un budget
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const recurringChargeId = searchParams.get('recurringChargeId');

    if (!recurringChargeId) {
      return NextResponse.json({ error: 'ID de charge récurrente requis' }, { status: 400 });
    }

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

    // Supprimer la liaison
    const { error: deleteError } = await supabase
      .from('budget_recurring_charges')
      .delete()
      .eq('budget_id', budgetId)
      .eq('recurring_charge_id', recurringChargeId);

    if (deleteError) {
      console.error('Error deleting budget-charge link:', deleteError);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/budgets/[id]/charges:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
