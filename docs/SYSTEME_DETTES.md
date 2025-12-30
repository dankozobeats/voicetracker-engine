# Système de Gestion des Dettes

## Vue d'ensemble

Le système de gestion des dettes est une architecture **complètement séparée** des charges récurrentes, avec sa propre table, API, et interface utilisateur.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE DETTES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Database (Supabase)                                         │
│  ├── Table: debts                                            │
│  │   ├── Colonnes de base: id, user_id, label, account      │
│  │   ├── Financières: monthly_payment, remaining_balance    │
│  │   ├── Optionnelles: initial_balance, interest_rate       │
│  │   ├── Dates: start_month, end_month, debt_start_date     │
│  │   └── Avancées: excluded_months, monthly_overrides       │
│  │                                                            │
│  Backend (Next.js API Routes)                                │
│  ├── /api/debts                                              │
│  │   ├── GET    - Liste toutes les dettes                   │
│  │   ├── POST   - Créer une nouvelle dette                  │
│  │   ├── PUT    - Modifier une dette                        │
│  │   └── DELETE - Supprimer une dette                       │
│  │                                                            │
│  Logique Métier                                              │
│  ├── lib/debt-projection.ts                                  │
│  │   ├── projectDebt() - Projection mensuelle               │
│  │   ├── projectMultipleDebts() - Projection multiple       │
│  │   └── calculateAggregateStats() - Statistiques globales  │
│  │                                                            │
│  Frontend (React)                                             │
│  ├── /debts                                                   │
│  │   ├── Formulaire d'ajout/modification                    │
│  │   ├── Liste des dettes avec actions                      │
│  │   ├── Statistiques agrégées                              │
│  │   ├── Sélecteur de période (3-6 ans)                     │
│  │   └── Tableau de projection détaillé                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Fichiers Créés/Modifiés

### 1. Base de Données
- **`docs/create-debts-table.sql`** - Script de création de la table `debts`
- **`docs/MIGRATION_GUIDE_DEBTS.md`** - Guide de migration étape par étape

### 2. Backend
- **`app/api/debts/route.ts`** - API REST complète (GET, POST, PUT, DELETE)
- **`lib/debt-projection.ts`** - Moteur de calcul de projection
- **`lib/types.ts`** - Type `SupabaseDebtRecord` ajouté

### 3. Frontend
- **`app/debts/DebtsClient.tsx`** - Interface principale avec formulaire et projections
- **`app/debts/page.tsx`** - Page wrapper

### 4. Navigation
- **`components/navigation/Sidebar.tsx`** - Lien "Suivi des dettes" ajouté

## Fonctionnalités

### Formulaire de Dette
- Nom de la dette (ex: Prêt auto)
- Compte (SG ou FLOA)
- Mensualité (montant du paiement mensuel)
- Capital restant à rembourser ⭐ **REQUIS**
- Capital initial (optionnel - pour barre de progression)
- Taux d'intérêt annuel % (optionnel - pour calcul des intérêts)
- Date de début des paiements (YYYY-MM)
- Date de début du prêt (optionnel)

### Projection
Le moteur de projection calcule mois par mois:
- **Solde de début**: Capital restant au début du mois
- **Paiement**: Mensualité (ou montant modifié si override)
- **Intérêts**: Calculés avec le taux d'intérêt si renseigné
- **Principal**: Part du capital remboursé (paiement - intérêts)
- **Solde de fin**: Capital restant à la fin du mois

### Statistiques Agrégées
- **Capital Restant Total**: Somme de toutes les dettes
- **Mensualité Totale**: Somme de tous les paiements mensuels
- **Intérêts Projetés**: Total des intérêts sur la période
- **Dernier Remboursement**: Date estimée de fin du dernier crédit

### Fonctionnalités Avancées
- **Mois suspendus** (`excluded_months`): Pauses de paiement
- **Paiements exceptionnels** (`monthly_overrides`): Remboursements anticipés
- **Période de projection**: 36, 48, 60, ou 72 mois
- **Barre de progression**: Si capital initial renseigné

## Formules de Calcul

### Intérêts Mensuels
```typescript
monthlyInterest = balance × (annualRate / 100 / 12)
```

### Remboursement de Principal
```typescript
principalPayment = monthlyPayment - monthlyInterest
```

### Nouveau Solde
```typescript
newBalance = oldBalance - principalPayment
```

### Date de Fin Estimée
Calculée automatiquement en fonction:
- Du capital restant
- De la mensualité
- Du taux d'intérêt
- Des mois suspendus
- Des paiements exceptionnels

## Exemple d'Utilisation

### Créer une Dette

```typescript
// Via l'interface /debts ou directement via API
POST /api/debts
{
  "label": "Prêt auto",
  "account": "SG",
  "monthly_payment": 350,
  "remaining_balance": 15000,
  "initial_balance": 20000,
  "interest_rate": 5.5,
  "start_month": "2024-01",
  "debt_start_date": "2024-01-15"
}
```

### Projection Résultante

Pour un prêt de 15 000€ à 350€/mois avec 5.5% d'intérêt:
- **Durée estimée**: ~47 mois
- **Total des intérêts**: ~1 745€
- **Total remboursé**: ~16 745€
- **Date de fin**: Décembre 2027

## Migration depuis recurring_charges

Si vous avez des dettes dans `recurring_charges` avec `purpose='DEBT'`:

```sql
-- Migrer vers la nouvelle table
INSERT INTO debts (...)
SELECT ... FROM recurring_charges WHERE purpose = 'DEBT';

-- Puis supprimer les anciennes (optionnel)
DELETE FROM recurring_charges WHERE purpose = 'DEBT';
```

Voir `docs/MIGRATION_GUIDE_DEBTS.md` pour les détails.

## Différences avec recurring_charges

| Aspect | recurring_charges | debts |
|--------|------------------|-------|
| **Usage** | Revenus et charges mensuelles | Dettes et crédits uniquement |
| **Champs clés** | amount (montant) | monthly_payment (mensualité) |
| | purpose (type) | - |
| | type (INCOME/EXPENSE) | - |
| **Champs uniques** | reminders | remaining_balance (requis) |
| | - | initial_balance |
| | - | interest_rate |
| **Projection** | Mensuel simple | 3-6 ans avec intérêts |
| **Interface** | Formulaire basique | Formulaire + projection détaillée |

## Sécurité

- **Row Level Security (RLS)** activée
- Les utilisateurs ne voient que leurs propres dettes
- Politiques pour SELECT, INSERT, UPDATE, DELETE
- Authentification requise via `getAuthenticatedUser()`

## Performance

- Index sur `user_id` pour requêtes rapides
- Index sur `account` pour filtrage
- Index sur `start_month` pour tri chronologique
- Trigger automatique pour `updated_at`

## Évolutions Futures Possibles

- 📊 Graphiques de projection visuels
- 📅 Rappels de paiement
- 💡 Suggestions d'optimisation (remboursement anticipé)
- 📈 Comparaison de scénarios (taux, mensualité)
- 📄 Export PDF du plan de remboursement
- 🔔 Alertes de fin de prêt
