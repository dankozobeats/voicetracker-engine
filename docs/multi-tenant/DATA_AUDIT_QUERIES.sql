-- ============================================
-- DATA AUDIT QUERIES - Multi-Tenant Migration
-- ============================================
-- À exécuter dans Supabase SQL Editor pour comprendre l'état actuel de vos données
--
-- Instructions:
-- 1. Ouvrir Supabase Dashboard > SQL Editor
-- 2. Copier/coller chaque section
-- 3. Noter les résultats
-- ============================================

-- ============================================
-- 1. VÉRIFIER LES UTILISATEURS EXISTANTS
-- ============================================
-- Cette requête montre tous les utilisateurs authentifiés dans votre système

SELECT
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at;

-- QUESTION: Combien d'utilisateurs avez-vous?
-- RÉSULTAT ATTENDU: Probablement 1 ou 2 utilisateurs (vous + test)


-- ============================================
-- 2. VÉRIFIER LES DONNÉES TRANSACTIONS
-- ============================================
-- Cette requête montre si vos transactions ont un user_id et quelles valeurs

SELECT
  user_id,
  COUNT(*) as nombre_transactions,
  MIN(date) as premiere_transaction,
  MAX(date) as derniere_transaction
FROM transactions
GROUP BY user_id
ORDER BY nombre_transactions DESC;

-- QUESTION: Avez-vous un ou plusieurs user_id différents?
-- SCÉNARIO A: Un seul user_id -> toutes vos données appartiennent à un utilisateur
-- SCÉNARIO B: Plusieurs user_id -> vos données sont déjà réparties
-- SCÉNARIO C: Erreur "column user_id does not exist" -> la colonne n'existe pas


-- ============================================
-- 3. VÉRIFIER SI LES user_id CORRESPONDENT À AUTH.USERS
-- ============================================
-- Cette requête vérifie si les user_id dans transactions pointent vers de vrais utilisateurs

SELECT
  t.user_id,
  u.email,
  COUNT(*) as nombre_transactions
FROM transactions t
LEFT JOIN auth.users u ON t.user_id = u.id
GROUP BY t.user_id, u.email
ORDER BY nombre_transactions DESC;

-- RÉSULTAT:
-- - Si u.email est NULL -> user_id ne correspond à aucun utilisateur (PROBLÈME)
-- - Si u.email existe -> user_id valide (BON)


-- ============================================
-- 4. VÉRIFIER LES AUTRES TABLES PRINCIPALES
-- ============================================

-- 4a. BUDGETS
SELECT
  user_id,
  COUNT(*) as nombre_budgets,
  array_agg(DISTINCT type) as types_budgets
FROM budgets
GROUP BY user_id;

-- 4b. DEBTS
SELECT
  user_id,
  COUNT(*) as nombre_dettes
FROM debts
GROUP BY user_id;

-- 4c. RECURRING_CHARGES
SELECT
  user_id,
  COUNT(*) as nombre_charges_recurrentes
FROM recurring_charges
GROUP BY user_id;

-- 4d. CEILING_RULES
SELECT
  user_id,
  COUNT(*) as nombre_regles_plafond
FROM ceiling_rules
GROUP BY user_id;

-- 4e. ACCOUNT_BALANCES
SELECT
  user_id,
  account,
  COUNT(*) as nombre_balances
FROM account_balances
GROUP BY user_id, account;


-- ============================================
-- 5. RÉSUMÉ COMPLET PAR USER_ID
-- ============================================
-- Cette requête donne un aperçu global de toutes vos données par user_id

