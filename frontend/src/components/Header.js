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
                  <Link to="/messages" className="nav-link">Messages</Link>
                </>
              )}
              
              {isAgency && (
                <>
                  <Link to="/agency?tab=vehicles" className="nav-link">Véhicules</Link>
                  <Link to="/agency?tab=reservations" className="nav-link">Réservations</Link>
                  <Link to="/agency?tab=stats" className="nav-link">Statistiques</Link>
                  <Link to="/agency?tab=documents" className="nav-link">Documents</Link>
                  <Link to="/agency?tab=ai-assistant" className="nav-link">Assistant IA</Link>
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <>
                      <Link to="/agency?tab=members" className="nav-link">Membres</Link>
                      <Link to="/agency?tab=settings" className="nav-link">Paramètres</Link>
                      <Link to="/agency?tab=profile" className="nav-link">Profil</Link>
                    </>
                  )}
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
