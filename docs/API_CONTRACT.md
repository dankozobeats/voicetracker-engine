# API CONTRACT — ENGINE → UI (IMMUTABLE)

This contract is immutable once validated.  
The UI consumes exactly what the engine provides: no new logic, no recalculation, read-only rendering.

Each section lists the JSON shape produced by the engine, the typing hints (copies of the engine contract), and a representative JSON snippet (one month minimum). Any evolution requires explicit revalidation.

## 1. MonthProjection

**Shape**

```ts
{
  month: string; // YYYY-MM
  openingBalance: number;
  income: number;
  expenses: number;
  fixedCharges: number;
  deferredIn: number;
  carriedOverDeficit: number;
  endingBalance: number;
  ceilings: CeilingStatus[];
  deferredResolutions: DeferredResolution[];
  categoryBudgets: CategoryBudgetResult[];
  categorySpending: Record<string, number>;
  multiMonthBudgets?: MultiMonthBudgetResult[];
  rollingBudgets?: RollingCategoryBudgetResult[];
  trends?: CategoryBudgetTrendResult[];
}
```

**Notes**

- Every numeric value is a snapshot from the engine (no UI-side sum or derived statuses).  
- Arrays (e.g., ceilings) preserve engine order.  
- Optional sections (`multiMonthBudgets`, `rollingBudgets`, `trends`) appear only when the engine populates them.

**Example**

```json
{
  "month": "2024-03",
  "openingBalance": 1500,
  "income": 3000,
  "expenses": 2450,
  "fixedCharges": 850,
  "deferredIn": 120,
  "carriedOverDeficit": 0,
  "endingBalance": 2070,
  "ceilings": [
    {
      "ruleId": "CEILING:SG:2024-03",
      "month": "2024-03",
      "ceiling": 4000,
      "totalOutflow": 2470,
      "state": "NOT_REACHED"
    }
  ],
  "deferredResolutions": [
    {
      "transactionId": "tx-123",
      "month": "2024-03",
      "amount": 120,
      "status": "APPLIED",
      "priority": 1,
      "forced": false,
      "category": "Abonnements"
    }
  ],
  "categoryBudgets": [
    {
      "category": "Alimentation",
      "budget": 600,
      "spent": 680,
      "remaining": -80,
      "status": "EXCEEDED"
    }
  ],
  "categorySpending": {
    "Alimentation": 680,
    "Transport": 210
  },
  "multiMonthBudgets": [
    {
      "category": "Projets",
      "periodStart": "2024-01",
      "periodEnd": "2024-06",
      "totalSpent": 2400,
      "budgetAmount": 3000,
      "ratio": 80,
      "status": "WARNING"
    }
  ],
  "rollingBudgets": [
    {
      "category": "Alimentation",
      "windowMonths": 3,
      "totalSpent": 1800,
      "budgetAmount": 2000,
      "ratio": 90,
      "status": "WARNING"
    }
  ],
  "trends": [
    {
      "category": "Alimentation",
      "current": 680,
      "previous": 610,
      "delta": 70,
      "percentChange": 11.47,
      "trend": "INCREASING"
    }
  ]
}
```

## 2. Advanced Alerts

**Shape**

```ts
{
  month: string; // YYYY-MM
  domain: 'DEFICIT' | 'DEFERRED' | 'CEILING' | 'BUDGET' | 'TREND';
  category?: string;
  ruleId: string;
  groupId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metadata?: Record<string, unknown>;
  priorityRank: number;
}
```

**Notes**

- Alerts are already ordered by the engine lexicographically (`severity`, `domain`, etc.). UI must respect this order.  
- The UI only receives alert texts derived by the consumer, never the engine alerts raw.  
- `metadata` fields are opaque; the UI may format but not interpret them.

**Example**

```json
[
  {
    "month": "2024-03",
    "domain": "BUDGET",
    "category": "Alimentation",
    "ruleId": "BUDGET:ALIMENTATION:2024-03",
    "groupId": "BUDGET:Alimentation",
    "severity": "CRITICAL",
    "metadata": {
      "spent": 680,
      "budget": 600
    },
    "priorityRank": 1
  }
]
```

## 3. Budgets

### 3.1 Category Budgets

Described inside `MonthProjection.categoryBudgets`. The UI renders the provided `status` (`OK`, `WARNING`, `EXCEEDED`) with no recalculation.

### 3.2 Rolling Budgets

Described inside `MonthProjection.rollingBudgets`. Each entry carries:

- `category`: string  
- `windowMonths`: number  
- `totalSpent`: number  
- `budgetAmount`: number  
- `ratio`: number  
- `status`: `OK | WARNING | REACHED | EXCEEDED`


### 3.3 Multi-Month Budgets

Described inside `MonthProjection.multiMonthBudgets`. Structure:

- `category`: string  
- `periodStart`: string (YYYY-MM)  
- `periodEnd`: string (YYYY-MM)  
- `totalSpent`: number  
- `budgetAmount`: number  
- `ratio`: number  
- `status`: `OK | WARNING | REACHED | EXCEEDED | INACTIVE`


## 4. Trends

**Structure inside `MonthProjection.trends`**

```ts
{
  category: string;
  current: number;
  previous: number;
  delta: number;
  percentChange: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'NO_HISTORY';
}
```

UI must display `trend` and `percentChange` without additional interpretation.

## 5. Consumer “Alert Text” Output

**Shape**

```ts
{
  groupId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  priorityRank: number;
}[]
```

**Notes**

- The UI only renders this consumer output as `alertTexts`.  
- Severity maps to colors/icons but never to thresholds.  
- Sorting is by `priorityRank` as produced; no resorting without explicit user action.

**Example**

```json
[
  {
    "groupId": "BUDGET:Alimentation",
    "severity": "CRITICAL",
    "title": "Budget — Alimentation",
    "message": "Ton : action requise / dépassement · Domaine : Budget · Catégorie : Alimentation · Règle : BUDGET:ALIMENTATION:2024-03 · Groupe : BUDGET:Alimentation",
    "priorityRank": 1
  }
]
```

## 6. General Remarks

- The UI receives `months` (array of `MonthProjection`), `balances`, budgets, trends, and consumer outputs as separate top-level keys.  
- All numeric and string values are deterministic snapshots coming straight from the engine.  
- The UI layer is strictly presentation: any sorting, filtering, or formatting is purely cosmetic.  
- Fetching against the mocked JSON must use this schema exactly; any change requires authorizing a contract update.
