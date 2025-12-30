-- ============================================
-- IMPORT DES DONNÉES VERS PRODUCTION
-- ============================================
-- À exécuter dans Supabase SQL Editor (Projet PROD: quobtzzvevtyoljyghbj)
--
-- Instructions:
-- 1. Créer d'abord le compte utilisateur en PROD
-- 2. Récupérer le nouveau user_id
-- 3. Remplacer l'ancien user_id dans les données exportées
-- 4. Exécuter les INSERT dans cet ordre
-- ============================================

-- ============================================
-- ÉTAPE 1: CRÉER LE COMPTE UTILISATEUR
-- ============================================
/*
IMPORTANT: Avant d'importer les données, créer le compte utilisateur via:

1. Aller sur: https://supabase.com/dashboard/project/quobtzzvevtyoljyghbj
2. Authentication → Users → Add User
3. Email: dankozobeats@gmail.com
4. Mot de passe: [choisir un mot de passe]
5. Confirmer automatiquement l'email (cocher "Auto Confirm User")
6. Cliquer "Create User"

OU via l'interface Voicetracker en production:
1. Aller sur votre URL Vercel (ex: https://voicetracker.vercel.app)
2. Créer un compte avec: dankozobeats@gmail.com
3. Confirmer l'email si nécessaire
*/


-- ============================================
-- ÉTAPE 2: RÉCUPÉRER LE NOUVEAU USER_ID
-- ============================================
-- Exécuter cette requête dans le SQL Editor PROD:

SELECT
  id as new_user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'dankozobeats@gmail.com';

-- NOTEZ CE UUID! Vous en aurez besoin pour l'étape suivante.
-- Exemple: a1b2c3d4-e5f6-7890-abcd-ef1234567890


-- ============================================
-- ÉTAPE 3: REMPLACER L'ANCIEN USER_ID
-- ============================================
/*
IMPORTANT: Avant d'exécuter les INSERT ci-dessous:

1. Copier tous les INSERT générés par export-dev-data.sql
2. Remplacer TOUS les anciens user_id par le nouveau:

   Ancien user_id (DEV): caaa6960-38ef-4be9-a27b-15f60b0dcff0
   Nouveau user_id (PROD): [COLLER ICI LE UUID DE L'ÉTAPE 2]

   Méthodes de remplacement:

   A) Dans un éditeur de texte (VS Code, etc.):
      - Chercher: 'caaa6960-38ef-4be9-a27b-15f60b0dcff0'
      - Remplacer par: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' (votre nouveau UUID)
      - Remplacer tout

   B) En ligne de commande:
      sed -i '' 's/caaa6960-38ef-4be9-a27b-15f60b0dcff0/NOUVEAU_USER_ID/g' export-data.sql

3. Une fois le remplacement fait, copier les INSERT modifiés ci-dessous
*/


-- ============================================
-- ÉTAPE 4: IMPORTER LES DONNÉES
-- ============================================
-- IMPORTANT: Exécuter les INSERT dans CET ORDRE exact!

-- 4.1 TRANSACTIONS (26 records)
-- ============================================
-- [COLLER ICI LES INSERT DE TRANSACTIONS avec le nouveau user_id]
-- Exemple:
-- INSERT INTO transactions (id, user_id, date, label, amount, category, account, type, created_at) VALUES
--   ('uuid1'::uuid, 'NOUVEAU_USER_ID'::uuid, '2024-12-01'::date, 'Transaction 1', 100.00, 'Food', 'Main', 'expense', '2024-12-01T10:00:00Z'::timestamptz);


-- 4.2 BUDGETS (12 records)
-- ============================================
-- [COLLER ICI LES INSERT DE BUDGETS avec le nouveau user_id]


-- 4.3 RECURRING CHARGES (28 records)
-- ============================================
-- [COLLER ICI LES INSERT DE RECURRING_CHARGES avec le nouveau user_id]


-- 4.4 DEBTS (3 records)
-- ============================================
-- [COLLER ICI LES INSERT DE DEBTS avec le nouveau user_id]


-- 4.5 BUDGET-RECURRING CHARGE LINKS
-- ============================================
-- [COLLER ICI LES INSERT DE BUDGET_RECURRING_CHARGES]
-- Note: Ces INSERT ne contiennent pas de user_id, juste des références aux budgets et charges


-- 4.6 CEILING RULES
-- ============================================
-- [COLLER ICI LES INSERT DE CEILING_RULES avec le nouveau user_id]


-- 4.7 ACCOUNT BALANCES
-- ============================================
-- [COLLER ICI LES INSERT DE ACCOUNT_BALANCES avec le nouveau user_id]


-- ============================================
-- ÉTAPE 5: VÉRIFICATION POST-IMPORT
-- ============================================

