# Guide de Migration: Système de Dettes Séparé

## Étape 1: Créer la table `debts` dans Supabase

1. Ouvrez le **Supabase SQL Editor** de votre projet
2. Copiez **tout le contenu** du fichier `docs/create-debts-table.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run** pour exécuter le script

Le script va créer:
- ✅ La table `debts` avec tous les champs
- ✅ Les index pour optimiser les requêtes
- ✅ Les politiques RLS (Row Level Security)
- ✅ Le trigger pour `updated_at`

## Étape 2: Vérifier que la table existe

Exécutez cette requête dans Supabase SQL Editor:

```sql
SELECT * FROM debts LIMIT 1;
```

Si aucune erreur n'apparaît, la table est créée avec succès!

## Étape 3: Tester l'interface

1. Démarrez votre application: `npm run dev`
2. Allez sur `/debts`
3. Cliquez sur **"Ajouter une dette"**
4. Remplissez le formulaire:
   - Nom: "Prêt auto"
   - Compte: SG
   - Mensualité: 350
   - Capital restant: 15000
   - Capital initial (optionnel): 20000
   - Taux d'intérêt (optionnel): 5.5
   - Début des paiements: 2024-01
5. Cliquez sur **"Créer"**

Vous devriez voir:
- ✅ La dette apparaître dans la liste
- ✅ Les statistiques agrégées en haut
- ✅ La projection sur 72 mois dans le tableau

## Étape 4 (Optionnel): Migrer les données existantes

Si vous avez déjà des dettes dans `recurring_charges` avec `purpose='DEBT'`, vous pouvez les migrer:

```sql
-- Migrer les dettes existantes de recurring_charges vers debts
INSERT INTO debts (
  user_id,
  label,
  account,
  monthly_payment,
  remaining_balance,
  initial_balance,
  interest_rate,
  debt_start_date,
  start_month,
  end_month,
  excluded_months,
  monthly_overrides
)
SELECT
  user_id,
  label,
  account,
  amount as monthly_payment,
  remaining_balance,
  initial_balance,
  interest_rate,
  debt_start_date,
  start_month,
  end_month,
  excluded_months,
  monthly_overrides
FROM recurring_charges
WHERE purpose = 'DEBT';

-- Vérifier la migration
SELECT COUNT(*) as total_debts FROM debts;

-- (Optionnel) Supprimer les anciennes dettes de recurring_charges
-- ATTENTION: Faites un backup avant!
-- DELETE FROM recurring_charges WHERE purpose = 'DEBT';
```

## Architecture Finale

Maintenant vous avez **deux systèmes complètement séparés**:

### 📊 Charges Récurrentes (`/recurring-charges`)
- Table: `recurring_charges`
- API: `/api/recurring-charges`
- Types: REGULAR, SAVINGS, EMERGENCY, HEALTH
- Affiche: revenus et dépenses mensuelles

### 💳 Dettes (`/debts`)
- Table: `debts`
- API: `/api/debts`
- Formulaire intégré
- Projection de remboursement sur 3-6 ans
- Calcul automatique des intérêts

## Dépannage

### Erreur: "Failed to fetch debts"
➡️ La table `debts` n'existe pas encore. Exécutez l'Étape 1.

### Erreur: "relation debts does not exist"
➡️ Le script SQL n'a pas été exécuté correctement. Vérifiez les erreurs dans Supabase.

### La page `/debts` est vide
➡️ C'est normal si vous n'avez pas encore ajouté de dette. Cliquez sur "Ajouter une dette".

### Les dettes apparaissent encore dans les charges récurrentes
➡️ Elles sont filtrées dans l'affichage mais toujours dans la base. Exécutez l'Étape 4 pour les migrer.
