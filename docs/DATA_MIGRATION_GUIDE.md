# Guide Complet: Migration des Données DEV → PROD

Ce guide vous accompagne dans la migration de vos données de développement vers la production Vercel.

---

## 📋 Vue d'Ensemble

**Situation actuelle:**
- **DEV Supabase** (`hrcpjgupucrgylnadnca`): Contient vos données (26 transactions, 12 budgets, etc.)
- **PROD Supabase** (`quobtzzvevtyoljyghbj`): Vide, prêt pour la production
- **Local**: Fonctionne avec DEV
- **Vercel**: Déployé mais pointe vers PROD (vide)

**Objectif:**
- Migrer toutes les données de DEV → PROD
- Déployer sur Vercel avec données complètes
- Maintenir le local sur DEV pour développement

---

## 🎯 Étapes de Migration

### PHASE 1: EXPORT DES DONNÉES (DEV)

**Temps estimé: 5 minutes**

1. **Ouvrir Supabase DEV**
   - URL: https://supabase.com/dashboard/project/hrcpjgupucrgylnadnca
   - SQL Editor → New Query

2. **Exécuter le script d'export**
   - Ouvrir: [scripts/export-dev-data.sql](../scripts/export-dev-data.sql)
   - Copier tout le contenu
   - Coller dans SQL Editor
   - Cliquer "Run"

3. **Sauvegarder les résultats**
   - Copier TOUS les résultats (7 sections)
   - Créer un fichier: `scripts/exported-data.sql`
   - Coller dedans
   - Sauvegarder

**Résultats attendus:**
```sql
-- Section 1: User info
User ID: caaa6960-38ef-4be9-a27b-15f60b0dcff0, Email: dankozobeats@gmail.com

-- Section 2: 26 INSERT INTO transactions...
INSERT INTO transactions (id, user_id, date, label, amount...) VALUES (...)...

-- Section 3: 12 INSERT INTO budgets...
INSERT INTO budgets (id, user_id, label, type...) VALUES (...)...

-- ... etc pour les 7 sections
```

---

### PHASE 2: CRÉER L'UTILISATEUR (PROD)

**Temps estimé: 2 minutes**

**Option A: Via Supabase Dashboard (RECOMMANDÉ)**

1. Ouvrir Supabase PROD
   - URL: https://supabase.com/dashboard/project/quobtzzvevtyoljyghbj
   - Authentication → Users → Add User

2. Créer l'utilisateur
   - Email: `dankozobeats@gmail.com`
   - Password: [choisir un mot de passe sécurisé]
   - ✅ Cocher "Auto Confirm User"
   - Cliquer "Create User"

3. Récupérer le nouveau UUID
   - Copier l'ID visible dans la liste des users
   - OU exécuter dans SQL Editor:
   ```sql
   SELECT id FROM auth.users WHERE email = 'dankozobeats@gmail.com';
   ```
   - **NOTER CE UUID!** Exemple: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Option B: Via l'App Vercel**

1. Aller sur votre URL Vercel
   - Exemple: `https://voicetracker.vercel.app/auth/register`

2. Créer un compte avec `dankozobeats@gmail.com`

3. Récupérer l'UUID dans Supabase Dashboard comme ci-dessus

---

### PHASE 3: REMPLACER LES USER_ID

**Temps estimé: 2 minutes**

1. **Ouvrir le fichier exporté**
   - Fichier: `scripts/exported-data.sql`

2. **Remplacer l'ancien user_id**

   **Dans VS Code (ou éditeur de texte):**
   - Cmd+F (Mac) ou Ctrl+F (Windows)
   - Chercher: `caaa6960-38ef-4be9-a27b-15f60b0dcff0`
   - Remplacer par: `[VOTRE_NOUVEAU_UUID_PROD]`
   - Remplacer tout (Replace All)

   **En ligne de commande:**
   ```bash
   cd scripts
   sed -i '' 's/caaa6960-38ef-4be9-a27b-15f60b0dcff0/NOUVEAU_UUID/g' exported-data.sql
   ```

3. **Vérifier le remplacement**
   - Chercher à nouveau l'ancien UUID
   - Résultat: "0 occurrences" ✅
   - Sauvegarder le fichier

---

### PHASE 4: IMPORT DES DONNÉES (PROD)

**Temps estimé: 5 minutes**

1. **Ouvrir Supabase PROD**
   - URL: https://supabase.com/dashboard/project/quobtzzvevtyoljyghbj
   - SQL Editor → New Query

