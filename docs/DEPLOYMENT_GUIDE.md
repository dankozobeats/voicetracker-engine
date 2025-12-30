# Guide de Déploiement Production - VoiceTracker V2

**Date:** 30 Décembre 2025
**Plateforme:** Vercel
**Framework:** Next.js 16.1.1

---

## 🚀 Étape 1: Installation et Configuration Vercel

### 1.1 Connexion à Vercel

```bash
# Se connecter à Vercel
vercel login
```

**Choisir votre méthode de connexion:**
- Email
- GitHub
- GitLab
- Bitbucket

**Recommandé:** Utiliser GitHub pour l'intégration automatique

---

### 1.2 Lier le Projet

```bash
# Dans le dossier du projet
cd ~/Projects/Voicetracker_V2

# Lier le projet à Vercel
vercel link
```

**Questions posées:**
```
? Set up and deploy "~/Projects/Voicetracker_V2"? [Y/n] y
? Which scope do you want to deploy to? [Your Account]
? Link to existing project? [y/N] n
? What's your project's name? voicetracker-v2
? In which directory is your code located? ./
```

---

## ⚙️ Étape 2: Configuration des Variables d'Environnement

### 2.1 Variables Requises

**Dans Vercel Dashboard → Settings → Environment Variables:**

```env
# Supabase (PRODUCTION)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-production
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-production
```

**IMPORTANT:** Utiliser les clés de PRODUCTION de Supabase, pas celles de développement!

---

### 2.2 Ajouter les Variables via CLI

```bash
# Ajouter les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Coller votre URL Supabase production

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Coller votre anon key production

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Coller votre service role key production
```

**Ou via Dashboard:**
1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet
3. Settings → Environment Variables
4. Add New → Name + Value + Environment (Production)

---

## 🗄️ Étape 3: Configuration Supabase Production

### 3.1 Créer un Projet Supabase Production

**Si pas déjà fait:**
1. Aller sur https://supabase.com/dashboard
2. New Project
3. Nom: `voicetracker-v2-prod`
4. Database Password: [générer un mot de passe fort]
5. Région: Choisir proche de vos utilisateurs (Europe/US)

---

### 3.2 Exécuter les Migrations SQL

**Dans Supabase SQL Editor (Production):**

**1. RLS Policies (Phase 1 - CRITIQUE):**
```bash
# Exécuter dans l'ordre:
docs/security/rls-transactions.sql
docs/security/rls-debts.sql
docs/security/rls-credits.sql
docs/security/rls-budget-recurring-charges.sql
```

**2. Audit Logs (Phase 2):**
```bash
docs/security/audit-logs-schema.sql
```

**3. Schéma des Tables:**
```bash
docs/supabase-budgets-schema.sql
# + Tous les autres schémas de tables
```

**Vérification:**
```sql
-- Vérifier que RLS est actif
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Devrait retourner toutes vos tables avec rowsecurity = true
```

---

### 3.3 Configurer l'URL de Redirection

**Supabase Dashboard → Authentication → URL Configuration:**

**Site URL:**
```
https://voicetracker-v2.vercel.app
# (ou votre domaine personnalisé)
```

**Redirect URLs:**
```
https://voicetracker-v2.vercel.app/**
http://localhost:3000/**  (pour développement)
```

---

## 🔧 Étape 4: Configuration Vercel

### 4.1 Créer `vercel.json` (Optionnel)

```bash
cat > vercel.json << 'EOF'
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  }
}
EOF
```

**Régions disponibles:**
- `iad1` - Washington, D.C., USA (East Coast)
- `cdg1` - Paris, France
- `sfo1` - San Francisco, USA (West Coast)
- `hnd1` - Tokyo, Japan

---

### 4.2 Fichier `.vercelignore`

```bash
cat > .vercelignore << 'EOF'
.next
node_modules
.env.local
.env
*.log
.git
docs/
*.md
EOF
```

---

## 🚀 Étape 5: Premier Déploiement

### 5.1 Déploiement Preview (Test)

```bash
# Déployer en preview (pas en production)
vercel
```

**Ce qui se passe:**
1. Build du projet
2. Upload sur Vercel
3. URL de preview générée (ex: `voicetracker-v2-abc123.vercel.app`)

**Tester la preview:**
- Ouvrir l'URL de preview
- Vérifier que l'app fonctionne
- Tester login/logout
- Créer un compte test

---

### 5.2 Déploiement Production

**Une fois la preview validée:**

```bash
# Déployer en production
vercel --prod
```

**URL de production:**
```
https://voicetracker-v2.vercel.app
# (ou votre domaine personnalisé)
```

---

## ✅ Étape 6: Vérifications Post-Déploiement

### 6.1 Checklist de Validation

**Sécurité:**
- [ ] HSTS header actif (https uniquement)
- [ ] CSP header présent
- [ ] RLS policies actives en production
- [ ] Service role key sécurisée (pas de leak)

**Authentification:**
- [ ] Connexion fonctionne
- [ ] Déconnexion fonctionne
- [ ] Inscription fonctionne
- [ ] Email de confirmation envoyé

**Fonctionnalités:**
- [ ] Transactions visibles
- [ ] Budgets accessibles
- [ ] Profil utilisateur fonctionne
- [ ] Multi-tenant vérifié (2 utilisateurs test)

**Performance:**
- [ ] Page load < 3 secondes
- [ ] Rate limiting actif
- [ ] Pas d'erreurs en console

---

### 6.2 Tester les Headers de Sécurité

