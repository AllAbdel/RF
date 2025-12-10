import React, { useState } from 'react';
import { showToast } from './Toast';
import '../styles/ShareButton.css';

const ShareButton = ({ vehicle }) => {
  const [showModal, setShowModal] = useState(false);

  const vehicleUrl = `${window.location.origin}/vehicle/${vehicle.id}`;
  const vehicleTitle = `${vehicle.brand} ${vehicle.model}`;
  const vehicleText = `Découvrez ce véhicule : ${vehicleTitle} à ${vehicle.price_per_hour}€/h`;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${vehicleText}\n${vehicleUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowModal(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Découvrez : ${vehicleTitle}`);
    const body = encodeURIComponent(`${vehicleText}\n\n${vehicleUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowModal(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(vehicleUrl);
      showToast('Lien copié dans le presse-papiers !', 'success');
      setShowModal(false);
    } catch (err) {
      showToast('Erreur lors de la copie du lien', 'error');
    }
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(vehicleUrl)}`, '_blank');
    setShowModal(false);
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(vehicleText)}&url=${encodeURIComponent(vehicleUrl)}`, '_blank');
    setShowModal(false);
  };

  return (
    <>
      <button 
        className="share-btn"
        onClick={() => setShowModal(true)}
      >
        Partager
      </button>

      {showModal && (
        <div className="share-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Partager ce véhicule</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="share-modal-content">
              <button className="share-option whatsapp" onClick={handleWhatsApp}>
                <div className="share-option-text">
                  <strong>WhatsApp</strong>
                  <span>Partager via WhatsApp</span>
                </div>
              </button>
              <button className="share-option facebook" onClick={handleFacebook}>
                <div className="share-option-text">
                  <strong>Facebook</strong>
                  <span>Partager sur Facebook</span>
                </div>
              </button>
              <button className="share-option twitter" onClick={handleTwitter}>
                <div className="share-option-text">
                  <strong>Twitter/X</strong>
                  <span>Partager sur Twitter</span>
                </div>
              </button>
              <button className="share-option email" onClick={handleEmail}>
                <div className="share-option-text">
                  <strong>Email</strong>
                  <span>Envoyer par email</span>
                </div>
              </button>
              <button className="share-option copy" onClick={handleCopyLink}>
                <div className="share-option-text">
                  <strong>Copier le lien</strong>
                  <span>Copier dans le presse-papiers</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
