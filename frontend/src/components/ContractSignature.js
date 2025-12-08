import React, { useRef, useState, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { useParams, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import '../styles/ContractSignature.css';

const ContractSignature = () => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const { documentId } = useParams();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeSignaturePad();
    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, []);

  const initializeSignaturePad = () => {
    if (canvasRef.current && !signaturePadRef.current) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      
      // Ajuster la taille du canvas
      canvas.width = container.offsetWidth;
      canvas.height = 200;
      
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 2.5,
      });
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSubmit = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setError('Veuillez signer avant de soumettre');
      return;
    }

    try {
      setSigning(true);
      const signatureData = signaturePadRef.current.toDataURL();
      
      await documentAPI.signContract(documentId, signatureData);
      
      alert('Contrat signé avec succès !');
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur signature:', err);
      setError('Erreur lors de la signature du contrat');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="contract-signature-page">
      <div className="contract-signature-container">
        <div className="signature-header">
          <h2>✍️ Signature du contrat</h2>
          <p className="signature-info">
            Veuillez signer dans la zone ci-dessous pour valider le contrat de location.
          </p>
        </div>

        {error && (
          <div className="signature-error">
            {error}
          </div>
        )}

        <div className="signature-section">
          <label className="signature-label">Votre signature :</label>
          <div className="signature-canvas-container">
            <canvas ref={canvasRef} className="signature-canvas"></canvas>
          </div>
          <div className="signature-hint">
            Signez avec votre souris, trackpad ou doigt (sur mobile)
          </div>
        </div>

        <div className="signature-actions">
          <button 
            className="btn btn-clear"
            onClick={clearSignature}
            disabled={signing}
          >
            🗑️ Effacer
          </button>
          <button 
            className="btn btn-cancel"
            onClick={() => navigate(-1)}
            disabled={signing}
          >
            ❌ Annuler
          </button>
          <button 
            className="btn btn-submit"
            onClick={handleSubmit}
            disabled={signing}
          >
            {signing ? '⏳ Envoi...' : '✓ Valider la signature'}
          </button>
        </div>

        <div className="signature-legal">
          <p>
            ⚖️ En signant ce document, vous acceptez les termes et conditions du contrat de location.
            Cette signature a la même valeur juridique qu'une signature manuscrite.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContractSignature;
