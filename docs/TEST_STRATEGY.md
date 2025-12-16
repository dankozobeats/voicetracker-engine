# 1. Philosophie de test
Chaque règle métier de `voicetracker-engine` mérite un test dédié car le moteur est déterministe : une règle non testée n’est pas validée, et toute modification doit être prouvée par une assertion Vitest.

# 2. Types de tests
- **Unitaires** : fonction par fonction (normalisation, handler, utilitaires).  
- **Scénarios métier** : projections multi-mois, report de découvert, différés.  
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

# 7. règle métier 
- Toute règle métier doit avoir :
  - un test nominal
  - un test limite (égalité)
  - un test dépassement
- Aucun test ne modifie le moteur pour "faire passer" une règle.