2. **Importer dans l'ordre**

   **⚠️ IMPORTANT: Respecter cet ordre!**

   a. **Transactions** (26 records)
   ```sql
   -- Copier TOUS les INSERT INTO transactions... depuis exported-data.sql
   -- Coller dans SQL Editor
   -- Run
   ```

   b. **Budgets** (12 records)
   ```sql
   -- Copier TOUS les INSERT INTO budgets...
   -- Run
   ```

   c. **Recurring Charges** (28 records)
   ```sql
   -- Copier TOUS les INSERT INTO recurring_charges...
   -- Run
   ```

   d. **Debts** (3 records)
   ```sql
   -- Copier TOUS les INSERT INTO debts...
   -- Run
   ```

   e. **Budget-Recurring Charge Links**
   ```sql
   -- Copier TOUS les INSERT INTO budget_recurring_charges...
   -- Run
   ```

   f. **Ceiling Rules**
   ```sql
   -- Copier TOUS les INSERT INTO ceiling_rules...
   -- Run
   ```

   g. **Account Balances**
   ```sql
   -- Copier TOUS les INSERT INTO account_balances...
   -- Run
   ```

3. **En cas d'erreur**
   - Vérifier que le user_id a bien été remplacé partout
   - Vérifier qu'il n'y a pas de doublons (exécuter 1 seule fois)
   - Voir section "Rollback" dans [import-to-prod.sql](../scripts/import-to-prod.sql)

---

### PHASE 5: VÉRIFICATION

**Temps estimé: 3 minutes**

1. **Vérifier les counts**

   Dans SQL Editor PROD:
   ```sql
   SELECT
     'IMPORT SUMMARY' as info,
     (SELECT COUNT(*) FROM transactions WHERE user_id = 'VOTRE_UUID'::uuid) as transactions,
     (SELECT COUNT(*) FROM budgets WHERE user_id = 'VOTRE_UUID'::uuid) as budgets,
     (SELECT COUNT(*) FROM recurring_charges WHERE user_id = 'VOTRE_UUID'::uuid) as recurring_charges,
     (SELECT COUNT(*) FROM debts WHERE user_id = 'VOTRE_UUID'::uuid) as debts,
     (SELECT COUNT(*) FROM budget_recurring_charges) as budget_links,
     (SELECT COUNT(*) FROM ceiling_rules WHERE user_id = 'VOTRE_UUID'::uuid) as ceiling_rules,
     (SELECT COUNT(*) FROM account_balances WHERE user_id = 'VOTRE_UUID'::uuid) as account_balances;
   ```

   **Résultats attendus:**
   ```
   transactions: 26 ✅
   budgets: 12 ✅
   recurring_charges: 28 ✅
   debts: 3 ✅
   ```

2. **Vérifier quelques données**

   ```sql
   -- Voir les dernières transactions
   SELECT date, label, amount, category
   FROM transactions
   WHERE user_id = 'VOTRE_UUID'::uuid
   ORDER BY date DESC
   LIMIT 5;

   -- Voir les budgets
   SELECT label, type, amount, period
   FROM budgets
   WHERE user_id = 'VOTRE_UUID'::uuid;
   ```

3. **Tester l'isolation multi-tenant**

   - Créer un 2ème user de test: `test@example.com`
   - Vérifier qu'il ne voit AUCUNE donnée:
   ```sql
   SELECT COUNT(*) FROM transactions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
   -- Résultat attendu: 0 ✅
   ```

---

### PHASE 6: CONFIGURER VERCEL

**Temps estimé: 5 minutes**

1. **Vérifier les variables d'environnement Vercel**

   - Aller sur: https://vercel.com/dashboard
   - Projet: `voicetracker`
   - Settings → Environment Variables

2. **Variables requises (Production):**

   ```
   ✅ NEXT_PUBLIC_SUPABASE_URL = https://quobtzzvevtyoljyghbj.supabase.co
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = [votre_anon_key_PROD]
   ✅ SUPABASE_URL = https://quobtzzvevtyoljyghbj.supabase.co
   ✅ SUPABASE_ANON_KEY = [votre_anon_key_PROD]
   ✅ SUPABASE_SERVICE_ROLE_KEY = [votre_service_role_key_PROD]

   Optionnel:
   - GROQ_API_KEY
   - NEXT_PUBLIC_APP_URL = https://votre-url.vercel.app
   ```

3. **Ajouter les variables manquantes** (si nécessaire)

   Voir le guide détaillé: [FIX_VERCEL_ENV_VARS.md](FIX_VERCEL_ENV_VARS.md)

---

### PHASE 7: CONFIGURER SUPABASE AUTH (PROD)

**Temps estimé: 2 minutes**

⚠️ **CRITIQUE pour que le login/logout fonctionne en production!**

1. **Ouvrir Supabase PROD**
   - URL: https://supabase.com/dashboard/project/quobtzzvevtyoljyghbj
   - Authentication → URL Configuration

2. **Configurer les URLs**

   ```
   Site URL: https://votre-app.vercel.app

   Redirect URLs (ajouter ces 3):
   https://votre-app.vercel.app/**
   https://votre-app.vercel.app/auth/callback
   http://localhost:3000/** (pour dev local)
   ```

3. **Sauvegarder**

---

### PHASE 8: DÉPLOYER EN PRODUCTION

**Temps estimé: 3 minutes**

1. **Commit les changements locaux**

   ```bash
   git add .
   git commit -m "docs: add data migration scripts and guides"
   git push origin main
   ```

