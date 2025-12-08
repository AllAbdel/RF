import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import '../styles/DocumentViewer.css';

const DocumentViewer = ({ reservationId, userType }) => {
  const [documents, setDocuments] = useState([]);
  const [contractSigned, setContractSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [reservationId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.getDocuments(reservationId);
      setDocuments(response.data.documents);
      setContractSigned(response.data.contract_signed);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement documents:', err);
      setError('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async (type) => {
    try {
      setGenerating(true);
      if (type === 'invoice') {
        await documentAPI.generateInvoice(reservationId);
      } else if (type === 'receipt') {
        await documentAPI.generateReceipt(reservationId);
      } else if (type === 'contract') {
        await documentAPI.generateContract(reservationId);
      }
      await loadDocuments();
      setError(null);
    } catch (err) {
      console.error(`Erreur génération ${type}:`, err);
      setError(`Erreur lors de la génération du document`);
    } finally {
      setGenerating(false);
    }
  };

  const downloadDocument = async (documentId, documentNumber) => {
    try {
      const response = await documentAPI.download(documentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${documentNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      setError('Erreur lors du téléchargement');
    }
  };

  const getDocumentLabel = (type) => {
    const labels = {
      invoice: 'Facture',
      receipt: 'Reçu',
      contract: 'Contrat'
    };
    return labels[type] || type;
  };

  const getDocumentIcon = (type) => {
    const icons = {
      invoice: '📄',
      receipt: '🧾',
      contract: '📋'
    };
    return icons[type] || '📄';
  };

  const hasDocument = (type) => {
    return documents.some(doc => doc.document_type === type);
  };

  const getDocument = (type) => {
    return documents.find(doc => doc.document_type === type);
  };

  if (loading) {
    return <div className="documents-loading">Chargement des documents...</div>;
  }

  return (
    <div className="document-viewer">
      <h3>📑 Documents de la réservation</h3>
      
      {error && <div className="documents-error">{error}</div>}

      <div className="documents-list">
        {/* Facture */}
        <div className="document-item">
          <div className="document-info">
            <span className="document-icon">{getDocumentIcon('invoice')}</span>
            <div>
              <div className="document-title">Facture</div>
              {hasDocument('invoice') && (
                <div className="document-number">{getDocument('invoice').document_number}</div>
              )}
            </div>
          </div>
          <div className="document-actions">
            {hasDocument('invoice') ? (
              <button 
                className="btn btn-download"
                onClick={() => downloadDocument(getDocument('invoice').id, getDocument('invoice').document_number)}
              >
                📥 Télécharger
              </button>
            ) : userType !== 'client' && (
              <button 
                className="btn btn-generate"
                onClick={() => generateDocument('invoice')}
                disabled={generating}
              >
                ✨ Générer
              </button>
            )}
          </div>
        </div>

        {/* Reçu */}
        <div className="document-item">
          <div className="document-info">
            <span className="document-icon">{getDocumentIcon('receipt')}</span>
            <div>
              <div className="document-title">Reçu</div>
              {hasDocument('receipt') && (
                <div className="document-number">{getDocument('receipt').document_number}</div>
              )}
            </div>
          </div>
          <div className="document-actions">
            {hasDocument('receipt') ? (
              <button 
                className="btn btn-download"
                onClick={() => downloadDocument(getDocument('receipt').id, getDocument('receipt').document_number)}
              >
                📥 Télécharger
              </button>
            ) : userType !== 'client' && (
              <button 
                className="btn btn-generate"
                onClick={() => generateDocument('receipt')}
                disabled={generating}
              >
                ✨ Générer
              </button>
            )}
          </div>
        </div>

        {/* Contrat */}
        <div className="document-item">
          <div className="document-info">
            <span className="document-icon">{getDocumentIcon('contract')}</span>
            <div>
              <div className="document-title">Contrat de location</div>
              {hasDocument('contract') && (
                <>
                  <div className="document-number">{getDocument('contract').document_number}</div>
                  {contractSigned && (
                    <div className="contract-signed">✅ Signé</div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="document-actions">
            {hasDocument('contract') ? (
              <>
                <button 
                  className="btn btn-download"
                  onClick={() => downloadDocument(getDocument('contract').id, getDocument('contract').document_number)}
                >
                  📥 Télécharger
                </button>
                {userType === 'client' && !contractSigned && (
                  <button 
                    className="btn btn-sign"
                    onClick={() => window.location.href = `/sign-contract/${getDocument('contract').id}`}
                  >
                    ✍️ Signer
                  </button>
                )}
              </>
            ) : userType !== 'client' && (
              <button 
                className="btn btn-generate"
                onClick={() => generateDocument('contract')}
                disabled={generating}
              >
                ✨ Générer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
