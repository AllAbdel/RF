# 🔐 SafeRent Verify - Module de Vérification Documentaire avec OCR

## 📋 Vue d'ensemble

**SafeRent Verify** est un système de détection de fraude documentaire utilisant l'OCR (Reconnaissance Optique de Caractères) et un moteur de scoring intelligent pour vérifier l'authenticité des documents d'identité et permis de conduire.

## ✨ Fonctionnalités

### Frontend (React)
- ✅ Interface drag & drop pour upload de documents
- ✅ Prévisualisation en temps réel
- ✅ Barre de progression animée
- ✅ Affichage du rapport d'analyse détaillé
- ✅ Score de confiance visuel (0-100)
- ✅ Détection des anomalies avec drapeaux d'alerte
- ✅ Simulation OCR côté client (pour démo)

### Backend (Python)
- ✅ Extraction OCR avec Tesseract
- ✅ Prétraitement d'image (débruitage, binarisation)
- ✅ Détection automatique du type de document
- ✅ Extraction des dates et vérification d'expiration
- ✅ Calcul de score de risque multicritères
- ✅ API REST prête à l'emploi (Flask)

## 📁 Fichiers créés

```
frontend/src/components/
  └── DocumentVerificationWidget.js  (Widget React complet)

backend/services/
  └── documentAnalyzer.py            (Moteur OCR + Scoring Python)
```

## 🚀 Installation

### 1. Frontend

Les icônes `lucide-react` sont déjà installées :
```bash
cd frontend
npm install lucide-react  # ✅ Déjà fait
```

### 2. Backend Python (Optionnel pour production)

```bash
cd backend/services

# Installer les dépendances Python
pip install pytesseract opencv-python pillow flask

# Télécharger Tesseract OCR (Windows)
# https://github.com/UB-Mannheim/tesseract/wiki
# Installer dans C:\Program Files\Tesseract-OCR
```

### 3. Configuration Tesseract (Windows)

Dans `documentAnalyzer.py`, décommentez et ajustez le chemin :
```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

## 🎯 Utilisation

### Mode Démo (Frontend uniquement)

Le widget actuel fonctionne **100% côté client** avec simulation OCR. Aucun backend requis pour tester.

**Tester les scénarios :**
1. Uploadez un fichier nommé **`permis.jpg`** → ✅ Document **VALIDE**
2. Uploadez un fichier nommé **`fake.jpg`** ou **`expire.jpg`** → ❌ Document **REJETÉ**
3. Tout autre fichier → ⚠️ **RÉVISION MANUELLE**

### Intégrer le widget

Dans votre `ClientDashboard.js` ou page de documents :

```javascript
import DocumentVerificationWidget from '../components/DocumentVerificationWidget';

