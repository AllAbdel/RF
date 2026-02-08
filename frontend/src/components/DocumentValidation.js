import React, { useState, useEffect } from 'react';
import { clientDocumentAPI } from '../services/api';
import '../styles/DocumentValidation.css';

const DocumentValidation = () => {
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [validationNotes, setValidationNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, manual_review

  useEffect(() => {
    loadPendingDocuments();
  }, []);

  const loadPendingDocuments = async () => {
    try {
      setLoading(true);
      const response = await clientDocumentAPI.getPending();
      setPendingDocuments(response.data.documents);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (documentId, action) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action === 'approved' ? 'approuver' : 'rejeter'} ce document ?`)) {
      return;
    }

    try {
      await clientDocumentAPI.validate(documentId, action, validationNotes);
      
      alert(`Document ${action === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);
      
      // Recharger la liste
      loadPendingDocuments();
      setSelectedDoc(null);
      setValidationNotes('');
    } catch (error) {
      alert('Erreur lors de la validation: ' + (error.response?.data?.error || error.message));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-green';
    if (score >= 50) return 'score-yellow';
    return 'score-red';
  };

  const getRiskLevel = (score) => {
    if (score < 50) return { text: 'ÉLEVÉ', class: 'risk-high' };
    if (score < 80) return { text: 'MOYEN', class: 'risk-medium' };
    return { text: 'FAIBLE', class: 'risk-low' };
  };

  const filteredDocuments = pendingDocuments.filter(doc => {
    if (filter === 'all') return true;
    return doc.validation_status === filter;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    // Trier par score (risque le plus élevé en premier)
    return a.overall_score - b.overall_score;
  });

  if (loading) {
    return <div className="loading">⏳ Chargement des documents...</div>;
  }

  return (
    <div className="document-validation-container">
      <div className="header">
        <h2>🔍 Validation des documents clients</h2>
        <div className="stats">
          <div className="stat-card">
            <span className="stat-number">{pendingDocuments.length}</span>
            <span className="stat-label">Documents en attente</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {pendingDocuments.filter(d => d.overall_score < 50).length}
            </span>
            <span className="stat-label">Risque élevé</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {pendingDocuments.filter(d => d.overall_score >= 50 && d.overall_score < 80).length}
            </span>
            <span className="stat-label">Vérification manuelle</span>
          </div>
        </div>
      </div>

      <div className="filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tous ({pendingDocuments.length})
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          En attente ({pendingDocuments.filter(d => d.validation_status === 'pending').length})
        </button>
        <button 
          className={filter === 'manual_review' ? 'active' : ''}
          onClick={() => setFilter('manual_review')}
        >
          Vérification manuelle ({pendingDocuments.filter(d => d.validation_status === 'manual_review').length})
        </button>
      </div>

      {sortedDocuments.length === 0 ? (
        <div className="empty-state">
          <p>✅ Aucun document en attente de validation</p>
        </div>
      ) : (
        <div className="documents-grid">
          {sortedDocuments.map((doc) => {
            const risk = getRiskLevel(doc.overall_score);
            const extractedData = doc.extracted_data ? JSON.parse(doc.extracted_data) : {};
            
            return (
              <div key={doc.id} className={`doc-validation-card ${risk.class}`}>
                <div className="doc-card-header">
                  <div className="client-info">
                    <h3>{doc.first_name} {doc.last_name}</h3>
                    <p className="email">{doc.email}</p>
                    {doc.brand && (
                      <p className="reservation">
                        📅 Réservation: {doc.brand} {doc.model}
                      </p>
                    )}
                  </div>
                  <div className={`risk-badge ${risk.class}`}>
                    Risque: {risk.text}
                  </div>
                </div>

                <div className="doc-type-badge">
                  {doc.document_type === 'id_card' ? '🪪 Carte d\'identité' : '🚗 Permis de conduire'}
                </div>

                <div className="scores-grid">
                  <div className="score-box">
                    <span className="score-label">Qualité technique</span>
                    <span className={`score-value ${getScoreColor(doc.technical_score)}`}>
                      {doc.technical_score}/100
                    </span>
                  </div>
                  <div className="score-box">
                    <span className="score-label">Format</span>
                    <span className={`score-value ${getScoreColor(doc.format_score)}`}>
                      {doc.format_score}/100
                    </span>
                  </div>
                  <div className="score-box">
                    <span className="score-label">Cohérence</span>
                    <span className={`score-value ${getScoreColor(doc.coherence_score || 0)}`}>
                      {doc.coherence_score || 0}/100
                    </span>
                  </div>
                  <div className="score-box overall">
                    <span className="score-label">SCORE GLOBAL</span>
                    <span className={`score-value ${getScoreColor(doc.overall_score)}`}>
                      {doc.overall_score}/100
                    </span>
                  </div>
                </div>

                {/* Drapeaux de fraude */}
                {(doc.is_screenshot || doc.is_edited || doc.is_duplicate) && (
                  <div className="fraud-flags">
                    <h4>⚠️ Alertes détectées:</h4>
                    {doc.is_screenshot && <span className="flag">📱 Capture d'écran</span>}
                    {doc.is_edited && <span className="flag">✏️ Document modifié</span>}
                    {doc.is_duplicate && <span className="flag">📋 Duplicata</span>}
                  </div>
                )}

                {/* Données extraites */}
                {Object.keys(extractedData).length > 0 && (
                  <div className="extracted-data">
                    <h4>📋 Données extraites (OCR):</h4>
                    {extractedData.licenseNumber && (
                      <p><strong>N° permis:</strong> {extractedData.licenseNumber}</p>
                    )}
                    {extractedData.idNumber && (
                      <p><strong>N° carte:</strong> {extractedData.idNumber}</p>
                    )}
                    {extractedData.dateOfBirth && (
                      <p><strong>Date de naissance:</strong> {extractedData.dateOfBirth}</p>
                    )}
                    {extractedData.issueDate && (
                      <p><strong>Date d'émission:</strong> {extractedData.issueDate}</p>
                    )}
                    {extractedData.expiryDate && (
                      <p><strong>Date d'expiration:</strong> {extractedData.expiryDate}</p>
                    )}
                    {extractedData.isExpired && (
                      <p className="expired">⚠️ Document expiré</p>
                    )}
                    {extractedData.names && extractedData.names.length > 0 && (
                      <p><strong>Noms détectés:</strong> {extractedData.names.join(', ')}</p>
                    )}
                  </div>
                )}

                <div className="doc-metadata">
                  <p><strong>Fichier:</strong> {doc.original_filename}</p>
                  <p><strong>Taille:</strong> {(doc.file_size / 1024).toFixed(2)} KB</p>
                  <p><strong>Date upload:</strong> {new Date(doc.created_at).toLocaleString('fr-FR')}</p>
                </div>

                <div className="validation-actions">
                  <button 
                    className="btn-view"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    👁️ Voir le document
                  </button>
                  <button 
                    className="btn-approve"
                    onClick={() => handleValidate(doc.id, 'approved')}
                  >
                    ✅ Approuver
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleValidate(doc.id, 'rejected')}
                  >
                    ❌ Rejeter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de visualisation */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedDoc(null)}>✖️</button>
            <h3>Document de {selectedDoc.first_name} {selectedDoc.last_name}</h3>
            <div className="modal-body">
              <img 
                src={`http://localhost:5000/uploads/documents/${selectedDoc.user_id}/${selectedDoc.file_path.split('\\').pop()}`}
                alt="Document"
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                onError={(e) => { e.target.src = '/no-image.svg'; }}
              />
            </div>
            <div className="modal-actions">
              <textarea
                placeholder="Notes de validation (optionnel)..."
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                rows="3"
              />
              <div className="action-buttons">
                <button 
                  className="btn-approve"
                  onClick={() => handleValidate(selectedDoc.id, 'approved')}
                >
                  ✅ Approuver
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => handleValidate(selectedDoc.id, 'rejected')}
                >
                  ❌ Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentValidation;
