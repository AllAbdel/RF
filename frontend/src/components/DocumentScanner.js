import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import '../styles/DocumentScanner.css';

/**
 * --- MOTEUR D'ANALYSE ANTI-FRAUDE (LOGIQUE MÉTIER) ---
 * Cette section contient la logique pure pour analyser les données extraites.
 */

class FraudEngine {
  // Regex pour détecter les formats de dates courants (DD/MM/YYYY ou DD.MM.YYYY)
  static dateRegex = /(\d{2})[./-](\d{2})[./-](\d{4})/;
  
  // Regex simplifiée pour détecter une MRZ (Zone de Lecture Automatique)
  static mrzPassportRegex = /P<[A-Z]{3}([A-Z<]+)<<([A-Z<]+)\n([A-Z0-9<]+)/;
  static mrzIdRegex = /ID[A-Z]{3}([A-Z0-9<]+)/;

  // Analyse du texte brut extrait par l'OCR
  static analyze(text) {
    const cleanText = text.toUpperCase();
    const flags = [];
    let score = 0;
    let type = 'UNKNOWN';
    
    // 1. Détection du type de document
    if (cleanText.includes('PASSEPORT') || cleanText.includes('PASSPORT')) {
      type = 'PASSPORT';
      score += 20;
    } else if (cleanText.includes('CARTE NATIONALE') || cleanText.includes('IDENTITY CARD') || cleanText.includes('CNI') || cleanText.includes('CARTE D\'IDENTITE') || cleanText.includes('CARTE D\'IDENTITÉ')) {
      type = 'ID_CARD';
      score += 20;
    } else if (cleanText.includes('PERMIS DE CONDUIRE') || cleanText.includes('DRIVING LICENSE') || cleanText.includes('PERMIS') || cleanText.includes('CATÉGORIES')) {
      type = 'DRIVER_LICENSE';
      score += 20;
    } else {
      flags.push("Type de document incertain");
    }

    // 2. Recherche de MRZ (Machine Readable Zone)
    const hasMRZ = this.mrzPassportRegex.test(cleanText) || this.mrzIdRegex.test(cleanText) || cleanText.includes('<<<<') || cleanText.includes('<<<');
    if (hasMRZ) {
      score += 30;
    } else if (type !== 'DRIVER_LICENSE') {
      flags.push("Zone MRZ manquante ou illisible");
      score -= 10;
    }

    // 3. Extraction et validation des dates
    const dateMatches = cleanText.match(new RegExp(this.dateRegex, 'g'));
    let expiryValid = false;
    let birthDate = null;
    let expiryDate = null;

    if (dateMatches && dateMatches.length > 0) {
      const parsedDates = dateMatches.map(d => {
        const parts = d.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
        return parts ? new Date(`${parts[3]}-${parts[2]}-${parts[1]}`) : new Date(0);
      }).filter(d => d.getTime() !== 0 && !isNaN(d.getTime()));

      const today = new Date();
      const futureDates = parsedDates.filter(d => d > today);
      const pastDates = parsedDates.filter(d => d < today);

      if (futureDates.length > 0) {
        expiryValid = true;
        expiryDate = new Date(Math.max(...futureDates.map(d => d.getTime())));
        score += 20;
      } else {
        flags.push("Document potentiellement expiré (aucune date future trouvée)");
        score -= 20;
      }

      // Vérification âge
      if (pastDates.length > 0) {
        const oldestDate = new Date(Math.min(...pastDates.map(d => d.getTime())));
        const ageDiff = today.getFullYear() - oldestDate.getFullYear();
        if (ageDiff >= 18 && ageDiff <= 100) {
          birthDate = oldestDate;
          score += 10;
        } else if (ageDiff > 0 && ageDiff < 18) {
          flags.push("Conducteur potentiellement mineur");
        }
      }
    } else {
      flags.push("Aucune date lisible détectée");
    }

    // 4. Mots clés de sécurité
    const securityKeywords = ['RÉPUBLIQUE', 'FRANÇAISE', 'NAME', 'NOM', 'PRÉNOM', 'DATE', 'SIGNATURE', 'NATIONALITÉ', 'SEXE', 'FRANCE'];
    let keywordCount = 0;
    securityKeywords.forEach(k => {
      if (cleanText.includes(k)) keywordCount++;
    });
    
    if (keywordCount >= 3) {
      score += 20;
    } else {
      flags.push("Peu de marqueurs officiels détectés (scan flou ?)");
    }

    // 5. Recherche de numéro de document
    const docNumberRegex = /\b[A-Z0-9]{8,15}\b/g;
    const docNumbers = cleanText.match(docNumberRegex);
    const hasDocNumber = docNumbers && docNumbers.length > 0;
    if (hasDocNumber) {
      score += 10;
    }

    // Normalisation du score
    score = Math.min(100, Math.max(0, score));

    // Détermination de la confiance
    let confidence = 'Faible';
    if (score > 80) confidence = 'Élevé';
    else if (score > 50) confidence = 'Moyen';

    return {
      isValid: score > 50,
      score,
      confidence,
      detectedType: type,
      extractedData: {
        mrzFound: hasMRZ,
        expiryDate: expiryDate ? expiryDate.toLocaleDateString('fr-FR') : (expiryValid ? "Validée" : "Non trouvée/Expirée"),
        birthDate: birthDate ? birthDate.toLocaleDateString('fr-FR') : null,
        docNumber: hasDocNumber ? docNumbers[0] : null
      },
      flags,
      rawText: text.substring(0, 500) // Garder un extrait du texte pour debug
    };
  }
}

