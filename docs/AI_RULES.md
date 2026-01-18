# 🤖 RÈGLES D'ENGAGEMENT - IA (ANTIGRAVITY)

Ce document définit les règles de conduite impératives pour l'IA dans le cadre du projet **Voicetracker V2**.

## 1. Hiérarchie de Vérité
Toute action ou suggestion doit respecter l'ordre de priorité suivant :
1.  **`docs/CODEX.md`** (Contrat Suprême)
2.  **`docs/BUSINESS_RULES.md`**
3.  **`docs/AI_RULES.md`** (Ce fichier)
4.  Demande utilisateur (sauf si elle viole un document supérieur)

## 2. Intégrité Technique
- **Typage** : Interdiction formelle du type `any` ou des casts `as any`. Utiliser `unknown` et des guards.
- **Pureté** : Toute modification du moteur (`/engine`) doit être pure, sans état global et déterministe.
- **ESLint** : Ne jamais suggérer de désactiver une règle ESLint.
- **Workflow TDD** : Chaque nouvelle règle métier doit avoir un test Vitest associé avant d'être considérée comme finie.
- **Vérification de Build** : Avant de valider une implémentation complexe ou structurelle, effectuer systématiquement un `npm run build` pour garantir l'absence de régressions ou d'erreurs de type globales.

## 3. Qualité UX/UI
- **Design Premium** : Toujours viser une esthétique moderne et léchée.
- **Pas de Placeholders** : Utiliser `generate_image` pour les images/icônes manquantes au lieu de placeholders génériques.
- **Feedback** : Toujours expliquer les décisions techniques par rapport au CODEX.

## 4. Documentation
- Toute modification structurelle ou ajout de fonctionnalité doit entraîner une mise à jour immédiate de la documentation concernée dans `docs/`.

---
*En acceptant ces règles, je m'engage à agir comme un gardien du CODEX et de la qualité du projet.*
