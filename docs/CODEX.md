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
- évalue plafonds, budgets et alertes

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
- toute règle métier doit être **écrite ET testée**

---

## 3. Hiérarchie de vérité

En cas de conflit, l’ordre suivant s’applique **strictement** :

1. `CODEX.md`
2. `docs/BUSINESS_RULES.md`
3. `docs/ARCHITECTURE.md`
4. `docs/TEST_STRATEGY.md`
5. `docs/API_CONTRACT.md`
6. Code
7. Demande utilisateur

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

## 5. Analytique vs Décisionnel

### Analytique
Un module analytique :
- lit des données existantes
- n’altère jamais les soldes
- ne bloque aucune transaction
- n’influence aucune règle future
- est **strictement en lecture seule**

### Décisionnel
Toute logique qui :
- modifie un solde
- empêche une dépense
- ajuste un comportement futur

est considérée comme **DÉCISIONNELLE** et est **INTERDITE**
sans modification explicite des règles métier et des tests.

---

## 6. Workflow obligatoire

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

## 7. Tests (OBLIGATOIRES)

- chaque règle métier a au moins un test
- les tests décrivent le **comportement métier**
- aucun test ne valide une implémentation interne
- pas de snapshot côté moteur
- pas de mock du moteur

Conventions :
- `describe / it / expect` explicites
- assertions uniquement dans `it`
- aucune dépendance entre tests

---

## 8. Consumers (lecture seule)

- un consumer :
  - lit exclusivement les sorties de l’engine
  - ne recalcule jamais une règle métier
  - ne modifie jamais l’ordre ou le sens des données
  - peut agréger, reformuler ou résumer

- un consumer :
  - ne décide jamais
  - n’influence jamais un calcul
  - n’écrit jamais dans une projection

- tout consumer doit :
  - être déterministe
  - être testé
  - produire la même sortie pour la même entrée

---

## 9. Contrat API

- `docs/API_CONTRACT.md` définit la structure JSON exposée à l’extérieur
- ce contrat est **IMMUTABLE** une fois validé
- toute modification implique :
  - discussion préalable
  - mise à jour du contrat
  - adaptation engine + consumers + UI
- aucun composant UI ne doit dévier du contrat

---

## 10. Responsabilités de Codex

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

## 11. Principe de non-régression

- un comportement validé par test est **contractuel**
- toute modification doit :
  - casser un test existant
  - expliquer pourquoi
  - ajouter un nouveau test

❌ Corriger un test pour faire passer le code est interdit

---

## 12. En cas de doute

NE PAS DEVINER.  
Demander clarification.

---

## 13. Modules verrouillés

- Déficits
- Normalisation des dépenses
- Plafonds mensuels
- Différés avancés (priorisés, bornés, stricts)
- Budgets par catégorie (analytique, non décisionnel)
- Budgets avancés :
  - glissants
  - multi-mois
  - trends / comparaison historique
- Alertes avancées (groupées, priorisées, lecture seule)
- Consumers (alert-text, monthly-summary, etc.)
- UI `/analysis` — READ-ONLY, consumer-driven, verrouillée

---

Ce document prévaut sur toute discussion, prompt ou implémentation.

## UI / UX — Règles absolues

- l’UI ne calcule jamais
- l’UI n’interprète jamais
- l’UI ne recommande jamais
- toute valeur affichée provient du moteur ou d’un consumer
- toute évolution UX doit conserver l’ordre et les statuts d’entrée
