# 🔧 Aide-Mémoire - Commandes Utiles

## 📦 Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos paramètres
```

### Frontend
```bash
cd frontend
npm install
```

### Base de Données
```bash
# Créer la base de données
mysql -u root -p -e "CREATE DATABASE car_rental;"

# Importer le schéma
mysql -u root -p car_rental < backend/database.sql

# (Optionnel) Importer les données de test
mysql -u root -p car_rental < backend/test-data.sql
```

## 🚀 Démarrage

### Mode Développement

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Serveur sur http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm start
# Application sur http://localhost:3000
```

### Mode Production

```bash
# Backend avec PM2
cd backend
pm2 start server.js --name car-rental-api
pm2 logs car-rental-api

# Frontend - Build
cd frontend
npm run build
# Les fichiers sont dans le dossier build/
```

## 🗄️ Base de Données

### Commandes MySQL Utiles

```bash
# Se connecter à MySQL
mysql -u root -p

# Lister les bases de données
SHOW DATABASES;

# Utiliser la base de données
USE car_rental;

# Lister les tables
SHOW TABLES;

# Voir la structure d'une table
DESCRIBE vehicles;

# Voir toutes les données d'une table
SELECT * FROM vehicles;

# Compter les enregistrements
SELECT COUNT(*) FROM users;

# Sauvegarder la base de données
mysqldump -u root -p car_rental > backup.sql

# Restaurer la base de données
mysql -u root -p car_rental < backup.sql

# Supprimer toutes les données (ATTENTION!)
TRUNCATE TABLE reservations;

# Réinitialiser complètement
DROP DATABASE car_rental;
CREATE DATABASE car_rental;
mysql -u root -p car_rental < backend/database.sql
```

### Requêtes Utiles

```sql
-- Voir tous les véhicules disponibles
SELECT * FROM vehicles WHERE status = 'available';

-- Voir toutes les réservations en attente
SELECT r.*, v.brand, v.model, u.first_name, u.last_name
FROM reservations r
JOIN vehicles v ON r.vehicle_id = v.id
JOIN users u ON r.client_id = u.id
WHERE r.status = 'pending';

-- Voir les statistiques d'une agence
SELECT 
    COUNT(DISTINCT v.id) as total_vehicles,
    COUNT(r.id) as total_reservations,
    SUM(r.total_price) as total_revenue
FROM vehicles v
LEFT JOIN reservations r ON v.id = r.vehicle_id
WHERE v.agency_id = 1;

-- Voir les véhicules les mieux notés
SELECT v.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
FROM vehicles v
LEFT JOIN reviews r ON v.id = r.vehicle_id
GROUP BY v.id
ORDER BY avg_rating DESC;
```

## 🔍 Debugging

### Backend

```bash
# Voir les logs en temps réel
npm run dev

# Voir les logs PM2
pm2 logs car-rental-api

# Redémarrer le serveur PM2
pm2 restart car-rental-api

# Voir le statut
pm2 status

# Arrêter le serveur
pm2 stop car-rental-api

# Supprimer de PM2
pm2 delete car-rental-api
```

### Frontend

```bash
# Mode développement avec hot reload
npm start

# Build de production
npm run build

# Nettoyer le cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Tester l'API avec curl

```bash
# Test de connexion serveur
curl http://localhost:5000/

# Inscription
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "phone": "0612345678",
    "user_type": "client"
  }'

# Connexion
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "password": "password123",
    "user_type": "client"
  }'

# Récupérer les véhicules (avec token)
curl http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 🐛 Résolution de Problèmes

### Erreur: Port 5000 déjà utilisé
```bash
# Trouver le processus
lsof -i :5000
# ou
netstat -ano | findstr :5000

# Tuer le processus
kill -9 PID
# ou sur Windows
taskkill /PID PID /F

# Ou changer le port dans .env
PORT=5001
```

### Erreur: Cannot connect to MySQL
```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql
# ou
brew services list

# Démarrer MySQL
sudo systemctl start mysql
# ou
brew services start mysql

# Vérifier les credentials dans .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=car_rental
```

### Erreur: CORS
```javascript
// Dans backend/server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Images ne s'affichent pas
```bash
# Vérifier les permissions
chmod -R 755 backend/uploads

# Vérifier que le dossier existe
mkdir -p backend/uploads/vehicles
```

## 🧹 Nettoyage

```bash
# Nettoyer node_modules
rm -rf backend/node_modules frontend/node_modules

# Nettoyer les builds
rm -rf frontend/build

# Nettoyer les uploads (ATTENTION!)
rm -rf backend/uploads/vehicles/*

# Réinstaller tout
cd backend && npm install
cd ../frontend && npm install
```

## 📊 Monitoring

### Avec PM2
```bash
# Dashboard en temps réel
pm2 monit

# Logs en temps réel
pm2 logs --lines 100

# Statistiques
pm2 list
```

### Logs Système
```bash
# Logs système (Linux)
tail -f /var/log/mysql/error.log
tail -f /var/log/nginx/error.log

# Logs Node.js
tail -f backend/error.log
```

## 🔐 Sécurité

### Générer un JWT Secret sécurisé
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# Python
python -c "import secrets; print(secrets.token_hex(64))"
```

### Hasher un mot de passe
```javascript
// Dans Node.js
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('password', 10);
console.log(hash);
```

## 🔄 Git

```bash
# Initialiser le repo
git init
git add .
git commit -m "Initial commit - Car rental platform"

# Ajouter remote
git remote add origin https://github.com/votre-username/car-rental.git
git push -u origin main

# .gitignore recommandé
cat > .gitignore << EOF
node_modules/
.env
*.log
uploads/
build/
.DS_Store
EOF
```

## 📦 Backup

### Backup complet
```bash
# Créer un backup
mkdir backup-$(date +%Y%m%d)
mysqldump -u root -p car_rental > backup-$(date +%Y%m%d)/database.sql
cp -r backend/uploads backup-$(date +%Y%m%d)/
tar -czf backup-$(date +%Y%m%d).tar.gz backup-$(date +%Y%m%d)
```

### Restaurer un backup
```bash
# Extraire
tar -xzf backup-20240101.tar.gz

# Restaurer la base de données
mysql -u root -p car_rental < backup-20240101/database.sql

# Restaurer les uploads
cp -r backup-20240101/uploads backend/
```

## 🧪 Tests

### Tester manuellement
```bash
# 1. Créer un compte client
# 2. Créer un compte agence
# 3. Ajouter un véhicule
# 4. Réserver le véhicule
# 5. Accepter la réservation
# 6. Envoyer des messages
# 7. Laisser un avis
```

### Endpoints à tester
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- GET /api/vehicles
- POST /api/vehicles (agence)
- POST /api/reservations (client)
- GET /api/reservations/agency
- PUT /api/reservations/:id/status

## 📱 URLs Importantes

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api
- MySQL: localhost:3306

## 🆘 Aide Rapide

```bash
# Tout réinitialiser
npm run reset  # (à créer dans package.json)

# Voir les logs d'erreur
cat backend/error.log | tail -n 50

# Tester la connexion DB
mysql -u root -p -e "USE car_rental; SELECT 'OK';"

# Vérifier les ports utilisés
netstat -tuln | grep LISTEN
```

---

**💡 Astuce**: Gardez ce fichier à portée de main pendant le développement !
