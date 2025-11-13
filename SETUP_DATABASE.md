# Configuration de la Base de Données

## ⚠️ Problème Actuel
La base de données MySQL n'est pas démarrée. Vous devez installer et configurer MySQL.

## 🚀 Solution Rapide : XAMPP (Recommandé pour Windows)

### 1. Télécharger et Installer XAMPP
1. Téléchargez XAMPP : https://www.apachefriends.org/download.html
2. Installez XAMPP (gardez les options par défaut)
3. Lancez XAMPP Control Panel

### 2. Démarrer MySQL
1. Dans XAMPP Control Panel, cliquez sur "Start" pour MySQL
2. Le port par défaut est 3306

### 3. Créer la Base de Données
1. Ouvrez votre navigateur et allez sur : http://localhost/phpmyadmin
2. Cliquez sur "Nouvelle base de données"
3. Nom : `car_rental`
4. Interclassement : `utf8mb4_general_ci`
5. Cliquez sur "Créer"

### 4. Importer le Schéma de la Base
1. Sélectionnez la base `car_rental` dans phpMyAdmin
2. Cliquez sur l'onglet "SQL"
3. Copiez le contenu du fichier `backend/database.sql`
4. Collez-le dans la zone de texte
5. Cliquez sur "Exécuter"

### 5. (Optionnel) Importer les Données de Test
1. Dans l'onglet "SQL"
2. Copiez le contenu de `backend/test-data.sql`
3. Collez et exécutez

### 6. Vérifier la Configuration
Vérifiez que le fichier `backend/.env` contient :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=car_rental
```

**Note :** Par défaut, XAMPP n'a pas de mot de passe pour root. Si vous avez défini un mot de passe, mettez-le dans `DB_PASSWORD`.

### 7. Redémarrer le Backend
```bash
cd backend
npm start
```

## 🔄 Alternative : MySQL Standalone

### 1. Télécharger MySQL
https://dev.mysql.com/downloads/installer/

### 2. Installer MySQL
- Choisissez "Developer Default"
- Définissez un mot de passe root (ex: 12345678)
- Gardez le port par défaut (3306)

### 3. Configurer le fichier .env
Mettez à jour `backend/.env` :
```
DB_PASSWORD=VotreMotDePasse
```

### 4. Créer la Base de Données
Ouvrez MySQL Workbench ou le terminal MySQL :
```sql
CREATE DATABASE car_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE car_rental;
SOURCE E:/Perso/RentFlow-V2/backend/database.sql;
SOURCE E:/Perso/RentFlow-V2/backend/test-data.sql;
```

## ✅ Vérification
Une fois MySQL configuré, vous devriez voir :
- Backend : `Serveur démarré sur le port 5000` (sans erreurs ECONNREFUSED)
- Frontend : Liste des véhicules disponibles
- Connexion/Inscription fonctionnelle

## 🆘 Besoin d'Aide ?
Si vous avez des erreurs, vérifiez :
1. MySQL est bien démarré
2. Le fichier .env a les bonnes informations
3. La base de données `car_rental` existe
4. Les tables ont été créées
