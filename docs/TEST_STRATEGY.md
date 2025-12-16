# 1. Philosophie de test
Chaque règle métier de `voicetracker-engine` mérite un test dédié car le moteur est déterministe : une règle non testée n’est pas validée, et toute modification doit être prouvée par une assertion Vitest.

# 2. Types de tests
- **Unitaires** : fonction par fonction (normalisation, handler, utilitaires).  
- **Scénarios métier** : projections multi-mois, report de découvert, différés, plafonds et différés avancés (`engine/calculator.deferred-advanced.spec.ts`).  
- **Tests de régression** : cas découverts en production ou pendant la revue sont ajoutés immédiatement.

# 3. Structure des fichiers de test
- Placement : `engine/*.test.ts` ou `engine/*.spec.ts`.  
- Nom clair décrivant la cible (`calculator.test.ts`, `calculator.expense-normalization.spec.ts`).  
- Granularité : un `describe` par composant, un `it` par règle ou comportement observé.

# 4. Bonnes pratiques
- Tests lisibles, avec commentaires si la logique n’est pas triviale.  
- Données explicites (dates `YYYY-MM`, montants positifs/négatifs).  
- Pas de “magie” : les montants et résultats doivent être compréhensibles.

# 5. Ce qui est interdit
- Tests flous ou dépendants d’un ordre d’exécution.  
- Tests qui cachent un bug en acceptant un comportement incorrect.  
- Tests qui injectent de la logique métier pour “faire passer” la suite.

# 6. Workflow attendu
1. Analyser la règle à couvrir.
2. Ajouter le test avant ou avec la modification.
3. Refuser une PR si un comportement nouveau n’est pas testé ou si un test cassé n’est pas résolu.

# 7. Tests — Différés avancés
- fichier : `engine/calculator.deferred-advanced.spec.ts`.
- invariants vérifiés :
  - déterminisme garanti (même entrée → même sortie).
  - ordre strict des priorités lors de l’injection des différés.
  - respect du plafond temporel (`maxDeferralMonths` déclenche l’état FORCED).
  - impact explicite sur le déficit (déficit augmente quand les dépenses dépassent le solde).
  - absence totale de comportement implicite ou arbitré par le moteur.

# 8. Tests — Budgets par catégorie
- fichier : `engine/calculator.category-budgets.spec.ts`.
- invariants vérifiés :
  - déterminisme garanti (même entrée → même sortie).
  - respect des seuils : WARNING ≥ 80 %, EXCEEDED > 100 %.
  - expression claire du statut (OK | WARNING | EXCEEDED) par catégorie.
  - aucun effet de bord sur les soldes ou les déficits.
  - aucune décision implicite dans la construction des résultats.

# 9. Tests — Budgets glissants
- fichier : `engine/calculator.budgets-rolling.spec.ts`.
- invariants vérifiés :
  - déterminisme absolu (identiques projections → identiques alertes).
  - isolation des catégories même sur la même fenêtre temporelle.
  - respect strict des `windowMonths` fournis pour la somme.
  - aucune incidence sur les soldes, plafonds ou différés.

# 9. règle métier 
- Toute règle métier doit avoir :
  - un test nominal
  - un test limite (égalité)
  - un test dépassement
- Aucun test ne modifie le moteur pour "faire passer" une règle.

# 10. Tests — Alertes moteur
- fichier : `engine/alerts.spec.ts`.
- invariants vérifiés :
  - déterminisme garanti (même entrée → même sortie).
  - ordre stable par sévérité puis type.
  - absence d’alertes dupliquées.
  - toutes les alertes sont dérivées, pas décisionnelles.

# 11. Tests — Analyse IA
- fichier : `engine/analysis.spec.ts`.
- invariants vérifiés :
  - la sortie texte est stable entre deux exécutions identiques.
  - aucun objet d’entrée n’est muté par la fonction.
  - les insights reprennent des événements déjà présents dans les alertes.

# 12. Tests — Génération d’alertes lexicographiques
- fichier : `engine/alerts/generate-alerts.spec.ts`.
- invariants vérifiés :
  - déterminisme complet (même projection → mêmes alertes, même ordre).
  - aucune mutation des projections d’entrée.
  - ordre final basé sur `month` puis `type` (tri lexicographique stable).
  - toutes les alertes reprennent des déclencheurs documentés.

# 13. Tests — Budgets multi-mois
- fichier : `engine/calculator.budgets-multimonth.spec.ts`.
- invariants vérifiés :
  - déterminisme absolu (même entrée → même sortie).
  - agrégations limitées à la période fixée (`periodStart` / `periodEnd`).
  - statuts explicites (OK | WARNING | REACHED | EXCEEDED | INACTIVE) sans effet sur les soldes.
  - chaque catégorie reste isolée, la somme d’une période n’impacte pas les autres.
  - les résultats restent analytiques : aucun comportement arbitraire ou décisionnel n’est introduit.

# 14. Tests — Budgets trends
- fichier : `engine/calculator.budgets-trends.spec.ts`.
- invariants vérifiés :
  - couverture de tous les `TrendStatus` : `INCREASING`, `DECREASING`, `STABLE` (variation ≤ 5 %), `NO_HISTORY`.
  - STABLE se déclenche uniquement lorsque la variation relative reste dans la marge de ±5 %.
  - déterminisme strict (même entrée → mêmes `trends`).
  - isolation par catégorie : un changement sur une catégorie n’affecte pas la tendance d’une autre.
  - comparaisons basées uniquement sur les `CategoryBudgetResult` précédents, sans recalculer les transactions.
