# 🔴 PROBLÈME : Impossible de se connecter à la base de données

## Diagnostic
Le serveur MySQL n'est **PAS démarré**. C'est pour cela que vous ne pouvez pas :
- Vous connecter avec un compte
- Voir les véhicules disponibles
- Accéder à l'application

## ✅ Solution

### Option 1 : XAMPP (le plus courant)
1. Ouvrez **XAMPP Control Panel**
2. Trouvez la ligne **MySQL**
3. Cliquez sur le bouton **Start**
4. Attendez que le voyant devienne **vert**
5. Relancez votre application

### Option 2 : Service Windows
Si MySQL est installé comme service Windows :

**En tant qu'Administrateur**, ouvrez PowerShell et exécutez :
```powershell
net start MySQL80
```

Ou cherchez "Services" dans Windows, trouvez MySQL et démarrez-le.

### Option 3 : WAMP/Laragon
- **WAMP** : Cliquez sur l'icône WAMP dans la barre des tâches → Start MySQL
- **Laragon** : Ouvrez Laragon → Cliquez sur "Start All"

## 🧪 Vérification

Une fois MySQL démarré, exécutez :
```cmd
cd E:\Perso\RentFlow-V2
test-mysql.bat
```

Ou directement :
```cmd
cd E:\Perso\RentFlow-V2\backend
node test-db-connection.js
```

Vous devriez voir :
```
✅ Connexion BDD: OK
👥 Utilisateurs: X
🚗 Véhicules: X
```

## 🚀 Redémarrage de l'application

Une fois MySQL démarré :

**Terminal 1 - Backend :**
```cmd
cd E:\Perso\RentFlow-V2\backend
node server.js
```

**Terminal 2 - Frontend :**
```cmd
cd E:\Perso\RentFlow-V2\frontend
npm start
```

## ❓ Toujours des problèmes ?

Si MySQL refuse de démarrer :

1. **Vérifiez qu'aucun autre MySQL n'est actif** sur le port 3306 :
   ```cmd
   netstat -ano | findstr :3306
   ```

2. **Consultez les logs XAMPP** : `C:\xampp\mysql\data\mysql_error.log`

3. **Port déjà utilisé ?** Changez le port dans XAMPP ou tuez le processus :
   ```cmd
   netstat -ano | findstr :3306
   taskkill /PID [numero_pid] /F
   ```

4. **Réinitialisez MySQL** (dernier recours) :
   - Sauvegardez votre base de données
   - Désinstallez MySQL
   - Réinstallez XAMPP proprement
