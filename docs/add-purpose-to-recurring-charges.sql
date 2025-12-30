-- Migration: Ajouter le champ 'purpose' aux charges récurrentes
-- Ce champ permet de catégoriser les charges comme épargne, provisions, etc.

-- Créer le type ENUM pour les différents usages possibles
CREATE TYPE charge_purpose AS ENUM (
  'REGULAR',    -- Charge normale (loyer, abonnements, etc.)
  'SAVINGS',    -- Épargne (Revolut, etc.)
  'EMERGENCY',  -- Provision pour imprévus
  'HEALTH'      -- Provision santé/médecin
);

-- Ajouter la colonne 'purpose' avec une valeur par défaut 'REGULAR'
ALTER TABLE recurring_charges
ADD COLUMN purpose charge_purpose NOT NULL DEFAULT 'REGULAR';

-- Créer un index pour améliorer les performances des requêtes filtrées par purpose
CREATE INDEX idx_recurring_charges_purpose ON recurring_charges(purpose);

-- Commentaires pour documentation
COMMENT ON COLUMN recurring_charges.purpose IS 'Type d''usage de la charge: REGULAR (normale), SAVINGS (épargne), EMERGENCY (imprévus), HEALTH (santé)';
