# 🚗 Plateforme de Location de Voitures

Une application web complète pour la gestion de location de voitures, permettant aux agences de gérer leurs véhicules et aux clients de réserver des voitures.

## 📋 Fonctionnalités

### Pour les Clients
- ✅ Recherche et filtrage de véhicules (par prix, carburant, localisation)
- ✅ Réservation de véhicules avec sélection de dates
- ✅ Gestion des réservations (modification, annulation)
- ✅ Historique des réservations
- ✅ Système d'avis et de notation
- ✅ Messagerie avec les agences

### Pour les Agences
- ✅ Dashboard de gestion complet
- ✅ CRUD complet des véhicules (ajout, modification, suppression)
- ✅ Gestion des réservations (acceptation, refus)
- ✅ Statistiques et analytics
- ✅ Gestion des membres de l'agence avec système de rôles
- ✅ Système de notifications en temps réel

## 🛠️ Technologies Utilisées

### Backend
- Node.js + Express.js
- MySQL (base de données)
- JWT (authentification)
- Socket.io (messagerie temps réel)
- Multer (upload de fichiers)
- Bcrypt (hashage de mots de passe)

### Frontend
- React 18
- React Router (navigation)
- Axios (API calls)
- Socket.io-client (temps réel)
- CSS moderne et responsive

## 📦 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- MySQL (v5.7 ou supérieur)
- npm ou yarn

### 1. Configuration de la base de données

1. Créez une base de données MySQL :
```bash
mysql -u root -p
```

2. Importez le schéma :
```bash
mysql -u root -p car_rental < backend/database.sql
```

### 2. Installation du Backend

```bash
cd backend
npm install
```

Créez un fichier `.env` :
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=car_rental

JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRE=7d

UPLOAD_PATH=./uploads
```

Lancez le serveur :
```bash
npm run dev
```

Le serveur démarre sur http://localhost:5000

### 3. Installation du Frontend

```bash
cd frontend
npm install
```

Lancez l'application :
```bash
npm start
```

L'application démarre sur http://localhost:3000

## 🎯 Utilisation

### Première connexion

#### En tant que Client
1. Cliquez sur "Client"
2. Inscrivez-vous avec vos informations
3. Recherchez des véhicules et effectuez des réservations

#### En tant qu'Agence
1. Cliquez sur "Agence"
2. Inscrivez-vous en créant votre agence
3. Ajoutez vos véhicules
4. Gérez les réservations et votre équipe

### Structure des Rôles d'Agence

- **Super Admin** : Accès complet, peut gérer les membres et leurs rôles
- **Admin** : Peut inviter des membres, gérer les véhicules et réservations
- **Membre** : Peut gérer les véhicules et réservations

## 📂 Structure du Projet

```
car-rental-platform/
├── backend/
│   ├── config/          # Configuration DB
│   ├── controllers/     # Logique métier
│   ├── middleware/      # Authentification, upload
│   ├── models/          # (futurs modèles)
│   ├── routes/          # Routes API
│   ├── uploads/         # Fichiers uploadés
│   ├── database.sql     # Schéma SQL
│   └── server.js        # Point d'entrée
│
├── frontend/
│   ├── public/          # Fichiers statiques
│   └── src/
│       ├── components/  # Composants React
│       ├── contexts/    # Context API (Auth)
│       ├── pages/       # Pages principales
│       ├── services/    # API & Socket.io
│       ├── styles/      # CSS modules
│       ├── App.js       # App principale
│       └── index.js     # Point d'entrée
│
└── README.md
```

## 🔌 API Endpoints

### Authentification
- POST `/api/auth/register` - Inscription
- POST `/api/auth/login` - Connexion
- GET `/api/auth/profile` - Profil utilisateur

### Véhicules
- GET `/api/vehicles` - Liste des véhicules (avec filtres)
- GET `/api/vehicles/:id` - Détails d'un véhicule
- POST `/api/vehicles` - Ajouter un véhicule (Agence)
- PUT `/api/vehicles/:id` - Modifier un véhicule (Agence)
- DELETE `/api/vehicles/:id` - Supprimer un véhicule (Agence)

### Réservations
- POST `/api/reservations` - Créer une réservation (Client)
- GET `/api/reservations/client` - Mes réservations (Client)
- GET `/api/reservations/agency` - Réservations de l'agence
- PUT `/api/reservations/:id/status` - Changer le statut (Agence)
- PUT `/api/reservations/:id/cancel` - Annuler une réservation (Client)

### Messagerie
- POST `/api/messages/conversation` - Créer/récupérer conversation
- GET `/api/messages/conversations` - Liste des conversations
- GET `/api/messages/conversation/:id` - Messages d'une conversation
- POST `/api/messages/send` - Envoyer un message

### Agence
- GET `/api/agency/members` - Liste des membres
- POST `/api/agency/members/invite` - Inviter un membre
- PUT `/api/agency/members/:id/role` - Changer le rôle
- DELETE `/api/agency/members/:id` - Retirer un membre
- GET `/api/agency/stats` - Statistiques

## 🔒 Sécurité

- Authentification JWT sécurisée
- Mots de passe hashés avec bcrypt
- Validation des entrées
- Protection CORS
- Gestion des rôles et permissions
- Upload de fichiers sécurisé

## 🚀 Améliorations Futures

- [ ] Intégration de paiement (Stripe)
- [ ] Carte interactive avec localisation
- [ ] Notifications push
- [ ] Export PDF des réservations
- [ ] Système de favoris
- [ ] Chat en temps réel amélioré
- [ ] Application mobile (React Native)
- [ ] Système de parrainage
- [ ] Multi-langue

## 🐛 Problèmes Connus

- Les images des véhicules doivent être au format JPG, PNG ou WEBP
- Le chat nécessite une connexion Socket.io stable
- La pagination n'est pas encore implémentée

## 📝 Notes

- Les réservations sont en mode "premier arrivé, premier servi"
- Un véhicule ne peut pas avoir plusieurs réservations actives en même temps
- Les avis ne peuvent être laissés qu'après la fin d'une réservation

## 👥 Contribution

Ce projet a été créé comme une démo complète d'une plateforme de location de voitures.

## 📄 Licence

Ce projet est sous licence MIT.

---

**Développé avec ❤️ pour démontrer une architecture full-stack moderne**
