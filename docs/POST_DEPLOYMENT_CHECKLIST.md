# Post-Deployment Checklist - VoiceTracker V2

**Date:** 30 Décembre 2025
**URL de Production:** À compléter après déploiement

---

## ✅ Vérifications Immédiates (Après Déploiement)

### 1. Vérifier que le Déploiement est Réussi

- [ ] Build terminé avec succès (pas d'erreurs)
- [ ] URL de production accessible
- [ ] Page d'accueil charge correctement
- [ ] Pas d'erreurs JavaScript en console (F12)

---

### 2. Vérifier les Variables d'Environnement

**Variables téléchargées par Vercel:**
```
✅ NEXT_PUBLIC_APP_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ NEXT_PUBLIC_SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ GROQ_API_KEY
✅ VERCEL_OIDC_TOKEN
```

**Vérifications:**
- [ ] Les URLs Supabase pointent vers PRODUCTION (pas dev)
- [ ] Service role key est celle de production
- [ ] Pas de secrets exposés côté client

**Test rapide:**
```bash
# Ouvrir la console du navigateur (F12) sur votre site
# Taper:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
# Devrait afficher l'URL de production
```

---

### 3. Configuration Supabase

**À faire dans Supabase Dashboard (Production):**

#### 3.1 Configurer les URLs de Redirection

1. Aller sur: https://supabase.com/dashboard
2. Sélectionner votre projet PRODUCTION
3. Authentication → URL Configuration

**Site URL:**
```
https://voicetracker.vercel.app
# (ou votre URL Vercel)
```

**Redirect URLs (ajouter):**
```
https://voicetracker.vercel.app/**
https://*.vercel.app/**  (pour les previews)
http://localhost:3000/**  (pour dev local)
```

- [ ] Site URL configurée
- [ ] Redirect URLs ajoutées
- [ ] Sauvegardé

---

#### 3.2 Vérifier les RLS Policies

**Exécuter dans SQL Editor:**

```sql
-- Vérifier que RLS est actif
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Vérifier les policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Attendu:**
- [ ] RLS actif sur toutes les tables (rowsecurity = true)
- [ ] 25+ policies visibles
- [ ] Tables: transactions, budgets, debts, credits, recurring_charges, etc.

**Si RLS n'est pas actif:**
```bash
# Exécuter les scripts de migration:
docs/security/rls-transactions.sql
docs/security/rls-debts.sql
docs/security/rls-credits.sql
docs/security/rls-budget-recurring-charges.sql
docs/security/audit-logs-schema.sql
```

---

#### 3.3 Créer la Table Audit Logs (si pas encore fait)

**Exécuter:**
```sql
-- Voir docs/security/audit-logs-schema.sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);
```

- [ ] Table `audit_logs` créée
- [ ] Index créés
- [ ] RLS actif

---

## 🧪 Tests Fonctionnels

### 4. Test d'Authentification

#### 4.1 Inscription

1. **Ouvrir en navigation privée:** Votre URL de production
2. **Aller sur:** `/auth/register`
3. **S'inscrire avec:**
   - Email: `test-prod@example.com`
   - Mot de passe: `TestProd1234!!`

**Attendu:**
- [ ] Message de confirmation affiché
- [ ] Email de confirmation reçu (vérifier boîte mail)
- [ ] Lien de confirmation fonctionne
- [ ] Redirection vers `/overview` après confirmation

**Si pas d'email reçu:**
- Vérifier Supabase → Authentication → Email Templates
- Vérifier les logs Supabase

---

#### 4.2 Connexion

1. **Aller sur:** `/auth/login`
2. **Se connecter** avec le compte test créé
3. **Vérifier:**
   - [ ] Connexion réussie
   - [ ] Redirection vers `/overview`
   - [ ] Email affiché dans la sidebar
   - [ ] Pas d'erreurs en console

---

#### 4.3 Profil Utilisateur

1. **Cliquer sur votre email** dans la sidebar
2. **Vérifier page `/profile`:**
   - [ ] Email affiché correctement
   - [ ] User ID affiché
   - [ ] Date de création affichée
   - [ ] Statistiques à 0 (nouveau compte)

---

#### 4.4 Déconnexion

1. **Cliquer sur "Se déconnecter"**
2. **Vérifier:**
   - [ ] Message "Déconnexion..." affiché
   - [ ] Redirection vers `/auth/login`
   - [ ] Impossible d'accéder à `/overview` (redirige vers login)
   - [ ] Cookies de session supprimés

---

### 5. Test Multi-Tenant

#### 5.1 Créer un 2ème Utilisateur

**Fenêtre normale (User A):**
1. **Se connecter** avec `test-prod@example.com`
2. **Créer une transaction:**
   - Date: aujourd'hui
   - Label: "Test Transaction User A"
   - Montant: 100€
   - Catégorie: food
3. **Vérifier:** Transaction visible dans `/overview`

**Fenêtre privée (User B):**
1. **S'inscrire** avec `test-prod-2@example.com`
2. **Se connecter**
3. **Vérifier:**
   - [ ] App complètement vide (0 transactions)
   - [ ] Ne voit PAS la transaction de User A
   - [ ] Email "test-prod-2@example.com" affiché dans sidebar

**Créer une transaction (User B):**
- Label: "Test Transaction User B"
- Montant: 50€

**Validation finale:**
- [ ] User A voit 1 transaction (la sienne)
- [ ] User B voit 1 transaction (la sienne)
- [ ] Aucune fuite de données entre utilisateurs ✅

---

### 6. Test des Fonctionnalités

#### 6.1 Transactions

- [ ] Créer une transaction → Fonctionne
- [ ] Voir la liste → Fonctionne
- [ ] Filtrer par mois → Fonctionne
- [ ] Modifier une transaction → Fonctionne
- [ ] Supprimer une transaction → Fonctionne

---

#### 6.2 Budgets

- [ ] Créer un budget → Fonctionne
- [ ] Voir les budgets → Fonctionne
- [ ] Lier une charge récurrente → Fonctionne
- [ ] Voir les résultats → Fonctionne

---

#### 6.3 Projection de Solde

1. **Aller sur:** `/projection`
2. **Sélectionner un compte:** SG
3. **Vérifier:**
   - [ ] Graphique affiché
   - [ ] Projections calculées
   - [ ] Pas d'erreur 500

---

## 🔐 Tests de Sécurité

### 7. Vérifier les Headers de Sécurité

```bash
# Remplacer YOUR_URL par votre URL Vercel
curl -I https://YOUR_URL.vercel.app/
```

**Headers attendus:**
```
✅ strict-transport-security: max-age=31536000; includeSubDomains; preload
✅ x-frame-options: DENY
✅ x-content-type-options: nosniff
✅ referrer-policy: strict-origin-when-cross-origin
✅ content-security-policy: default-src 'self'; ...
✅ permissions-policy: camera=(), microphone=(), ...
```

**Test en ligne:**
- Aller sur: https://securityheaders.com
- Entrer votre URL
- **Score attendu:** A ou A+

- [ ] Tous les headers présents
- [ ] Score A/A+ sur securityheaders.com

---

### 8. Test Rate Limiting

**Test projection endpoint (limite: 20 req/min):**

```bash
# Remplacer YOUR_URL
for i in {1..25}; do
  echo "Request $i"
  curl -w "\nStatus: %{http_code}\n" \
    "https://YOUR_URL.vercel.app/api/engine/projection?account=SG&month=2025-01&months=12" \
    -H "Cookie: YOUR_SESSION_COOKIE"
  sleep 2
