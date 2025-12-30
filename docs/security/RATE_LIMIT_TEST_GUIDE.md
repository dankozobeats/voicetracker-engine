# Guide de Test - Rate Limiting

## 🎯 Objectif

Tester le rate limiting sur l'endpoint `/api/engine/projection` pour vérifier:
1. ✅ Les requêtes normales passent sans problème
2. ✅ Le rate limit se déclenche après 20 requêtes/minute
3. ✅ Les messages d'erreur sont clairs
4. ✅ Le compteur se réinitialise après 60 secondes
5. ✅ L'application continue de fonctionner normalement

---

## 🚀 Test 1: Utilisation Normale (Manuel)

### Objectif
Vérifier qu'un utilisateur normal n'est PAS bloqué.

### Étapes

```bash
# 1. Démarrer l'application
npm run dev

# 2. Se connecter dans le navigateur
# Aller sur http://localhost:3000/auth/login
# Se connecter avec vos identifiants

# 3. Aller sur la page Overview
# http://localhost:3000/overview

# 4. Rafraîchir la page 5-10 fois
# Appuyer sur F5 plusieurs fois
```

**✅ Résultat Attendu:**
- La page se charge normalement à chaque fois
- Aucun message d'erreur "Rate limit exceeded"
- Les données s'affichent correctement

**❌ Si échec:**
- Vérifier les logs de la console (F12)
- Vérifier que la limite est bien 20/min et non 5/min

---

## 🧪 Test 2: Déclenchement du Rate Limit (cURL)

### Objectif
Vérifier que le rate limit se déclenche après 20 requêtes.

### Prérequis

```bash
# 1. Obtenir votre cookie de session
# Dans le navigateur, F12 → Application → Cookies → localhost:3000
# Copier la valeur de "sb-hrcpjgupucrgylnadnca-auth-token"
```

### Test avec cURL

```bash
# 2. Définir le cookie (remplacer XXX par votre vraie valeur)
COOKIE="sb-hrcpjgupucrgylnadnca-auth-token=XXX"

# 3. Envoyer 25 requêtes rapides
for i in {1..25}; do
  echo "=== Request $i ==="
  curl -s http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=12 \
    -H "Cookie: $COOKIE" \
    -w "\nHTTP Status: %{http_code}\n" \
    | head -20
  echo ""
done
```

**✅ Résultat Attendu:**

```
=== Request 1 ===
{"payload":{"months":[...]}}
HTTP Status: 200

=== Request 2 ===
{"payload":{"months":[...]}}
HTTP Status: 200

...

=== Request 20 ===
{"payload":{"months":[...]}}
HTTP Status: 200

=== Request 21 ===
{"error":"Rate limit exceeded","message":"Too many projection requests. Please try again in 59 seconds.","limit":20,"retryAfter":59}
HTTP Status: 429

=== Request 22 ===
{"error":"Rate limit exceeded","message":"Too many projection requests. Please try again in 58 seconds.","limit":20,"retryAfter":58}
HTTP Status: 429

...
```

**❌ Si échec:**
- Si toutes les requêtes passent: le rate limiter n'est pas actif
- Si bloqué avant 20: la limite est trop basse
- Si jamais bloqué: vérifier que le code est bien déployé

---

## ⏱️ Test 3: Réinitialisation du Compteur

### Objectif
Vérifier que le compteur se réinitialise après 60 secondes.

### Étapes

```bash
# 1. Déclencher le rate limit (20+ requêtes)
for i in {1..21}; do
  curl -s http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=12 \
    -H "Cookie: $COOKIE" > /dev/null
done

# 2. Vérifier qu'on est bloqué
curl http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=12 \
  -H "Cookie: $COOKIE"
# Devrait retourner 429

# 3. Attendre 60 secondes
echo "Attente de 60 secondes..."
sleep 60

# 4. Réessayer
curl http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=12 \
  -H "Cookie: $COOKIE"
# Devrait retourner 200
```

**✅ Résultat Attendu:**
- Après 60 secondes, la requête passe à nouveau (200 OK)
- Le compteur est réinitialisé

---

## 📊 Test 4: Vérification des Headers

### Objectif
Vérifier que les headers X-RateLimit ne sont pas présents (on ne les a pas ajoutés).

### Test

```bash
curl -I http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=12 \
  -H "Cookie: $COOKIE"
```

**Résultat:**
```
HTTP/1.1 200 OK
Content-Type: application/json
...
(Pas de X-RateLimit-Limit, X-RateLimit-Remaining)
```