function MyPage() {
  return (
    <div>
      <DocumentVerificationWidget />
    </div>
  );
}
```

### Mode Production (Backend Python)

Pour une vraie production avec OCR serveur :

**1. Remplacer la fonction de simulation**

Dans `DocumentVerificationWidget.js`, remplacez `analyzeDocumentMock` par :

```javascript
const analyzeDocumentReal = async (file) => {
  const formData = new FormData();
  formData.append('document', file);

  try {
    const response = await fetch('http://localhost:5001/api/verify-document', {
      method: 'POST',
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error("Erreur d'analyse", error);
    return { success: false, error: error.message };
  }
};
```

**2. Lancer le backend Python**

```bash
cd backend/services
python documentAnalyzer.py
```

L'API Flask démarre sur `http://localhost:5001`

**3. Tester l'API directement**

```bash
curl -X POST http://localhost:5001/api/verify-document \
  -F "document=@permis.jpg"
```

## 📊 Scoring Algorithm

### Critères de détection de fraude

| Critère | Points | Description |
|---------|--------|-------------|
| Type inconnu | +30 | Document non identifié (ni CNI, ni permis, ni passeport) |
| Mots-clés manquants | +15/mot | "RÉPUBLIQUE FRANÇAISE", "PERMIS DE CONDUIRE" absents |
| Pas de date | +20 | Aucune date au format DD/MM/YYYY détectée |
| **Date expirée** | +50 | Date de validité dépassée |
| Texte insuffisant | +25 | Moins de 100 caractères extraits (flou/illisible) |
| Caractères suspects | +15 | Symboles anormaux ou encodage corrompu |

### Verdict automatique

- **Score < 30** → ✅ **APPROVED** (Validé automatiquement)
- **Score 30-59** → ⚠️ **MANUAL_REVIEW** (Révision humaine requise)
- **Score ≥ 60** → ❌ **REJECTED** (Rejeté automatiquement)

## 🔬 Exemple de réponse API

```json
{
  "success": true,
  "ocrText": "RÉPUBLIQUE FRANÇAISE\nPERMIS DE CONDUIRE\n...",
  "detectedType": "PERMIS_DE_CONDUIRE",
  "confidence": 0.92,
  "data": {
    "lastName": "DURAND",
    "firstName": "PIERRE",
    "birthDate": "12/05/1985",
    "docNumber": "12345678910"
  },
  "dates": ["10/01/2020", "10/01/2035"],
  "riskReport": {
    "score": 15,
    "flags": [],
    "verdict": "APPROVED"
  }
}
```

## 🎨 Personnalisation

### Ajouter un nouveau type de document

Dans `documentAnalyzer.py` :

```python
self.document_types = {
    "PERMIS_DE_CONDUIRE": ["RÉPUBLIQUE FRANÇAISE", "PERMIS DE CONDUIRE"],
    "CNI": ["RÉPUBLIQUE FRANÇAISE", "CARTE NATIONALE"],
    "PASSPORT": ["PASSEPORT", "PASSPORT"],
    "VOTRE_TYPE": ["MOT_CLE_1", "MOT_CLE_2"]  # ✅ Ajoutez ici
}
```

### Ajuster les seuils de scoring

Modifiez les points dans `calculate_risk_score()` :

```python
if doc_type == "UNKNOWN":
    score += 30  # Changez cette valeur
```

## 🚨 Sécurité & Conformité

### ⚠️ Important - RGPD & Protection des données

- **Chiffrement** : Les fichiers doivent être transmis via HTTPS en production
- **Stockage** : Ne jamais sauvegarder les documents clients sans consentement explicite
- **Logs** : Anonymiser les logs (pas de noms/adresses dans les traces)
- **Retention** : Supprimer automatiquement les fichiers après analyse (délai max 24h)

### Recommandations production

```python
# Exemple de sécurisation Flask
from flask_limiter import Limiter
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://votredomaine.com"])  # Restreindre CORS
limiter = Limiter(app, default_limits=["10 per minute"])  # Rate limiting

@app.route('/api/verify-document', methods=['POST'])
@limiter.limit("5 per minute")  # Max 5 uploads/minute
def verify_document():
    # ... votre code ...
```

## 📚 Ressources complémentaires

- [Documentation Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [OpenCV Python Tutorials](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)
- [Flask REST API Best Practices](https://flask.palletsprojects.com/en/stable/tutorial/)

## 🐛 Dépannage

### `pytesseract.TesseractNotFoundError`
→ Installez Tesseract et configurez le chemin dans le script

### OCR retourne du texte vide
→ Vérifiez la qualité de l'image (min 300 DPI, contraste élevé)

### Score toujours élevé
→ Améliorez le prétraitement (`preprocess_image()`)

## 📝 TODO / Améliorations futures

- [ ] Support multi-langues (anglais, espagnol)
- [ ] Détection de falsification avancée (métadonnées EXIF)
- [ ] Reconnaissance faciale (correspondance photo/selfie)
- [ ] Cache Redis pour éviter re-analyses
- [ ] Dashboard statistiques (taux d'acceptation/rejet)
- [ ] Export PDF des rapports d'analyse

---

**Auteur** : RentFlow Team  
**Version** : 1.0.0  
**Date** : Décembre 2025
