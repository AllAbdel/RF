import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { isAuthenticated, isClient, isAgency, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text">Rentflow</span>
        </Link>

        <nav className="nav-menu">
          <Link to="/" className="nav-link">Accueil</Link>
          
          {isAuthenticated ? (
            <>
              {isClient && (
                <>
                  <Link to="/client" className="nav-link">Mes Réservations</Link>
                  <Link to="/favorites" className="nav-link">Favoris</Link>
                  <Link to="/comparator" className="nav-link">Comparateur</Link>
                  <Link to="/map" className="nav-link">Carte</Link>
                  <Link to="/messages" className="nav-link">Messages</Link>
                </>
              )}
              
              {isAgency && (
                <>
                  <Link to="/" className="nav-link">Recherche Véhicules</Link>
                  <Link to="/agency" className="nav-link">Dashboard</Link>
                  <Link to="/statistics" className="nav-link">Statistiques</Link>
                  <Link to="/messages" className="nav-link">Messages</Link>
                </>
              )}
              
              <div className="user-menu">
                <span className="user-name">
                  {user?.first_name} {user?.last_name}
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <Link to="/auth" className="auth-link">
              Connexion / Inscription
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
