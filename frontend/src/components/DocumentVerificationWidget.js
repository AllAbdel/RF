import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';

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
            score: 85, // Score élevé = risque fort
            flags: [
              "Date d'expiration dépassée (2018)",
              "Police de caractères incohérente détectée",
              "Faible score de confiance OCR"
            ],
            verdict: "REJECTED"
          }
        });
      }
      // Scénario par défaut (Image générique)
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
    }, 2500); // 2.5 secondes de "traitement"
  });
};

// --- COMPOSANTS UI ---

const StatusBadge = ({ verdict }) => {
  switch (verdict) {
    case 'APPROVED':
      return <span className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-bold"><CheckCircle size={16} /> VALIDE</span>;
    case 'REJECTED':
      return <span className="flex items-center gap-1 text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm font-bold"><XCircle size={16} /> REJETÉ</span>;
    default:
      return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-sm font-bold"><AlertTriangle size={16} /> À VÉRIFIER</span>;
  }
};

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4 overflow-hidden">
    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
  </div>
);

export default function DocumentVerificationWidget() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [stepText, setStepText] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
      setResult(null);
    }
  };

  const startVerification = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(10);
    setStepText("Chiffrement et envoi sécurisé...");

    // Simulation upload
    setTimeout(async () => {
      setStatus('processing');
      setProgress(30);
      setStepText("Extraction OCR en cours...");
      
      // Simulation OCR étape intermédiaire
      setTimeout(() => {
        setProgress(60);
        setStepText("Analyse des incohérences biométriques...");
      }, 1000);

      setTimeout(() => {
        setProgress(85);
        setStepText("Calcul du score de risque...");
      }, 2000);

      // Appel de l'analyse "Backend"
      const analysisResult = await analyzeDocumentMock(file);
      
      setResult(analysisResult);
      setProgress(100);
      setStatus('complete');
    }, 1000);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setResult(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="text-blue-400" /> SafeRent Verify
            </h1>
            <p className="text-slate-400 text-sm mt-1">Module de détection de fraude documentaire</p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Sécurité</div>
            <div className="text-green-400 text-sm font-mono flex items-center justify-end gap-1">
              <Lock size={12} /> TLS 1.3 ENCRYPTED
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          
          {/* Section Gauche : Upload & Preview */}
          <div className="w-full md:w-1/2 p-6 border-r border-slate-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload size={20} className="text-blue-600" /> Document Source
            </h2>

            {!file ? (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors relative">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png, application/pdf"
                />
                <div className="flex flex-col items-center text-slate-500">
                  <FileText size={48} className="mb-2 text-slate-400" />
                  <p className="font-medium">Glissez votre document ici</p>
                  <p className="text-sm mt-1">ou cliquez pour parcourir</p>
                  <p className="text-xs mt-4 text-slate-400">Supporte JPG, PNG, PDF (Max 5Mo)</p>
                  <p className="text-xs text-blue-500 mt-2 font-medium">Testez avec un fichier nommé "permis.jpg" ou "fake.jpg"</p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img src={preview} alt="Document Preview" className="w-full h-64 object-contain" />
                {status === 'processing' && (
                   <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center text-white">
                     <ScanLine size={48} className="animate-pulse mb-2 text-blue-400" />
                     <p className="font-mono animate-pulse">SCANNING...</p>
                   </div>
                )}
                {status === 'idle' && (
                  <button onClick={reset} className="absolute top-2 right-2 bg-white/90 p-1 rounded-full text-slate-600 hover:text-red-500 shadow-sm">
                    <XCircle size={20} />
                  </button>
                )}
              </div>
            )}

            <div className="mt-6">
              {status === 'idle' && file && (
                <button 
                  onClick={startVerification}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-200"
                >
                  <Search size={20} /> Lancer l'analyse
                </button>
              )}

              {(status === 'uploading' || status === 'processing') && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    <span>Status</span>
                    <span>{progress}%</span>
                  </div>
                  <ProgressBar progress={progress} />
                  <p className="text-sm text-center text-slate-600 italic animate-pulse">{stepText}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Droite : Résultats */}
          <div className="w-full md:w-1/2 p-6 bg-slate-50/50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Rapport d'Analyse
            </h2>

            {status !== 'complete' ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                <Shield size={64} className="opacity-20 mb-4" />
                <p>En attente d'analyse...</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Score Card */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Niveau de Confiance</p>
                      <div className="text-3xl font-bold mt-1 text-slate-800">
                        {100 - result.riskReport.score}/100
                      </div>
                    </div>
                    <StatusBadge verdict={result.riskReport.verdict} />
                  </div>
                  
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                     <div 
                        className={`h-full ${result.riskReport.score > 50 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{width: `${100 - result.riskReport.score}%`}}
                      ></div>
                  </div>
                </div>

                {/* Données Extraites */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                    <ScanLine size={12} /> Données OCR
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="text-slate-500">Type détecté:</span>
                      <span className="font-mono font-medium">{result.detectedType}</span>
                    </div>
                    {Object.entries(result.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drapeaux de Risque */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
                   <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                    <AlertTriangle size={12} /> Alertes de Fraude
                  </h3>
                  {result.riskReport.flags.length === 0 ? (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle size={14} /> Aucune anomalie détectée.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {result.riskReport.flags.map((flag, idx) => (
                        <li key={idx} className="text-sm text-red-600 bg-red-50 p-2 rounded flex items-start gap-2">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {flag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Raw JSON Toggle */}
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-slate-400 hover:text-blue-500 transition-colors">Voir le JSON brut (API Response)</summary>
                  <pre className="bg-slate-900 text-slate-300 p-3 rounded mt-2 overflow-x-auto font-mono">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>

                 <button 
                  onClick={reset}
                  className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={16} /> Analyser un autre document
                </button>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
