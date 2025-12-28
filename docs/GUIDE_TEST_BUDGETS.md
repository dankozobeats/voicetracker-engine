# 🧪 Guide de test - Système de Budgets

## ✅ Prérequis

1. Exécuter le script SQL : `docs/budget-recurring-charges-link.sql` dans Supabase
2. Avoir au moins 2-3 charges récurrentes de type EXPENSE créées
3. Serveur dev en cours : `npm run dev`

---

## 📋 Scénario de test complet

### Étape 1: Créer des charges récurrentes (si pas déjà fait)

**Page** : `/recurring-charges` (Charges récurrentes)

Créer 3 charges EXPENSE :
- Mutuelle : 45€/mois (compte SG)
- Kiné : 30€/mois (compte SG)
- Pharmacie habituelle : 25€/mois (compte SG)

---

### Étape 2: Créer un budget

**Page** : `/budgets/manage` (Gérer mes budgets)

1. Cliquer sur **"+ Nouveau budget"**
2. Remplir le formulaire :
   - Catégorie : **Santé**
   - Montant : **150€**
   - Période : **Mensuel**
3. Cliquer sur **"Créer"**

**✅ Résultat attendu** :
- Un nouveau budget apparaît avec :
  - Budget total : 150,00 €
  - Charges fixes : 0,00 €
  - Reste disponible : 150,00 € (en vert)

---

### Étape 3: Affecter des charges au budget

1. Sur le budget "Santé", cliquer sur **"+ Affecter une charge"**
2. Dans le modal qui s'ouvre :
   - Voir la liste des charges EXPENSE disponibles
   - Voir "Budget restant: 150,00 €" en haut
3. Cliquer sur **"Affecter"** pour Mutuelle (45€)
4. Le modal se ferme automatiquement

**✅ Résultat attendu** :
- Le budget se met à jour :
  - Budget total : 150,00 €
  - Charges fixes : 45,00 € (en orange)
  - Reste disponible : 105,00 € (en vert)
- La charge "Mutuelle - 45,00 €" apparaît dans la liste avec un bouton ✕

---

### Étape 4: Affecter une deuxième charge

1. Cliquer à nouveau sur **"+ Affecter une charge"**
2. Affecter "Kiné" (30€)

**✅ Résultat attendu** :
- Budget total : 150,00 €
- Charges fixes : 75,00 € (45€ + 30€)
- Reste disponible : 75,00 € (en vert)
- Deux charges listées :
  - Mutuelle - SG - 45,00 € ✕
  - Kiné - SG - 30,00 € ✕

---

### Étape 5: Retirer une charge

1. Cliquer sur le **✕** à côté de "Kiné"
2. Confirmer dans la popup

**✅ Résultat attendu** :
- Charges fixes : 45,00 € (seulement Mutuelle)
- Reste disponible : 105,00 € (150€ - 45€)
- "Kiné" n'apparaît plus dans la liste

---

### Étape 6: Tester le modal d'affectation

1. Cliquer sur **"+ Affecter une charge"**

**✅ Résultat attendu** :
- Le modal affiche :
  - Titre : "Affecter des charges au budget "Santé""
  - Budget restant : 105,00 €
  - Liste des charges **non affectées** :
    - ✅ Kiné (car on vient de la retirer)
    - ✅ Pharmacie habituelle
    - ❌ Mutuelle (déjà affectée, donc pas dans la liste)

---

### Étape 7: Créer un deuxième budget

1. Créer un budget "Courses" = 300€/mois
2. Créer une charge récurrente EXPENSE "Supermarché" = 250€/mois
3. Affecter "Supermarché" au budget "Courses"

**✅ Résultat attendu** :
- Deux budgets visibles :
  - **Santé** : 150€ total, 45€ charges, 105€ restant
  - **Courses** : 300€ total, 250€ charges, 50€ restant

---

### Étape 8: Tester la modification d'un budget

1. Sur le budget "Santé", cliquer sur **"Modifier"**
2. Changer le montant à **200€**
3. Cliquer sur **"Mettre à jour"**

**✅ Résultat attendu** :
- Budget total : 200,00 €
- Charges fixes : 45,00 € (inchangé)
- Reste disponible : 155,00 € (200€ - 45€, en vert)

---

### Étape 9: Tester la suppression d'un budget

1. Sur le budget "Courses", cliquer sur **"Supprimer"**
2. Confirmer

**✅ Résultat attendu** :
- Le budget "Courses" disparaît
- La charge "Supermarché" est automatiquement libérée (grâce à ON DELETE CASCADE)
- Elle redevient disponible pour être affectée à un autre budget

---

### Étape 10: Vérifier la page résultats

**Page** : `/budgets` (Résultats)

**✅ Résultat attendu** :
- Section "Budgets mensuels" affiche le budget "Santé"
- Barre de progression verte (car pas encore de transactions ce mois-ci)
- Montant dépensé = 45€ (uniquement les charges récurrentes affectées)
- Ratio = 22,5% (45€ / 200€)
- Statut = ✅ "Dans le budget" (vert)

---

## 🐛 Cas d'erreur à tester

### Test 1: Affecter la même charge deux fois
1. Affecter "Mutuelle" au budget "Santé"
2. Essayer de réaffecter "Mutuelle" au même budget

**✅ Attendu** : Message d'erreur "Cette charge est déjà affectée à ce budget"

---

### Test 2: Budget avec montant négatif
1. Créer un budget "Test" = 50€
2. Affecter "Mutuelle" (45€) et "Kiné" (30€) = 75€ total

**✅ Attendu** :
- Charges fixes : 75,00 €
- Reste disponible : -25,00 € **en rouge** (dépassement)

---

### Test 3: Supprimer une charge récurrente affectée
1. Aller sur `/recurring-charges`
2. Supprimer la charge "Mutuelle" (qui est affectée au budget "Santé")

**✅ Attendu** :
- La charge est supprimée
- Elle disparaît automatiquement de la liste des charges affectées au budget
- Les montants du budget se recalculent automatiquement

---

## 🎯 Points clés à vérifier

- [ ] Les montants s'affichent en format EUR (ex: 150,00 €)
- [ ] Les couleurs changent selon le statut (vert = OK, rouge = négatif)
- [ ] Le modal d'affectation ne montre que les charges non affectées
- [ ] Le bouton ✕ retire bien la charge
- [ ] Les totaux se recalculent instantanément
- [ ] Pas d'erreur dans la console navigateur
- [ ] Pas d'erreur dans la console terminal Next.js

---

## 📊 État final attendu

Après tous les tests, tu devrais avoir :

```
Budget "Santé" : 200€
├─ Mutuelle (charge) : 45€
├─ Charges fixes totales : 45€
└─ Reste disponible : 155€ ✅

Budget "Courses" : Supprimé
```

---

## 🚀 Prochaine étape

Si tous les tests passent :
- ✅ Le système de liaison budgets ↔ charges fonctionne
- ✅ L'UI de gestion est opérationnelle
- ✅ Prêt à intégrer le moteur d'analyse

Sinon, noter les erreurs et me les communiquer !
