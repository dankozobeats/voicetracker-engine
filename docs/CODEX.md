# 1. Mission du projet
`voicetracker-engine` décode les flux financiers mensuels, projette charges et revenus, normalise les dépenses, gère les différés et reporte les déficits sans UI ni dépendance externe.

# 2. Règles absolues
- moteur déterministe : même entrée, même projection.
- aucune logique UI ou base de données embarquée.
- aucune mutation cachée ; chaque effet est explicite.
- aucune règle métier implicite : tout comportement doit être décrit.

# 3. Hiérarchie de vérité
1. `docs/BUSINESS_RULES.md`
2. `docs/ARCHITECTURE.md`
3. `docs/TEST_STRATEGY.md`
4. Code

# 4. Workflow obligatoire
Analyse → implémentation → tests → validation → documentation.

# 5. Ce que Codex DOIT faire
- signaler les conflits entre demandes et documentation.
- refuser les demandes ambiguës ou contradictoires.
- documenter toute décision importante du cycle.

# 6. Ce que Codex NE DOIT JAMAIS faire
- modifier une règle sans un test associé.
- deviner l’intention métier au lieu de demander.
- simplifier une règle métier sans preuve écrite.
