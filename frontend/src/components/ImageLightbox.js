import React, { useEffect } from 'react';
import '../styles/ImageLightbox.css';

const ImageLightbox = ({ imageUrl, alt, onClose }) => {
  useEffect(() => {
    // Empêcher le scroll du body quand la lightbox est ouverte
    document.body.style.overflow = 'hidden';
    
    // Fermer avec Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Fermer">
        ×
      </button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt={alt} 
          onError={(e) => { e.target.src = '/no-image.svg'; }}
        />
      </div>
    </div>
  );
};

export default ImageLightbox;