```bash
# Tester les headers
curl -I https://voicetracker-v2.vercel.app/

# Devrait contenir:
# Strict-Transport-Security: max-age=31536000
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
```

---

### 6.3 Tester le Multi-Tenant

**Créer 2 utilisateurs test:**

1. **User A:**
   - Email: `test-a@votre-domaine.com`
   - Créer quelques transactions

2. **User B (fenêtre privée):**
   - Email: `test-b@votre-domaine.com`
   - Vérifier que l'app est vide
   - Vérifier qu'il ne voit PAS les données de User A

**Validation:**
- ✅ User A voit ses données
- ✅ User B voit ses données (différentes)
- ✅ Isolation complète

---

## 🔄 Étape 7: Déploiements Automatiques (GitHub)

### 7.1 Connecter GitHub à Vercel

**Via Dashboard Vercel:**
1. Settings → Git
2. Connect Git Repository
3. Sélectionner `dankozobeats/voicetracker-engine`
4. Autoriser Vercel

**Ou via CLI:**
```bash
vercel git connect
```

---

### 7.2 Configuration des Branches

**Production Branch:** `main`
- Chaque push sur `main` → Déploiement automatique en production

**Preview Branches:** Toutes les autres branches
- Chaque push → Déploiement preview automatique

**Pull Requests:**
- Chaque PR → Preview deployment avec commentaire automatique

---

## 📊 Étape 8: Monitoring et Logs

### 8.1 Vercel Analytics

**Activer dans Dashboard:**
1. Aller sur votre projet Vercel
2. Analytics → Enable

**Métriques disponibles:**
- Page views
- Top pages
- Unique visitors
- Geographic distribution
- Performance metrics

---

### 8.2 Logs en Temps Réel

```bash
# Voir les logs de production
vercel logs --prod

# Suivre les logs en temps réel
vercel logs --prod --follow
```

---

### 8.3 Supabase Logs

**Dashboard Supabase → Logs:**
- API Logs (requêtes)
- Auth Logs (connexions)
- Database Logs (queries)

**Activer les audit logs:**
- Déjà configuré via `audit_logs` table

---

## 🔐 Étape 9: Sécurité Production

### 9.1 Vérifier les Secrets

**S'assurer que:**
- [ ] `.env.local` dans `.gitignore`
- [ ] Service role key uniquement dans Vercel env vars
- [ ] Pas de secrets hardcodés dans le code
- [ ] Rotation des clés tous les 90 jours (optionnel)

```bash
# Vérifier qu'aucun secret n'est commité
git log --all --full-history -- "*.env*"
# Devrait être vide ou montrer que .env est dans .gitignore
```

---

### 9.2 Activer la Protection DDoS

**Vercel automatiquement:**
- Protection DDoS edge-level
- Rate limiting global (1000 req/10s par IP)
- Geo-blocking disponible (Pro plan)

**Votre rate limiting (app-level):**
- 20 req/min pour projections
- 50 req/min pour writes
- Déjà configuré ✅

---

## 🌐 Étape 10: Domaine Personnalisé (Optionnel)

### 10.1 Ajouter un Domaine

**Via Dashboard:**
1. Settings → Domains
2. Add Domain
3. Entrer votre domaine (ex: `voicetracker.com`)
4. Suivre les instructions DNS

**Configuration DNS:**
```
Type: CNAME
Name: @ (ou www)
Value: cname.vercel-dns.com
```

---

### 10.2 Mettre à Jour Supabase

**Supabase → Authentication → URL Configuration:**

**Remplacer:**
```
Site URL: https://voicetracker.com
Redirect URLs: https://voicetracker.com/**
```

---

## 🎉 Déploiement Terminé!

### Votre Application est Maintenant:

✅ **Déployée sur Vercel**
✅ **Sécurisée (HTTPS, HSTS, CSP)**
✅ **Multi-tenant fonctionnel**
✅ **Rate limiting actif**
✅ **Audit logging actif**
✅ **RLS policies en production**
✅ **Prête pour les utilisateurs réels**

---

## 📋 Commandes Utiles

```bash
# Déployer en preview
vercel

# Déployer en production
vercel --prod

# Voir les logs
vercel logs --prod

# Lister les déploiements
vercel ls

# Ouvrir le dashboard
vercel dashboard

# Voir les variables d'environnement
vercel env ls

# Rollback à un déploiement précédent
vercel rollback [deployment-url]
```

---

## 🆘 Troubleshooting

### Erreur: "Build Failed"

**Causes possibles:**
1. Variables d'environnement manquantes
2. Erreur TypeScript
3. Dépendances manquantes

**Solution:**
```bash
# Tester le build localement
npm run build

# Si ça fonctionne localement, vérifier les env vars sur Vercel
vercel env ls
```

---

### Erreur: "Database Connection Failed"

**Vérifier:**
1. URLs Supabase correctes dans Vercel env vars
2. RLS policies exécutées en production
3. Service role key correcte

**Test:**
```bash
# Vérifier la connexion Supabase
curl https://votre-projet.supabase.co/rest/v1/
```

---

### Erreur: "Unauthorized" après déploiement

**Cause:** URL de redirection Supabase pas configurée

**Solution:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Ajouter votre URL Vercel dans "Redirect URLs"
3. Sauvegarder

---

## 📞 Support

**Documentation:**
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production](https://supabase.com/docs/guides/platform/going-into-prod)

**Communauté:**
- [Vercel Discord](https://vercel.com/discord)
- [Supabase Discord](https://discord.supabase.com)

---

**Bon déploiement! 🚀**
