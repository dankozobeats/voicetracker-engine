# GUIDE DE MIGRATION COMPLÈTE - Engine Integration

Ce guide vous accompagne pour connecter le vrai Engine production à votre application.

## 📊 Vue d'ensemble

**Problème actuel**: Vous avez deux moteurs d'analyse:
- `/engine/calculator.ts` - Engine production sophistiqué (CODEX-compliant) **NON UTILISÉ**
- `/analysis/engine/financial-analysis.engine.ts` - Engine simple **UTILISÉ** par le dashboard

**Objectif**: Remplacer le moteur simple par le moteur production pour débloquer toutes les fonctionnalités:
- ✅ Charges récurrentes (loyer, abonnements)
- ✅ Plafonds de dépenses
- ✅ Transactions différées avec priorités
- ✅ Budgets glissants (3 derniers mois)
- ✅ Budgets multi-mois
- ✅ Reports de déficit
- ✅ Alertes avancées

---

## 🗂 Fichiers créés

Les fichiers suivants ont été créés pour vous:

1. **`docs/supabase-complete-migration.sql`**
   - Script SQL complet pour migrer votre base de données
   - Ajoute tous les champs manquants à `transactions`
   - Crée les tables `recurring_charges`, `ceiling_rules`, `account_balances`
   - Met à jour la table `budgets` pour supporter ROLLING et MULTI

2. **`lib/types.ts`** (mis à jour)
   - Types TypeScript pour tous les nouveaux champs/tables
   - `SupabaseTransactionRecord`, `SupabaseRecurringChargeRecord`, etc.

3. **`lib/adapters/supabase-to-engine.ts`**
   - Couche de transformation entre types Supabase et types Engine
   - Fonctions: `supabaseTransactionToEngine`, `supabaseBudgetsToEngine`, etc.

4. **`app/api/engine/projection/route.ts`**
   - Nouvel endpoint API qui appelle le vrai Engine
   - `GET /api/engine/projection?account=SG&month=2025-01&months=12`
   - Retourne le format `EnginePayload` complet

---

## 🚀 ÉTAPE 1: Migration de la base de données

### 1.1 Exécuter le script SQL

1. Ouvrez Supabase Dashboard: https://supabase.com/dashboard
2. Allez dans votre projet
3. Cliquez sur "SQL Editor" dans la sidebar
4. Cliquez sur "New query"
5. Copiez-collez le contenu de `docs/supabase-complete-migration.sql`
6. Cliquez sur "Run" (en bas à droite)

**Vérification**:
```sql
-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions';

-- Vérifier que les nouvelles tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('recurring_charges', 'ceiling_rules', 'account_balances');
```

### 1.2 Migrer les données existantes

Les transactions existantes auront automatiquement:
- `account = 'SG'` (par défaut)
- `type = 'EXPENSE'` (sauf si label contient "revenu")
- `is_deferred = false`
- `priority = 9`

**Si vous voulez corriger manuellement certaines transactions**:
```sql
-- Exemple: Marquer certaines transactions comme INCOME
UPDATE transactions
SET type = 'INCOME'
WHERE label ILIKE '%salaire%';

-- Exemple: Changer le compte de certaines transactions
UPDATE transactions
SET account = 'FLOA'
WHERE label ILIKE '%crédit%';
```

---

## 🚀 ÉTAPE 2: Tester le nouvel endpoint

### 2.1 Démarrer votre serveur

```bash
npm run dev
```

### 2.2 Tester l'endpoint Engine

Ouvrez votre navigateur et allez sur:
```
http://localhost:3000/api/engine/projection?account=SG&month=2025-01&months=3
```

**Réponse attendue**:
```json
{
  "payload": {
    "months": [
      {
        "month": "2025-01",
        "openingBalance": 0,
        "income": 20240,
        "expenses": 0,
        "fixedCharges": 0,
        "deferredIn": 0,
        "carriedOverDeficit": 0,
        "endingBalance": 20240,
        "ceilings": [],
        "deferredResolutions": [],
        "categoryBudgets": [...],
        "categorySpending": {...}
      },
      ...
    ],
    "balances": [...],
    "categoryBudgets": [...],
    "rollingBudgets": [],
    "multiMonthBudgets": [],
    "trends": [],
    "alertTexts": [...]
  }
}
```

**Si vous obtenez des erreurs**:
- 401 Unauthorized → Vous devez être connecté
- 500 → Regardez les logs du serveur (`console.error`)
- Pas de données → Vérifiez que vous avez des transactions dans la base

---

## 🚀 ÉTAPE 3: Connecter le Dashboard au vrai Engine

### 3.1 Modifier `app/dashboard/page.tsx`

Actuellement, le dashboard utilise `financial-analysis.engine.ts`. On va le remplacer par un appel au nouvel endpoint.

