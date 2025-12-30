# Variables d'Environnement Vercel - Configuration Complète

## 🚨 Erreur Actuelle

Le build échoue avec:
```
Error: NEXT_PUBLIC_APP_URL is required for the password reset flow
```

## ✅ Solution: Ajouter Toutes les Variables Manquantes

Aller sur: https://vercel.com/dashboard → Votre projet → Settings → Environment Variables

### Variables à Ajouter (Production)

**1. NEXT_PUBLIC_APP_URL** (MANQUANTE - cause de l'erreur)
```
Name: NEXT_PUBLIC_APP_URL
Value: https://votre-url-vercel.vercel.app
Environment: Production
```
> ⚠️ Remplacer par votre vraie URL Vercel!

**2. SUPABASE_URL** (serveur)
```
Name: SUPABASE_URL
Value: https://hrcpjgupucrgylnadnca.supabase.co
Environment: Production
```

**3. SUPABASE_ANON_KEY** (serveur)
```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyY3BqZ3VwdWNyZ3lsbmFkbmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzg4NjMsImV4cCI6MjA4MTcxNDg2M30.jZ1j-WhTlIiRWbm26zKA9ZZtUlUnJ4y4CHXIAbUmcu8
Environment: Production
```

**4. GROQ_API_KEY** (optionnel, mais recommandé)
```
Name: GROQ_API_KEY
Value: [votre_clé_groq_api]
Environment: Production
```

### Variables Déjà Présentes (Vérifier)

Ces variables devraient déjà exister:

✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://hrcpjgupucrgylnadnca.supabase.co`
✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (même valeur que ci-dessus)
✅ `SUPABASE_SERVICE_ROLE_KEY` = (clé service role)

---

## 📝 Liste Complète des Variables

Vous devriez avoir **7 variables** au total:

```
1. NEXT_PUBLIC_APP_URL              → https://votre-url.vercel.app
2. NEXT_PUBLIC_SUPABASE_URL         → https://hrcpjgupucrgylnadnca.supabase.co
3. NEXT_PUBLIC_SUPABASE_ANON_KEY    → eyJhbGci... (anon key)
4. SUPABASE_URL                     → https://hrcpjgupucrgylnadnca.supabase.co
5. SUPABASE_ANON_KEY                → eyJhbGci... (même que #3)
6. SUPABASE_SERVICE_ROLE_KEY        → eyJhbGci... (service role key)
7. GROQ_API_KEY                     → gsk_JWJ... (optionnel)
```

---

## 🎯 Comment Trouver Votre URL Vercel

### Méthode 1: Dans le Dashboard
1. Aller sur https://vercel.com/dashboard
2. Cliquer sur votre projet
3. En haut, vous verrez "Domains"
4. Copier l'URL (ex: `voicetracker-xyz123.vercel.app`)

### Méthode 2: Dans le Terminal
Après `vercel --prod`, l'URL s'affiche:
```
✓ Production: https://voicetracker-xyz123.vercel.app [1m]
```

---

## 🚀 Après Avoir Ajouté les Variables

1. **Redéployer:**
   ```bash
   vercel --prod
   ```

2. **Le build devrait réussir** ✅

3. **Configurer Supabase:**
   - Aller sur: https://supabase.com/dashboard/project/hrcpjgupucrgylnadnca
   - Authentication → URL Configuration
   - Site URL: `https://votre-url.vercel.app`
   - Redirect URLs: `https://votre-url.vercel.app/**`

---

## 🔧 Ajout Rapide via CLI (Alternative)

Si vous préférez le terminal:

```bash
# Récupérer votre URL Vercel
vercel --prod
# Noter l'URL affichée

# Ajouter NEXT_PUBLIC_APP_URL
vercel env add NEXT_PUBLIC_APP_URL production
# Quand demandé, coller: https://votre-url.vercel.app

# Ajouter SUPABASE_URL
vercel env add SUPABASE_URL production
# Coller: https://hrcpjgupucrgylnadnca.supabase.co

# Ajouter SUPABASE_ANON_KEY
vercel env add SUPABASE_ANON_KEY production
# Coller: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyY3BqZ3VwdWNyZ3lsbmFkbmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzg4NjMsImV4cCI6MjA4MTcxNDg2M30.jZ1j-WhTlIiRWbm26zKA9ZZtUlUnJ4y4CHXIAbUmcu8

# Ajouter GROQ_API_KEY
vercel env add GROQ_API_KEY production
# Coller: [votre_clé_groq_api]

# Redéployer
vercel --prod
```

---

## ⚠️ Pourquoi Ces 3 Variables Manquent?

Vercel a seulement les variables `NEXT_PUBLIC_*` (client-side) mais pas les versions serveur:

- ❌ Manque: `SUPABASE_URL` (serveur)
- ❌ Manque: `SUPABASE_ANON_KEY` (serveur)
- ❌ Manque: `NEXT_PUBLIC_APP_URL` (client + serveur)

Le code a besoin des DEUX versions:
- Client (`lib/supabase/client.ts`) → `NEXT_PUBLIC_*`
- Serveur (`lib/supabase/server.ts`) → Sans préfixe

---

## 📋 Checklist

- [ ] Trouver votre URL Vercel
- [ ] Ajouter `NEXT_PUBLIC_APP_URL`
- [ ] Ajouter `SUPABASE_URL`
- [ ] Ajouter `SUPABASE_ANON_KEY`
- [ ] Ajouter `GROQ_API_KEY` (optionnel)
- [ ] Vérifier que les 7 variables sont présentes
- [ ] Redéployer: `vercel --prod`
- [ ] Configurer les URLs Supabase
- [ ] Tester le login en production

---

**Une fois ces variables ajoutées, le build réussira! 🎉**
