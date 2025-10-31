# 🚀 Guide de Déploiement en Production

## 📋 Checklist Avant Déploiement

### Sécurité
- [ ] Changer JWT_SECRET par une vraie clé secrète forte
- [ ] Utiliser des variables d'environnement pour toutes les clés sensibles
- [ ] Activer HTTPS (obligatoire en production)
- [ ] Configurer CORS correctement (domaines autorisés uniquement)
- [ ] Mettre en place des rate limiting
- [ ] Ajouter helmet.js pour sécuriser les headers HTTP
- [ ] Valider toutes les entrées utilisateur
- [ ] Mettre en place des logs de sécurité

### Base de Données
- [ ] Créer un utilisateur MySQL dédié (pas root)
- [ ] Configurer les backups automatiques
- [ ] Optimiser les index
- [ ] Mettre en place une stratégie de sauvegarde
- [ ] Tester la restauration des backups
- [ ] Configurer les connexions SSL pour MySQL

### Performance
- [ ] Activer la compression gzip
- [ ] Mettre en place un CDN pour les images
- [ ] Optimiser les images (compression, format WebP)
- [ ] Configurer le cache
- [ ] Minimiser et bundler le frontend
- [ ] Mettre en place un reverse proxy (Nginx)

## 🌐 Options de Déploiement

### Option 1: VPS (Digital Ocean, OVH, Contabo)

**Avantages**: Contrôle total, prix fixe
**Coût**: 5-20€/mois

#### Configuration Serveur Ubuntu

```bash
# 1. Mise à jour du système
sudo apt update && sudo apt upgrade -y

# 2. Installation Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Installation MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# 4. Installation PM2 (Process Manager)
sudo npm install -g pm2

# 5. Installation Nginx
sudo apt install -y nginx

# 6. Cloner le projet
git clone votre-repo.git
cd car-rental-platform

# 7. Configuration Backend
cd backend
npm install --production
cp .env.example .env
# Éditer .env avec les bonnes valeurs

# 8. Configuration Frontend
cd ../frontend
npm install
npm run build

# 9. Démarrer le backend avec PM2
cd ../backend
pm2 start server.js --name "car-rental-api"
pm2 startup
pm2 save

# 10. Configurer Nginx
sudo nano /etc/nginx/sites-available/car-rental
```

#### Configuration Nginx

```nginx
# Backend API
server {
    listen 80;
    server_name api.votredomaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend
server {
    listen 80;
    server_name votredomaine.com www.votredomaine.com;
    root /chemin/vers/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/car-rental /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Configurer HTTPS avec Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votredomaine.com -d www.votredomaine.com -d api.votredomaine.com
```

### Option 2: Heroku (Backend) + Netlify (Frontend)

**Avantages**: Déploiement facile, gratuit pour commencer
**Coût**: Gratuit → 7$/mois

#### Backend sur Heroku

```bash
# 1. Installer Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Se connecter
heroku login

# 3. Créer l'app
cd backend
heroku create votre-app-name

# 4. Ajouter MySQL addon
heroku addons:create jawsdb:kitefin

# 5. Configurer les variables d'environnement
heroku config:set JWT_SECRET=votre_secret
heroku config:set NODE_ENV=production

# 6. Déployer
git push heroku main

# 7. Importer la base de données
heroku run bash
mysql -h host -u user -p database < database.sql
```

#### Frontend sur Netlify

```bash
# 1. Build du frontend
cd frontend
npm run build

# 2. Déployer (via Netlify CLI ou interface web)
# Ou connecter votre repo GitHub à Netlify

# Build command: npm run build
# Publish directory: build
```

### Option 3: Docker + Docker Compose

**Avantages**: Portabilité, isolation
**Coût**: Dépend de l'hébergement

#### Dockerfile Backend

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

#### Dockerfile Frontend

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: car_rental
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/database.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: car_rental
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "5000:5000"
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

## 🔧 Configuration Production

### Backend (.env.production)

```env
NODE_ENV=production
PORT=5000
DB_HOST=votre_host_mysql
DB_USER=votre_user_mysql
DB_PASSWORD=votre_password_securise
DB_NAME=car_rental
JWT_SECRET=une_cle_tres_securisee_au_moins_32_caracteres
JWT_EXPIRE=7d
FRONTEND_URL=https://votredomaine.com
```

### Frontend (src/services/api.js)

```javascript
// Changer l'URL de l'API
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.votredomaine.com/api'
  : 'http://localhost:5000/api';
```

## 📊 Monitoring et Logs

### Avec PM2

```bash
# Logs
pm2 logs car-rental-api

# Monitoring
pm2 monit

# Status
pm2 status
```

### Outils Recommandés

- **Monitoring**: New Relic, Datadog
- **Logs**: Loggly, Papertrail
- **Uptime**: UptimeRobot
- **Erreurs**: Sentry

## 🔒 Sécurité Additionnelle

### Ajouter dans backend/server.js

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Helmet pour sécuriser les headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite à 100 requêtes par IP
});
app.use('/api/', limiter);
```

## 📈 Optimisations

### Images

```bash
# Compresser les images avant upload
npm install sharp

# Dans backend/middleware/upload.js
const sharp = require('sharp');

// Redimensionner et compresser
await sharp(file.path)
  .resize(1200, 800, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toFile(outputPath);
```

### Base de Données

```sql
-- Créer des index pour les requêtes fréquentes
CREATE INDEX idx_vehicles_search ON vehicles(brand, model, fuel_type);
CREATE INDEX idx_reservations_dates ON reservations(start_date, end_date, status);
```

## 🎯 Checklist Post-Déploiement

- [ ] Tester toutes les fonctionnalités
- [ ] Vérifier les certificats SSL
- [ ] Configurer les backups automatiques
- [ ] Mettre en place le monitoring
- [ ] Tester les performances
- [ ] Vérifier les logs d'erreur
- [ ] Configurer les alertes
- [ ] Documenter la configuration
- [ ] Créer un plan de disaster recovery

## 🆘 Dépannage Commun

**Erreur de connexion MySQL**
→ Vérifier les credentials et le firewall

**CORS errors**
→ Vérifier la configuration CORS dans backend

**Images ne s'affichent pas**
→ Vérifier les permissions du dossier uploads

**Socket.io ne se connecte pas**
→ Vérifier la configuration du proxy Nginx pour WebSocket

## 📞 Support

Pour toute question sur le déploiement, consultez :
- La documentation officielle de Node.js
- Les forums Stack Overflow
- La documentation de votre hébergeur

---

**Bon déploiement ! 🚀**
