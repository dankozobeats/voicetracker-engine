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

# 4. Charges fixes
- chaque charge fixe mentionne un intervalle `startMonth` / `endMonth` (`YYYY-MM`).
- elle s’applique à chaque mois compris dans cet intervalle inclusif.
- hors de son intervalle, la charge ne participe pas au calcul.

# 5. Ordre de calcul
1. ouvrir le mois avec le solde reporté précédent.
2. ajouter les revenus du mois.
3. normaliser et soustraire les dépenses non différées.
4. soustraire les charges fixes actives.
5. ajouter les différés arrivant ce mois.
6. appliquer le déficit reporté précédent.
7. calculer le `endingBalance` puis le propager comme ouverture du mois suivant.

# 6. Cas interdits
- considérer une dépense négative comme une réduction de revenu.
- diviser un déficit en fragments partiels.
- ignorer une charge fixe en cours.
- traiter un différé dans un mois autre que son `deferredTo`.

# 7. Principe de non-régression
Une règle validée reste figée tant qu’un test Vitest ne certifie pas sa mise à jour avant tout changement.
