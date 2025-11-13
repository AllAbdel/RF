import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">RentFlow</h3>
            <p className="footer-description">
              Votre plateforme de location de véhicules de confiance.
              Trouvez le véhicule parfait pour tous vos déplacements.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">Liens rapides</h4>
            <ul className="footer-links">
              <li><a href="/">Accueil</a></li>
              <li><a href="/#about">À propos</a></li>
              <li><a href="/#how-it-works">Comment ça marche</a></li>
              <li><a href="/auth">Devenir partenaire</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">Suivez-nous</h4>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                <span className="social-icon">Facebook</span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link twitter">
                <span className="social-icon">Twitter</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                <span className="social-icon">Instagram</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                <span className="social-icon">LinkedIn</span>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">Contact</h4>
            <ul className="footer-contact">
              <li>Email: contact@rentflow.com</li>
              <li>Tél: +33 1 23 45 67 89</li>
              <li>Adresse: Paris, France</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} RentFlow. Tous droits réservés.
          </p>
          <div className="footer-bottom-links">
            <a href="/privacy">Politique de confidentialité</a>
            <a href="/terms">Conditions d'utilisation</a>
            <a href="/cookies">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
