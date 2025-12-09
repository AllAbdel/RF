# 🔐 GUIDE D'INSTALLATION - AMÉLIORATIONS SÉCURITÉ

## 📋 Étapes d'installation

### 1. Exécuter les migrations SQL

**Option A - Via MySQL Workbench (Recommandé) :**
1. Ouvrez MySQL Workbench
2. Connectez-vous à votre base de données `car_rental`
3. Ouvrez le fichier `backend/migrations/001_security_enhancements.sql`
4. Exécutez le script (⚡ bouton Execute ou Ctrl+Shift+Enter)

**Option B - Via ligne de commande :**
```bash
# Depuis le dossier backend
mysql -u root -p car_rental < migrations/001_security_enhancements.sql
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `backend` (copiez `.env.example`) :

```env
# JWT Secrets (IMPORTANT: Changez ces valeurs en production !)
JWT_SECRET=votre-secret-jwt-unique-et-complexe
JWT_REFRESH_SECRET=votre-secret-refresh-unique-et-complexe
JWT_EXPIRE=24h

# Configuration SMTP pour les emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# URL Frontend
FRONTEND_URL=http://localhost:3000
```

**⚠️ Configuration Gmail App Password :**
1. Allez sur https://myaccount.google.com/security
2. Activez la validation en 2 étapes
3. Générez un "Mot de passe d'application"
4. Utilisez ce mot de passe dans `SMTP_PASS`

**Alternative SMTP (autres fournisseurs) :**
- **Outlook** : smtp-mail.outlook.com:587
- **Yahoo** : smtp.mail.yahoo.com:465
- **SendGrid** : smtp.sendgrid.net:587
- **Mailgun** : smtp.mailgun.org:587

### 3. Installer les dépendances

Les dépendances sont déjà installées. Si besoin :
```bash
cd backend
npm install
```

### 4. Redémarrer le serveur

```bash
cd backend
npm start
```

---

## 🆕 NOUVELLES FONCTIONNALITÉS IMPLÉMENTÉES

### ✅ 1. Vérification Email
- Email de confirmation lors de l'inscription
- Token expire après 24h
- Renvoi possible du lien de vérification
- Compte inactif tant que non vérifié

**Routes :**
- `POST /api/auth/verify-email` - Vérifier l'email
- `POST /api/auth/resend-verification` - Renvoyer email

### ✅ 2. Réinitialisation Mot de Passe
- Demande via email
- Token expire après 1h
- Email de confirmation après changement
- Historique des 5 derniers mots de passe

**Routes :**
- `POST /api/auth/request-password-reset` - Demander reset
- `POST /api/auth/reset-password` - Réinitialiser
- `POST /api/auth/change-password` - Changer (connecté)

### ✅ 3. Politique Mots de Passe Renforcée
- **Minimum 8 caractères**
- **1 majuscule** obligatoire
- **1 minuscule** obligatoire
- **1 chiffre** obligatoire
- **1 caractère spécial** (!@#$%...)
- Vérification historique (5 derniers)
- Score de force (0-100)

### ✅ 4. Rate Limiting
- **Connexion** : 5 tentatives / 15 min
- **Inscription** : 3 / heure
- **Reset password** : 3 / heure
- **Vérification email** : 5 / heure
- **API générale** : 100 / 15 min
- **API sensibles** : 20 / 15 min

### ✅ 5. JWT Amélioré
- **Access Token** : 24h (au lieu de 7j)
- **Refresh Token** : 7 jours
- **Blacklist** : Tokens révoqués côté serveur
- **JTI** : ID unique par token
- **Logout serveur** : Révocation complète

**Routes :**
- `POST /api/auth/refresh-token` - Rafraîchir token
- `POST /api/auth/logout` - Déconnexion serveur

### ✅ 6. Authentification 2FA (TOTP)
- **QR Code** pour Google Authenticator/Authy
- **8 codes de secours** générés
- **Vérification** à chaque connexion
- **Régénération** des codes possible

**Routes :**
- `POST /api/auth/2fa/setup` - Initialiser 2FA
- `POST /api/auth/2fa/verify-setup` - Activer 2FA
- `POST /api/auth/2fa/disable` - Désactiver 2FA
- `POST /api/auth/2fa/regenerate-backup-codes` - Nouveaux codes
- `GET /api/auth/2fa/status` - Statut 2FA

### ✅ 7. Sécurité Supplémentaire
- **Logging** : Toutes tentatives de connexion
- **Détection** : Activité suspecte (10 échecs = blocage)
- **Nettoyage** : Tokens expirés (auto toutes les 6h)
- **IP Tracking** : Suivi des adresses IP

---

## 📚 EXEMPLES D'UTILISATION

### Frontend - Inscription avec validation
```javascript
const register = async (formData) => {
  try {
    const response = await axios.post('/api/auth/register', formData);
    
    // Sauvegarder les tokens
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    // Afficher message de vérification email
    if (response.data.emailVerificationRequired) {
      alert('Veuillez vérifier votre email pour activer votre compte');
    }
  } catch (error) {
    if (error.response.data.details) {
      // Afficher erreurs de validation mot de passe
      console.error(error.response.data.details);
    }
  }
};
```

### Frontend - Connexion avec 2FA
```javascript
const login = async (email, password, twofa_code = null) => {
  try {
    const response = await axios.post('/api/auth/login', {
      email,
      password,
      user_type: 'client',
      twofa_code
    });
    
    if (response.data.requires2FA) {
      // Afficher formulaire pour code 2FA
      showTwoFactorForm(response.data.userId);
    } else {
      // Connexion réussie
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
  } catch (error) {
    console.error(error.response.data.error);
  }
};
```

### Frontend - Refresh Token automatique
```javascript
// Intercepteur Axios
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && error.response?.data?.error === 'Token expiré') {
      const refreshToken = localStorage.getItem('refreshToken');
      
      try {
        const response = await axios.post('/api/auth/refresh-token', { refreshToken });
        localStorage.setItem('accessToken', response.data.accessToken);
        
        // Réessayer la requête originale
        error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        // Refresh token expiré, rediriger vers login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Frontend - Setup 2FA
```javascript
const setup2FA = async () => {
  // 1. Initialiser
  const { data } = await axios.post('/api/auth/2fa/setup');
  
  // 2. Afficher QR code
  document.getElementById('qrCode').src = data.qrCode;
  
  // 3. Demander code de vérification
  const code = prompt('Entrez le code depuis votre app:');
  
  // 4. Vérifier et activer
  const result = await axios.post('/api/auth/2fa/verify-setup', { token: code });
  
  // 5. IMPORTANT: Afficher codes de secours
  alert('Sauvegardez ces codes:\n' + result.data.backupCodes.join('\n'));
};
```

---

## 🧪 TESTS

### Tester la vérification email
```bash
# S'inscrire
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "Test1234!@#",
  ...
}

# Vérifier l'email (récupérer token dans console serveur)
POST /api/auth/verify-email
{
  "token": "abc123..."
}
```

### Tester le rate limiting
```bash
# Faire 6 tentatives de connexion échouées rapidement
# La 6ème devrait retourner 429 (Too Many Requests)
```

### Tester la validation mot de passe
```bash
POST /api/auth/register
{
  "password": "faible"  # ❌ Erreur
}

{
  "password": "Test1234!@#"  # ✅ Valide
}
```

---

## 📊 TABLES AJOUTÉES

| Table | Description |
|-------|-------------|
| `password_history` | Historique des 5 derniers mots de passe |
| `token_blacklist` | Tokens JWT révoqués |
| `refresh_tokens` | Tokens de rafraîchissement actifs |
| `login_attempts` | Tentatives de connexion (analytics) |

## 🔧 COLONNES AJOUTÉES (users)

| Colonne | Type | Description |
|---------|------|-------------|
| `email_verified` | BOOLEAN | Email vérifié ou non |
| `verification_token` | VARCHAR(255) | Token de vérification |
| `verification_token_expires` | DATETIME | Expiration token |
| `reset_password_token` | VARCHAR(255) | Token reset password |
| `reset_password_expires` | DATETIME | Expiration reset |
| `twofa_secret` | VARCHAR(255) | Secret TOTP 2FA |
| `twofa_enabled` | BOOLEAN | 2FA activée |
| `twofa_backup_codes` | TEXT | Codes secours (JSON) |

---

## 🔒 SÉCURITÉ EN PRODUCTION

### Checklist avant déploiement :
- [ ] Changer `JWT_SECRET` et `JWT_REFRESH_SECRET`
- [ ] Configurer SMTP avec credentials production
- [ ] Activer HTTPS (SSL/TLS)
- [ ] Configurer CORS strictement
- [ ] Activer helmet.js pour headers sécurité
- [ ] Configurer firewall et rate limiting IP
- [ ] Sauvegardes BDD automatiques
- [ ] Monitoring des tentatives suspectes
- [ ] Logs centralisés (Winston/Sentry)

---

## 📝 NOTES

- Les utilisateurs existants sont automatiquement marqués comme `email_verified = TRUE` lors de la migration
- Les tokens sont nettoyés automatiquement toutes les 6 heures
- Rate limiting basé sur IP address
- 2FA recommandée pour tous les comptes agences
- Emails envoyés de manière asynchrone (non bloquant)

---

**🎉 Toutes les fonctionnalités sont prêtes à l'emploi !**

Pour toute question : consultez les fichiers dans `backend/utils/` et `backend/services/`
