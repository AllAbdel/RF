import React, { useState, useEffect } from 'react';
import { clientDocumentAPI } from '../services/api';
import '../styles/DocumentUpload.css';

const DocumentUpload = ({ reservationId }) => {
  const [files, setFiles] = useState({
    id_card: null,
    driving_license: null
  });
  const [previews, setPreviews] = useState({
    id_card: null,
    driving_license: null
  });
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [myDocuments, setMyDocuments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMyDocuments();
  }, []);

  const loadMyDocuments = async () => {
    try {
      const response = await clientDocumentAPI.getMyDocuments();
      setMyDocuments(response.data.documents);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    }
  };

  const handleFileSelect = (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Type de fichier non autorisé pour ${docType}. Utilisez JPG, PNG ou PDF.`);
      return;
    }

    // Vérifier la taille (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError(`Le fichier ${file.name} est trop volumineux (max 10MB)`);
      return;
    }

    setFiles({ ...files, [docType]: file });
    setError('');

    // Créer preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews({ ...previews, [docType]: e.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!files.id_card && !files.driving_license) {
      setError('Veuillez sélectionner au moins un document');
      return;
    }

    setUploading(true);
    setError('');
    setResults(null);

    try {
      const formData = new FormData();
      if (files.id_card) formData.append('id_card', files.id_card);
      if (files.driving_license) formData.append('driving_license', files.driving_license);
      if (reservationId) formData.append('reservation_id', reservationId);

      const response = await clientDocumentAPI.upload(formData);

      setResults(response.data);
      loadMyDocuments();

      // Réinitialiser
      setFiles({ id_card: null, driving_license: null });
      setPreviews({ id_card: null, driving_license: null });
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { text: 'Approuvé', class: 'status-approved' },
      rejected: { text: 'Rejeté', class: 'status-rejected' },
      pending: { text: 'En attente', class: 'status-pending' },
      manual_review: { text: 'Vérification manuelle', class: 'status-review' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-green';
    if (score >= 50) return 'score-yellow';
    return 'score-red';
  };

  const downloadDocument = async (docId, filename) => {
    try {
      const response = await clientDocumentAPI.download(docId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  return (
    <div className="document-upload-container">
      <h2>📄 Vérification de documents</h2>
      
      <div className="upload-section">
        <h3>Uploader vos documents</h3>
        <p className="info-text">
          Pour valider votre réservation, nous devons vérifier vos documents d'identité.
          Nos algorithmes de détection automatique analysent la qualité et l'authenticité des documents.
        </p>

        <div className="upload-grid">
          {/* Carte d'identité */}
          <div className="upload-box">
            <h4>🪪 Carte d'identité</h4>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={(e) => handleFileSelect('id_card', e)}
              disabled={uploading}
            />
            {previews.id_card && (
              <div className="preview">
                <img src={previews.id_card} alt="Aperçu carte d'identité" />
              </div>
            )}
          </div>

          {/* Permis de conduire */}
          <div className="upload-box">
            <h4>🚗 Permis de conduire</h4>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={(e) => handleFileSelect('driving_license', e)}
              disabled={uploading}
            />
            {previews.driving_license && (
              <div className="preview">
                <img src={previews.driving_license} alt="Aperçu permis" />
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="upload-btn"
          onClick={handleUpload}
          disabled={uploading || (!files.id_card && !files.driving_license)}
        >
          {uploading ? '⏳ Analyse en cours...' : '🚀 Analyser les documents'}
        </button>

        {/* Résultats de l'analyse */}
        {results && (
          <div className="analysis-results">
            <h3>✅ Analyse terminée</h3>
            <p className="recommendation">{results.recommendation}</p>
            
            <div className="documents-results">
              {results.documents.map((doc, idx) => (
                <div key={idx} className="doc-result">
                  <h4>{doc.type === 'id_card' ? '🪪 Carte d\'identité' : '🚗 Permis de conduire'}</h4>
                  
                  <div className="scores">
                    <div className="score-item">
                      <span>Qualité technique:</span>
                      <span className={getScoreColor(doc.technicalScore)}>
                        {doc.technicalScore}/100
                      </span>
                    </div>
                    <div className="score-item">
                      <span>Validation format:</span>
                      <span className={getScoreColor(doc.formatScore)}>
                        {doc.formatScore}/100
                      </span>
                    </div>
                    {doc.coherenceScore > 0 && (
                      <div className="score-item">
                        <span>Cohérence:</span>
                        <span className={getScoreColor(doc.coherenceScore)}>
                          {doc.coherenceScore}/100
                        </span>
                      </div>
                    )}
                    <div className="score-item overall">
                      <span>Score global:</span>
                      <span className={getScoreColor(doc.overallScore)}>
                        {doc.overallScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="flags">
                    {doc.flags.isScreenshot && <span className="flag warning">⚠️ Capture d'écran détectée</span>}
                    {doc.flags.isEdited && <span className="flag warning">⚠️ Document modifié</span>}
                    {doc.flags.isDuplicate && <span className="flag warning">⚠️ Duplicata détecté</span>}
                  </div>

                  {getStatusBadge(doc.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Liste de mes documents */}
      <div className="my-documents-section">
        <h3>📂 Mes documents</h3>
        {myDocuments.length === 0 ? (
          <p className="empty-message">Aucun document téléchargé</p>
        ) : (
          <div className="documents-list">
            {myDocuments.map((doc) => (
              <div key={doc.id} className="doc-card">
                <div className="doc-header">
                  <span className="doc-type">
                    {doc.document_type === 'id_card' ? '🪪 Carte d\'identité' : '🚗 Permis de conduire'}
                  </span>
                  {getStatusBadge(doc.validation_status)}
                </div>
                
                <div className="doc-info">
                  <p><strong>Fichier:</strong> {doc.original_filename}</p>
                  <p><strong>Date:</strong> {new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Score global:</strong> <span className={getScoreColor(doc.overall_score)}>{doc.overall_score}/100</span></p>
                </div>

                {doc.validation_notes && (
                  <div className="validation-notes">
                    <strong>Notes de validation:</strong>
                    <p>{doc.validation_notes}</p>
                  </div>
                )}

                <div className="doc-actions">
                  <button onClick={() => downloadDocument(doc.id, doc.original_filename)}>
                    📥 Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
