# Guide de Rotation de la Clé Service Role

## ⚠️ IMPORTANT: Pourquoi Faire Ceci?

Si votre clé service role a été exposée (commit Git, logs, etc.), vous **DEVEZ** la régénérer immédiatement. Cette clé donne un accès administrateur complet à votre base de données Supabase, en contournant toutes les politiques RLS.

## Étapes de Rotation

### 1. Générer une Nouvelle Clé dans Supabase

1. Connectez-vous à votre projet Supabase: https://app.supabase.com
2. Allez dans **Settings** → **API**
3. Section **Project API keys**
4. Trouvez la section **service_role (secret)**
5. Cliquez sur **Regenerate** à côté de la clé service role
6. ⚠️ **ATTENTION**: L'ancienne clé sera immédiatement révoquée!
7. Copiez la nouvelle clé générée

### 2. Mettre à Jour votre .env.local

```bash
# Ouvrez votre fichier .env.local
nano .env.local

# Remplacez la ligne:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... [ANCIENNE CLÉ]

# Par:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... [NOUVELLE CLÉ]

# Sauvegardez le fichier
```

### 3. Redémarrer votre Application

```bash
# Arrêter le serveur de développement (Ctrl+C)
# Puis relancer:
npm run dev
```

### 4. Mettre à Jour les Environnements de Production

Si vous déployez sur Vercel, Netlify, ou autre:

#### Vercel:
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Trouvez `SUPABASE_SERVICE_ROLE_KEY`
5. Cliquez sur **Edit** → Collez la nouvelle clé
6. **Re-deploy** votre application

#### Netlify:
1. Allez sur https://app.netlify.com
2. Sélectionnez votre site
3. **Site settings** → **Environment variables**
4. Modifiez `SUPABASE_SERVICE_ROLE_KEY`
5. **Re-deploy** le site

### 5. Vérifier que Tout Fonctionne

```bash
# Test local
curl http://localhost:3000/api/transactions

# Devrait retourner vos transactions (si authentifié)
# Pas d'erreur "Unauthorized" ou "Invalid API key"
```

## 🔒 Bonnes Pratiques pour l'Avenir

### Ne JAMAIS Commiter les Secrets

Vérifiez votre `.gitignore`:

```gitignore
# Fichiers d'environnement
.env
.env.local
.env*.local
.env.production.local

# Fichiers temporaires
*.log
*.tmp
```

### Vérifier Avant de Commit

```bash
# Avant chaque commit, vérifiez:
git status

# Si vous voyez .env.local, NE PAS L'AJOUTER!
# Si déjà ajouté par erreur:
git reset .env.local
```

### Utiliser des Variables d'Environnement Sécurisées

Pour la production:
- ✅ Vercel Environment Variables
- ✅ Netlify Environment Variables
- ✅ GitHub Secrets (pour CI/CD)
- ❌ Jamais hardcodé dans le code
- ❌ Jamais dans Git

### Scanner pour Secrets Exposés

Utilisez des outils comme:
- **git-secrets**: https://github.com/awslabs/git-secrets
- **gitleaks**: https://github.com/gitleaks/gitleaks
- **truffleHog**: https://github.com/trufflesecurity/trufflehog

Installation de gitleaks (recommandé):
```bash
# macOS
brew install gitleaks

# Scanner votre repo
gitleaks detect --source . --verbose

# Scanner l'historique Git complet
gitleaks detect --source . --log-opts="--all"
```

## 🚨 Si la Clé a Été Exposée Publiquement

Si votre clé a été commitée dans un repo public GitHub:

1. **Régénérer IMMÉDIATEMENT** (suivre les étapes ci-dessus)
2. **Vérifier les logs Supabase** pour des accès suspects:
   - Allez dans Supabase Dashboard → **Logs**
   - Regardez les requêtes récentes
   - Cherchez des patterns inhabituels
3. **Nettoyer l'historique Git** (avancé):
   ```bash
   # Utiliser BFG Repo-Cleaner
   brew install bfg
   bfg --replace-text <(echo 'SUPABASE_SERVICE_ROLE_KEY=***REMOVED***') --no-blob-protection
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```
4. **Informer GitHub** si le repo était public:
   - La clé peut être dans leur cache
   - Contacter le support si nécessaire

## Checklist Post-Rotation

- [ ] Nouvelle clé générée dans Supabase
- [ ] .env.local mis à jour localement
- [ ] Application locale testée et fonctionnelle
- [ ] Variables d'environnement mises à jour en production
- [ ] Application de production re-déployée
- [ ] Tests de santé effectués (API calls fonctionnent)
- [ ] .env.local bien dans .gitignore
- [ ] Ancienne clé révoquée (automatique lors de la régénération)
- [ ] Logs Supabase vérifiés pour accès suspects

## Questions Fréquentes

### Q: L'ancienne clé fonctionne-t-elle encore après régénération?
**R:** Non, elle est immédiatement révoquée. C'est pourquoi il faut mettre à jour tous les environnements rapidement.

### Q: Dois-je aussi changer l'Anon Key?
**R:** Non, l'anon key est intentionnellement publique. Seule la service role key est sensible.

### Q: Que se passe-t-il si j'oublie de mettre à jour la production?
**R:** Votre application en production cessera de fonctionner (erreurs 401/403). Les utilisateurs ne pourront plus accéder aux données.

### Q: À quelle fréquence dois-je faire tourner la clé?
**R:**
- Immédiatement si exposée
- Tous les 90 jours en prévention (bonne pratique)
- Lors de changements d'équipe (départ d'un développeur)

## Support

Si vous rencontrez des problèmes:
- Documentation Supabase: https://supabase.com/docs/guides/api
- Support Supabase: https://supabase.com/support
