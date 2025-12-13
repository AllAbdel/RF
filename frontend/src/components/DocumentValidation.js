import React, { useState } from 'react';
import { 
  Shield, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search, 
  ScanLine, 
  Lock,
  RefreshCw,
  Sparkles,
  Zap,
  Eye
} from 'lucide-react';
import './DocumentValidation.css';

/**
 * SIMULATION DU MOTEUR OCR ET ANALYSE (BACKEND LOGIC)
 * Dans une production réelle, cette logique serait sur un serveur Python/Node 
 * avec Tesseract ou OpenCV.
 */
const analyzeDocumentMock = async (file) => {
  return new Promise((resolve) => {
    // Simulation du temps de traitement OCR
    setTimeout(() => {
      const fileName = file.name.toLowerCase();
      const currentYear = new Date().getFullYear();
      
      // Scénario : Permis de conduire valide
      if (fileName.includes('permis') || fileName.includes('license')) {
        resolve({
          success: true,
          ocrText: "RÉPUBLIQUE FRANÇAISE\nPERMIS DE CONDUIRE\nF\n1. DURAND\n2. PIERRE\n3. 12/05/1985 (PARIS)\n4a. 10/01/2020 4b. 10/01/2035\n4c. PREFECTURE DE POLICE\n5. 12345678910",
          detectedType: "PERMIS_DE_CONDUIRE",
          confidence: 0.92,
          data: {
            lastName: "DURAND",
            firstName: "PIERRE",
            birthDate: "12/05/1985",
            issueDate: "10/01/2020",
            expiryDate: "10/01/2035",
            docNumber: "12345678910"
          },
          riskReport: {
            score: 15, // Score bas = risque faible
            flags: [],
            verdict: "APPROVED"
          }
        });
      } 
      // Scénario : Document expiré ou suspect
      else if (fileName.includes('faux') || fileName.includes('fake') || fileName.includes('expire')) {
        resolve({
          success: true,
          ocrText: "RÉPUBLIQUE FRANÇAISE\nCARTE NATIONALE D'IDENTITÉ\nNom: MARTIN\nValide jusqu'au: 01/01/2018",
          detectedType: "CNI",
          confidence: 0.65,
          data: {
            lastName: "MARTIN",
            expiryDate: "01/01/2018"
          },
          riskReport: {
            score: 85,
            flags: [
              "Date d'expiration dépassée (2018)",
              "Police de caractères incohérente détectée",
              "Faible score de confiance OCR"
            ],
            verdict: "REJECTED"
          }
        });
      }
      else {
        resolve({
          success: true,
          ocrText: "DOCUMENT NON RECONNU\nTEXTE ILLISIBLE...",
          detectedType: "UNKNOWN",
          confidence: 0.40,
          data: {},
          riskReport: {
            score: 60,
            flags: ["Type de document non identifié", "Texte flou ou incomplet"],
            verdict: "MANUAL_REVIEW"
          }
        });
      }
    }, 2500);
  });
};

const StatusBadge = ({ verdict }) => {
  switch (verdict) {
    case 'APPROVED':
      return (
        <span className="status-badge status-approved animate-fadeInBounce">
          <CheckCircle size={18} className="animate-spin-once" /> 
          <span className="font-bold">DOCUMENT VALIDE</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="status-badge status-rejected animate-fadeInBounce">
          <XCircle size={18} className="animate-shake" /> 
          <span className="font-bold">DOCUMENT REJETÉ</span>
        </span>
      );
    default:
      return (
        <span className="status-badge status-review animate-fadeInBounce">
          <AlertTriangle size={18} className="animate-pulse" /> 
          <span className="font-bold">VÉRIFICATION MANUELLE</span>
        </span>
      );
  }
};

const ProgressBar = ({ progress }) => (
  <div className="progress-container">
    <div className="progress-bar" style={{ width: `${progress}%` }}>
      <div className="progress-shine"></div>
    </div>
  </div>
);

