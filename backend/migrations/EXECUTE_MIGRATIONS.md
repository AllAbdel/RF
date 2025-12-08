# 🚀 Migrations à exécuter

## Instructions

Exécutez ces migrations **dans l'ordre** sur votre base de données MySQL.

### Méthode 1 : Via MySQL Workbench ou phpMyAdmin
1. Ouvrez votre outil de gestion MySQL
2. Sélectionnez votre base de données
3. Copiez et exécutez le contenu de chaque fichier SQL ci-dessous

### Méthode 2 : Via ligne de commande
```bash
# Depuis le dossier backend/migrations/
mysql -u [votre_utilisateur] -p [nom_de_votre_base] < add_vehicle_terms_pdf.sql
mysql -u [votre_utilisateur] -p [nom_de_votre_base] < add_agency_profile_fields.sql
```

## 📋 Fichiers de migration

### 1. add_vehicle_terms_pdf.sql
**Objectif** : Ajouter la colonne `terms_pdf` à la table `vehicles`

Cette migration permet aux agences de télécharger un fichier PDF contenant les conditions d'utilisation pour chaque véhicule.

**Impact** :
- Ajoute une colonne `terms_pdf VARCHAR(500) NULL` dans la table `vehicles`
- Permet de stocker le chemin vers un PDF personnalisé pour chaque véhicule

### 2. add_agency_profile_fields.sql
**Objectif** : Enrichir le profil des agences

Cette migration ajoute plusieurs colonnes pour permettre aux agences de :
- Télécharger un logo
- Ajouter une description
- Configurer des liens de paiement (PayPal, Stripe, Autre)
- Télécharger des conditions générales de location en PDF
- Ajouter un site web

**Impact** :
- Ajoute 7 nouvelles colonnes à la table `agencies` :
  - `logo VARCHAR(500)` - Chemin vers le logo de l'agence
  - `description TEXT` - Présentation de l'agence
  - `payment_link_paypal VARCHAR(500)` - Lien PayPal
  - `payment_link_stripe VARCHAR(500)` - Lien Stripe
  - `payment_link_other VARCHAR(500)` - Autre lien de paiement
  - `rental_conditions_pdf VARCHAR(500)` - Conditions générales en PDF
  - `website VARCHAR(255)` - Site web de l'agence
- Crée un index sur `name` pour améliorer les performances

## ✅ Vérification

Après avoir exécuté les migrations, vérifiez que :

```sql
-- Vérifier la colonne terms_pdf dans vehicles
DESCRIBE vehicles;

-- Vérifier les nouvelles colonnes dans agencies
DESCRIBE agencies;
```

Vous devriez voir les nouvelles colonnes apparaître dans les résultats.

## 🎯 Étapes suivantes

Une fois les migrations exécutées :
1. ✅ Redémarrez le serveur backend si nécessaire
2. ✅ Testez l'upload de PDF pour les véhicules
3. ✅ Testez la modification du profil de l'agence (logo, liens de paiement, etc.)
4. ✅ Vérifiez que les fichiers sont bien sauvegardés dans les dossiers :
   - `backend/uploads/vehicles/terms/`
   - `backend/uploads/agencies/logos/`
   - `backend/uploads/agencies/terms/`

## 📝 Notes

- Les migrations sont **non-destructives** : elles n'affectent pas les données existantes
- Toutes les nouvelles colonnes sont `NULL` par défaut, donc compatibles avec les enregistrements existants
- Les dossiers de téléchargement seront créés automatiquement au premier upload
