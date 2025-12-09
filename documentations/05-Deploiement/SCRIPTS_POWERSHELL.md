# 🎮 Scripts PowerShell - Guide d'utilisation

## 📋 Scripts disponibles

À la racine du projet, vous trouverez 2 scripts PowerShell :

### ✅ `start.ps1` - Démarrage complet
Lance tous les serveurs nécessaires en arrière-plan **sans ouvrir de fenêtres**.

### 🛑 `stop.ps1` - Arrêt complet
Arrête tous les serveurs Node.js en cours d'exécution.

---

## 🚀 Utilisation

### Démarrer l'application

```powershell
.\start.ps1
```

**Ce que fait ce script :**
1. ✅ Vérifie que MySQL est démarré
2. 🧹 Nettoie les anciens processus Node
3. 🔧 Démarre le backend (port 5000) en arrière-plan
4. 🎨 Démarre le frontend (port 3000) en arrière-plan
5. 🌐 Ouvre automatiquement le navigateur

**Avantages :**
- ✨ **Aucune fenêtre** supplémentaire ne s'ouvre
- 🔇 Exécution **silencieuse** en arrière-plan
- 🚀 Ouverture **automatique** du navigateur
- 📊 Affiche les **Job IDs** pour le suivi

### Arrêter l'application

```powershell
.\stop.ps1
```

**Ce que fait ce script :**
1. 🛑 Arrête tous les processus Node.js
2. 🧹 Nettoie tous les jobs PowerShell
3. ✅ Confirme l'arrêt

---

## 💡 Commandes alternatives

### Arrêt rapide
```powershell
Get-Process -Name node | Stop-Process -Force
```

### Voir les processus Node en cours
```powershell
Get-Process -Name node
```

### Voir les jobs PowerShell
```powershell
Get-Job
```

### Arrêter un job spécifique
```powershell
Stop-Job -Id <JobID>
Remove-Job -Id <JobID>
```

---

## 🔍 Vérifications

### Vérifier si MySQL tourne
```powershell
Get-Process -Name mysqld
```

### Vérifier les ports utilisés
```powershell
# Backend (port 5000)
Get-NetTCPConnection -LocalPort 5000

# Frontend (port 3000)
Get-NetTCPConnection -LocalPort 3000

# MySQL (port 3306)
Get-NetTCPConnection -LocalPort 3306
```

---

## ⚠️ Problèmes courants

### "MySQL n'est pas actif"
**Solution :**
1. Ouvrir XAMPP Control Panel
2. Cliquer sur "Start" à côté de MySQL
3. Relancer `.\start.ps1`

### "node_modules manquant"
**Solution :**
```powershell
cd backend
npm install

cd ../frontend
npm install
```

### "Port déjà utilisé"
**Solution :**
```powershell
# Arrêter tous les processus Node
.\stop.ps1

# Ou forcer l'arrêt
Get-Process -Name node | Stop-Process -Force

# Relancer
.\start.ps1
```

### "Le navigateur ne s'ouvre pas"
Le navigateur s'ouvre automatiquement après 10 secondes.
Sinon, ouvrez manuellement : http://localhost:3000

---

## 📊 Fonctionnement technique

### Backend (Job PowerShell)
- Exécuté avec `Start-Job`
- Répertoire : `E:\Perso\RentFlow-V2\backend`
- Commande : `node server.js`
- Port : **5000**

### Frontend (Job PowerShell)
- Exécuté avec `Start-Job`
- Répertoire : `E:\Perso\RentFlow-V2\frontend`
- Commande : `npm start`
- Port : **3000**
- Variable : `BROWSER=none` (pas de double ouverture)

---

## 🎯 Workflow recommandé

### Développement quotidien
```powershell
# Matin - Démarrer
.\start.ps1

# ... Développer ...

# Soir - Arrêter
.\stop.ps1
```

### Redémarrage rapide
```powershell
.\stop.ps1
Start-Sleep -Seconds 2
.\start.ps1
```

### Test après modifications
```powershell
# Arrêter
.\stop.ps1

# Modifier le code...

# Redémarrer pour voir les changements
.\start.ps1
```

---

## 📝 Notes importantes

1. **Pas de fenêtres** : Les scripts utilisent `Start-Job` pour une exécution en arrière-plan silencieuse
2. **MySQL requis** : MySQL doit être démarré via XAMPP avant de lancer `start.ps1`
3. **Jobs persistants** : Les jobs continuent après la fermeture de la fenêtre PowerShell
4. **Arrêt propre** : Toujours utiliser `.\stop.ps1` pour un arrêt propre

---

## 🆘 Support

En cas de problème :
1. Vérifier MySQL dans XAMPP
2. Exécuter `.\stop.ps1` puis `.\start.ps1`
3. Consulter [documentations/](../documentations/)

---

**Dernière mise à jour :** 9 décembre 2025
