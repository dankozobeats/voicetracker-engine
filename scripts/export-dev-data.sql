-- ============================================
-- EXPORT DES DONNÉES DE DÉVELOPPEMENT
-- ============================================
-- À exécuter dans Supabase SQL Editor (Projet DEV: hrcpjgupucrgylnadnca)
--
-- Instructions:
-- 1. Aller sur: https://supabase.com/dashboard/project/hrcpjgupucrgylnadnca
-- 2. SQL Editor → New Query
-- 3. Copier/coller cette requête
-- 4. Exécuter
-- 5. Copier les résultats (format INSERT)
-- ============================================

-- ============================================
-- 1. EXPORTER LES UTILISATEURS
-- ============================================
-- Note: Les utilisateurs sont dans auth.users, géré automatiquement
-- On exportera seulement l'ID pour référence

SELECT
  'User ID: ' || id || ', Email: ' || email as user_info
FROM auth.users
ORDER BY created_at;

-- Notez votre user_id pour l'étape suivante
-- Exemple: caaa6960-38ef-4be9-a27b-15f60b0dcff0


-- ============================================
-- 2. EXPORTER LES TRANSACTIONS
-- ============================================
SELECT
  'INSERT INTO transactions (id, user_id, date, label, amount, category, account, type, created_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  quote_literal(date::text) || '::date, ' ||
  quote_literal(label) || ', ' ||
  amount || ', ' ||
  quote_literal(category) || ', ' ||
  quote_literal(account) || ', ' ||
  quote_literal(type) || ', ' ||
  quote_literal(created_at::text) || '::timestamptz);'
FROM transactions
ORDER BY date;


-- ============================================
-- 3. EXPORTER LES BUDGETS
-- ============================================
SELECT
  'INSERT INTO budgets (id, user_id, label, type, amount, period, category, account, created_at, updated_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  quote_literal(label) || ', ' ||
  quote_literal(type) || ', ' ||
  amount || ', ' ||
  quote_literal(period) || ', ' ||
  COALESCE(quote_literal(category), 'NULL') || ', ' ||
  COALESCE(quote_literal(account), 'NULL') || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz);'
FROM budgets
ORDER BY created_at;


-- ============================================
-- 4. EXPORTER LES RECURRING CHARGES
-- ============================================
SELECT
  'INSERT INTO recurring_charges (id, user_id, label, amount, frequency, start_date, end_date, category, account, created_at, updated_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  quote_literal(label) || ', ' ||
  amount || ', ' ||
  quote_literal(frequency) || ', ' ||
  quote_literal(start_date::text) || '::date, ' ||
  COALESCE(quote_literal(end_date::text) || '::date', 'NULL') || ', ' ||
  COALESCE(quote_literal(category), 'NULL') || ', ' ||
  COALESCE(quote_literal(account), 'NULL') || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz);'
FROM recurring_charges
ORDER BY created_at;


-- ============================================
-- 5. EXPORTER LES DEBTS
-- ============================================
SELECT
  'INSERT INTO debts (id, user_id, label, amount, start_month, end_month, monthly_payment, created_at, updated_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  quote_literal(label) || ', ' ||
  amount || ', ' ||
  quote_literal(start_month) || ', ' ||
  quote_literal(end_month) || ', ' ||
  monthly_payment || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz);'
FROM debts
ORDER BY start_month;


-- ============================================
-- 6. EXPORTER LES BUDGET-CHARGE LINKS
-- ============================================
SELECT
  'INSERT INTO budget_recurring_charges (budget_id, recurring_charge_id) VALUES (' ||
  quote_literal(budget_id::text) || '::uuid, ' ||
  quote_literal(recurring_charge_id::text) || '::uuid);'
FROM budget_recurring_charges;


-- ============================================
-- 7. EXPORTER LES CEILING RULES
-- ============================================
SELECT
  'INSERT INTO ceiling_rules (id, user_id, label, category, threshold, created_at, updated_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  quote_literal(label) || ', ' ||
  quote_literal(category) || ', ' ||
  threshold || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz);'
FROM ceiling_rules
ORDER BY created_at;


-- ============================================
-- 8. EXPORTER LES ACCOUNT BALANCES
-- ============================================
SELECT
  'INSERT INTO account_balances (id, user_id, account, balance, month, created_at, updated_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  quote_literal(account) || ', ' ||
  balance || ', ' ||
  quote_literal(month) || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz);'
FROM account_balances
ORDER BY month, account;


-- ============================================
-- RÉSUMÉ DES DONNÉES À EXPORTER
-- ============================================
SELECT
  'SUMMARY' as info,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM budgets) as budgets,
  (SELECT COUNT(*) FROM recurring_charges) as recurring_charges,
  (SELECT COUNT(*) FROM debts) as debts,
  (SELECT COUNT(*) FROM budget_recurring_charges) as budget_links,
  (SELECT COUNT(*) FROM ceiling_rules) as ceiling_rules,
  (SELECT COUNT(*) FROM account_balances) as account_balances;


-- ============================================
-- NOTES IMPORTANTES
-- ============================================
/*
1. Copier tous les résultats INSERT INTO dans un fichier texte

2. Dans le fichier d'import, remplacer l'ancien user_id par le nouveau:

   Chercher: 'caaa6960-38ef-4be9-a27b-15f60b0dcff0'
   Remplacer par: 'NOUVEAU_USER_ID_PROD'

3. Avant d'importer en PROD, créer d'abord le compte utilisateur
   avec le MÊME email (dankozobeats@gmail.com)

4. Récupérer le nouveau user_id en PROD:
   SELECT id FROM auth.users WHERE email = 'dankozobeats@gmail.com';

5. Remplacer dans tous les INSERT statements

6. Exécuter dans PROD
*/
