# CODEX — ENGINE & PLATFORM CONTRACT (MANDATORY)

⚠️ **THIS FILE IS CONTRACTUAL**  
This document MUST be read and applied before **any** code, test, or documentation change.  
If this file is ignored or partially applied, the output is **INVALID**.

---

## 1. Mission du projet

`voicetracker-engine` est un moteur financier **déterministe**, **pur**, et **contractuel** qui :

- décode des flux financiers mensuels
- projette revenus, charges fixes, charges différées et récurrentes
- normalise les dépenses
- observe et reporte les déficits
- calcule budgets, plafonds et alertes
- produit des projections **immutables**

❌ Aucune UI  
❌ Aucune base de données  
❌ Aucune dépendance externe  
❌ Aucune logique implicite  
❌ Aucune décision automatique  

---

## 2. Principes absolus (NON NÉGOCIABLES)

- même entrée → même sortie
- aucune mutation cachée
- aucune logique implicite
- aucune supposition métier
- chaque mois produit un résultat **immuable**
- le moteur **observe**, il ne corrige jamais
- toute règle métier doit être :
  - écrite
  - testée
  - documentée

---

## 3. Hiérarchie stricte de vérité

En cas de conflit, l’ordre suivant s’applique **sans exception** :

1. `CODEX.md`
2. `docs/BUSINESS_RULES.md`
3. `docs/ARCHITECTURE.md`
4. `docs/TEST_STRATEGY.md`
5. `docs/API_CONTRACT.md`
6. Code
7. Demande utilisateur

➡️ Toute demande violant un document supérieur → **REFUS OBLIGATOIRE**

---

## 4. Règles métier fondamentales (SOURCE DE VÉRITÉ)

### Dépenses
- toujours traitées comme des **coûts positifs**
- toute valeur négative est normalisée
- une dépense ne peut **jamais** augmenter un solde

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
sans modification explicite des règles métier **et** des tests.

---

## 6. Séparation des responsabilités

### ENGINE
- logique métier pure
- aucune mutation
- aucun effet de bord
- aucun affichage
- aucun accès réseau

### ANALYSIS
- lecture seule
- interprétation / agrégation
- jamais décisionnaire

### CONSUMERS
- reformulation / résumé uniquement
- jamais de calcul métier
- jamais d’impact sur les règles

### UI
- affichage strict
- aucune logique métier
- aucune recomposition de règles
- aucune interprétation décisionnelle

---

## 7. Workflow obligatoire pour chaque feature

Avant toute écriture de code :

1. Lecture de `CODEX.md`
2. Lecture des documents concernés
3. Reformulation écrite de la demande
4. Identification des modules impactés
5. Identification des modules verrouillés
6. Proposition écrite de l’implémentation
7. Proposition des tests associés
8. Attente de validation explicite
9. Implémentation minimale
10. Lancement de **toute** la suite Vitest
11. Mise à jour de la documentation

⛔ Sauter une étape est interdit.

---

## 8. Tests (OBLIGATOIRES)

- chaque règle métier a au moins un test
- les tests décrivent un **comportement métier**
- aucun test ne valide une implémentation interne
- pas de snapshot côté moteur
- pas de mock du moteur

Conventions :
- `describe / it / expect` explicites
- assertions uniquement dans `it`
- aucune dépendance entre tests

---

## 9. Consumers (lecture seule)

- un consumer :
  - lit exclusivement les sorties de l’engine
  - ne recalcule jamais une règle métier
  - ne modifie jamais l’ordre ou le sens des données
  - peut agréger, reformuler ou résumer

- un consumer :
  - ne décide jamais
  - n’influence jamais un calcul
  - n’écrit jamais dans une projection

---

## 10. Contrat API

- `docs/API_CONTRACT.md` définit la structure JSON exposée
- ce contrat est **IMMUTABLE** une fois validé
- toute modification implique :
  - discussion préalable
  - mise à jour du contrat
  - adaptation engine + consumers + UI

---

## 11. Principe de non-régression

- tout comportement validé par test est **contractuel**
- toute modification doit :
  - casser un test existant
  - expliquer pourquoi
  - ajouter un nouveau test

❌ Corriger un test pour faire passer le code est interdit

---

## 12. Modules verrouillés

- Déficits
- Normalisation des dépenses
- Plafonds mensuels
- Différés avancés (priorisés, bornés, stricts)
- Budgets par catégorie (analytique)
- Budgets avancés (glissants, multi-mois, trends)
- Alertes avancées (lecture seule)
- Consumers
- UI `/analysis` — READ ONLY

---

## 13. Commutation mock ⇆ API

- `lib/api.ts#getAnalysisData` est l’unique point d’accès UI
- mocks utilisés tant que `NEXT_PUBLIC_USE_REAL_API` est désactivé
- activation requiert :
  - `NEXT_PUBLIC_USE_REAL_API=1`
  - `NEXT_PUBLIC_ENGINE_API_URL`
- en cas d’erreur réseau :
  - fallback mock sauf si `NEXT_PUBLIC_ENGINE_API_FAIL_HARD=1`
- toute commutation impose :
  - `npm run test`
  - validation manuelle du flux UI

---

## 14. ESLint & TypeScript — Règles strictes (MANDATORY)

- ESLint v9 (flat config) is enforced
- ZERO tolerance for `any` or `as any`
- `catch` blocks MUST always be written as:
  `catch (error: unknown)`
- Inside catch blocks:
  - errors MUST be narrowed (`instanceof Error`, guards)
  - rethrowing untyped `unknown` is forbidden
- Prefer `unknown` over unsafe casts
- Casting `unknown as Type` is forbidden unless a validation step is documented
- Unused imports, variables, parameters MUST be removed
- Prefixing with `_` is allowed ONLY when semantically justified
- ESLint WARNINGS are acceptable
- ESLint ERRORS are NEVER acceptable
- Code MUST pass `npm run lint`
- ESLint rules must NEVER be disabled

---

## 15. En cas de doute

NE PAS DEVINER.  
Demander clarification.

---

Ce document prévaut sur toute discussion, prompt ou implémentation.
## 🔊 Voice Transaction Module — Extension

### Objectif
Ajouter une saisie vocale de transactions bancaires
sans modifier le moteur de calcul existant.

### Règles strictes
- ❌ Interdiction totale de modifier le moteur de calcul
- ❌ Aucune logique métier de calcul dans le module voice
- ❌ Aucune dépendance UI / DOM / navigateur
- ❌ Aucun fallback silencieux
- ✔ Production exclusive de `TransactionCreateInput`
- ✔ Erreurs typées obligatoires
- ✔ Tests Vitest obligatoires avant intégration

### Architecture imposée
src/voice/
- voice.contract.ts
- voice.parser.ts
- voice.normalizer.ts
- voice.errors.ts
- voice.index.ts

src/tests/voice/
- parser.spec.ts
- normalizer.spec.ts
- integration.spec.ts

### Pipeline
Voix → Texte → Parser → Normalizer → TransactionCreateInput → API existante

### Discipline
- Branche dédiée obligatoire
- Merge interdit si tests non verts