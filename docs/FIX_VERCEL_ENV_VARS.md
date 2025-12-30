# Fix: Variables d'Environnement Vercel

**Erreur:** `SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY must be defined on the server`

---

## 🐛 Problème

Le code serveur attend ces variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Mais Vercel a seulement:
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

**Il manque les versions sans `NEXT_PUBLIC_` pour le serveur!**

---

## ✅ Solution Rapide (Via Dashboard)

### 1. Aller sur Vercel Dashboard

**URL:** https://vercel.com/dankozobeats-projects/voicetracker/settings/environment-variables

Ou:
1. https://vercel.com/dashboard
2. Sélectionner `voicetracker`
3. Settings → Environment Variables

---

### 2. Ajouter les Variables Manquantes

**Cliquer sur "Add New"** et ajouter ces 2 variables:

#### Variable 1: SUPABASE_URL
```
Name: SUPABASE_URL
Value: [COPIER la même valeur que NEXT_PUBLIC_SUPABASE_URL]
Environment: Production
```

#### Variable 2: SUPABASE_ANON_KEY
```
Name: SUPABASE_ANON_KEY
Value: [COPIER la même valeur que NEXT_PUBLIC_SUPABASE_ANON_KEY]
Environment: Production
```

**Note:** `SUPABASE_SERVICE_ROLE_KEY` existe déjà ✅

---

### 3. Vérifier les Variables

**Vous devriez avoir 6 variables au total:**

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY

➕ SUPABASE_URL (nouvelle)
➕ SUPABASE_ANON_KEY (nouvelle)

Optionnel:
- GROQ_API_KEY
- NEXT_PUBLIC_APP_URL
- VERCEL_OIDC_TOKEN
```

---

### 4. Redéployer

```bash
vercel --prod
```

Le build devrait maintenant réussir!

---

## 🔧 Solution Alternative (Via CLI)

Si vous préférez le terminal:

```bash
# Vérifier votre URL Supabase actuelle
cat .env.local | grep NEXT_PUBLIC_SUPABASE_URL

# Ajouter SUPABASE_URL (copier la valeur ci-dessus)
vercel env add SUPABASE_URL production
# Coller: https://votre-projet.supabase.co

# Ajouter SUPABASE_ANON_KEY
vercel env add SUPABASE_ANON_KEY production
# Coller: votre-anon-key

# Redéployer
vercel --prod
```

---

## 📋 Pourquoi Cette Erreur?

**Explication:**

1. **Variables `NEXT_PUBLIC_*`** → Exposées côté client (navigateur)
2. **Variables sans préfixe** → Côté serveur uniquement (sécurisé)

**Votre code utilise les deux:**
- **Client** (`lib/supabase/client.ts`) → `process.env.NEXT_PUBLIC_SUPABASE_URL`
- **Serveur** (`lib/supabase/server.ts`) → `process.env.SUPABASE_URL`

**Solution:** Avoir les 2 versions de chaque variable!

---

## ✅ Checklist

- [ ] Aller sur Vercel Dashboard → Environment Variables
- [ ] Ajouter `SUPABASE_URL` (Production)
- [ ] Ajouter `SUPABASE_ANON_KEY` (Production)
- [ ] Sauvegarder
- [ ] Redéployer: `vercel --prod`
- [ ] Vérifier que le build réussit ✅

---

## 🚀 Après le Fix

Une fois les variables ajoutées et le redéploiement réussi:

1. **Configurer les URLs Supabase** (CRITIQUE!)
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `https://votre-url.vercel.app`
   - Redirect URLs: `https://votre-url.vercel.app/**`

2. **Vérifier les RLS Policies**
   - Exécuter les scripts SQL en production
   - Voir: `docs/security/rls-*.sql`

3. **Tester l'application**
   - Login/Logout
   - Créer un compte
   - Multi-tenant

**Bon déploiement! 🎉**
