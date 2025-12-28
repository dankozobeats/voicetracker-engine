# 💰 Système de Budgets - Documentation

## 🎯 Concept principal

Le système de budgets fonctionne en **3 étapes** :

1. **Définir un budget global par catégorie** (ex: Santé = 150€/mois)
2. **Affecter des charges récurrentes** à ce budget (ex: Mutuelle 45€ + Kiné 30€)
3. **Le système calcule automatiquement** le reste disponible pour dépenses variables

---

## 📊 Exemple concret

```
Budget "Santé" : 150€/mois
├─ Mutuelle (charge récurrente) : 45€
├─ Kiné (charge récurrente) : 30€
├─ Charges fixes totales : 75€
└─ Reste disponible : 75€ ← Pour médecin, pharmacie, etc.
```

Quand tu enregistres une transaction "Pharmacie 20€" :
- **Dépenses totales du mois** = 45€ + 30€ + 20€ = 95€
- **Budget** = 150€
- **Statut** = ✅ Vert (dans le budget)

---

## 🏗 Architecture technique

### Base de données

#### Table `budgets`
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES auth.users
category    TEXT NOT NULL              -- Ex: "Santé", "Courses", etc.
amount      NUMERIC NOT NULL           -- Montant du budget
period      TEXT NOT NULL              -- 'MONTHLY', 'ROLLING', 'MULTI'
window_months INTEGER                  -- Pour ROLLING
period_start DATE                      -- Pour MULTI
period_end   DATE                      -- Pour MULTI
```

#### Table `budget_recurring_charges` (liaison)
```sql
id                    UUID PRIMARY KEY
budget_id             UUID REFERENCES budgets(id) ON DELETE CASCADE
recurring_charge_id   UUID REFERENCES recurring_charges(id) ON DELETE CASCADE

UNIQUE(budget_id, recurring_charge_id)  -- Une charge = un seul budget
```

**Migration SQL** : `docs/budget-recurring-charges-link.sql`

---

## 🔌 API

### Gérer les budgets
- **GET** `/api/budgets/manage` - Liste tous les budgets
- **POST** `/api/budgets/manage` - Créer un budget
- **PUT** `/api/budgets/manage?id=xxx` - Modifier un budget
- **DELETE** `/api/budgets/manage?id=xxx` - Supprimer un budget

### Affecter des charges
- **GET** `/api/budgets/[id]/charges` - Liste les charges affectées
- **POST** `/api/budgets/[id]/charges` - Affecter une charge
  ```json
  { "recurringChargeId": "uuid" }
  ```
- **DELETE** `/api/budgets/[id]/charges?recurringChargeId=xxx` - Retirer une charge

---

## 🎨 Interface utilisateur

### Page de gestion `/budgets/manage`

**Fichier** : `app/budgets/manage/page.tsx`

**Fonctionnalités** :
1. ✅ Créer/modifier/supprimer des budgets
2. ✅ Afficher pour chaque budget :
   - Budget total
   - Charges fixes (somme des charges récurrentes)
   - Reste disponible
3. ✅ Bouton "+ Affecter une charge" pour chaque budget
4. ✅ Liste des charges affectées avec possibilité de les retirer (✕)
5. ✅ Modal d'affectation montrant les charges EXPENSE disponibles

**Workflow utilisateur** :
1. Cliquer sur "+ Nouveau budget"
2. Remplir : Catégorie (ex: "Santé"), Montant (ex: 150€), Période (Mensuel)
3. Cliquer sur "Créer"
4. Cliquer sur "+ Affecter une charge"
5. Sélectionner les charges récurrentes à affecter (ex: Mutuelle, Kiné)
6. Voir immédiatement le "Reste disponible" se mettre à jour

---

## 📈 Page de résultats `/budgets`

**Fichier** : `app/budgets/page.tsx`

**Affichage** :
- Budgets mensuels avec barres de progression
- Budgets glissants (X derniers mois)
- Budgets multi-mois (période fixe)
- Évolution des dépenses (mois actuel vs précédent)

**Calcul** :
```
Pour chaque budget:
  totalSpent = charges_récurrentes + transactions_du_mois
  ratio = (totalSpent / budget_amount) * 100
  status = OK | WARNING | EXCEEDED
