# 📧 Guide Configuration SMTP Gmail

## Étapes à suivre

### 1. Activer la validation en 2 étapes
🔗 https://myaccount.google.com/security
- Se connecter avec: compte.de.spam2@gmail.com
- Cliquer sur "Validation en 2 étapes"
- Suivre les instructions

### 2. Générer un mot de passe d'application
🔗 https://myaccount.google.com/apppasswords
- Se connecter avec: compte.de.spam2@gmail.com
- Nom de l'application: "RentFlow"
- Google génère un code de 16 caractères (ex: abcd efgh ijkl mnop)
- ⚠️ COPIER CE CODE (vous pouvez retirer les espaces)

### 3. Configurer le .env
Ouvrir: `backend\.env`

Remplacer:
```
SMTP_PASS=VOTRE_MOT_DE_PASSE_APP_ICI
```

Par:
```
SMTP_PASS=votrecodede16caracteres
```

### 4. Tester la configuration
```powershell
cd backend
node test-email.js
```

Si ça fonctionne, vous recevrez un email de confirmation sur compte.de.spam2@gmail.com

### 5. Activer les emails en production
Dans `backend\.env`, changer:
```
NODE_ENV=development
```

En:
```
NODE_ENV=production
```

Puis redémarrer:
```powershell
.\start-all.ps1
```

## ✅ Résultat attendu

Une fois configuré, les emails seront automatiquement envoyés pour:
- ✉️ Vérification d'email lors de l'inscription
- 🔐 Réinitialisation de mot de passe
- 🔔 Notifications importantes

---

**Note**: En mode `development`, les emails ne sont PAS envoyés et les comptes sont auto-vérifiés.
En mode `production`, tous les emails sont envoyés et la vérification est obligatoire.
