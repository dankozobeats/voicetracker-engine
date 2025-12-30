# Guide de Tests de Pénétration (Pentest)

## ⚠️ Avertissement Légal

Ces tests doivent UNIQUEMENT être effectués sur:
- ✅ Votre propre application
- ✅ Environnement de développement/staging
- ✅ Avec autorisation explicite si environnement partagé

❌ **JAMAIS** sur des systèmes tiers sans autorisation écrite.

## 📋 Vue d'Ensemble

Ce guide vous permet de tester la sécurité de VoiceTracker V2 en simulant des attaques réelles.

**Durée estimée:** 2-4 heures
**Niveau requis:** Intermédiaire

## 🎯 Objectifs

1. Identifier les vulnérabilités avant les attaquants
2. Valider les corrections de sécurité (Phase 1 & 2)
3. Obtenir un rapport de conformité
4. Améliorer la posture de sécurité

## 🛠️ Outils Requis

### Installation (macOS/Linux)

```bash
# 1. cURL (déjà installé)
which curl

# 2. SQLMap (détection SQL injection)
brew install sqlmap

# 3. OWASP ZAP (scanner de vulnérabilités)
brew install --cask owasp-zap

# 4. Burp Suite Community (proxy HTTP)
# Télécharger: https://portswigger.net/burp/communitydownload

# 5. gitleaks (scanner de secrets)
brew install gitleaks

# 6. nuclei (scanner de vulnérabilités)
brew install nuclei
```

---

## 🧪 Tests de Sécurité

### Test 1: Vérification des Headers de Sécurité

**Objectif:** Vérifier que les headers CSP, X-Frame-Options, etc. sont présents.

```bash
# Tester la page d'accueil
curl -I http://localhost:3000/

# Vérifier les headers attendus:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
# Referrer-Policy: strict-origin-when-cross-origin
```

**✅ Résultat Attendu:** Tous les headers de sécurité présents

**❌ Si échec:** Le middleware n'est pas actif. Vérifier `middleware.ts`.

---

### Test 2: Tentative d'Accès Cross-User (IDOR)

**Objectif:** Vérifier qu'un utilisateur ne peut pas accéder aux données d'un autre.

#### Étape 1: Créer 2 Utilisateurs

```bash
# User A
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user-a@test.com", "password":"Test1234!!"}'

# User B
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user-b@test.com", "password":"Test1234!!"}'
```

#### Étape 2: User A Crée une Transaction

```bash
# Se connecter en tant que User A
# Créer une transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION_COOKIE_USER_A>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-15",
    "label": "Test Transaction User A",
    "amount": 100,
    "category": "food",
    "account": "SG"
  }'

# Noter l'ID de la transaction: TRANSACTION_ID
```

#### Étape 3: User B Tente d'Accéder

```bash
# Se connecter en tant que User B
# Tenter d'accéder à la transaction de User A
curl -X GET http://localhost:3000/api/transactions/TRANSACTION_ID \
  -H "Cookie: <SESSION_COOKIE_USER_B>"
```

**✅ Résultat Attendu:** `404 Not Found` ou `403 Forbidden`

**❌ Si échec:** Vulnérabilité IDOR! Les RLS ne sont pas actives ou le filtrage user_id est manquant.

---

### Test 3: Injection SQL

**Objectif:** Vérifier l'absence de vulnérabilités SQL injection.

```bash
# Test basique: tenter d'injecter dans un paramètre
curl "http://localhost:3000/api/transactions?category=' OR '1'='1"

# Test avec SQLMap (plus avancé)
sqlmap -u "http://localhost:3000/api/transactions?category=food" \
  --cookie="<YOUR_SESSION_COOKIE>" \
  --level=3 \
  --risk=2 \
  --batch
```

**✅ Résultat Attendu:** Aucune injection détectée (Supabase SDK protège automatiquement)

**❌ Si échec:** Si SQLMap trouve une injection, NE PAS utiliser de raw SQL queries. Toujours passer par Supabase SDK.

---

### Test 4: Cross-Site Scripting (XSS)

**Objectif:** Vérifier que les inputs utilisateur sont bien échappés.

#### Test XSS Reflété

```bash
# Tenter d'injecter un script dans le label d'une transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION_COOKIE>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-15",
    "label": "<script>alert(\"XSS\")</script>",
    "amount": 100,
    "category": "food",
    "account": "SG"
  }'

# Récupérer la transaction
curl http://localhost:3000/api/transactions/<TRANSACTION_ID> \
  -H "Cookie: <SESSION_COOKIE>"
```

**✅ Résultat Attendu:** Le script est stocké tel quel (texte) mais JAMAIS exécuté dans le navigateur.

