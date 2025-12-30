-- Migration: Ajouter le support de gestion des dettes
-- Ce script étend le système de charges récurrentes pour gérer les dettes avec projection

-- IMPORTANT: Exécutez ce script ligne par ligne ou par section dans Supabase SQL Editor

-- ========================================
-- ÉTAPE 1: Ajouter DEBT au type ENUM
-- ========================================
-- Note: Cette commande doit être exécutée seule et validée avant les autres
ALTER TYPE charge_purpose ADD VALUE IF NOT EXISTS 'DEBT';

-- ========================================
-- ÉTAPE 2: Ajouter les colonnes de dette
-- ========================================
-- Attendez que l'étape 1 soit validée, puis exécutez cette section

ALTER TABLE recurring_charges
ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(10, 2), -- Capital initial de la dette
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(10, 2), -- Capital restant à rembourser
ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5, 2), -- Taux d'intérêt annuel (ex: 5.5 pour 5.5%)
ADD COLUMN IF NOT EXISTS debt_start_date DATE; -- Date de début de la dette

-- ========================================
-- ÉTAPE 3: Ajouter les commentaires
-- ========================================

COMMENT ON COLUMN recurring_charges.initial_balance IS 'Capital initial emprunté (uniquement pour purpose=DEBT)';
COMMENT ON COLUMN recurring_charges.remaining_balance IS 'Capital restant à rembourser (uniquement pour purpose=DEBT)';
COMMENT ON COLUMN recurring_charges.interest_rate IS 'Taux d''intérêt annuel en pourcentage (ex: 5.5 pour 5.5%)';
COMMENT ON COLUMN recurring_charges.debt_start_date IS 'Date de début du prêt/dette';

-- ========================================
-- NOTE IMPORTANTE
-- ========================================
-- Les champs existants sont réutilisés ainsi:
-- - amount: mensualité (paiement mensuel)
-- - start_month: début des paiements (format YYYY-MM)
-- - end_month: fin prévue des paiements (optionnel, peut être calculé)
-- - excluded_months: mois où le paiement est suspendu
-- - monthly_overrides: paiements exceptionnels (remboursement anticipé partiel)
