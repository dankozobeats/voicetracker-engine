-- Table de liaison entre budgets et charges récurrentes
-- Version SAFE : peut être exécutée plusieurs fois sans erreur

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own budget-charge links" ON budget_recurring_charges;
DROP POLICY IF EXISTS "Users can create their own budget-charge links" ON budget_recurring_charges;
DROP POLICY IF EXISTS "Users can delete their own budget-charge links" ON budget_recurring_charges;

-- Supprimer la fonction trigger si elle existe
DROP FUNCTION IF EXISTS update_budget_recurring_charges_updated_at() CASCADE;

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS budget_recurring_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  recurring_charge_id UUID NOT NULL REFERENCES recurring_charges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Empêcher qu'une charge soit affectée plusieurs fois au même budget
  UNIQUE(budget_id, recurring_charge_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_budget_recurring_charges_budget ON budget_recurring_charges(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_recurring_charges_charge ON budget_recurring_charges(recurring_charge_id);

-- RLS (Row Level Security) pour sécuriser l'accès
ALTER TABLE budget_recurring_charges ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne peuvent voir que leurs propres liaisons
CREATE POLICY "Users can view their own budget-charge links"
  ON budget_recurring_charges
  FOR SELECT
  USING (
    budget_id IN (
      SELECT id FROM budgets WHERE user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent créer des liaisons pour leurs propres budgets
CREATE POLICY "Users can create their own budget-charge links"
  ON budget_recurring_charges
  FOR INSERT
  WITH CHECK (
    budget_id IN (
      SELECT id FROM budgets WHERE user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent supprimer leurs propres liaisons
CREATE POLICY "Users can delete their own budget-charge links"
  ON budget_recurring_charges
  FOR DELETE
  USING (
    budget_id IN (
      SELECT id FROM budgets WHERE user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_budget_recurring_charges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe puis le recréer
DROP TRIGGER IF EXISTS budget_recurring_charges_updated_at ON budget_recurring_charges;

CREATE TRIGGER budget_recurring_charges_updated_at
  BEFORE UPDATE ON budget_recurring_charges
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_recurring_charges_updated_at();