done
```

**Attendu:**
- [ ] Requêtes 1-20: Status 200
- [ ] Requêtes 21+: Status 429 (Rate limit exceeded)

---

### 9. Test RLS (Row Level Security)

**Via Supabase SQL Editor:**

```sql
-- Se connecter en tant que utilisateur authentifié (pas service role)
-- Via Supabase Dashboard → SQL Editor

-- Essayer de lire toutes les transactions
SELECT * FROM transactions;

-- Résultat: SEULEMENT vos transactions (RLS filtre automatiquement)
```

**Attendu:**
- [ ] Impossible de voir les transactions d'autres utilisateurs
- [ ] RLS bloque l'accès cross-user

---

## 📊 Monitoring

### 10. Vérifier les Logs

**Vercel Logs:**
```bash
vercel logs --prod --follow
```

**Supabase Logs:**
1. Aller sur Supabase Dashboard
2. Logs → Auth Logs
3. Vérifier les connexions/inscriptions

**Attendu:**
- [ ] Pas d'erreurs critiques
- [ ] Requêtes API réussies
- [ ] Auth events loggés

---

### 11. Activer Vercel Analytics (Optionnel)

1. Aller sur: https://vercel.com/dashboard
2. Sélectionner votre projet
3. Analytics → Enable

**Métriques disponibles:**
- Page views
- Unique visitors
- Performance (Web Vitals)
- Geographic distribution

- [ ] Analytics activé
- [ ] Premières métriques visibles

---

## 🎯 Performance

### 12. Test de Performance

**Lighthouse (Chrome DevTools):**
1. Ouvrir votre site en navigation privée
2. F12 → Lighthouse
3. Sélectionner "Performance" + "Best practices" + "SEO"
4. Cliquer "Generate report"

**Scores attendus:**
- [ ] Performance: > 80
- [ ] Best Practices: > 90
- [ ] SEO: > 80

**Si scores bas:**
- Vérifier la taille des images
- Vérifier le bundle JavaScript
- Activer la compression Vercel

---

### 13. Test de Charge (Optionnel)

```bash
# Installer Apache Bench (si pas déjà installé)
brew install httpd  # Mac
# ou
apt-get install apache2-utils  # Linux

