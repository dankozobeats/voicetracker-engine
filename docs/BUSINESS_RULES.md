# 1. Définitions métier
- Compte : entité financière (`SG`, `FLOA`) à laquelle sont rattachées transactions, charges et soldes.
- Solde : montant disponible pour un compte à un instant donné (ouverture, clôture).
- Dépense : sortie d’argent qui est toujours enregistrée comme un coût positif, même si la saisie initiale est négative.
- Revenu : entrée d’argent ajoutée au solde du mois courant.
- Différé : dépense validée mais reportée, appliquée uniquement au mois cible indiqué.
- Charge fixe : engagement mensuel lié à un compte, défini pour un intervalle `YYYY-MM`.
- Déficit : solde final négatif qui sera entièrement reporté vers le mois suivant.

# 2. Règles fondamentales
- une dépense est TOUJOURS positive dans le calcul des coûts mensuels.
- un déficit est reporté intégralement, pas partiellement.
- il n’y a aucune compensation automatique en dehors des revenus ou reports explicites.
- le solde final d’un mois devient exactement le solde initial du mois suivant sans transformation.

# 3. Règles sur les différés
- les différés sont invoqués uniquement par des transactions marquées `isDeferred`.
- ils sont appliqués dans le mois cible (`deferredTo` au format `YYYY-MM`) et n’impactent pas le mois d’origine.
- si plusieurs différés ciblent le même mois, leur coût est additionné avant d’affecter ce mois.

# 4. DIFFÉRÉS AVANCÉS
- `maxDeferralMonths` définit la durée maximale d’attente ; au-delà, la dépense est injectée immédiatement et le statut devient **FORCED**.
- chaque dépense différée peut définir `deferredUntil`, une priorité (`priority`, plus petit = plus urgent), et `maxDeferralMonths`.
- les différés injectés le même mois sont traités par priorité croissante sans réordonnancement dynamique ; aucune dépense n’est bloquée.
- statuts explicites :
  - **PENDING** : différé toujours dans sa fenêtre d’attente.
  - **APPLIED** : injecté normalement selon le calendrier.
  - **FORCED** : appliqué parce que le plafond temporel est dépassé.
  - **EXPIRED** : laissé de côté quand l’appelant l’indique.
- la stratégie **STRICT** impose l’application mécanique des règles : aucun arbitrage implicite, aucune rediffusion automatique, toutes les décisions restent à la charge de l’appelant.

# 5. Budgets par catégorie
- chaque budget associe un `category` à un montant annuel ou mensuel.
- les dépenses sont agrégées par catégorie (dépenses directes + différés appliqués) et confrontées au budget prévu.
- seuils constants :
  - WARNING : dépenses >= 80 % du budget
  - EXCEEDED : dépenses > 100 % du budget
- L’état résultant (OK | WARNING | EXCEEDED) est stocké dans `CategoryBudgetResult`.
- Ce mécanisme est purement analytique : il ne bloque aucune transaction ni ne réajuste le déficit.

# 6. Budgets glissants
- un budget glissant associe une fenêtre `windowMonths` (mois courant + N-1 mois précédents) à une catégorie.
- le total dépensé est la somme des dépenses normalisées sur cette fenêtre.
- status :
  - **OK** : total < 80 % du budget.
  - **WARNING** : total ≥ 80 % et < 100 %.
  - **REACHED** : total = 100 %.
  - **EXCEEDED** : total > 100 %.
- chaque résultat (`RollingCategoryBudgetResult`) contient `totalSpent`, `ratio` et `status`.
- aucun effet sur solde/déficit ; le calcul reste déterministe et purement analytique.

# 7. Budgets multi-mois
- un budget multi-mois définit une période fermée (`periodStart` / `periodEnd`) et un montant `amount`.
- la somme (`totalSpent`) est la somme des dépenses normalisées de la catégorie pour chaque mois du segment, cumulée jusqu’au mois courant (sans regarder au-delà).
- statuts disponibles :
  - **OK** : total < 80 % du budget.
  - **WARNING** : total ≥ 80 % et < 100 %.
  - **REACHED** : total = 100 %.
  - **EXCEEDED** : total > 100 %.
  - **INACTIVE** : le mois traité est hors de la période définie.
- chaque résultat (`MultiMonthBudgetResult`) expose `category`, `periodStart`, `periodEnd`, `totalSpent`, `ratio` et `status`.
- les budgets multi-mois restent analytiques : ils ne modifient en rien les soldes, déficits ou plafonds.

# 8. Alertes moteur (lecture seule)
- les alertes sont dérivées des projections, sans jamais modifier les soldes ni déclencher d’action.
- chaque alerte fournit `month`, `type`, `level`, `sourceModule` et des métadonnées « opaque ».
- déclencheurs :
  - `DEFICIT_STARTED` (CRITICAL) : le mois bascule dans le négatif.
  - `DEFICIT_CARRIED` (WARNING) : un déficit est reporté vers ce mois.
  - `DEFICIT_WORSENING` (WARNING) : le déficit s’aggrave comparé au mois précédent.
  - `DEFERRED_PENDING` (INFO), `DEFERRED_FORCED` (WARNING), `DEFERRED_EXPIRED` (WARNING) proviennent de la liste `deferredResolutions`.
  - `CEILING_REACHED` (WARNING), `CEILING_EXCEEDED` (CRITICAL) reflètent l’état des plafonds (`REACHED`/`EXCEEDED`).
  - `CATEGORY_BUDGET_WARNING` (WARNING), `CATEGORY_BUDGET_EXCEEDED` (CRITICAL) suivent les budgets par catégorie.
- le tri final des alertes est lexicographique (`month`, `type`), ce qui garantit une sortie stable.

# 9. Charges fixes
- chaque charge fixe mentionne un intervalle `startMonth` / `endMonth` (`YYYY-MM`).
- elle s’applique à chaque mois compris dans cet intervalle inclusif.
- hors de son intervalle, la charge ne participe pas au calcul.

# 10. Règles sur les plafonds
- les plafonds sont définis par `CeilingRule` et s’appliquent à chaque mois couvert (`YYYY-MM`).
- le total évalué pour un mois est `dépenses + charges fixes + différés` (tous positifs).
- un état est produit : `NOT_REACHED` si le total est inférieur, `REACHED` si égal, `EXCEEDED` si supérieur au plafond.
- chaque mois conserve l’historique des statuts de plafond sans modifier le solde.

# 11. Ordre de calcul
1. ouvrir le mois avec le solde reporté précédent.
2. ajouter les revenus du mois.
3. normaliser et soustraire les dépenses non différées.
4. soustraire les charges fixes actives.
5. ajouter les différés arrivant ce mois.
6. appliquer le déficit reporté précédent.
7. calculer le `endingBalance` puis le propager comme ouverture du mois suivant.

# 12. Cas interdits
- considérer une dépense négative comme une réduction de revenu.
- diviser un déficit en fragments partiels.
- ignorer une charge fixe en cours.
- traiter un différé dans un mois autre que son `deferredTo`.

# 13. Principe de non-régression
Une règle validée reste figée tant qu’un test Vitest ne certifie pas sa mise à jour avant tout changement.