const DocumentValidation = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [stepText, setStepText] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('❌ Veuillez sélectionner une image (JPG, PNG, etc.)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('❌ Le fichier est trop volumineux (max 10 Mo)');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setStatus('idle');
    setResult(null);
    setProgress(0);
  };

  const startVerification = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(0);
    setStepText("📤 Upload du document...");

    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }

    setStatus('processing');
    setStepText("🔍 Analyse OCR en cours...");
    setProgress(0);

    for (let i = 0; i <= 100; i += 5) {
      setProgress(i);
      if (i === 25) setStepText("🔎 Extraction du texte...");
      if (i === 50) setStepText("🧠 Analyse de fraude...");
      if (i === 75) setStepText("✅ Génération du rapport...");
      await new Promise(r => setTimeout(r, 50));
    }

    const analysisResult = await analyzeDocumentMock(file);
    setResult(analysisResult);
    setStatus('complete');
    setProgress(100);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setStepText("");
  };

  return (
    <div className="doc-validation-page">
      <div className="doc-validation-wrapper">
        <div className="doc-validation-card">
          <div className="doc-header animate-slideDown">
            <div className="header-icon-wrapper">
              <Shield className="header-icon" size={40} />
              <Sparkles className="sparkle-icon" size={20} />
            </div>
            <div>
              <h1 className="header-title">Vérification de Documents</h1>
              <p className="header-subtitle">Intelligence Artificielle • Analyse OCR • Détection de fraude</p>
            </div>
          </div>

          {!file && (
            <div className="upload-zone animate-fadeIn" onClick={() => document.getElementById('fileInput').click()}>
              <div className="upload-icon-wrapper">
                <Upload className="upload-icon" size={64} />
                <div className="upload-pulse"></div>
              </div>
              <p className="upload-title">
                Déposez votre document ici
              </p>
              <p className="upload-subtitle">
                ou cliquez pour sélectionner
              </p>
              <div className="upload-formats">
                <span className="format-badge">📄 JPG</span>
                <span className="format-badge">📄 PNG</span>
                <span className="format-badge">📄 PDF</span>
                <span className="format-badge-size">Max 10 Mo</span>
              </div>
              <input id="fileInput" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          )}

          {file && (
            <div className="file-preview-section animate-fadeIn">
              <div className="preview-wrapper">
                <img src={preview} alt="Aperçu" className="preview-image" />
                <button onClick={reset} className="reset-button" title="Nouveau document">
                  <RefreshCw size={22} />
                </button>
                <div className="preview-overlay">
                  <Eye size={32} className="preview-eye-icon" />
                </div>
              </div>

              <div className="file-info-card">
                <FileText size={24} className="file-icon" />
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(0)} Ko</span>
                </div>
              </div>

              {status === 'idle' && (
                <button onClick={startVerification} className="scan-button animate-pulse-glow">
                  <Zap size={28} className="scan-icon" />
                  <span className="scan-text">Lancer l'analyse intelligente</span>
                  <ScanLine size={24} className="scan-icon-secondary" />
                </button>
              )}

              {(status === 'uploading' || status === 'processing') && (
                <div className="processing-section">
                  <ProgressBar progress={progress} />
                  <p className="processing-text">
                    {stepText}
                  </p>
                  <div className="processing-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}

              {status === 'complete' && result && (
                <div className="results-section animate-fadeInUp">
                  <div className="verdict-card">
                    <div className="verdict-content">
                      <div className="verdict-label">Verdict final</div>
                      <StatusBadge verdict={result.riskReport.verdict} />
                    </div>
                    <div className="risk-score-wrapper">
                      <div className="risk-score-label">Score de risque</div>
                      <div className={`risk-score ${
                        result.riskReport.score < 30 ? 'risk-low' : 
                        result.riskReport.score < 70 ? 'risk-medium' : 
                        'risk-high'
                      }`}>
                        <span className="score-value">{result.riskReport.score}</span>
                        <span className="score-max">/100</span>
                      </div>
                      <div className="risk-score-bar">
                        <div 
                          className={`risk-score-fill ${
                            result.riskReport.score < 30 ? 'fill-low' : 
                            result.riskReport.score < 70 ? 'fill-medium' : 
                            'fill-high'
                          }`}
                          style={{ width: `${result.riskReport.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {result.riskReport.flags.length > 0 && (
                    <div className="alerts-card">
                      <div className="alerts-header">
                        <AlertTriangle className="alert-icon" size={24} />
                        <h3 className="alerts-title">Alertes détectées</h3>
                      </div>
                      <ul className="alerts-list">
                        {result.riskReport.flags.map((flag, i) => (
                          <li key={i} className="alert-item animate-slideInLeft" style={{animationDelay: `${i * 0.1}s`}}>
                            <span className="alert-bullet"></span>
                            <span className="alert-text">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="ocr-card">
                    <div className="ocr-header">
                      <Search size={24} className="ocr-icon" />
                      <h3 className="ocr-title">Texte extrait (OCR)</h3>
                    </div>
                    <pre className="ocr-content">{result.ocrText}</pre>
                  </div>

                  <div className="info-grid">
                    <div className="info-card info-type">
                      <div className="info-label">Type de document</div>
                      <div className="info-value">{result.detectedType}</div>
                    </div>
                    <div className="info-card info-confidence">
                      <div className="info-label">Confiance OCR</div>
                      <div className="info-value">{(result.confidence * 100).toFixed(0)}%</div>
                      <div className="confidence-bar">
                        <div className="confidence-fill" style={{ width: `${result.confidence * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="security-notice">
                    <Lock className="security-icon" size={22} />
                    <div>
                      <strong>Sécurité et confidentialité</strong>
                      <p>Aucune donnée n'est envoyée à un serveur externe. Toute l'analyse est effectuée localement.</p>
                    </div>
                  </div>

                  <button onClick={reset} className="new-analysis-button">
                    <RefreshCw size={22} />
                    Analyser un nouveau document
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentValidation;
