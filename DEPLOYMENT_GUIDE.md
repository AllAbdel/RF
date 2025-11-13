# 🚀 Guide de Déploiement RentFlow en Production

## ⚠️ Important
Les scripts `start.ps1` et `stop.ps1` sont **uniquement pour le développement local**.
En production, le site tournera **automatiquement 24/7** sans intervention.

---

## 🌐 Options de Déploiement

### ⭐ Option 1 : Railway (Recommandé - Le plus simple)

**Avantages** :
- ✅ Gratuit pour commencer (500h/mois)
- ✅ Déploiement automatique depuis GitHub
- ✅ Base de données MySQL incluse
- ✅ SSL/HTTPS automatique
- ✅ Aucune configuration serveur
- ✅ Le site tourne 24/7 automatiquement

**Étapes** :
1. Créer un compte sur https://railway.app
2. Connecter le repository GitHub
3. Créer un projet MySQL
4. Déployer le backend
5. Déployer le frontend
6. Configurer les variables d'environnement
7. C'est en ligne !

**Coût** : Gratuit jusqu'à 500h, puis ~$5-10/mois

---

### 🔷 Option 2 : Render

**Avantages** :
- ✅ Plan gratuit disponible
- ✅ Déploiement Git automatique
- ✅ Base de données PostgreSQL/MySQL
- ✅ SSL automatique

**Étapes** :
1. Créer un compte sur https://render.com
2. Créer un service Web pour le backend
3. Créer un service Static Site pour le frontend
4. Créer une base de données MySQL
5. Configurer les variables d'environnement

**Coût** : Gratuit avec limitations, puis $7/mois par service

---

### 🖥️ Option 3 : VPS (Pour plus de contrôle)

**Providers** : DigitalOcean, OVH, Hostinger, AWS EC2, Linode...

**Avantages** :
- ✅ Contrôle total
- ✅ Performance optimale
- ✅ Évolutivité

**Ce qui sera installé sur le serveur** :
- Node.js + PM2 (gestionnaire de processus)
- MySQL
- Nginx (serveur web)
- Certificat SSL (Let's Encrypt)

**Le site tournera automatiquement** :
```bash
# PM2 démarre automatiquement au boot du serveur
pm2 startup
pm2 start backend/server.js --name rentflow-backend
pm2 save

# MySQL est configuré comme service système
systemctl enable mysql
systemctl start mysql

# Nginx sert le frontend et proxy le backend
```

**Coût** : À partir de $5-6/mois

---

## 📦 Fichiers de Configuration à Préparer

### 1. Variables d'environnement Production (.env.production)
```env
# Base de données
DB_HOST=votre-db-host.railway.app
DB_USER=root
DB_PASSWORD=mot_de_passe_securise
DB_NAME=car_rental

# JWT
JWT_SECRET=cle_secrete_tres_longue_et_complexe
JWT_EXPIRE=7d

# URLs
FRONTEND_URL=https://rentflow.com
BACKEND_URL=https://api.rentflow.com

# Upload
UPLOAD_PATH=./uploads
```

### 2. Script de Build Frontend
```json
{
  "scripts": {
    "build": "react-scripts build",
    "start": "serve -s build"
  }
}
```

### 3. Configuration PM2 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'rentflow-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

### 4. Configuration Nginx
```nginx
server {
    listen 80;
    server_name votredomaine.com;

    # Frontend
    location / {
        root /var/www/rentflow/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🎯 Solution Recommandée pour Débutant

### Railway - Déploiement en 10 minutes

**Pourquoi Railway ?**
- Pas de configuration serveur
- Pas de ligne de commande
- Interface visuelle simple
- Déploiement automatique à chaque commit Git
- Base de données incluse
- HTTPS automatique

**Ce que ton ami devra faire** :
1. Pousser le code sur GitHub
2. Se connecter à Railway avec GitHub
3. Cliquer sur "New Project"
4. Sélectionner le repo
5. Ajouter MySQL
6. Configurer 3-4 variables d'environnement
7. **C'est tout !** Le site sera en ligne

**Le site tournera automatiquement 24/7** sans aucune intervention.

---

## 📋 Checklist avant Déploiement

- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées
- [ ] Base de données créée et importée (schema + données)
- [ ] Tests effectués en local
- [ ] Fichiers sensibles dans .gitignore (.env, node_modules, etc.)
- [ ] Script de build frontend testé
- [ ] CORS configuré pour le domaine de production
- [ ] Clés API et secrets changés (JWT_SECRET)

---

## 🆘 Support & Ressources

### Documentation officielle
- Railway : https://docs.railway.app
- Render : https://render.com/docs
- PM2 : https://pm2.keymetrics.io

### Tutoriels vidéo recommandés
- Déployer Node.js sur Railway
- Configuration MySQL en production
- Setup Nginx pour React + Node.js

---

## 💰 Estimation des Coûts

| Solution | Coût Initial | Coût Mensuel | Idéal Pour |
|----------|--------------|--------------|------------|
| Railway  | Gratuit | $0-10 | Démarrage rapide |
| Render   | Gratuit | $0-14 | Projets moyens |
| VPS (DigitalOcean) | $0 | $6-12 | Contrôle total |
| Hostinger VPS | $0 | $5-8 | Budget serré |

---

## 🎓 Prochaines Étapes

Quand le développement sera terminé :

1. **Finaliser les tests** sur localhost
2. **Préparer les fichiers de configuration** (on les créera ensemble)
3. **Choisir la plateforme** de déploiement
4. **Acheter un nom de domaine** (si nécessaire)
5. **Déployer** en suivant ce guide
6. **Configurer** la base de données en production
7. **Tester** le site en ligne
8. **Monitorer** les performances

---

## 📞 Notes

- Pas besoin de `start.ps1` en production
- MySQL démarre automatiquement
- Le backend tourne avec PM2 (redémarre automatiquement en cas de crash)
- Le frontend est compilé en fichiers statiques (ultra-rapide)
- Tout est automatique, **aucune intervention manuelle nécessaire**

**Le site sera accessible 24h/24, 7j/7 sans que ton ami n'ait à faire quoi que ce soit !** 🚀