**Vérification dans le navigateur:**
1. Ouvrir la page de transactions
2. Inspecter le HTML (F12)
3. Le `<script>` doit être échappé en `&lt;script&gt;`

**❌ Si échec:** Si le script s'exécute, il y a une vulnérabilité XSS. Vérifier qu'aucun `dangerouslySetInnerHTML` n'est utilisé.

---

### Test 5: Rate Limiting

**Objectif:** Vérifier que le rate limiting fonctionne.

```bash
# Envoyer 25 requêtes rapides à l'endpoint /api/engine/projection
for i in {1..25}; do
  echo "Request $i"
  curl http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=12 \
    -H "Cookie: <SESSION_COOKIE>" \
    -w "\nStatus: %{http_code}\n"
done
```

**✅ Résultat Attendu:**
- Requêtes 1-20: `200 OK`
- Requêtes 21-25: `429 Too Many Requests`

**Vérifier les headers:**
```bash
curl -I http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=12 \
  -H "Cookie: <SESSION_COOKIE>"

# Devrait contenir:
# X-RateLimit-Limit: 20
# X-RateLimit-Remaining: 19 (ou moins)
# X-RateLimit-Reset: <secondes>
```

**❌ Si échec:** Le rate limiting n'est pas appliqué. Ajouter le code dans l'endpoint.

---

### Test 6: Broken Authentication

**Objectif:** Vérifier qu'on ne peut pas accéder aux endpoints sans authentification.

```bash
# Tenter d'accéder à /api/transactions SANS cookie de session
curl http://localhost:3000/api/transactions

# Tenter d'accéder à /api/budgets SANS authentification
curl http://localhost:3000/api/budgets
```

**✅ Résultat Attendu:** `401 Unauthorized` pour toutes les requêtes

**❌ Si échec:** L'endpoint ne vérifie pas l'authentification. Ajouter `await getAuthenticatedUser()`.

---

### Test 7: Sensitive Data Exposure

**Objectif:** Vérifier qu'aucune donnée sensible n'est exposée.

#### Test 7.1: Vérifier les Secrets dans Git

```bash
# Scanner le repo pour des secrets
gitleaks detect --source . --verbose

# Scanner l'historique complet
gitleaks detect --source . --log-opts="--all"
```

**✅ Résultat Attendu:** `No leaks found`

**❌ Si échec:** Des secrets ont été trouvés. Les retirer de Git et les mettre dans `.env.local`.

#### Test 7.2: Vérifier les Erreurs API

```bash
# Provoquer une erreur volontaire
curl -X POST http://localhost:3000/api/transactions \
  -H "Cookie: <SESSION_COOKIE>" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

**✅ Résultat Attendu:** Message d'erreur générique, SANS stack trace ni détails techniques

**❌ Si échec:** Si la stack trace est visible, cela expose des infos sensibles. Utiliser `jsonError()` sans détails.

---

### Test 8: Security Misconfiguration

**Objectif:** Vérifier que les configurations par défaut sont sécurisées.

#### Test 8.1: Fichiers Sensibles Accessibles

```bash
# Tenter d'accéder à .env
curl http://localhost:3000/.env

# Tenter d'accéder à .git
curl http://localhost:3000/.git/config

# Tenter d'accéder à package.json
curl http://localhost:3000/package.json
```

**✅ Résultat Attendu:** `404 Not Found` pour tous

**❌ Si échec:** Fichiers sensibles exposés. Vérifier la configuration Next.js et `.gitignore`.

#### Test 8.2: Headers HSTS (Production Only)

```bash
# En production, vérifier HSTS
curl -I https://votre-app-prod.com/

# Devrait contenir:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

### Test 9: Row Level Security (RLS) Bypass

**Objectif:** Vérifier que les RLS ne peuvent pas être contournées.

#### Test 9.1: Tenter d'Accéder à Toutes les Transactions (SQL Direct)

