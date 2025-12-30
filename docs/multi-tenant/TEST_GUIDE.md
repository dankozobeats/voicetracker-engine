# Guide de Test Multi-Tenant - VoiceTracker V2

**Date:** 30 Décembre 2025
**Serveur:** http://localhost:3000

---

## ✅ Test 1: Vérifier l'Interface Utilisateur Actuelle

### Étape 1.1: Regarder la Sidebar

**Ouvrir:** http://localhost:3000/overview

**Dans la sidebar (en bas), vous devriez voir:**

```
┌────────────────────────────────┐
│ [+] Ajouter une transaction    │
│ [+] Créer un budget           │
├────────────────────────────────┤
│ ┌─┐ dankozobeats@gmail.com    │
│ │@│ Voir le profil            │
│ └─┘                           │
├────────────────────────────────┤
│ [→] Se déconnecter            │
└────────────────────────────────┘
```

**Vérifications:**
- [ ] Mon email est affiché: `dankozobeats@gmail.com`
- [ ] Il y a un lien "Voir le profil"
- [ ] Il y a un bouton "Se déconnecter"

---

### Étape 1.2: Tester la Page de Profil

**Cliquer sur:** Votre email dans la sidebar

**URL attendue:** http://localhost:3000/profile

**Ce que vous devriez voir:**

#### Section 1: Informations du Compte
```
📧 Email
   dankozobeats@gmail.com

🗄️  User ID
   caaa6960-38ef-4be9-a27b-15f60b0dcff0

📅 Compte créé le
   22 décembre 2025
```

#### Section 2: Mes Statistiques
```
┌──────────────────┬──────────────────┐
│ 📄 26            │ 📈 12            │
│ Transactions     │ Budgets          │
├──────────────────┼──────────────────┤
│ 💳 3             │ 🔁 28            │
│ Dettes           │ Charges Récurr.  │
└──────────────────┴──────────────────┘
```

#### Section 3: Sécurité & Confidentialité
```
🔒 Sécurité & Confidentialité
• Vos données sont protégées par Row Level Security (RLS)
• Aucun autre utilisateur ne peut accéder à vos informations
• Toutes les actions sont auditées et traçables
• Connexions sécurisées avec authentification Supabase
```

#### Section 4: Mode Multi-Utilisateur
```
✨ Mode Multi-Utilisateur
Cette application supporte plusieurs utilisateurs...
```

**Vérifications:**
- [ ] Email correct affiché
- [ ] User ID affiché
- [ ] Statistiques correctes (26 transactions, 12 budgets, 3 dettes, 28 charges)
- [ ] Sections de sécurité et multi-tenant affichées

---

### Étape 1.3: Tester la Déconnexion

**Cliquer sur:** "Se déconnecter" dans la sidebar

**Ce qui devrait se passer:**
1. Bouton affiche "Déconnexion..." pendant ~1 seconde
2. Redirection automatique vers `/auth/login`
3. Vous êtes déconnecté

**Vérifications:**
- [ ] État de chargement visible ("Déconnexion...")
- [ ] Redirection vers la page de login
- [ ] Plus d'accès aux pages protégées

**Tester l'accès:**
- Essayer d'aller sur http://localhost:3000/overview
- **Résultat attendu:** Redirection automatique vers `/auth/login`

---

## 🧪 Test 2: Créer un 2ème Utilisateur (Multi-Tenant)

### Étape 2.1: Se Reconnecter (User A)

**Aller sur:** http://localhost:3000/auth/login

**Se connecter avec:**
- Email: `dankozobeats@gmail.com`
- Mot de passe: Votre mot de passe

**Vérifications:**
- [ ] Connexion réussie
- [ ] Redirection vers `/overview`
- [ ] Toutes vos données sont toujours là (26 transactions)
- [ ] Email affiché dans la sidebar

---

### Étape 2.2: Ouvrir une Fenêtre Privée (User B)

**Mac:**
- Chrome: `Cmd + Shift + N`
- Firefox: `Cmd + Shift + P`
- Safari: `Cmd + Shift + N`

**Windows:**
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Edge: `Ctrl + Shift + N`