**Option A: Fetch API**
```typescript
// app/dashboard/page.tsx
async function getDashboardData() {
  const user = await getAuthenticatedUser();

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Call the new Engine endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(
    `${baseUrl}/api/engine/projection?account=SG&month=${month}&months=1`,
    {
      headers: {
        // Server-side fetch needs to pass auth somehow
        // For now, we'll use service role (already authenticated via getAuthenticatedUser)
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load projection');
  }

  const { payload } = await response.json();
  return { payload };
}
```

**Option B: Appel direct (recommandé pour Server Components)**

Créez `/lib/engine-service.ts`:
```typescript
import { serverSupabaseAdmin } from '@/lib/supabase/server';
import { calculateProjection } from '@/engine/calculator';
import { generateAdvancedAlerts } from '@/engine/alerts/advanced-alerts';
import { formatAlertTexts } from '@/analysis/consumers/alert-text.consumer';
import type { Account } from '@/lib/types';
import {
  supabaseTransactionsToEngine,
  supabaseRecurringChargesToEngine,
  supabaseCeilingRulesToEngine,
  supabaseBudgetsToEngine,
} from '@/lib/adapters/supabase-to-engine';

export async function getEngineProjection(
  userId: string,
  account: Account,
  startMonth: string,
  months: number,
) {
  const supabase = serverSupabaseAdmin();

  // Same logic as in /api/engine/projection/route.ts
  // Fetch all data, transform, call Engine, return payload

  // ... (copier la logique de l'endpoint)
}
```

Puis dans `app/dashboard/page.tsx`:
```typescript
import { getEngineProjection } from '@/lib/engine-service';

async function getDashboardData() {
  const user = await getAuthenticatedUser();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const payload = await getEngineProjection(user.id, 'SG', month, 1);
  return { payload };
}
```

---

## 🚀 ÉTAPE 4: Mettre à jour le formulaire de transaction

Le formulaire actuel (`components/transactions/TransactionForm.tsx`) ne gère pas tous les nouveaux champs.

### 4.1 Ajouter les champs au formulaire

Vous devez ajouter:
- **Account** (sélecteur: SG / FLOA)
- **Type** (sélecteur: INCOME / EXPENSE) - remplace la détection par label
- **Différé?** (checkbox: transaction différée)
  - Si oui: afficher `deferredTo`, `deferredUntil`, `maxDeferralMonths`, `priority`

**Exemple simplifié**:
```tsx
const [account, setAccount] = useState<Account>('SG');
const [type, setType] = useState<TransactionType>('EXPENSE');
const [isDeferred, setIsDeferred] = useState(false);
const [deferredTo, setDeferredTo] = useState('');

// Dans le JSX:
<select value={account} onChange={(e) => setAccount(e.target.value as Account)}>
  <option value="SG">Compte SG</option>
  <option value="FLOA">Compte FLOA</option>
</select>

<select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
  <option value="INCOME">Revenu</option>
  <option value="EXPENSE">Dépense</option>
</select>

<label>
  <input
    type="checkbox"
    checked={isDeferred}
    onChange={(e) => setIsDeferred(e.target.checked)}
  />
  Transaction différée
</label>

{isDeferred && (
  <input
    type="month"
    value={deferredTo}
    onChange={(e) => setDeferredTo(e.target.value)}
    placeholder="Différé jusqu'à (YYYY-MM)"
  />
)}
```

### 4.2 Mettre à jour l'API `/api/transactions/route.ts`

Le POST doit accepter les nouveaux champs:

```typescript
const {
  date,
  label,
  amount,
  category,
  account = 'SG',
  type = 'EXPENSE',
  is_deferred = false,
  deferred_to,
  deferred_until,
  max_deferral_months,
  priority = 9,
} = await request.json();

// Validation
if (!['SG', 'FLOA'].includes(account)) {
  return jsonError('Account must be SG or FLOA');
}

if (!['INCOME', 'EXPENSE'].includes(type)) {
  return jsonError('Type must be INCOME or EXPENSE');
}

// Insert
const { data, error } = await supabase
  .from('transactions')
  .insert({
    user_id: user.id,
    date: normalizedDate,
    label: normalizeStringField(label, 'label'),
    amount,
    category: category ? normalizeStringField(category, 'category') : null,
    account,
    type,
    is_deferred,
    deferred_to,
    deferred_until,
    max_deferral_months,
    priority,
  })
  .select()
  .single();
```

---

## 🚀 ÉTAPE 5: Créer les UI pour les nouvelles fonctionnalités

### 5.1 Page de gestion des charges récurrentes

Créez `/app/recurring-charges/page.tsx`:
- Liste des charges récurrentes
- Formulaire pour ajouter: label, montant, compte, date début, date fin optionnelle
- API: `/app/api/recurring-charges/route.ts`

