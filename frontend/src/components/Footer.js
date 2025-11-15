import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Rentflow</h3>
            <p className="footer-description">
              Votre plateforme de location de véhicules de confiance.
              Trouvez le véhicule parfait pour tous vos déplacements.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-subtitle">Liens rapides</h4>
            <ul className="footer-links">
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/about">À propos</Link></li>
              <li><Link to="/how-it-works">Comment ça marche</Link></li>
              <li><Link to="/partner">Devenir partenaire</Link></li>
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
              <li>Email: contact@Rentflow.com</li>
              <li>Tél: +33 1 23 45 67 89</li>
              <li>Adresse: Paris, France</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} Rentflow. Tous droits réservés.
          </p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Politique de confidentialité</Link>
            <Link to="/terms">Conditions d'utilisation</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
