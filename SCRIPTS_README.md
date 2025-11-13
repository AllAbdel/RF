# 🚀 Scripts de Démarrage RentFlow

## Démarrage Rapide

### Démarrer l'application complète (MySQL + Backend + Frontend)
```powershell
.\start.ps1
```

### Arrêter l'application
```powershell
.\stop.ps1
```

## Configuration

### Si UniServerZ n'est pas détecté automatiquement

1. Ouvrez le fichier `.config`
2. Ajoutez le chemin vers votre installation UniServerZ :
   ```
   UNISERVER_PATH=C:\VotreChemin\UniServerZ
   ```
3. Sauvegardez et relancez `.\start.ps1`

### Chemins vérifiés automatiquement
Le script cherche UniServerZ dans :
- Le chemin défini dans `.config`
- `C:\UniServerZ`
- `C:\Program Files\UniServerZ`
- `D:\UniServerZ`
- `E:\UniServerZ`

## Que font ces scripts ?

### `start.ps1`
1. ✅ Détecte et démarre MySQL (via UniServerZ)
2. ✅ Lance le serveur backend (Node.js sur port 5000)
3. ✅ Lance le serveur frontend (React sur port 3000)
4. ✅ Tout en arrière-plan (pas de fenêtres)

### `stop.ps1`
1. ⛔ Arrête le frontend
2. ⛔ Arrête le backend
3. ⛔ Arrête MySQL
4. 🧹 Nettoie les fichiers temporaires

## Accès à l'Application

Après le démarrage :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **MySQL** : localhost:3306

## Vérification

Pour vérifier que tout fonctionne :
```powershell
# Vérifier MySQL
Get-Process mysqld

# Vérifier Node.js
Get-Process node
```

## Problèmes Courants

### MySQL ne démarre pas
- Vérifiez que UniServerZ est bien installé
- Vérifiez le chemin dans `.config`
- Démarrez UniServerZ manuellement et utilisez juste les serveurs Node

### Port déjà utilisé
```powershell
# Libérer le port 3000 (Frontend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Libérer le port 5000 (Backend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### Les serveurs ne se lancent pas en arrière-plan
Exécutez manuellement :
```powershell
# Terminal 1 - MySQL via UniServerZ
# (ou démarrez UniServerZ manuellement)

# Terminal 2 - Backend
cd backend
npm start

# Terminal 3 - Frontend
cd frontend
npm start
```

## Notes

- Les processus tournent en arrière-plan sans fenêtres
- Utilisez **TOUJOURS** `stop.ps1` pour arrêter proprement
- Les logs ne sont pas visibles (processus silencieux)
- Pour voir les logs, lancez manuellement dans des terminaux séparés