2. **Déployer sur Vercel**

   ```bash
   vercel --prod
   ```

3. **Attendre le build**
   - Le build devrait réussir maintenant ✅
   - Récupérer l'URL de production

---

### PHASE 9: TESTER LA PRODUCTION

**Temps estimé: 5 minutes**

1. **Ouvrir l'app en production**
   - URL: `https://votre-app.vercel.app`

2. **Tester l'authentification**
   - Se connecter avec: `dankozobeats@gmail.com`
   - Vérifier la redirection vers `/overview`
   - Vérifier que le profil s'affiche en haut à gauche

3. **Vérifier les données**
   - Dashboard → Voir les 26 transactions
   - Budgets → Voir les 12 budgets
   - Recurring Charges → Voir les 28 charges
   - Debts → Voir les 3 dettes

4. **Tester les opérations CRUD**
   - Créer une nouvelle transaction
   - Modifier un budget
   - Supprimer une charge récurrente (puis la recréer)

5. **Tester le logout**
   - Cliquer "Se déconnecter"
   - Vérifier la redirection vers `/auth/login`
   - Vérifier qu'on ne peut plus accéder aux pages protégées

6. **Tester le multi-tenant**
   - Se déconnecter
   - Créer un nouveau compte: `test@example.com`
   - Vérifier qu'il n'y a AUCUNE donnée visible
   - Créer 1 transaction test
   - Se déconnecter
   - Se reconnecter avec `dankozobeats@gmail.com`
   - Vérifier que les 26 transactions originales sont toujours là
   - La transaction du user test n'est PAS visible ✅

---

## ✅ Checklist Complète

### Avant la migration
- [ ] Backup des données DEV (export SQL)
- [ ] Projet PROD Supabase créé et configuré
- [ ] Variables d'environnement Vercel vérifiées

### Migration
- [ ] Export des données DEV exécuté
- [ ] Fichier `exported-data.sql` sauvegardé
- [ ] Utilisateur créé en PROD
- [ ] Nouveau UUID récupéré
- [ ] Ancien user_id remplacé dans tous les INSERT
- [ ] Données importées dans l'ordre correct
- [ ] Counts vérifiés (26 transactions, 12 budgets, etc.)

### Configuration
- [ ] URLs de redirection Supabase configurées
- [ ] Variables d'environnement Vercel complètes
- [ ] Code commité et pushé
- [ ] Déployé sur Vercel avec succès

### Tests
- [ ] Login/logout fonctionne
- [ ] Données visibles dans l'app
- [ ] Opérations CRUD fonctionnent
- [ ] Multi-tenant vérifié (2ème user ne voit rien)
- [ ] Aucune erreur dans la console browser
- [ ] Aucune erreur dans les logs Vercel

---

## 🆘 Troubleshooting

### Erreur: "User already exists"
**Solution:** L'utilisateur a déjà été créé. Récupérer son UUID et continuer à l'étape 3.

### Erreur: "duplicate key value violates unique constraint"
**Solution:** Les données ont déjà été importées. Soit:
- Vous avez exécuté 2 fois → OK, ignorer
- Rollback et réimporter (voir [import-to-prod.sql](../scripts/import-to-prod.sql))

### Erreur: "Failed to fetch" après login
**Solution:** URLs de redirection Supabase mal configurées
- Vérifier Authentication → URL Configuration
- Ajouter `https://votre-app.vercel.app/**`

### Les données ne s'affichent pas en production
**Solution:**
1. Vérifier les variables d'environnement Vercel pointent vers PROD
2. Vérifier que l'import a bien fonctionné (voir counts dans SQL)
3. Vérifier les logs Vercel pour erreurs

### Local ne fonctionne plus après migration
**Solution:** `.env.local` a été écrasé par Vercel CLI
- Restaurer avec les credentials DEV (voir [.env.local](.env.local) dans le repo)
- PROD = `quobtzzvevtyoljyghbj`
- DEV = `hrcpjgupucrgylnadnca`

---

## 📚 Ressources

- [Export Script](../scripts/export-dev-data.sql)
- [Import Script](../scripts/import-to-prod.sql)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Fix Vercel Env Vars](FIX_VERCEL_ENV_VARS.md)
- [Post-Deployment Checklist](POST_DEPLOYMENT_CHECKLIST.md)

---

## 🎉 Après la Migration Réussie

**Félicitations!** Votre application est maintenant:

✅ Déployée en production sur Vercel
✅ Avec toutes vos données migrées
✅ Multi-tenant sécurisé avec RLS
✅ Authentification fonctionnelle
✅ Prête pour de vrais utilisateurs

**Prochaines étapes recommandées:**

1. **Monitoring**: Configurer des alertes Vercel
2. **Backups**: Planifier des backups réguliers Supabase
3. **Analytics**: Ajouter Google Analytics ou équivalent
4. **SEO**: Configurer meta tags et sitemap
5. **Performance**: Activer Vercel Analytics

**Bon déploiement! 🚀**
