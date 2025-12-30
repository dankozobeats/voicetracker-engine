# Scripts de Migration - DEV vers PROD

Ce dossier contient les scripts pour migrer vos données de développement vers production.

---

## 📁 Fichiers

### 1. `export-dev-data.sql`
**Usage:** Exporter les données depuis le projet Supabase DEV

**Où exécuter:** Supabase Dashboard DEV (hrcpjgupucrgylnadnca)
- https://supabase.com/dashboard/project/hrcpjgupucrgylnadnca
- SQL Editor → New Query → Copier/coller le script → Run

**Ce qu'il fait:**
- Génère des INSERT statements pour toutes vos données
- Transactions (26)
- Budgets (12)
- Recurring Charges (28)
- Debts (3)
- Budget-Recurring Charge Links
- Ceiling Rules
- Account Balances

**Résultat:**
- Copier tous les INSERT générés
- Sauvegarder dans: `scripts/exported-data.sql`

---

### 2. `import-to-prod.sql`
**Usage:** Guide d'import vers le projet Supabase PROD

**Où exécuter:** Supabase Dashboard PROD (quobtzzvevtyoljyghbj)
- https://supabase.com/dashboard/project/quobtzzvevtyoljyghbj
- SQL Editor → New Query

**Ce qu'il fait:**
- Instructions détaillées étape par étape
- Création du compte utilisateur
- Récupération du nouveau UUID
- Remplacement des user_id
- Import des données dans l'ordre
- Requêtes de vérification
- Commandes de rollback si nécessaire

**IMPORTANT:**
- Ne PAS copier/coller ce fichier tel quel
- Suivre les instructions dans le fichier
- Remplacer l'ancien user_id par le nouveau AVANT d'importer

---

### 3. `exported-data.sql` (À CRÉER)
**Usage:** Fichier temporaire contenant les données exportées

**Comment le créer:**
1. Exécuter `export-dev-data.sql` dans DEV
2. Copier TOUS les résultats
3. Créer ce fichier: `scripts/exported-data.sql`
4. Coller les résultats
5. Remplacer l'ancien user_id par le nouveau
6. Utiliser pour l'import en PROD

**⚠️ NE PAS COMMITER CE FICHIER** (contient vos données personnelles)

---

## 🚀 Procédure Complète

### Étape 1: Export (DEV)
```bash
# 1. Aller sur Supabase DEV
# 2. SQL Editor → New Query
# 3. Copier/coller export-dev-data.sql
# 4. Run
# 5. Copier TOUS les résultats
# 6. Créer scripts/exported-data.sql
# 7. Coller dedans
```

### Étape 2: Créer User (PROD)
```bash
# 1. Aller sur Supabase PROD
# 2. Authentication → Users → Add User
# 3. Email: dankozobeats@gmail.com
# 4. Cocher "Auto Confirm User"
# 5. Create User
# 6. Copier le nouveau UUID
```

### Étape 3: Remplacer UUID
```bash
# Dans VS Code:
# - Ouvrir scripts/exported-data.sql
# - Cmd+F (Mac) / Ctrl+F (Windows)
# - Chercher: caaa6960-38ef-4be9-a27b-15f60b0dcff0
# - Remplacer par: [NOUVEAU_UUID_PROD]
# - Replace All
# - Sauvegarder

# OU en ligne de commande:
cd scripts
sed -i '' 's/caaa6960-38ef-4be9-a27b-15f60b0dcff0/NOUVEAU_UUID/g' exported-data.sql
```

### Étape 4: Import (PROD)
```bash
# 1. Aller sur Supabase PROD
# 2. SQL Editor → New Query
# 3. Copier les INSERT de exported-data.sql (dans l'ordre!)
#    - Transactions
#    - Budgets
#    - Recurring Charges
#    - Debts
#    - Budget Links
#    - Ceiling Rules
#    - Account Balances
# 4. Run après chaque section
```