**Dans la fenêtre privée, aller sur:**
http://localhost:3000/auth/register

---

### Étape 2.3: Créer un Nouveau Compte

**Remplir le formulaire:**
- Email: `test@example.com`
- Mot de passe: `Test1234!!`
- Confirmer le mot de passe: `Test1234!!`

**Cliquer sur:** "Register" ou "Create account"

**Ce qui devrait se passer:**
- Message: "We will send a confirmation email..."
- Vous recevez un email de confirmation

**PROBLÈME:** Email de confirmation requis?

**Solution rapide (Développement):**

1. **Option A: Désactiver la confirmation email dans Supabase**
   - Aller sur: https://supabase.com/dashboard
   - Sélectionner votre projet
   - Authentication → Settings → Email Auth
   - **Décocher:** "Confirm email"
   - Réessayer de créer le compte

2. **Option B: Confirmer manuellement dans Supabase**
   - Aller sur: Supabase Dashboard → Authentication → Users
   - Trouver `test@example.com`
   - Vérifier que le statut est "Confirmed" ou cliquer sur "Confirm user"

**Après confirmation, se connecter:**
- Email: `test@example.com`
- Mot de passe: `Test1234!!`

---

### Étape 2.4: Vérifier l'Isolation des Données (User B)

**Dans la fenêtre privée (User B):**

**Aller sur:** http://localhost:3000/overview

**Ce que vous devriez voir:**
```
┌────────────────────────────────┐
│ Vue Financière                 │
├────────────────────────────────┤
│ Aucune transaction             │
│                                │
│ [Vide]                         │
└────────────────────────────────┘
```

**Sidebar (User B):**
```
┌────────────────────────────────┐
│ ┌─┐ test@example.com           │
│ │@│ Voir le profil            │
│ └─┘                           │
├────────────────────────────────┤
│ [→] Se déconnecter            │
└────────────────────────────────┘
```

**Vérifications:**
- [ ] Email affiché: `test@example.com` (PAS `dankozobeats@gmail.com`)
- [ ] 0 transactions visibles
- [ ] Aucune donnée de User A visible

**Aller sur le profil de User B:**
http://localhost:3000/profile

**Statistiques attendues:**
```
📄 0 Transactions
📈 0 Budgets
💳 0 Dettes
🔁 0 Charges Récurrentes
```

**Vérifications:**
- [ ] Toutes les statistiques à 0 (nouveau compte)
- [ ] Email correct: `test@example.com`

---

### Étape 2.5: Créer une Transaction (User B)

**Dans la fenêtre privée (User B):**

**Cliquer sur:** "Ajouter une transaction" dans la sidebar

**Remplir le formulaire:**
- Date: `2025-12-30`
- Label: `Test Transaction User B`
- Montant: `50`
- Catégorie: `food`
- Compte: `SG`

**Sauvegarder**

**Vérifications:**
- [ ] Transaction créée avec succès
- [ ] Transaction visible dans `/overview` (User B)
- [ ] Compteur de transactions: 1

---

### Étape 2.6: Vérifier l'Isolation (Retour User A)

**Dans la fenêtre normale (User A - vous):**

**Rafraîchir la page:** http://localhost:3000/overview

**Ce que vous devriez voir:**
```
Transactions: 26 (toujours les vôtres)

Aucune trace de:
- test@example.com
- "Test Transaction User B"
```

**Aller sur votre profil:** http://localhost:3000/profile

**Statistiques attendues (User A):**
```
📄 26 Transactions (inchangé)
📈 12 Budgets (inchangé)
💳 3 Dettes (inchangé)
🔁 28 Charges Récurrentes (inchangé)
```

**Vérifications:**
- [ ] Vos données n'ont PAS changé
- [ ] Aucune donnée de User B visible
- [ ] Isolation complète confirmée! ✅

---

## 🎯 Test 3: Vérification Base de Données

### Étape 3.1: Vérifier dans Supabase

**Aller sur:** Supabase Dashboard → Table Editor → `transactions`

**Filtrer par user_id:**

**User A (vous):**
```sql
user_id = caaa6960-38ef-4be9-a27b-15f60b0dcff0
```
**Résultat:** 26 transactions (vos données originales)

