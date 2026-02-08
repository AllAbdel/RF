import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ClientDocuments.css';

const ClientDocuments = () => {
  const navigate = useNavigate();

  return (
    <div className="client-documents-container">
      <div className="documents-header">
        <h2>Vérification de documents</h2>
        <p>Pour louer un véhicule, vous devez fournir vos documents d'identité.</p>
      </div>

      <div className="documents-info-card">
        <div className="info-icon">📋</div>
        <h3>Comment ça marche ?</h3>
        <ol className="steps-list">
          <li>
            <span className="step-number">1</span>
            <div className="step-content">
              <strong>Réservez un véhicule</strong>
              <p>Trouvez le véhicule qui vous convient et effectuez une demande de réservation.</p>
            </div>
          </li>
          <li>
            <span className="step-number">2</span>
            <div className="step-content">
              <strong>Envoyez vos documents par message</strong>
              <p>Une fois la réservation créée, contactez l'agence via la messagerie et envoyez vos documents :</p>
              <ul className="docs-required">
                <li>🪪 Carte d'identité (recto/verso)</li>
                <li>🚗 Permis de conduire (recto/verso)</li>
              </ul>
            </div>
          </li>
          <li>
            <span className="step-number">3</span>
            <div className="step-content">
              <strong>L'agence vérifie vos documents</strong>
              <p>L'agence analyse vos documents avec notre système anti-fraude et vous confirme la validation.</p>
            </div>
          </li>
        </ol>
      </div>

      <div className="documents-tips">
        <h4>💡 Conseils pour vos documents</h4>
        <ul>
          <li>Prenez des photos nettes et bien éclairées</li>
          <li>Assurez-vous que le document est entièrement visible</li>
          <li>Évitez les reflets et les ombres</li>
          <li>Format accepté : JPG, PNG (max 10Mo)</li>
        </ul>
      </div>

      <button 
        className="go-to-messages-btn"
        onClick={() => navigate('/messages')}
      >
        Aller à la messagerie
      </button>
    </div>
  );
};

export default ClientDocuments;
