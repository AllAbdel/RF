# 🚀 GUIDE RAPIDE - MIGRATION SQL

## ⚠️ IMPORTANT : Exécuter la migration SQL MAINTENANT

### Méthode Recommandée : MySQL Workbench

1. **Ouvrir MySQL Workbench**

2. **Se connecter à la base de données**
   - Host: `localhost`
   - User: `root`
   - Password: `12345678`
   - Database: `car_rental`

3. **Ouvrir le fichier de migration**
   - Menu : File > Open SQL Script
   - Naviguer vers : `E:\Perso\RentFlow-V2\backend\migrations\001_security_enhancements.sql`

4. **Exécuter le script**
   - Cliquer sur l'icône ⚡ (Execute)
   - Ou appuyer sur `Ctrl + Shift + Enter`

5. **Vérifier la sortie**
   - Tu devrais voir : "69 rows affected"
   - Aucune erreur en rouge

---

## ✅ Ce que le script fait

- Ajoute 8 colonnes à la table `users` pour la sécurité
- Crée 4 nouvelles tables :
  - `password_history` : Historique mots de passe
  - `token_blacklist` : Tokens révoqués
  - `refresh_tokens` : Tokens de rafraîchissement
  - `login_attempts` : Tentatives de connexion

---

## 🔄 Après l'exécution

Redémarre le serveur :
```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Puis :
npm start
```

✅ Le message d'erreur `ECONNREFUSED` devrait disparaître !

---

## 📧 Configuration Email (Optionnel pour tester)

Si tu veux tester les emails immédiatement :

### Option 1 : Gmail (Recommandé pour test)

1. **Activer la validation en 2 étapes**
   - Va sur : https://myaccount.google.com/security
   - Activer "Validation en deux étapes"

2. **Générer un mot de passe d'application**
   - Va sur : https://myaccount.google.com/apppasswords
   - Sélectionner "Autre (nom personnalisé)"
   - Nom : "RentFlow"
   - Copier le mot de passe généré (16 caractères)

3. **Modifier `.env`**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=ton-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # Mot de passe d'app
   ```

4. **Redémarrer le serveur**

### Option 2 : Mailtrap (Pour développement)

Alternative gratuite pour tester les emails sans les envoyer vraiment :

1. Créer un compte sur : https://mailtrap.io
2. Copier les identifiants SMTP
3. Modifier `.env` :
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=ton-username-mailtrap
   SMTP_PASS=ton-password-mailtrap
   ```

---

## 🎯 Priorités

1. ✅ **URGENT** : Exécuter la migration SQL (sinon rien ne marche)
2. ⏳ **Optionnel** : Configurer SMTP (seulement si tu veux tester les emails maintenant)

---

**Le serveur fonctionne déjà, mais les nouvelles fonctionnalités nécessitent la migration SQL !**