Dans Supabase SQL Editor (connecté en tant qu'utilisateur, PAS service role):

```sql
-- Devrait NE retourner QUE vos transactions
SELECT * FROM transactions;

-- Tenter de lire les transactions d'un autre user
SELECT * FROM transactions WHERE user_id != auth.uid();
-- Devrait retourner 0 rows

-- Tenter de modifier une transaction d'un autre user
UPDATE transactions
SET amount = 99999
WHERE user_id != auth.uid();
-- Devrait échouer (0 rows affected)
```

**✅ Résultat Attendu:** RLS bloque tout accès cross-user

**❌ Si échec:** RLS non actives. Exécuter les scripts `docs/security/rls-*.sql`.

---

### Test 10: Authorization Bypass

**Objectif:** Vérifier les vérifications d'appartenance dans les endpoints complexes.

```bash
# User A crée un budget
curl -X POST http://localhost:3000/api/budgets/manage \
  -H "Cookie: <SESSION_COOKIE_USER_A>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Budget User A",
    "type": "CATEGORY",
    "category": "food",
    "amount": 500,
    "period": "monthly"
  }'
# Noter l'ID: BUDGET_ID_A

# User B tente de lier une charge à ce budget
curl -X POST http://localhost:3000/api/budgets/BUDGET_ID_A/charges \
  -H "Cookie: <SESSION_COOKIE_USER_B>" \
  -H "Content-Type: application/json" \
  -d '{"recurringChargeId": "SOME_CHARGE_ID"}'
```

**✅ Résultat Attendu:** `404 Not Found` ou `403 Forbidden`

**❌ Si échec:** User B peut modifier le budget de User A. Ajouter vérification ownership.

---

## 📊 Scan Automatisé avec OWASP ZAP

### Configuration

1. Lancer ZAP: `open -a "ZAP"`
2. **Tools** → **Options** → **Authentication**
3. Configurer le cookie de session:
   - **Cookie Name:** `sb-<project>-auth-token`
   - **Cookie Value:** `<votre session>`

### Scan Automatisé

```bash
# Automated Scan (Quick)
zap-cli quick-scan http://localhost:3000

# Full Scan (Thorough - 30-60 min)
zap-cli active-scan http://localhost:3000

# Spider (crawl) l'application
zap-cli spider http://localhost:3000

# Baseline scan (plus rapide)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:3000
```

### Analyser le Rapport

ZAP génère un rapport HTML avec:
- 🔴 **High Risk**: À corriger immédiatement
- 🟠 **Medium Risk**: À planifier
- 🟡 **Low Risk**: Améliorations optionnelles
- 🔵 **Info**: Notes informatives

---

## 📝 Checklist Complète

### Authentication & Session Management
- [ ] Impossible d'accéder aux endpoints sans authentification
- [ ] Les sessions expirent après un délai raisonnable
- [ ] Logout invalide la session
- [ ] Pas de session fixation possible

### Authorization
- [ ] User A ne peut pas accéder aux données de User B (IDOR)
- [ ] Les RLS policies sont actives sur toutes les tables
- [ ] Les endpoints vérifient l'appartenance des ressources

### Injection
- [ ] Aucune SQL injection détectée (SQLMap)
- [ ] Aucune XSS reflétée ou stockée
- [ ] Les inputs sont validés et échappés

### Security Misconfiguration
- [ ] Headers de sécurité présents (CSP, X-Frame-Options, etc.)
- [ ] Fichiers sensibles non accessibles (.env, .git)
- [ ] HSTS activé en production
- [ ] Erreurs API ne révèlent pas de détails techniques

### Sensitive Data Exposure
- [ ] Aucun secret dans Git (gitleaks)
- [ ] Service role key sécurisée
- [ ] Pas de données sensibles dans les logs

### Rate Limiting
- [ ] Rate limiting actif sur endpoints coûteux
- [ ] Headers X-RateLimit-* présents
- [ ] 429 Too Many Requests après dépassement

### Security Logging
- [ ] Actions critiques loggées dans audit_logs
- [ ] Tentatives non autorisées loggées
- [ ] Rate limit hits loggués

---

## 🎯 Score de Sécurité Final

| Catégorie | Tests Passés | Score |
|-----------|--------------|-------|
| Authentication | /6 | /10 |
| Authorization | /5 | /10 |
| Injection | /3 | /10 |
| Security Misconfiguration | /4 | /10 |
| Sensitive Data Exposure | /3 | /10 |
| Rate Limiting | /3 | /10 |
| Security Logging | /2 | /10 |
| **TOTAL** | **/26** | **/10** |

**Formule:** `Score = (Tests Passés / 26) * 10`

---

## 🐛 Rapport de Bugs

Si vous trouvez une vulnérabilité:

1. **NE PAS** la divulguer publiquement
2. Documenter:
   - Étapes de reproduction
   - Impact potentiel
   - Capture d'écran/logs
3. Corriger immédiatement si critique
4. Ajouter un test de non-régression

---

## ✅ Résultat Attendu

Après tous les tests:
- ✅ Score ≥ 8/10 (toutes les vulnérabilités critiques corrigées)
- ✅ Rapport ZAP avec 0 risques High/Critical
- ✅ Aucun secret détecté par gitleaks
- ✅ RLS actives et fonctionnelles
- ✅ Rate limiting opérationnel

**Félicitations! Votre application est sécurisée et prête pour la production.** 🎉
