# 🚀 Quick Start - Assistant IA

## Installation rapide (1 minute)

### 1. Installer Python
- Télécharger : https://www.python.org/downloads/
- ⚠️ IMPORTANT : Cocher "Add Python to PATH"

### 2. Installer dépendances
```powershell
pip install fastapi uvicorn pydantic
```

### 3. Lancer RentFlow
```powershell
.\start.ps1
```

## ✅ Vérifier que ça marche

- Frontend : http://localhost:3000
- Backend : http://localhost:5000
- **Service IA** : http://localhost:8000
- Documentation API : http://localhost:8000/docs

## 📱 Utiliser l'Assistant IA

1. Connectez-vous à RentFlow
2. Dashboard Agence → Onglet **🤖 Assistance IA**
3. Cliquez "Analyser ma flotte"
4. Posez vos questions !

## 💬 Questions exemples

```
Quelle est ma meilleure voiture ?
Comment augmenter mes revenus ?
Dois-je baisser mes prix ?
Stratégie marketing pour Paris ?
Pourquoi j'ai des mauvais avis ?
```

## 🔊 Fonctionnalités

- ✨ Analyse automatique de performance
- 💬 Chat intelligent contextualisé
- 🔊 Synthèse vocale (cliquer sur l'icône son)
- 📊 Métriques en temps réel
- 🎯 Recommandations personnalisées

## 🐛 Problème ?

**Service IA indisponible :**
```powershell
cd backend\services
python ai_advisor_api.py
```

**Python non trouvé :**
- Vérifier : `python --version`
- Réinstaller Python et cocher "Add to PATH"

**Port 8000 déjà utilisé :**
```powershell
# Trouver le processus
Get-NetTCPConnection -LocalPort 8000 | Select OwningProcess
# Arrêter le processus (remplacer PID)
Stop-Process -Id PID -Force
```

## 📚 Documentation complète

Voir `documentations/ASSISTANT_IA.md`

---

**Powered by FastAPI + React** 🚀