-- Vérifier le nombre de records importés:
SELECT
  'IMPORT SUMMARY' as info,
  (SELECT COUNT(*) FROM transactions WHERE user_id = 'NOUVEAU_USER_ID'::uuid) as transactions,
  (SELECT COUNT(*) FROM budgets WHERE user_id = 'NOUVEAU_USER_ID'::uuid) as budgets,
  (SELECT COUNT(*) FROM recurring_charges WHERE user_id = 'NOUVEAU_USER_ID'::uuid) as recurring_charges,
  (SELECT COUNT(*) FROM debts WHERE user_id = 'NOUVEAU_USER_ID'::uuid) as debts,
  (SELECT COUNT(*) FROM budget_recurring_charges) as budget_links,
  (SELECT COUNT(*) FROM ceiling_rules WHERE user_id = 'NOUVEAU_USER_ID'::uuid) as ceiling_rules,
  (SELECT COUNT(*) FROM account_balances WHERE user_id = 'NOUVEAU_USER_ID'::uuid) as account_balances;

-- Résultats attendus:
-- transactions: 26
-- budgets: 12
-- recurring_charges: 28
-- debts: 3
-- budget_links: (nombre de liens créés)
-- ceiling_rules: (nombre de règles)
-- account_balances: (nombre de balances)


-- Vérifier quelques transactions exemple:
SELECT
  date,
  label,
  amount,
  category,
  account,
  type
FROM transactions
WHERE user_id = 'NOUVEAU_USER_ID'::uuid
ORDER BY date DESC
LIMIT 5;


-- Vérifier les budgets:
SELECT
  label,
  type,
  amount,
  period,
  category
FROM budgets
WHERE user_id = 'NOUVEAU_USER_ID'::uuid
ORDER BY created_at;


-- Vérifier les recurring charges:
SELECT
  label,
  amount,
  frequency,
  start_date,
  category
FROM recurring_charges
WHERE user_id = 'NOUVEAU_USER_ID'::uuid
ORDER BY start_date;


-- ============================================
-- ÉTAPE 6: TESTER L'ISOLATION MULTI-TENANT
-- ============================================

-- Créer un 2ème utilisateur de test:
/*
Via Dashboard ou app:
- Email: test@example.com
- Password: TestPassword123
*/

-- Vérifier que le nouveau user ne voit AUCUNE donnée:
SELECT
  (SELECT COUNT(*) FROM transactions WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')) as test_user_transactions,
  (SELECT COUNT(*) FROM budgets WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')) as test_user_budgets;

-- Résultat attendu: 0, 0 (aucune donnée visible pour le user de test)


-- ============================================
-- NOTES IMPORTANTES
-- ============================================
/*
1. ✅ AVANT L'IMPORT:
   - Créer le compte user en PROD
   - Récupérer le nouveau user_id
   - Remplacer TOUS les anciens user_id dans les INSERT

2. ⚠️ ORDRE D'EXÉCUTION:
   - Respecter l'ordre ci-dessus (transactions → budgets → recurring_charges → debts → links)
   - Les liens budget_recurring_charges dépendent des budgets et charges existants

3. 🔒 SÉCURITÉ:
   - Les RLS policies sont déjà en place
   - Chaque user ne verra que ses propres données
   - Tester avec un 2ème compte pour vérifier l'isolation

4. 📊 VALIDATION:
   - Vérifier les counts correspondent aux nombres attendus
   - Tester quelques requêtes pour voir les données
   - Se connecter à l'app et vérifier que tout s'affiche correctement

5. 🚀 APRÈS L'IMPORT RÉUSSI:
   - Configurer les URLs de redirection Supabase (voir DEPLOYMENT_GUIDE.md)
   - Tester le login/logout en production
   - Vérifier que toutes les fonctionnalités marchent
*/


-- ============================================
-- ROLLBACK EN CAS DE PROBLÈME
-- ============================================
/*
Si quelque chose ne va pas, supprimer toutes les données importées:

-- ATTENTION: Cette commande supprime TOUTES les données de l'utilisateur!
DELETE FROM budget_recurring_charges
WHERE budget_id IN (SELECT id FROM budgets WHERE user_id = 'NOUVEAU_USER_ID'::uuid);

DELETE FROM account_balances WHERE user_id = 'NOUVEAU_USER_ID'::uuid;
DELETE FROM ceiling_rules WHERE user_id = 'NOUVEAU_USER_ID'::uuid;
DELETE FROM debts WHERE user_id = 'NOUVEAU_USER_ID'::uuid;
DELETE FROM recurring_charges WHERE user_id = 'NOUVEAU_USER_ID'::uuid;
DELETE FROM budgets WHERE user_id = 'NOUVEAU_USER_ID'::uuid;
DELETE FROM transactions WHERE user_id = 'NOUVEAU_USER_ID'::uuid;

-- Vérifier que tout est supprimé:
SELECT 'All data deleted' as status,
  (SELECT COUNT(*) FROM transactions WHERE user_id = 'NOUVEAU_USER_ID'::uuid) as remaining_transactions;
*/