```

---

## 🔄 Moteur d'analyse

### Consumer `CategoryBudgetConsumer`

**Fichier** : `analysis/consumers/category-budget.consumer.ts`

**Logique** :
1. Récupère tous les budgets MONTHLY de l'utilisateur
2. Pour chaque budget, récupère les charges récurrentes affectées via `budget_recurring_charges`
3. Calcule le total des charges fixes
4. Récupère les transactions du mois pour cette catégorie
5. Calcule : `totalSpent = charges_fixes + transactions`
6. Détermine le statut : OK (< 80%), WARNING (80-100%), EXCEEDED (> 100%)

**Code simplifié** :
```typescript
const charges = await getLinkedCharges(budget.id);
const chargesTotal = charges.reduce((sum, c) => sum + c.amount, 0);
const transactions = await getTransactions(category, month);
const transactionsTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

const totalSpent = chargesTotal + transactionsTotal;
const ratio = (totalSpent / budget.amount) * 100;
const status = ratio < 80 ? 'OK' : ratio < 100 ? 'WARNING' : 'EXCEEDED';
```

---

## 🎯 Types de budgets

### 1. MONTHLY (Mensuel)
Budget qui se renouvelle chaque mois.

**Exemple** : Courses = 300€/mois

### 2. ROLLING (Glissant)
Budget calculé sur les X derniers mois glissants.

**Exemple** : Transport = 500€ sur 3 mois glissants

### 3. MULTI (Multi-mois)
Budget sur une période fixe avec dates de début et fin.

**Exemple** : Vacances = 1000€ du 01/06 au 31/08

---

## ✅ Workflow complet

1. **Créer des charges récurrentes** (page Charges récurrentes)
   - Ex: Mutuelle = 45€/mois, Kiné = 30€/mois

2. **Créer un budget** (page Gérer mes budgets)
   - Ex: Santé = 150€/mois

3. **Affecter les charges au budget**
   - Cliquer sur "+ Affecter une charge"
   - Sélectionner Mutuelle et Kiné

4. **Visualiser le reste disponible**
   - Budget: 150€
   - Charges fixes: 75€
   - **Reste: 75€** pour dépenses variables

5. **Enregistrer des transactions** (page Transactions)
   - Ex: Pharmacie = 20€

6. **Voir le résultat** (page Résultats)
   - Total dépensé: 95€ (75€ charges + 20€ transaction)
   - Ratio: 63% (95€ / 150€)
   - Statut: ✅ OK (dans le budget)

---

## 🔐 Sécurité

- **RLS (Row Level Security)** activé sur toutes les tables
- Les utilisateurs ne peuvent voir/modifier que leurs propres données
- Validation des permissions à chaque requête API
- Vérification de propriété budget ↔ user avant toute opération

---

## 📝 Fichiers clés

| Fichier | Description |
|---------|-------------|
| `docs/budget-recurring-charges-link.sql` | Script de migration SQL |
| `app/budgets/manage/page.tsx` | Page de gestion des budgets |
| `app/budgets/page.tsx` | Page de résultats |
| `app/api/budgets/manage/route.ts` | API CRUD budgets |
| `app/api/budgets/[id]/charges/route.ts` | API liaison charges |
| `analysis/consumers/category-budget.consumer.ts` | Moteur d'analyse mensuel |
| `components/budgets/CategoryBudgetItem.tsx` | Composant d'affichage |

---

## 🚀 Prochaines améliorations possibles

- [ ] Alertes quand un budget approche de sa limite
- [ ] Graphiques d'évolution des budgets sur 6-12 mois
- [ ] Suggestions automatiques de catégories basées sur les transactions
- [ ] Export des budgets en CSV/PDF
- [ ] Objectifs d'épargne (budget négatif = économie)
- [ ] Budgets partagés (entre utilisateurs)
