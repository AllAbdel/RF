# 🧪 SCRIPTS DE TEST - API SÉCURITÉ

## 📋 Prérequis

- ✅ Migration SQL exécutée
- ✅ Serveur démarré (`npm start`)
- 📧 SMTP configuré (optionnel, juste pour tester emails)

---

## 🔐 Tests PowerShell (Copier-Coller)

### 1️⃣ Test Inscription (Mot de passe valide)

```powershell
$body = @{
    email = "test@example.com"
    password = "Test1234!@#"
    first_name = "John"
    last_name = "Doe"
    user_type = "client"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

**✅ Résultat attendu :**
- `accessToken` (valide 24h)
- `refreshToken` (valide 7j)
- `emailVerificationRequired: true`
- `user` avec `email_verified: false`

---

### 2️⃣ Test Inscription (Mot de passe FAIBLE) ❌

```powershell
$body = @{
    email = "weak@example.com"
    password = "weak"
    first_name = "Test"
    last_name = "User"
    user_type = "client"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

**❌ Résultat attendu :**
- Erreur 400
- Liste des problèmes :
  - "Le mot de passe doit contenir au moins 8 caractères"
  - "Le mot de passe doit contenir au moins une majuscule"
  - "Le mot de passe doit contenir au moins un chiffre"
  - "Le mot de passe doit contenir au moins un caractère spécial"

---

### 3️⃣ Test Connexion (Sans 2FA)

```powershell
$body = @{
    email = "test@example.com"
    password = "Test1234!@#"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$accessToken = $response.accessToken
Write-Host "Access Token: $accessToken"
```

**✅ Résultat attendu :**
- `accessToken` et `refreshToken`
- `user` avec infos

**💾 Sauvegarder le token pour les tests suivants !**

---

### 4️⃣ Test Profil Utilisateur (Authentifié)

```powershell
# Utiliser le token du test précédent
$headers = @{
    Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Method GET -Headers $headers
```

**✅ Résultat attendu :**
- Infos utilisateur
- `email_verified: false` (pas encore vérifié)

---

### 5️⃣ Test Refresh Token

```powershell
$body = @{
    refreshToken = $response.refreshToken
} | ConvertTo-Json

$newTokens = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/refresh-token" -Method POST -Body $body -ContentType "application/json"
Write-Host "Nouveau Access Token: $($newTokens.accessToken)"
```

**✅ Résultat attendu :**
- Nouveau `accessToken` valide

---

### 6️⃣ Test Demande Reset Mot de Passe

```powershell
$body = @{
    email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/request-password-reset" -Method POST -Body $body -ContentType "application/json"
```

**✅ Résultat attendu :**
- Message : "Si un compte existe, un email a été envoyé"
- 📧 Email envoyé (si SMTP configuré)

---

### 7️⃣ Test Rate Limiting (6 tentatives échouées)

```powershell
# Tenter 6 connexions avec mauvais mot de passe
1..6 | ForEach-Object {
    $body = @{
        email = "test@example.com"
        password = "WrongPassword123!"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    } catch {
        Write-Host "Tentative $_: $($_.Exception.Response.StatusCode)"
    }
    Start-Sleep -Milliseconds 500
}
```

**✅ Résultat attendu :**
- Tentatives 1-5 : Erreur 401 (Identifiants invalides)
- Tentative 6 : Erreur 429 (Trop de tentatives)

---

### 8️⃣ Test Setup 2FA (Authentifié)

```powershell
# Étape 1: Initialiser 2FA
$headers = @{
    Authorization = "Bearer $accessToken"
}

$setup = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/2fa/setup" -Method POST -Headers $headers
Write-Host "QR Code: $($setup.qrCode)"
Write-Host "Secret: $($setup.secret)"

# Le QR code est en format data:image/png;base64,...
# Tu peux le scanner avec Google Authenticator
```

**✅ Résultat attendu :**
- `qrCode` (data URL à scanner)
- `secret` (clé manuelle si besoin)

**📱 Scanner avec Google Authenticator puis continuer...**

---

### 9️⃣ Test Vérification 2FA Setup

```powershell
# Remplacer 123456 par le code de ton app
$body = @{
    token = "123456"  # Code depuis Google Authenticator
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $accessToken"
}

$result = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/2fa/verify-setup" -Method POST -Body $body -Headers $headers -ContentType "application/json"
Write-Host "Codes de secours:"
$result.backupCodes
```

**✅ Résultat attendu :**
- Message de succès
- 8 codes de secours au format `XXXX-XXXX`
- 📧 Email de confirmation (si SMTP configuré)

---

### 🔟 Test Connexion avec 2FA

```powershell
# Étape 1: Login normal
$body = @{
    email = "test@example.com"
    password = "Test1234!@#"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"

if ($loginResponse.requires2FA) {
    Write-Host "2FA requis! Entre le code:"
    $code = Read-Host
    
    # Étape 2: Vérifier 2FA
    $body2FA = @{
        email = "test@example.com"
        password = "Test1234!@#"
        twoFactorToken = $code
    } | ConvertTo-Json
    
    $finalLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body2FA -ContentType "application/json"
    Write-Host "Connecté avec 2FA!"
    Write-Host "Access Token: $($finalLogin.accessToken)"
}
```

**✅ Résultat attendu :**
- Première requête : `requires2FA: true`
- Deuxième requête (avec code) : `accessToken` + `refreshToken`

---

### 1️⃣1️⃣ Test Logout Serveur (Révocation Token)

```powershell
$headers = @{
    Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/logout" -Method POST -Headers $headers

# Tester que le token est bien révoqué
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Method GET -Headers $headers
} catch {
    Write-Host "✅ Token révoqué avec succès!"
}
```

**✅ Résultat attendu :**
- Logout : Message de succès
- Tentative profil : Erreur 401 (Token révoqué)

---

### 1️⃣2️⃣ Test Changement Mot de Passe

```powershell
$headers = @{
    Authorization = "Bearer $accessToken"
}

$body = @{
    currentPassword = "Test1234!@#"
    newPassword = "NewPassword456!@#"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/change-password" -Method POST -Body $body -Headers $headers -ContentType "application/json"
```

**✅ Résultat attendu :**
- Message de succès
- Tous les tokens révoqués (logout automatique)

---

## 📊 Tests Base de Données

### Vérifier les nouvelles tables

Ouvrir MySQL Workbench et exécuter :

```sql
-- Vérifier structure users
DESCRIBE users;

-- Vérifier les nouvelles tables
SHOW TABLES LIKE '%password%';
SHOW TABLES LIKE '%token%';
SHOW TABLES LIKE '%login%';

-- Voir les tentatives de connexion
SELECT * FROM login_attempts ORDER BY attempted_at DESC LIMIT 10;

-- Voir les tokens refresh actifs
SELECT id, user_id, created_at, expires_at FROM refresh_tokens;

-- Voir les tokens blacklistés
SELECT * FROM token_blacklist ORDER BY blacklisted_at DESC LIMIT 10;
```

---

## 🎯 Checklist Tests Complets

- [ ] Inscription avec mot de passe valide
- [ ] Inscription rejetée (mot de passe faible)
- [ ] Connexion réussie
- [ ] Profil utilisateur authentifié
- [ ] Refresh token fonctionnel
- [ ] Demande reset mot de passe
- [ ] Rate limiting après 5 échecs
- [ ] Setup 2FA (QR code)
- [ ] Activation 2FA (codes secours)
- [ ] Connexion avec 2FA
- [ ] Logout serveur (révocation)
- [ ] Changement mot de passe

---

## 🐛 Problèmes Courants

### Erreur : "ECONNREFUSED"
➡️ La migration SQL n'a pas été exécutée  
✅ Solution : Exécuter `001_security_enhancements.sql` dans MySQL Workbench

### Erreur : "SMTP Invalid login"
➡️ Configuration email invalide  
✅ Solution : Configurer `SMTP_USER` et `SMTP_PASS` dans `.env` (ou ignorer si tu ne testes pas les emails)

### Erreur : "Token révoqué" immédiatement
➡️ Le secret JWT a changé  
✅ Solution : Réinscription ou utiliser le nouveau token

### Erreur 429 : "Too Many Requests"
➡️ Rate limiting activé  
✅ Solution : Attendre 15 minutes ou redémarrer le serveur (reset compteurs)

---

**Bon testing ! 🚀**
