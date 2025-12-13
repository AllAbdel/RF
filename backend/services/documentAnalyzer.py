"""
SafeRent Verify - Backend OCR & Fraud Detection Engine
Module de détection de fraude documentaire avec scoring intelligent

Dépendances :
pip install pytesseract opencv-python pillow

Configuration Tesseract (Windows) :
1. Téléchargez Tesseract : https://github.com/UB-Mannheim/tesseract/wiki
2. Installez-le (ex: C:\\Program Files\\Tesseract-OCR)
3.Ajoutez le chemin au PATH ou configurez pytesseract.pytesseract.tesseract_cmd
"""

import pytesseract
import cv2
import re
from datetime import datetime
from pathlib import Path
import json

# Configuration Tesseract (Windows)
# Décommentez et ajustez le chemin si nécessaire :
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


class DocumentAnalyzer:
    """
    Moteur d'analyse de documents avec OCR et détection de fraude
    """
    
    def __init__(self):
        self.document_types = {
            "PERMIS_DE_CONDUIRE": ["RÉPUBLIQUE FRANÇAISE", "PERMIS DE CONDUIRE", "PREFECTURE"],
            "CNI": ["RÉPUBLIQUE FRANÇAISE", "CARTE NATIONALE", "IDENTITÉ"],
            "PASSPORT": ["PASSEPORT", "PASSPORT", "RÉPUBLIQUE FRANÇAISE"]
        }
    
    def preprocess_image(self, image_path):
        """
        Prétraitement de l'image pour améliorer l'OCR
        """
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Impossible de lire l'image : {image_path}")
        
        # Conversion en niveaux de gris
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Réduction du bruit
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Binarisation adaptative
        binary = cv2.adaptiveThreshold(
            denoised, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        return binary
    
    def extract_text(self, image_path):
        """
        Extraction OCR du texte
        """
        processed_img = self.preprocess_image(image_path)
        text = pytesseract.image_to_string(processed_img, lang='fra')
        return text
    
    def detect_document_type(self, text):
        """
        Détection du type de document par mots-clés
        """
        text_upper = text.upper()
        
        for doc_type, keywords in self.document_types.items():
            found = sum(1 for kw in keywords if kw in text_upper)
            if found >= 2:  # Au moins 2 mots-clés trouvés
                return doc_type, found / len(keywords)
        
        return "UNKNOWN", 0.0
    
    def extract_dates(self, text):
        """
        Extraction des dates au format DD/MM/YYYY
        """
        pattern = r'\b(\d{2})/(\d{2})/(\d{4})\b'
        matches = re.findall(pattern, text)
        
        dates = []
        for day, month, year in matches:
            try:
                date_obj = datetime(int(year), int(month), int(day))
                dates.append({
                    'raw': f"{day}/{month}/{year}",
                    'date': date_obj,
                    'is_expired': date_obj < datetime.now()
                })
            except ValueError:
                pass  # Date invalide
        
        return dates
    
    def calculate_risk_score(self, text, doc_type, dates):
        """
        Calcul du score de risque de fraude (0-100)
        Score bas = document fiable
        Score élevé = risque de fraude
        """
        score = 0
        flags = []
        
        # 1. Type de document non reconnu (+30 points)
        if doc_type == "UNKNOWN":
            score += 30
            flags.append("Type de document non identifié")
        
        # 2. Mots-clés obligatoires manquants
        required_keywords = self.document_types.get(doc_type, [])
        text_upper = text.upper()
        missing_keywords = [kw for kw in required_keywords if kw not in text_upper]
        
        if missing_keywords:
            score += 15 * len(missing_keywords)
            flags.append(f"Mots-clés officiels manquants : {', '.join(missing_keywords[:2])}")
        
        # 3. Absence de dates (+20 points)
        if not dates:
            score += 20
            flags.append("Aucune date détectée")
        
        # 4. Document expiré (+50 points)
        expired_dates = [d for d in dates if d['is_expired']]
        if expired_dates:
            score += 50
            oldest = min(expired_dates, key=lambda d: d['date'])
            flags.append(f"Date d'expiration dépassée ({oldest['raw']})")
        
        # 5. Texte trop court (< 100 caractères) (+25 points)
        if len(text.strip()) < 100:
            score += 25
            flags.append("Texte extrait insuffisant ou illisible")
        
        # 6. Caractères suspects (symboles anormaux)
        suspicious_chars = sum(1 for c in text if ord(c) > 127 and not c.isalpha())
        if suspicious_chars > 20:
            score += 15
            flags.append("Caractères suspects détectés (possible altération)")
        
        # Limiter le score à 100
        score = min(score, 100)
        
        # Déterminer le verdict
        if score < 30:
            verdict = "APPROVED"
        elif score < 60:
            verdict = "MANUAL_REVIEW"
        else:
            verdict = "REJECTED"
        
        return {
            "score": score,
            "flags": flags,
            "verdict": verdict
        }
    
    def analyze_document(self, image_path):
        """
        Analyse complète d'un document
        Retourne un rapport JSON complet
        """
        try:
            # Extraction OCR
            text = self.extract_text(image_path)
            
            # Détection du type
            doc_type, confidence = self.detect_document_type(text)
            
            # Extraction des dates
            dates = self.extract_dates(text)
            
            # Calcul du risque
            risk_report = self.calculate_risk_score(text, doc_type, dates)
            
            # Extraction de données structurées (exemple pour permis)
            data = self._extract_structured_data(text, doc_type)
            
            return {
                "success": True,
                "ocrText": text,
                "detectedType": doc_type,
                "confidence": confidence,
                "data": data,
                "dates": [d['raw'] for d in dates],
                "riskReport": risk_report
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _extract_structured_data(self, text, doc_type):
        """
        Extraction de données structurées selon le type de document
        """
        data = {}
        
        if doc_type == "PERMIS_DE_CONDUIRE":
            # Exemple : extraction nom/prénom
            name_match = re.search(r'1\.\s*([A-Z\s]+)', text)
            if name_match:
                data['lastName'] = name_match.group(1).strip()
            
            firstname_match = re.search(r'2\.\s*([A-Z\s]+)', text)
            if firstname_match:
                data['firstName'] = firstname_match.group(1).strip()
            
            # Numéro de permis
            number_match = re.search(r'5\.\s*(\d+)', text)
            if number_match:
                data['docNumber'] = number_match.group(1)
        
        return data


# ========================================
# EXEMPLE D'UTILISATION
# ========================================

if __name__ == "__main__":
    analyzer = DocumentAnalyzer()
    
    # Exemple d'analyse
    test_image = "test_permis.jpg"  # Remplacez par votre fichier
    
    if Path(test_image).exists():
        result = analyzer.analyze_document(test_image)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"❌ Fichier {test_image} introuvable")
        print("\nPour tester :")
        print("1. Placez une image de document dans le dossier courant")
        print("2. Nommez-la 'test_permis.jpg'")
        print("3. Relancez ce script")


# ========================================
# INTÉGRATION AVEC API REST (Flask)
# ========================================
"""
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = './uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max

analyzer = DocumentAnalyzer()

@app.route('/api/verify-document', methods=['POST'])
def verify_document():
    if 'document' not in request.files:
        return jsonify({'error': 'Aucun fichier fourni'}), 400
    
    file = request.files['document']
    if file.filename == '':
        return jsonify({'error': 'Nom de fichier vide'}), 400
    
    # Sauvegarde temporaire
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    # Analyse
    result = analyzer.analyze_document(filepath)
    
    # Nettoyage
    os.remove(filepath)
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
"""