/**
 * --- COMPOSANTS UI ---
 */

const FileUploader = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="scanner-file-uploader"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/png, image/jpeg, image/jpg"
        onChange={(e) => e.target.files && onFileSelect(e.target.files[0])} 
      />
      <div className="uploader-content">
        <div className="uploader-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div>
          <h3>Glissez votre document ici</h3>
          <p>ou cliquez pour parcourir (JPG, PNG)</p>
        </div>
        <div className="uploader-hint">
          Nous acceptons les Cartes d'identité, Passeports et Permis de conduire.
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ result }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'score-green';
    if (score >= 50) return 'score-yellow';
    return 'score-red';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'PASSPORT': 'Passeport',
      'ID_CARD': 'Carte d\'identité',
      'DRIVER_LICENSE': 'Permis de conduire',
      'UNKNOWN': 'Non identifié'
    };
    return labels[type] || type;
  };

  return (
    <div className="scanner-result-card">
      <div className="result-header">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Rapport d'Analyse Anti-Fraude
        </h3>
        <span className={`score-badge ${getScoreColor(result.score)}`}>
          Score: {result.score}/100
        </span>
      </div>
      
      <div className="result-body">
        {/* Résumé Principal */}
        <div className="result-summary">
          <div className="summary-box">
            <span className="summary-label">Document</span>
            <div className="summary-value">{getTypeLabel(result.detectedType)}</div>
          </div>
          <div className="summary-box">
            <span className="summary-label">Confiance</span>
            <div className={`summary-value confidence-${result.confidence.toLowerCase()}`}>
              {result.confidence}
            </div>
          </div>
        </div>

        {/* Indicateurs */}
        <div className="result-indicators">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Indicateurs
          </h4>
          <div className="indicator-list">
            <div className="indicator-item">
              <span>Structure MRZ (Machine Readable)</span>
              {result.extractedData.mrzFound ? 
                <span className="indicator-status success">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Détectée
                </span> : 
                <span className="indicator-status fail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  Absente
                </span>
              }
            </div>
            <div className="indicator-item">
              <span>Cohérence des dates</span>
              {result.extractedData.expiryDate === 'Non trouvée/Expirée' ? 
                <span className="indicator-status fail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Suspecte
                </span> : 
                <span className="indicator-status success">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Valide
                </span>
              }
            </div>
            {result.extractedData.birthDate && (
              <div className="indicator-item">
                <span>Date de naissance détectée</span>
                <span className="indicator-value">{result.extractedData.birthDate}</span>
              </div>
            )}
            {result.extractedData.expiryDate && result.extractedData.expiryDate !== 'Non trouvée/Expirée' && (
              <div className="indicator-item">
                <span>Date d'expiration</span>
                <span className="indicator-value">{result.extractedData.expiryDate}</span>
              </div>
            )}
            {result.extractedData.docNumber && (
              <div className="indicator-item">
                <span>Numéro de document</span>
                <span className="indicator-value">{result.extractedData.docNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Drapeaux d'alerte */}
        {result.flags.length > 0 && (
          <div className="result-flags">
            <h4 className="flags-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Anomalies Détectées
            </h4>
            <ul className="flags-list">
              {result.flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* JSON Technique (pour dev) */}
        <div className="result-technical">
          <details>
            <summary>Voir le JSON brut (Debug)</summary>
            <pre>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default function DocumentScanner() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, SCANNING, ANALYZING, DONE
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  // Dimensions minimales pour Tesseract (en pixels)
  const MIN_WIDTH = 100;
  const MIN_HEIGHT = 100;

  /**
   * Prépare l'image pour l'OCR en vérifiant les dimensions
   * et en la redimensionnant si nécessaire
   */
  const prepareImageForOCR = (imageFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        
        // Vérifier si l'image est trop petite
        if (width < MIN_WIDTH || height < MIN_HEIGHT) {
          // Calculer le facteur de redimensionnement
          const scaleX = width < MIN_WIDTH ? MIN_WIDTH / width : 1;
          const scaleY = height < MIN_HEIGHT ? MIN_HEIGHT / height : 1;
          const scale = Math.max(scaleX, scaleY, 2); // Au moins x2 pour améliorer la qualité
          
          const newWidth = Math.round(width * scale);
          const newHeight = Math.round(height * scale);
          
          // Créer un canvas pour redimensionner
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext('2d');
          
          // Utiliser un lissage de qualité pour l'upscale
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Convertir en blob
          canvas.toBlob((blob) => {
            if (blob) {
              console.log(`Image redimensionnée: ${width}x${height} → ${newWidth}x${newHeight}`);
              resolve(blob);
            } else {
              reject(new Error('Impossible de redimensionner l\'image'));
            }
          }, 'image/png', 1.0);
        } else {
          // L'image est assez grande, utiliser telle quelle
          resolve(imageFile);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Impossible de charger l\'image'));
      };
      
      // Charger l'image depuis le fichier
      img.src = URL.createObjectURL(imageFile);
    });
  };

  // OCR réel avec Tesseract.js
  const performOCR = async (imageFile) => {
    try {
      // Préparer l'image (redimensionner si trop petite)
      const preparedImage = await prepareImageForOCR(imageFile);
      
      const { data: { text } } = await Tesseract.recognize(
        preparedImage,
        'fra', // Langue française
        { 
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      return text;
    } catch (error) {
      console.error('Erreur OCR:', error);
      throw error;
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setStatus('SCANNING');
    setProgress(0);
    setError(null);
    
    try {
      // Étape 1: OCR
      const text = await performOCR(file);
      
      // Vérifier si du texte a été extrait
      if (!text || text.trim().length < 10) {
        setError("Aucun texte lisible détecté. Assurez-vous que l'image est nette et bien éclairée.");
        setStatus('IDLE');
        return;
      }
      
      setStatus('ANALYZING');
      
      // Étape 2: Analyse Algorithmique
      setTimeout(() => {
        const result = FraudEngine.analyze(text);
        setScanResult(result);
        setStatus('DONE');
      }, 500);

    } catch (err) {
      console.error("Erreur d'analyse", err);
      setStatus('IDLE');
      
      // Message d'erreur adapté
      if (err.message.includes('small') || err.message.includes('scale')) {
        setError("L'image est trop petite ou de trop basse résolution. Utilisez un scan ou une photo de meilleure qualité (minimum 300x300 pixels recommandé).");
      } else if (err.message.includes('charger')) {
        setError("Impossible de charger l'image. Vérifiez que le fichier n'est pas corrompu.");
      } else {
        setError("Erreur lors de la lecture du document. Veuillez réessayer avec une image de meilleure qualité.");
      }
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setScanResult(null);
    setStatus('IDLE');
    setProgress(0);
    setError(null);
  };

  const onFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setScanResult(null);
    setStatus('IDLE');
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="document-scanner-container">
      {/* Header */}
      <div className="scanner-header">
        <h2>Vérification Documents</h2>
        <p>Module de détection de fraude pour location de véhicules. Analyse OCR & contrôle de cohérence.</p>
      </div>

      <div className="scanner-content">
        {/* Colonne Gauche : Upload & Preview */}
        <div className="scanner-left">
          {!file ? (
            <FileUploader onFileSelect={onFileSelect} />
          ) : (
            <div className="scanner-preview-container">
              <img src={preview} alt="Document Preview" className="scanner-preview-image" />
              
              {status === 'SCANNING' && (
                <div className="scanner-overlay scanning">
                  <div className="spinner"></div>
                  <p>Extraction du texte (OCR)... {progress}%</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
              
              {status === 'ANALYZING' && (
                <div className="scanner-overlay analyzing">
                  <div className="shield-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <p>Analyse des risques...</p>
                </div>
              )}

              {status !== 'SCANNING' && status !== 'ANALYZING' && (
                <button className="reset-btn" onClick={reset} title="Changer d'image">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Affichage des erreurs */}
          {error && (
            <div className="scanner-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {file && status === 'IDLE' && (
            <button className="analyze-btn" onClick={handleProcess}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Lancer l'Analyse
            </button>
          )}

          <div className="scanner-notice">
            <strong>Note de confidentialité :</strong> Le traitement est effectué localement dans votre navigateur. 
            Aucune image n'est envoyée vers des serveurs externes pour l'analyse OCR.
          </div>
        </div>

        {/* Colonne Droite : Résultats */}
        <div className="scanner-right">
          {status === 'DONE' && scanResult ? (
            <ResultCard result={scanResult} />
          ) : (
            <div className="scanner-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p>Les résultats de l'analyse apparaîtront ici.</p>
              <span>Le système vérifie la présence de MRZ, la cohérence des dates et les mots-clés officiels.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
