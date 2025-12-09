# 📚 Documentation RentFlow

Bienvenue dans la documentation complète de RentFlow !

## 📖 Organisation

La documentation est organisée par thématiques pour faciliter la navigation :

### 📁 Structure

```
documentations/
├── 01-Installation/     # Installation et démarrage rapide
├── 02-Configuration/    # Configuration base de données, SMTP, etc.
├── 03-Securite/        # Sécurité, authentification, migrations
├── 04-Tests/           # Guides de test et scripts
├── 05-Deploiement/     # Déploiement et commandes
├── 06-Fonctionnalites/ # Nouvelles fonctionnalités et instructions
└── README.md           # Ce fichier
```

---

## 🚀 01. Installation

**📄 Documents disponibles :**
- [QUICKSTART.md](01-Installation/QUICKSTART.md) - Guide de démarrage rapide
- [LISEZ-MOI-EN-PREMIER.md](01-Installation/LISEZ-MOI-EN-PREMIER.md) - Instructions initiales
- [00-LIRE-EN-PREMIER.txt](01-Installation/00-LIRE-EN-PREMIER.txt) - Prérequis

**Pour commencer :**
1. Installer XAMPP (MySQL + Apache)
2. Installer Node.js
3. Cloner le projet
4. Lancer `.\start-all.ps1`

---

## ⚙️ 02. Configuration

**📄 Documents disponibles :**
- [CONFIGURATION_SMTP.md](02-Configuration/CONFIGURATION_SMTP.md) - Configuration des emails
- [SETUP_DATABASE.md](02-Configuration/SETUP_DATABASE.md) - Configuration base de données
- [PROBLEME-BDD.md](02-Configuration/PROBLEME-BDD.md) - Résolution problèmes BDD

**Points clés :**
- Configuration du fichier `.env`
- Paramétrage SMTP pour Gmail
- Création et migration de la base de données

---

## 🔒 03. Sécurité

**📄 Documents disponibles :**
- [SECURITY_INSTALLATION.md](03-Securite/SECURITY_INSTALLATION.md) - Installation des fonctionnalités de sécurité
- [MIGRATION_GUIDE.md](03-Securite/MIGRATION_GUIDE.md) - Guide de migration base de données
- [IMPLEMENTATION_COMPLETE.md](03-Securite/IMPLEMENTATION_COMPLETE.md) - Détails de l'implémentation backend
- [FRONTEND_IMPLEMENTATION.md](03-Securite/FRONTEND_IMPLEMENTATION.md) - Détails de l'implémentation frontend

**Fonctionnalités de sécurité :**
- ✅ Vérification email avec tokens
- ✅ Authentification 2FA (TOTP)
- ✅ Politique de mots de passe forts
- ✅ Historique des 5 derniers mots de passe
- ✅ Réinitialisation mot de passe (expiration 1h)
- ✅ Rate limiting (5 tentatives/15min)
- ✅ JWT avec refresh tokens (24h/7j)
- ✅ Sécurité uploads (MIME validation, antivirus)

---

## 🧪 04. Tests

**📄 Documents disponibles :**
- [GUIDE_TEST.md](04-Tests/GUIDE_TEST.md) - Guide complet de test
- [TEST_SCRIPTS.md](04-Tests/TEST_SCRIPTS.md) - Scripts de test disponibles
- [TESTING_GUIDE.md](04-Tests/TESTING_GUIDE.md) - Méthodologie de test

**Scripts utiles :**
```powershell
# Vérifier la base de données
node backend/check-db.js

# Importer les données de test
node backend/import-test-data.js

# Tester l'envoi d'emails
node backend/test-email.js

# Vérifier tous les utilisateurs
node backend/verify-users.js
```

**Comptes de test :**
- Client : `client1@email.fr` / `password123`
- Agence : `admin@premium-paris.fr` / `password123`

---

## 🚢 05. Déploiement

**📄 Documents disponibles :**
- [DEPLOYMENT_COMPLETE.md](05-Deploiement/DEPLOYMENT_COMPLETE.md) - Guide de déploiement
- [DEPLOYMENT.md](05-Deploiement/DEPLOYMENT.md) - Instructions détaillées
- [COMMANDS.md](05-Deploiement/COMMANDS.md) - Commandes disponibles
- [SCRIPTS_README.md](05-Deploiement/SCRIPTS_README.md) - Documentation des scripts
- [SCRIPTS_POWERSHELL.md](05-Deploiement/SCRIPTS_POWERSHELL.md) - Guide d'utilisation des scripts

**Commandes principales :**
```powershell
# Démarrer tout (silencieux)
.\start-all.ps1

# Arrêter les serveurs
Get-Process -Name node | Stop-Process -Force

# Mode debug
.\start-debug.ps1
```

---

## ✨ 06. Fonctionnalités

**📄 Documents disponibles :**
- [NOUVELLES_FONCTIONNALITES.md](06-Fonctionnalites/NOUVELLES_FONCTIONNALITES.md) - Nouvelles fonctionnalités
- [FEATURES.md](06-Fonctionnalites/FEATURES.md) - Liste complète des fonctionnalités
- [VEHICLE_ADDRESSES_INSTRUCTIONS.md](06-Fonctionnalites/VEHICLE_ADDRESSES_INSTRUCTIONS.md) - Gestion des adresses

**Fonctionnalités principales :**
- 🚗 Gestion de véhicules avec images multiples
- 📅 Système de réservations
- 💬 Messagerie en temps réel (Socket.io)
- ⭐ Système d'avis et notes
- 🏢 Gestion multi-agences
- 👥 Gestion membres d'agence
- 🔍 Recherche et filtres avancés
- 📊 Dashboard statistiques

---

## 🛠️ Technologies utilisées

### Backend
- **Node.js** + Express.js
- **MySQL** (avec mysql2)
- **JWT** pour l'authentification
- **Socket.io** pour le temps réel
- **Nodemailer** pour les emails
- **Speakeasy** pour 2FA
- **bcrypt** pour le hashing

### Frontend
- **React** 18
- **React Router** pour la navigation
- **Axios** pour les requêtes HTTP
- **Socket.io-client** pour le temps réel
- **CSS** personnalisé avec variables

---

## 📞 Support

Pour toute question ou problème :

1. **Consulter la documentation appropriée** dans les dossiers ci-dessus
2. **Vérifier les logs** : Backend affiche les erreurs dans le terminal
3. **Tester la configuration** : Utiliser les scripts de test

---

## 🔄 Mises à jour

**Dernière mise à jour :** 9 décembre 2025

**Changements récents :**
- ✅ Ajout authentification 2FA
- ✅ Vérification email obligatoire
- ✅ Configuration SMTP fonctionnelle
- ✅ Rate limiting adaptatif (dev/prod)
- ✅ Mode développement simplifié
- ✅ Documentation réorganisée

---

**Bon développement ! 🚀**