SELECT
  COALESCE(u.email, 'UTILISATEUR INCONNU') as utilisateur,
  t.user_id,
  (SELECT COUNT(*) FROM transactions WHERE user_id = t.user_id) as transactions,
  (SELECT COUNT(*) FROM budgets WHERE user_id = t.user_id) as budgets,
  (SELECT COUNT(*) FROM debts WHERE user_id = t.user_id) as debts,
  (SELECT COUNT(*) FROM recurring_charges WHERE user_id = t.user_id) as recurring_charges,
  (SELECT COUNT(*) FROM ceiling_rules WHERE user_id = t.user_id) as ceiling_rules,
  (SELECT COUNT(*) FROM account_balances WHERE user_id = t.user_id) as account_balances
FROM (SELECT DISTINCT user_id FROM transactions) t
LEFT JOIN auth.users u ON t.user_id = u.id
ORDER BY transactions DESC;


-- ============================================
-- 6. VÉRIFIER LES DONNÉES ORPHELINES
-- ============================================
-- Cette requête trouve les données dont le user_id ne correspond à aucun utilisateur réel

-- Transactions orphelines
SELECT COUNT(*) as transactions_orphelines
FROM transactions t
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = t.user_id
);

-- Budgets orphelins
SELECT COUNT(*) as budgets_orphelins
FROM budgets b
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = b.user_id
);

-- Debts orphelines
SELECT COUNT(*) as debts_orphelines
FROM debts d
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = d.user_id
);


-- ============================================
-- 7. IDENTIFIER L'UTILISATEUR PRINCIPAL
-- ============================================
-- Si vous avez plusieurs utilisateurs, cette requête trouve celui avec le plus de données

SELECT
  u.id,
  u.email,
  u.created_at,
  (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) as total_transactions
FROM auth.users u
ORDER BY total_transactions DESC
LIMIT 1;

-- RÉSULTAT: C'est probablement VOTRE compte principal


-- ============================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================

/*
SCÉNARIO 1: Toutes les données appartiennent à UN utilisateur existant
─────────────────────────────────────────────────────────────────────
Requête #5 montre:
- 1 seule ligne
- user_id correspond à votre email
- Toutes les colonnes ont des valeurs > 0

SOLUTION: Aucune migration nécessaire! Vos données sont déjà correctement attribuées.
          Vous pouvez passer directement au multi-tenant.


SCÉNARIO 2: Données réparties entre plusieurs utilisateurs
───────────────────────────────────────────────────────────
Requête #5 montre:
- Plusieurs lignes
- Chaque user_id correspond à un email valide

SOLUTION: Vérifier que chaque utilisateur voit bien SES données.
          Si oui, tout est OK pour le multi-tenant.


SCÉNARIO 3: Données orphelines (user_id ne correspond à personne)
──────────────────────────────────────────────────────────────────
Requête #3 montre:
- u.email est NULL
Requête #6 montre:
- Nombre > 0 pour transactions_orphelines

PROBLÈME: Vos données existent mais le user_id ne pointe vers aucun utilisateur!

SOLUTION: Créer un script de migration pour assigner ces données à votre compte.


SCÉNARIO 4: Colonne user_id n'existe pas
─────────────────────────────────────────
Erreur: "column user_id does not exist"

PROBLÈME: Vos tables n'ont jamais eu de user_id!

SOLUTION: Ajouter la colonne user_id et assigner toutes les données à votre compte.


SCÉNARIO 5: user_id existe mais est NULL partout
─────────────────────────────────────────────────
Requête #2 montre:
- user_id = NULL avec COUNT(*) > 0

PROBLÈME: La colonne existe mais n'est jamais remplie.

SOLUTION: Assigner toutes les données (user_id NULL) à votre compte principal.
*/


-- ============================================
-- PROCHAINES ÉTAPES SELON VOS RÉSULTATS
-- ============================================

/*
Après avoir exécuté ces requêtes, notez:

1. Nombre total d'utilisateurs dans auth.users: ______
2. Nombre de user_id distincts dans transactions: ______
3. Y a-t-il des données orphelines? OUI / NON
4. Votre email principal: ______
5. Votre user_id principal (UUID): ______

Avec ces informations, je pourrai créer un script de migration adapté à votre situation.
*/
