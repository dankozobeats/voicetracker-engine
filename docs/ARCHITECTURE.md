# 1. Vue d’ensemble
`voicetracker-engine` est une librairie TypeScript de calcul financier, déterministe et sans état partagé ; elle produit des projections mensuelles strictement basées sur les entrées fournies.

# 2. Découpage des modules
- `engine/calculator.ts` : assemble les transactions et charges par mois, normalise les dépenses, et orchestre l’appel au handler de déficit.
- `engine/deficit-handler.ts` : applique la règle de report de découvert d’un mois à l’autre sans toucher aux autres parties du calcul.
- `engine/utils/*` : contient les helpers de gestion du temps (conversion `YYYY-MM`, ajout de mois, etc.) utilisés par le calculateur et le handler.
- `engine/types.ts` : définit les types partagés (transactions, charges récurrentes, projections) pour assurer la cohérence du contract entre modules.

# 3. Flux de données
Entrées (transactions, charges récurrentes, mois de départ, solde initial) → `calculator.ts` calcule revenus/dépenses/fixes/différés → `deficit-handler` applique le report → sortie : liste de `MonthProjection` avec solde final par mois. Aucun état global n’est conservé.

# 4. Gestion du temps
Toutes les références temporelles utilisent le format `YYYY-MM`. Chaque itération correspond à un mois calendaire complet, ce qui garantit un traitement uniforme des charges fixes et des différés.

# 5. Responsabilités par fichier
- `calculator.ts` : orchestration multi-mois.
- `deficit-handler.ts` : règles de report du découvert.
- `utils/date.ts` : mathématiques des mois.
- `types.ts` : objets partagés.
- `analysis.ts` : couche IA interprétative pure qui lit les projections et alertes pour produire des insights textuels.

# 6. Ce que le moteur NE FAIT PAS
- pas d’interface utilisateur.
- pas de base de données ni cache métier.
- pas d’authentification ou autorisation.
- pas d’appels réseaux vers des API externes.

# 8. Évolutivité contrôlée
Ajouter une règle implique :
1. mettre à jour les types si nécessaire ;
2. enrichir `calculator.ts` ou `deficit-handler.ts` de façon pure ;
3. couvrir la règle avec un test Vitest ;
4. documenter la règle dans `docs/CODEX.md`.


# 9. Évolutivité contrôlée
“La couche d’analyse dépend exclusivement des métadonnées d’alertes, jamais du contexte d’exécution.”