# Test de charge (100 requêtes, 10 concurrentes)
ab -n 100 -c 10 https://YOUR_URL.vercel.app/
```

**Attendu:**
- [ ] Temps de réponse moyen < 500ms
- [ ] 0% de requêtes échouées
- [ ] Rate limiting déclenché si trop de requêtes

---

## 🚀 Go Live!

### 14. Checklist Finale avant Production

**Sécurité:**
- [ ] RLS actif sur toutes les tables ✅
- [ ] Headers de sécurité présents ✅
- [ ] Rate limiting fonctionnel ✅
- [ ] Audit logging actif ✅
- [ ] Pas de secrets exposés ✅

**Fonctionnalités:**
- [ ] Authentification complète ✅
- [ ] Multi-tenant vérifié ✅
- [ ] Toutes les pages fonctionnent ✅
- [ ] Profil utilisateur OK ✅

**Performance:**
- [ ] Page load < 3s ✅
- [ ] Lighthouse score > 80 ✅
- [ ] Pas d'erreurs en production ✅

**Monitoring:**
- [ ] Logs accessibles ✅
- [ ] Analytics activé ✅
- [ ] Alertes configurées (optionnel) ⚠️

---

## 🎉 Application en Production!

**Si tous les tests passent:**

✅ **Votre application est PRÊTE pour les utilisateurs réels!**

**Vous pouvez maintenant:**
1. Partager l'URL avec vos utilisateurs
2. Créer votre propre compte de production
3. Migrer vos données de développement (si nécessaire)
4. Configurer un domaine personnalisé (optionnel)

---

## 📞 En Cas de Problème

### Rollback (Revenir en Arrière)

```bash
# Lister les déploiements
vercel ls

# Rollback vers un déploiement précédent
vercel rollback [deployment-url]
```

### Redéployer

```bash
# Redéployer en production
vercel --prod
```

### Support

- [Vercel Support](https://vercel.com/support)
- [Supabase Support](https://supabase.com/support)
- [Next.js Docs](https://nextjs.org/docs)

---

**Bon lancement! 🚀**