**Note:** Nous n'avons PAS ajouté les headers pour simplifier. Ils peuvent être ajoutés plus tard si nécessaire.

---

## 🌐 Test 5: Test dans le Navigateur

### Objectif
Vérifier que l'interface utilisateur gère correctement l'erreur 429.

### Étapes

```bash
# 1. Ouvrir http://localhost:3000/overview dans le navigateur

# 2. Ouvrir la console (F12)

# 3. Dans la console, exécuter:
async function testRateLimit() {
  for (let i = 1; i <= 25; i++) {
    console.log(`Request ${i}...`);
    try {
      const res = await fetch('/api/engine/projection?account=SG&month=2025-01&months=12');
      const data = await res.json();

      if (res.status === 429) {
        console.error(`RATE LIMITED at request ${i}:`, data);
      } else {
        console.log(`Request ${i}: OK`);
      }
    } catch (err) {
      console.error(`Request ${i}: ERROR`, err);
    }
  }
}

testRateLimit();
```

**✅ Résultat Attendu:**
```
Request 1: OK
Request 2: OK
...
Request 20: OK
RATE LIMITED at request 21: {error: 'Rate limit exceeded', message: '...', ...}
RATE LIMITED at request 22: {error: 'Rate limit exceeded', message: '...', ...}
...
```

---

## 🐛 Test 6: Test de Fail-Open (Erreur du Rate Limiter)

### Objectif
Vérifier que si le rate limiter plante, l'application continue.

**Note:** Ce test est difficile à faire sans modifier le code. Pour le valider:

1. Le code a un `try-catch` autour du rate limiter
2. Si une erreur se produit, elle est loggée mais la requête continue
3. Cela garantit la disponibilité même en cas de bug

---

## 📋 Checklist de Validation

- [ ] Test 1: Utilisation normale → OK (pas de blocage inattendu)
- [ ] Test 2: Déclenchement après 20 requêtes → OK (bloqué à la 21ème)
- [ ] Test 3: Réinitialisation après 60s → OK (fonctionne à nouveau)
- [ ] Test 4: Headers → Pas de headers X-RateLimit (attendu)
- [ ] Test 5: Interface navigateur → Gère l'erreur 429
- [ ] Test 6: Fail-open → Code vérifié (try-catch présent)

---

## 🎯 Critères de Réussite

**✅ SUCCÈS** si:
- Utilisateurs normaux jamais bloqués
- Rate limit déclenché après exactement 20 requêtes
- Reset fonctionne après 60 secondes
- Messages d'erreur clairs et informatifs
- Application stable (pas de crash)

**⚠️ ATTENTION** si:
- Utilisateurs légitimes bloqués (limite trop basse?)
- Rate limit ne se déclenche jamais (pas actif?)
- Erreurs dans les logs

---

## 🚀 Prochaines Étapes

### Si Tous les Tests Passent:

1. **Monitorer en production pendant 24-48h**
   - Vérifier les logs pour des rate limits
   - S'assurer qu'aucun utilisateur légitime n'est bloqué

2. **Étendre à d'autres endpoints**
   - `/api/transactions` (POST) - RATE_LIMITS.API_WRITE (50/min)
   - `/api/budgets/manage` (POST/PUT/DELETE) - RATE_LIMITS.API_WRITE (50/min)

3. **Ajouter les headers X-RateLimit** (optionnel)
   ```typescript
   return addRateLimitHeaders(
     response,
     user.id,
     'api:projection',
     RATE_LIMITS.API_EXPENSIVE
   );
   ```

### Si Un Test Échoue:

1. **Vérifier les logs** de la console serveur
2. **Ajuster la limite** si nécessaire (20 trop bas/haut?)
3. **Déboguer** le rate limiter (lib/rate-limiter.ts)

---

## 💡 Conseils

- **En développement:** Les limites peuvent sembler strictes. C'est normal!
- **En production:** 20 req/min est généreux pour des projections financières
- **Monitoring:** Regarder les logs pour voir si des users légitimes sont bloqués
- **Ajustement:** Si nécessaire, augmenter à 30 ou 50/min

---

## ✅ Validation Finale

Une fois tous les tests passés, vous pouvez:
- ✅ Passer à l'implémentation de l'audit logging
- ✅ Étendre le rate limiting à d'autres endpoints
- ✅ Déployer en production avec confiance

**Bonne chance pour vos tests!** 🚀