**User B (test):**
```sql
user_id = <UUID_DE_TEST@EXAMPLE.COM>
```
**Résultat:** 1 transaction ("Test Transaction User B")

**Vérifications:**
- [ ] Chaque transaction a un `user_id` différent
- [ ] Les données sont bien séparées dans la base
- [ ] Aucune transaction sans `user_id`

---

### Étape 3.2: Tester les RLS Policies

**Dans Supabase SQL Editor:**

**Se connecter en tant que User B (si possible):**
```sql
-- Simuler User B
SET LOCAL request.jwt.claims.sub = '<UUID_DE_TEST>';

-- Essayer de lire toutes les transactions
SELECT * FROM transactions;
```

**Résultat attendu:**
- SEULEMENT la transaction de User B visible
- RLS bloque l'accès aux transactions de User A

**Vérifications:**
- [ ] RLS fonctionne correctement
- [ ] Impossible d'accéder aux données d'un autre user

---

## ✅ Checklist Finale

### Interface Utilisateur
- [ ] Email affiché dans la sidebar (User A)
- [ ] Lien "Voir le profil" fonctionne
- [ ] Bouton "Se déconnecter" fonctionne
- [ ] Page de profil affiche les bonnes statistiques
- [ ] Déconnexion redirige vers login
- [ ] Routes protégées inaccessibles sans auth

### Multi-Tenant
- [ ] User A voit ses 26 transactions
- [ ] User B voit 0 transactions (nouveau compte)
- [ ] User B peut créer sa propre transaction
- [ ] User A ne voit PAS la transaction de User B
- [ ] Chaque user a son propre email dans la sidebar
- [ ] Profil de chaque user affiche ses propres stats

### Sécurité
- [ ] RLS bloque l'accès cross-user
- [ ] Déconnexion supprime l'accès immédiat
- [ ] Pas de fuite de données entre users
- [ ] Audit logs (si activé) enregistre les bonnes actions

---

## 🎉 Résultat Attendu

Si tous les tests passent:

**✅ SUCCÈS! Votre application est 100% multi-tenant et sécurisée!**

**Vous avez maintenant:**
- Interface utilisateur complète (login, profil, logout)
- Isolation parfaite des données (RLS)
- Multi-tenant fonctionnel
- Prêt pour la production!

---

## ❌ Problèmes Possibles et Solutions

### Problème 1: Email ne s'affiche pas dans la sidebar

**Solution:**
1. Vérifier que vous êtes bien connecté
2. Rafraîchir la page (`Cmd+R` ou `Ctrl+R`)
3. Vider le cache du navigateur
4. Vérifier la console JavaScript (F12) pour des erreurs

---

### Problème 2: "Confirm email" requis

**Solution:**
- Option A: Désactiver dans Supabase (voir Étape 2.3)
- Option B: Confirmer manuellement dans Supabase Dashboard
- Option C: Utiliser un vrai email et cliquer sur le lien de confirmation

---

### Problème 3: User B voit les données de User A

**PROBLÈME CRITIQUE!** Les RLS ne fonctionnent pas.

**Solution:**
1. Vérifier que les scripts SQL ont été exécutés:
   - `docs/security/rls-transactions.sql`
   - `docs/security/rls-budgets.sql`
   - Etc.
2. Vérifier dans Supabase → Database → Policies
3. Vérifier que RLS est activé sur toutes les tables

---

### Problème 4: Impossible de se déconnecter

**Solution:**
1. Ouvrir la console JavaScript (F12)
2. Vérifier les erreurs
3. Vérifier que `supabase.auth.signOut()` fonctionne
4. Redémarrer le serveur: `npm run dev`

---

## 📞 Prochaines Étapes

**Après les tests:**

1. **Si tout fonctionne:**
   - Documenter les résultats
   - Préparer le déploiement en production
   - Ajouter des fonctionnalités supplémentaires (avatar, paramètres, etc.)

2. **Si des problèmes:**
   - Noter les erreurs
   - Vérifier les logs
   - Demander de l'aide si nécessaire

**Bon test! 🚀**