### 5.2 Page de gestion des plafonds

Créez `/app/ceiling-rules/page.tsx`:
- Liste des plafonds
- Formulaire pour ajouter: label, montant, compte, mois début, mois fin optionnel
- API: `/app/api/ceiling-rules/route.ts`

### 5.3 Page de gestion des soldes d'ouverture

Créez `/app/account-balances/page.tsx`:
- Affiche le solde d'ouverture pour chaque compte/mois
- Formulaire pour définir le solde initial
- API: `/app/api/account-balances/route.ts`

---

## 🚀 ÉTAPE 6: Connecter les autres pages

### 6.1 Page Analysis

Modifiez `/app/analysis/AnalysisClient.tsx`:
```typescript
const response = await fetch('/api/engine/projection?account=SG&month=2025-01&months=12');
const { payload } = await response.json();

// payload contient maintenant:
// - months[] avec toutes les projections
// - categoryBudgets, rollingBudgets, multiMonthBudgets
// - trends
// - alertTexts
```

### 6.2 Page Budgets

Modifiez `/app/budgets/BudgetsClient.tsx`:
```typescript
const response = await fetch('/api/engine/projection?account=SG&month=2025-01&months=1');
const { payload } = await response.json();

setBudgets({
  categoryBudgets: payload.categoryBudgets,
  rollingBudgets: payload.rollingBudgets,
  multiMonthBudgets: payload.multiMonthBudgets,
  trends: payload.trends,
});
```

**Important**: Ne plus afficher `spent: 0` hardcodé - utiliser les valeurs de l'Engine!

---

## 🚀 ÉTAPE 7: Cleanup (optionnel)

Une fois que tout fonctionne avec le vrai Engine:

### 7.1 Supprimer l'ancien moteur simple

```bash
rm analysis/engine/financial-analysis.engine.ts
rm analysis/engine/financial-analysis.engine.spec.ts
```

### 7.2 Supprimer l'ancien endpoint dashboard

```bash
rm app/api/dashboard/route.ts
```

### 7.3 Nettoyer `.env.local`

Supprimer:
```
NEXT_PUBLIC_USE_MOCK=true
```

---

## ✅ Checklist de migration

- [ ] **ÉTAPE 1**: Exécuter le script SQL de migration
- [ ] **ÉTAPE 2**: Tester le nouvel endpoint `/api/engine/projection`
- [ ] **ÉTAPE 3**: Connecter le dashboard au vrai Engine
- [ ] **ÉTAPE 4**: Mettre à jour le formulaire de transaction
- [ ] **ÉTAPE 5**: Créer les UI pour recurring charges, ceilings, balances
- [ ] **ÉTAPE 6**: Connecter les pages Analysis et Budgets
- [ ] **ÉTAPE 7**: Cleanup des anciens fichiers

---

## 🐛 Problèmes courants

### Erreur: "Column 'account' does not exist"
→ Le script SQL n'a pas été exécuté. Retour à l'ÉTAPE 1.

### Erreur: "Cannot read property 'categoryBudgets' of undefined"
→ L'Engine retourne un tableau vide. Vérifiez que vous avez des transactions dans la base.

### Erreur: "Type mismatch" dans les adapters
→ Vérifiez que les types Supabase correspondent bien au schéma SQL.

### Dashboard affiche toujours des zéros
→ Vérifiez que vous appelez bien `/api/engine/projection` et non l'ancien endpoint.

---

## 📝 Notes importantes

1. **CODEX Compliance**: Le vrai Engine (`/engine/calculator.ts`) est verrouillé. Ne le modifiez PAS.
2. **Read-Only UI**: L'UI doit afficher les résultats de l'Engine tels quels, sans recalculs.
3. **Adapters only**: La couche `lib/adapters/` ne fait QUE de la transformation de types, pas de logique métier.
4. **Multi-comptes**: L'Engine supporte SG et FLOA. Vous devrez peut-être ajouter un sélecteur de compte dans l'UI.

---

## 🎯 Résultat final attendu

Après la migration complète, votre application:

1. ✅ Gère plusieurs comptes (SG, FLOA)
2. ✅ Calcule les charges récurrentes automatiquement
3. ✅ Respecte les plafonds de dépenses
4. ✅ Gère les transactions différées avec priorités
5. ✅ Affiche les budgets glissants (3 derniers mois)
6. ✅ Affiche les budgets multi-mois
7. ✅ Reporte les déficits sur les mois suivants
8. ✅ Génère des alertes avancées sophistiquées
9. ✅ Respecte 100% le contrat CODEX

**Vous aurez enfin l'application sophistiquée que vous vouliez!** 🎉
