# Debug: Login Production Ne Fonctionne Pas

## 🔍 Diagnostic Étape par Étape

### Étape 1: Identifier le Type d'Erreur

Quand vous essayez de vous connecter, que se passe-t-il exactement?

**A) Erreur "Invalid login credentials"**
- → Le compte n'existe pas en production
- → Mauvais mot de passe

**B) Page blanche / "Failed to fetch"**
- → URLs de redirection Supabase mal configurées
- → Variables d'environnement incorrectes

**C) Redirection vers `/auth/login` après connexion**
- → Cookie/session ne se crée pas
- → Problème de CORS ou domaine

**D) Erreur 500 / Erreur serveur**
- → Variables d'environnement manquantes côté serveur
- → Problème de connexion Supabase

---

## ✅ Solution 1: Vérifier que le Compte Existe en Production

### Votre compte existe-t-il dans le bon projet Supabase?

1. **Ouvrir Supabase Dashboard DEV**
   - URL: https://supabase.com/dashboard/project/hrcpjgupucrgylnadnca
   - Authentication → Users
   - Chercher: `dankozobeats@gmail.com`

2. **Vérifier l'état du compte:**
   - ✅ Email confirmé?
   - ✅ Status: Active?

### Si le compte n'existe pas ou n'est pas confirmé:

**Option A: Créer le compte via Dashboard**
1. Authentication → Users → Add User
2. Email: `dankozobeats@gmail.com`
3. Password: [choisir un mot de passe]
4. ✅ **Cocher "Auto Confirm User"** (IMPORTANT!)
5. Create User

**Option B: Créer le compte via l'app**
1. Aller sur: `https://votre-url.vercel.app/auth/register`
2. S'enregistrer avec votre email
3. **IMPORTANT:** Vérifier votre boîte mail et confirmer l'email

---

## ✅ Solution 2: Configurer les URLs de Redirection Supabase

**C'est LA cause la plus fréquente du problème!**

### Configuration Requise:

1. **Ouvrir Supabase Dashboard DEV**
   - URL: https://supabase.com/dashboard/project/hrcpjgupucrgylnadnca
   - Authentication → URL Configuration

2. **Configurer ces valeurs:**

   ```
   Site URL:
   https://votre-url-vercel.vercel.app

   Redirect URLs (ajouter TOUTES ces lignes):
   https://votre-url-vercel.vercel.app/**
   https://votre-url-vercel.vercel.app/auth/callback
   https://votre-url-vercel.vercel.app/auth/confirm
   http://localhost:3000/**
   ```

3. **Cliquer "Save"**

### Comment trouver votre URL Vercel?

**Méthode 1: Dashboard Vercel**
- https://vercel.com/dashboard
- Cliquer sur votre projet
- L'URL est affichée en haut (sous "Domains")

**Méthode 2: Dernière ligne du build**
```
✓ Production: https://voicetracker-xyz123.vercel.app
```

---

## ✅ Solution 3: Vérifier les Variables d'Environnement Vercel

### Variables Requises:

Aller sur: https://vercel.com/dashboard → Projet → Settings → Environment Variables

**Vérifier que TOUTES ces variables existent pour Production:**

```
✅ NEXT_PUBLIC_APP_URL = https://votre-url.vercel.app
✅ NEXT_PUBLIC_SUPABASE_URL = https://hrcpjgupucrgylnadnca.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci... (votre clé)
✅ SUPABASE_URL = https://hrcpjgupucrgylnadnca.supabase.co
✅ SUPABASE_ANON_KEY = eyJhbGci... (même que ci-dessus)
✅ SUPABASE_SERVICE_ROLE_KEY = eyJhbGci... (service role)
```

### Si des variables manquent:

Ajouter chaque variable manquante:
- Click "Add New"
- Name: [nom de la variable]
- Value: [valeur]
- Environment: **Production** (cocher uniquement Production)
- Save

Puis **redéployer**:
```bash
vercel --prod
```

---

## ✅ Solution 4: Vérifier les Logs d'Erreur

### Dans le Navigateur:

1. Aller sur votre URL Vercel
2. Ouvrir la Console Développeur:
   - Chrome/Edge: F12 ou Cmd+Option+I (Mac)
   - Firefox: F12 ou Cmd+Option+K (Mac)
3. Onglet "Console"
4. Essayer de se connecter
5. **Noter les erreurs affichées**

### Erreurs Courantes:

**"Failed to fetch"**
- → URLs de redirection Supabase incorrectes
- → Fix: Solution 2 ci-dessus

