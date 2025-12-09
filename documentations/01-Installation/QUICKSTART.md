# 🚀 Guide de Démarrage Rapide

## ⚡ Installation en 5 minutes

### 1️⃣ Base de données (2 min)

Ouvrez MySQL et exécutez :
```sql
CREATE DATABASE car_rental;
USE car_rental;
SOURCE /chemin/vers/backend/database.sql;
```

Ou via ligne de commande :
```bash
mysql -u root -p < backend/database.sql
```

### 2️⃣ Backend (1 min)

```bash
cd backend
npm install
cp .env.example .env
# Éditez le .env avec vos informations MySQL
npm run dev
```

✅ Backend prêt sur http://localhost:5000

### 3️⃣ Frontend (1 min)

```bash
cd frontend
npm install
npm start
```

✅ Application prête sur http://localhost:3000

### 4️⃣ Créez votre premier compte (1 min)

1. Ouvrez http://localhost:3000
2. Choisissez "Client" ou "Agence"
3. Remplissez le formulaire d'inscription
4. Connectez-vous et explorez ! 🎉

## 🔑 Configuration .env Minimale

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mdp
DB_NAME=car_rental
JWT_SECRET=changez_moi_par_une_vraie_cle_secrete
JWT_EXPIRE=7d
```

## 📝 Premiers Tests

### Tester en tant qu'Agence
1. Inscrivez-vous comme agence
2. Ajoutez un véhicule avec des images
3. Attendez une réservation client
4. Gérez les réservations depuis le dashboard

### Tester en tant que Client
1. Inscrivez-vous comme client
2. Recherchez des véhicules disponibles
3. Réservez un véhicule pour des dates spécifiques
4. Suivez vos réservations

## 🐛 Problèmes courants

**Erreur de connexion MySQL ?**
- Vérifiez que MySQL est démarré
- Vérifiez vos identifiants dans .env

**Port 5000 déjà utilisé ?**
- Changez PORT dans .env
- Mettez à jour l'URL dans frontend/src/services/api.js

**Erreur CORS ?**
- Vérifiez que le backend est bien démarré
- L'URL du backend dans le frontend doit être correcte

## ✨ Fonctionnalités à Tester

### Client
- [x] Recherche avec filtres avancés
- [x] Réservation avec sélection de dates
- [x] Annulation de réservation
- [x] Historique des réservations
- [x] Système d'avis (après réservation terminée)

### Agence
- [x] Ajout de véhicules (10 images max)
- [x] Modification/Suppression de véhicules
- [x] Acceptation/Refus de réservations
- [x] Invitation de membres d'équipe
- [x] Gestion des rôles (Super Admin, Admin, Membre)
- [x] Dashboard avec statistiques
- [x] Vue des revenus totaux

## 🎯 Prochaines Étapes

1. **Explorez le code** : Structure claire et commentée
2. **Personnalisez** : Ajoutez vos propres fonctionnalités
3. **Déployez** : Prêt pour la production (ajoutez HTTPS)
4. **Améliorez** : Consultez la section "Améliorations Futures" du README

## 🆘 Besoin d'Aide ?

- Consultez le README.md complet
- Vérifiez la structure des dossiers
- Examinez les commentaires dans le code
- Testez les endpoints API avec Postman

---

**Bon développement ! 🚀**
