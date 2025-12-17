# CODEX — ENGINE CONTRACT (MANDATORY)

This file MUST be read before any code, test, or documentation change.
If this file is ignored, the output is invalid.

---

## 1. Mission du projet

`voicetracker-engine` est un moteur financier **déterministe** qui :
- décode les flux financiers mensuels
- projette revenus, charges fixes et différés
- normalise les dépenses
- reporte les déficits
- évalue des plafonds et alertes

❌ Aucune UI  
❌ Aucune base de données  
❌ Aucune dépendance externe  
❌ Aucune logique implicite  

---

## 2. Règles absolues (NON NÉGOCIABLES)

- même entrée → même projection
- aucune mutation cachée
- aucune logique implicite
- chaque mois produit un **résultat immuable**
- le moteur observe, il ne corrige pas
- toute règle métier doit être écrite ET testée

---

## 3. Hiérarchie de vérité

En cas de conflit, l’ordre suivant s’applique strictement :

1. `CODEX.md`
2. `docs/BUSINESS_RULES.md`
3. `docs/ARCHITECTURE.md`
4. `docs/TEST_STRATEGY.md`
5. Code
6. Demande utilisateur

Si une demande viole un document supérieur → **REFUS OBLIGATOIRE**

---

## 4. Règles métier fondamentales (SOURCE DE VÉRITÉ)

### Dépenses
- toujours traitées comme des **coûts positifs**
- les valeurs négatives sont normalisées
- une dépense ne peut jamais augmenter un solde

### Déficits
- un déficit est observé, jamais corrigé
- si `endingBalance < 0` :
  - `carriedOverDeficit = abs(endingBalance)`
  - le mois suivant le soustrait
- un déficit ne bloque jamais les dépenses futures

### Plafonds
- un plafond ne bloque rien
- il mesure uniquement la consommation
- statuts possibles :
  - `NOT_REACHED`
  - `REACHED`
  - `EXCEEDED`
- les plafonds n’affectent jamais les soldes

---

## 5. Workflow obligatoire

Pour chaque feature :

1. Lecture de `CODEX.md`
2. Lecture des docs concernées
3. Proposition écrite des changements
4. Écriture ou mise à jour des tests
5. Implémentation minimale
6. Lancement de **toute** la suite Vitest
7. Mise à jour de la documentation

⛔ Sauter une étape est interdit.

---

## 6. Tests (OBLIGATOIRES)

- chaque règle métier a au moins un test
- les tests décrivent le **comportement métier**
- aucun test ne valide une implémentation interne
- pas de snapshot
- pas de mock du moteur

Conventions :
- `describe / it / expect` explicites
- assertions uniquement dans `it`
- aucune dépendance entre tests

---

## 7. Responsabilités de Codex

Codex DOIT :
- signaler toute ambiguïté
- refuser toute demande contradictoire
- documenter toute règle ajoutée
- préserver les comportements existants

Codex NE DOIT JAMAIS :
- modifier une règle pour faire passer un test
- introduire un effet de bord
- “simplifier” une règle métier
- interpréter une intention non écrite

---

## 8. En cas de doute

NE PAS DEVINER.  
Demander clarification.

# 9. Modules verrouillés
- Déficits
- Normalisation des dépenses
- Plafonds mensuels
- Différés avancés (priorisés, bornés, stricts)
- Budgets par catégorie (analytique, non décisionnel)
- Budgets avancés (glissants, multi-mois, tendances) — module analytique verrouillé.
- Budgets multi-mois : évalués par période fixe, status OK/WARNING/REACHED/EXCEEDED/INACTIVE, tests dans `engine/calculator.budgets-multimonth.spec.ts`.
- LOT 3 — Trends / comparaison historique (ANALYTICAL + LOCKABLE) : lecture seule des `CategoryBudgetResult`, statuts `INCREASING`/`DECREASING`/`STABLE`/`NO_HISTORY`, tests dans `engine/calculator.budgets-trends.spec.ts`.
- Alertes avancées : lecture seule, dérivées des résultats existants, tests dans `engine/alerts/advanced-alerts.spec.ts`.

## 10. Couche consumer verrouillée

- Les consumers ne lisent que des résultats (`AdvancedAlert[]`, `MonthProjection`, etc.) et produisent des artefacts de présentation : aucun recalcul, aucune mutation, aucun effet de bord.
- Le premier consumer canonicalisé est `analysis/consumers/alert-text.consumer.ts` (tests : `analysis/consumers/alert-text.consumer.spec.ts`) ; il transforme les `AdvancedAlert` en titres/messages FR ordonnés par `priorityRank`.
- Un second consumer, `analysis/consumers/monthly-summary.consumer.ts` (accompagné de `monthly-summary.consumer.spec.ts`), synthétise les `AdvancedAlert` + `CategoryBudgetTrendResult` en un résumé mensuel neutre avec titres, points clés et détails classés.
- Tout changement de cette couche (nouveau consumer ou modification existante) exige des tests Vitest (`npx vitest run`) et une discussion explicite avant d’être fusionné.
