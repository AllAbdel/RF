# 🤖 Assistant IA RentFlow

## Description

L'Assistant IA RentFlow est un conseiller intelligent pour les agences de location de voitures. Il analyse en temps réel les performances de votre agence et vous donne des recommandations stratégiques personnalisées.

## ✨ Fonctionnalités

- **Analyse automatique** : Évalue votre flotte, taux d'occupation, revenus et satisfaction client
- **Conseils personnalisés** : Recommandations sur les prix, véhicules à optimiser, stratégies marketing
- **Chat contextuel** : Posez des questions sur votre agence et obtenez des réponses précises
- **Synthèse vocale** : Les réponses sont lues à haute voix (activable/désactivable)
- **Métriques en direct** : Tableau de bord avec les KPIs principaux

## 📋 Prérequis

### Windows
- **Python 3.8+** : [Télécharger Python](https://www.python.org/downloads/)
- Node.js et npm (déjà installés pour RentFlow)

### Vérifier Python
```powershell
python --version
```
Si la commande ne fonctionne pas, ajoutez Python au PATH ou réinstallez-le.

## 🚀 Installation

### 1. Installer les dépendances Python

```powershell
cd backend
pip install -r requirements.txt
```

Les dépendances incluent :
- `fastapi` : Framework API moderne
- `uvicorn` : Serveur ASGI haute performance
- `pydantic` : Validation des données

### 2. Démarrage automatique

Le script `start.ps1` lance automatiquement le service IA :

```powershell
.\start.ps1
```

Le service IA démarre sur **http://localhost:8000**

### 3. Démarrage manuel (optionnel)

Si vous voulez lancer uniquement le service IA :

```powershell
.\start-ai.ps1
```

Ou manuellement :

```powershell
cd backend\services
python ai_advisor_api.py
```

## 📖 Utilisation

### Dans RentFlow

1. Connectez-vous en tant que membre d'une agence
2. Allez dans le tableau de bord agence
3. Cliquez sur l'onglet **🤖 Assistance IA**
4. Cliquez sur "Analyser ma flotte" pour une analyse complète
5. Posez des questions dans le chat

### Questions exemples

- "Quelle est ma meilleure voiture ?"
- "Comment augmenter mes revenus ?"
- "Pourquoi mes avis clients sont mauvais ?"
- "Stratégie marketing pour ma ville ?"
- "Dois-je baisser ou augmenter mes prix ?"

### Quick Actions

- **✨ Analyser ma flotte** : Analyse complète des performances
- **🏆 Meilleur véhicule** : Identifie votre véhicule star
- **💰 Conseils Prix** : Optimisation tarifaire
- **📢 Marketing** : Stratégies de promotion

## 🧠 Comment ça marche ?

### Backend (Python)

Le service IA (`ai_advisor_api.py`) :
1. Reçoit le contexte de l'agence (véhicules, revenus, avis)
2. Analyse les données avec des algorithmes intelligents
3. Génère des recommandations personnalisées
4. Répond aux questions contextuelles

### Frontend (React)

Le widget (`AiAdvisorWidget.js`) :
- Récupère le contexte de l'agence via `/api/agency/ai-context`
- Envoie les requêtes au service IA Python
- Affiche les réponses avec mise en forme Markdown
- Lit les réponses avec l'API Web Speech

### Données analysées

- **Flotte** : Nombre de véhicules, taux d'utilisation, disponibilité
- **Revenus** : Chiffre d'affaires des 30 derniers jours
- **Performance véhicules** : Top/Worst performers, ROI par véhicule
- **Avis clients** : Notes moyennes, plaintes, satisfaction
- **Réservations** : Nombre, durée moyenne

## 🔧 API Endpoints

### Service IA (Python - Port 8000)

- `GET /` : Health check
- `GET /docs` : Documentation interactive Swagger
- `POST /api/analyze` : Analyse complète de l'agence
- `POST /api/chat` : Chat contextuel

### Backend Node.js (Port 5000)

- `GET /api/agency/ai-context` : Récupère le contexte complet de l'agence

## 🐛 Dépannage

### "Python n'est pas reconnu"
- Installez Python : https://www.python.org/downloads/
- Cochez "Add Python to PATH" lors de l'installation

### "ModuleNotFoundError: No module named 'fastapi'"
```powershell
pip install fastapi uvicorn pydantic
```

### "Service IA non disponible"
1. Vérifiez que Python fonctionne : `python --version`
2. Lancez manuellement : `python backend\services\ai_advisor_api.py`
3. Vérifiez le port 8000 : `Get-NetTCPConnection -LocalPort 8000`

### Le chat ne fonctionne pas
1. Ouvrez http://localhost:8000 dans un navigateur
2. Si "Service Unavailable", relancez le service IA
3. Vérifiez les logs PowerShell : `Get-Job | Receive-Job`

## 📊 Améliorations futures

### Version Prod (avec OpenAI)

Pour utiliser ChatGPT au lieu de la logique conditionnelle :

1. Installer le SDK OpenAI :
```powershell
pip install openai
```

2. Modifier `ai_advisor_api.py` :
```python
import openai
openai.api_key = "VOTRE_CLE_API"

def chat_with_advisor(message):
    completion = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Tu es un expert en location de voiture..."},
            {"role": "user", "content": message.content}
        ]
    )
    return completion.choices[0].message.content
```

### Fonctionnalités possibles

- 📈 Prédictions de demande (ML)
- 🎯 Alertes automatiques (véhicule problématique, baisse d'occupation)
- 📧 Rapports hebdomadaires par email
- 🗣️ Reconnaissance vocale (speech-to-text)
- 🌍 Multi-langues (EN, ES, DE...)

## 📝 License

Ce module fait partie de RentFlow V2.

## 👨‍💻 Support

En cas de problème, vérifiez :
1. Python est installé et dans le PATH
2. Les dépendances sont installées (`pip list`)
3. Le port 8000 n'est pas utilisé par un autre service
4. Les logs PowerShell (`Get-Job | Receive-Job`)

---

**Propulsé par FastAPI et React** 🚀