**"Invalid login credentials"**
- → Compte n'existe pas / mauvais mot de passe
- → Fix: Solution 1 ci-dessus

**CORS error**
- → Domaine Vercel non autorisé dans Supabase
- → Fix: Solution 2 (ajouter l'URL dans Redirect URLs)

**"NEXT_PUBLIC_APP_URL is not defined"**
- → Variable manquante
- → Fix: Solution 3

---

## ✅ Solution 5: Vérifier les Logs Vercel

1. **Aller sur Vercel Dashboard**
   - https://vercel.com/dashboard
   - Cliquer sur votre projet
   - Onglet "Logs"

2. **Filtrer par "Errors"**

3. **Essayer de se connecter** et rafraîchir les logs

4. **Noter les erreurs côté serveur**

### Erreurs Côté Serveur Courantes:

**"SUPABASE_URL is not defined"**
- → Variable d'environnement manquante
- → Fix: Solution 3

**"User not found"**
- → Le compte n'existe pas dans ce projet Supabase
- → Fix: Solution 1

---

## 🔧 Procédure Complète de Fix

### 1. Trouver votre URL Vercel
```bash
# Dans le terminal:
vercel --prod
# Noter l'URL affichée: https://voicetracker-xyz123.vercel.app
```

### 2. Configurer Supabase
1. Aller: https://supabase.com/dashboard/project/hrcpjgupucrgylnadnca
2. Authentication → URL Configuration
3. Site URL: `https://voicetracker-xyz123.vercel.app`
4. Redirect URLs:
   ```
   https://voicetracker-xyz123.vercel.app/**
   http://localhost:3000/**
   ```
5. Save

### 3. Ajouter les Variables Vercel
1. Aller: https://vercel.com/dashboard
2. Projet → Settings → Environment Variables
3. Ajouter si manquantes:
   ```
   NEXT_PUBLIC_APP_URL = https://voicetracker-xyz123.vercel.app
   SUPABASE_URL = https://hrcpjgupucrgylnadnca.supabase.co
   SUPABASE_ANON_KEY = eyJhbGci... (copier depuis .env.local)
   ```

### 4. Créer/Vérifier le Compte
1. Supabase → Authentication → Users
2. Vérifier que `dankozobeats@gmail.com` existe
3. Si non, créer avec "Auto Confirm User" ✅

### 5. Redéployer
```bash
vercel --prod
```

### 6. Tester
1. Ouvrir: `https://voicetracker-xyz123.vercel.app`
2. Aller sur `/auth/login`
3. Se connecter avec: `dankozobeats@gmail.com`
4. Vérifier la redirection vers `/overview`

---

## 🆘 Si Rien Ne Fonctionne

### Test de Diagnostic:

Créez un nouveau compte directement en production:

1. Aller sur: `https://votre-url.vercel.app/auth/register`
2. Créer un compte avec: `test-prod@example.com`
3. Vérifier votre email et confirmer
4. Essayer de se connecter avec ce nouveau compte

**Si le nouveau compte fonctionne:**
- → Le problème est avec votre compte original
- → Vérifier qu'il existe dans le bon projet Supabase
- → Réinitialiser le mot de passe

**Si le nouveau compte ne fonctionne pas non plus:**
- → Le problème est dans la configuration
- → Vérifier Solutions 2 et 3 ci-dessus
- → Partager les erreurs de la console

---

## 📋 Checklist de Debug

- [ ] Compte existe dans Supabase DEV (hrcpjgupucrgylnadnca)
- [ ] Compte est confirmé (email vérifié)
- [ ] URL Vercel trouvée
- [ ] Site URL Supabase configuré
- [ ] Redirect URLs Supabase configurées (avec **)
- [ ] NEXT_PUBLIC_APP_URL ajouté à Vercel
- [ ] SUPABASE_URL ajouté à Vercel
- [ ] SUPABASE_ANON_KEY ajouté à Vercel
- [ ] Redéployé sur Vercel
- [ ] Console navigateur vérifiée (pas d'erreurs)
- [ ] Logs Vercel vérifiés (pas d'erreurs)
- [ ] Test avec nouveau compte

---

## 💬 Informations à Fournir

Si le problème persiste, donnez-moi:

1. **Votre URL Vercel complète**
2. **L'erreur exacte dans la console navigateur** (screenshot)
3. **L'erreur dans les logs Vercel** (si visible)
4. **Ce qui se passe quand vous cliquez "Login":**
   - Page blanche?
   - Message d'erreur?
   - Reste sur la page login?
   - Autre?

Je pourrai alors vous aider plus précisément!