### Étape 5: Vérification (PROD)
```sql
-- Dans SQL Editor PROD:
SELECT
  'IMPORT SUMMARY' as info,
  (SELECT COUNT(*) FROM transactions WHERE user_id = 'NOUVEAU_UUID'::uuid) as transactions,
  (SELECT COUNT(*) FROM budgets WHERE user_id = 'NOUVEAU_UUID'::uuid) as budgets,
  (SELECT COUNT(*) FROM recurring_charges WHERE user_id = 'NOUVEAU_UUID'::uuid) as recurring_charges,
  (SELECT COUNT(*) FROM debts WHERE user_id = 'NOUVEAU_UUID'::uuid) as debts;

-- Résultats attendus:
-- transactions: 26 ✅
-- budgets: 12 ✅
-- recurring_charges: 28 ✅
-- debts: 3 ✅
```

---

## 📋 Ordre d'Import (CRITIQUE!)

**⚠️ IMPORTANT: Respecter cet ordre exact!**

1. **Transactions** (26 records) - Pas de dépendances
2. **Budgets** (12 records) - Pas de dépendances
3. **Recurring Charges** (28 records) - Pas de dépendances
4. **Debts** (3 records) - Pas de dépendances
5. **Budget-Recurring Charge Links** - Dépend de #2 et #3
6. **Ceiling Rules** - Pas de dépendances
7. **Account Balances** - Pas de dépendances

---

## ⚠️ Précautions

### Avant de commencer:
- [ ] Backup de la base DEV (juste au cas où)
- [ ] Vérifier que PROD est vide (ou accepter d'écraser)
- [ ] Noter l'ancien user_id DEV: `caaa6960-38ef-4be9-a27b-15f60b0dcff0`

### Pendant la migration:
- [ ] Ne PAS exécuter les INSERT plusieurs fois (doublons!)
- [ ] Vérifier que le remplacement UUID a fonctionné
- [ ] Importer dans l'ordre exact

### Après l'import:
- [ ] Vérifier les counts correspondent
- [ ] Tester quelques requêtes SELECT
- [ ] Créer un 2ème user de test pour vérifier l'isolation
- [ ] Supprimer `exported-data.sql` (données sensibles!)

---

## 🆘 En Cas d'Erreur

### Rollback complet (PROD)
```sql
-- ⚠️ DANGER: Supprime TOUTES les données de l'utilisateur!
DELETE FROM budget_recurring_charges
WHERE budget_id IN (SELECT id FROM budgets WHERE user_id = 'UUID'::uuid);

DELETE FROM account_balances WHERE user_id = 'UUID'::uuid;
DELETE FROM ceiling_rules WHERE user_id = 'UUID'::uuid;
DELETE FROM debts WHERE user_id = 'UUID'::uuid;
DELETE FROM recurring_charges WHERE user_id = 'UUID'::uuid;
DELETE FROM budgets WHERE user_id = 'UUID'::uuid;
DELETE FROM transactions WHERE user_id = 'UUID'::uuid;

-- Vérification:
SELECT COUNT(*) FROM transactions WHERE user_id = 'UUID'::uuid;
-- Résultat attendu: 0
```

Ensuite, recommencer l'import depuis l'étape 4.

---

## 📚 Documentation Complète

Pour le guide détaillé complet, voir:
- [DATA_MIGRATION_GUIDE.md](../docs/DATA_MIGRATION_GUIDE.md) - Guide étape par étape
- [import-to-prod.sql](import-to-prod.sql) - Toutes les instructions SQL
- [FIX_VERCEL_ENV_VARS.md](../docs/FIX_VERCEL_ENV_VARS.md) - Configuration Vercel
- [DEPLOYMENT_GUIDE.md](../docs/DEPLOYMENT_GUIDE.md) - Déploiement complet

---

## ✅ Checklist Rapide

- [ ] Export des données DEV
- [ ] Fichier `exported-data.sql` créé
- [ ] User créé en PROD
- [ ] Nouveau UUID récupéré
- [ ] UUID remplacé dans `exported-data.sql`
- [ ] Import des données (dans l'ordre!)
- [ ] Vérification des counts
- [ ] Test dans l'app PROD
- [ ] Suppression de `exported-data.sql`

---

**Bon courage pour la migration! 🚀**
