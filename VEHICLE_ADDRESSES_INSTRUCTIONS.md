# Instructions pour ajouter les adresses de récupération et dépôt

## ✅ Modifications effectuées :

### Backend :
- ✅ Contrôleur de véhicules mis à jour (`createVehicle` et `updateVehicle`)
- ✅ Nouveaux champs : `pickup_address` et `return_address`

### Frontend :
- ✅ Formulaire de véhicule mis à jour avec les champs d'adresses
- ✅ Page de détails du véhicule affiche les adresses
- ✅ CSS ajouté pour le style des adresses

## 🗄️ Migration SQL à exécuter :

**Ouvrez phpMyAdmin et exécutez ce SQL dans la base `car_rental` :**

```sql
USE car_rental;

ALTER TABLE vehicles 
ADD COLUMN pickup_address TEXT NULL AFTER location,
ADD COLUMN return_address TEXT NULL AFTER pickup_address;
```

## 📝 Utilisation :

Après avoir exécuté la migration SQL :

1. **Créer/Modifier un véhicule** : Les champs "Adresse de récupération" et "Adresse de dépôt/retour" sont maintenant obligatoires
2. **Page de détails** : Les adresses s'affichent dans une section dédiée avec des icônes 🚗 et 🏁
3. **Fallback** : Si les adresses ne sont pas renseignées, le système utilisera le champ "Localisation" par défaut

## 🔄 Note importante :

Les véhicules existants n'ont pas ces adresses. Vous devrez les modifier pour ajouter ces informations.
