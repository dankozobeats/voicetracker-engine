-- Migration: Créer une table dédiée pour les dettes
-- Cette table est complètement indépendante de recurring_charges

-- ========================================
-- ÉTAPE 1: Créer la table debts
-- ========================================

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations de base
  label TEXT NOT NULL,
  account TEXT NOT NULL CHECK (account IN ('SG', 'FLOA')),

  -- Informations financières
  monthly_payment NUMERIC(10, 2) NOT NULL CHECK (monthly_payment > 0),
  remaining_balance NUMERIC(10, 2) NOT NULL CHECK (remaining_balance >= 0),
  initial_balance NUMERIC(10, 2), -- Optionnel, pour calculer la progression
  interest_rate NUMERIC(5, 2) CHECK (interest_rate >= 0), -- Taux d'intérêt annuel en % (ex: 5.5)

  -- Dates et période
  debt_start_date DATE, -- Date de début du prêt
  start_month TEXT NOT NULL, -- YYYY-MM - Début des paiements
  end_month TEXT, -- YYYY-MM - Fin estimée des paiements (optionnel)

  -- Gestion avancée
  excluded_months TEXT[] DEFAULT '{}', -- Mois où le paiement est suspendu
  monthly_overrides JSONB DEFAULT '{}', -- Paiements exceptionnels {"2025-12": 500}

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ÉTAPE 2: Créer les index
-- ========================================

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_account ON debts(account);
CREATE INDEX IF NOT EXISTS idx_debts_start_month ON debts(start_month);

-- ========================================
-- ÉTAPE 3: Activer Row Level Security (RLS)
-- ========================================

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs ne peuvent voir que leurs propres dettes
CREATE POLICY "Users can view their own debts"
  ON debts FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres dettes
CREATE POLICY "Users can insert their own debts"
  ON debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres dettes
CREATE POLICY "Users can update their own debts"
  ON debts FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres dettes
CREATE POLICY "Users can delete their own debts"
  ON debts FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- ÉTAPE 4: Trigger pour updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_debts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER debts_updated_at_trigger
  BEFORE UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION update_debts_updated_at();

-- ========================================
-- ÉTAPE 5: Commentaires
-- ========================================

COMMENT ON TABLE debts IS 'Table dédiée pour le suivi des dettes et crédits à rembourser';
COMMENT ON COLUMN debts.label IS 'Nom de la dette (ex: Prêt auto, Crédit immo)';
COMMENT ON COLUMN debts.account IS 'Compte bancaire (SG ou FLOA)';
COMMENT ON COLUMN debts.monthly_payment IS 'Mensualité (paiement mensuel)';
COMMENT ON COLUMN debts.remaining_balance IS 'Capital restant à rembourser';
COMMENT ON COLUMN debts.initial_balance IS 'Capital initial emprunté (optionnel)';
COMMENT ON COLUMN debts.interest_rate IS 'Taux d''intérêt annuel en pourcentage (ex: 5.5 pour 5.5%)';
COMMENT ON COLUMN debts.debt_start_date IS 'Date de début du prêt/dette';
COMMENT ON COLUMN debts.start_month IS 'Mois de début des paiements (YYYY-MM)';
COMMENT ON COLUMN debts.end_month IS 'Mois de fin estimée des paiements (YYYY-MM, optionnel)';
COMMENT ON COLUMN debts.excluded_months IS 'Mois où le paiement est suspendu (array de YYYY-MM)';
COMMENT ON COLUMN debts.monthly_overrides IS 'Paiements exceptionnels pour certains mois (JSON: {"2025-12": 500})';
