import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import '../styles/Header.css';

const Header = () => {
  const { isAuthenticated, isClient, isAgency, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const currentTab = searchParams.get('tab');
  const isOnDashboard = location.pathname === '/client' || location.pathname === '/agency';

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActiveTab = (tab) => {
    return currentTab === tab;
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text">Rentflow</span>
        </Link>

        <button className="burger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>Accueil</Link>
          
          {isAuthenticated ? (
            <>
              {isClient && (
                <>
                  <Link 
                    to="/client?tab=reservations" 
                    className={`nav-link ${isOnDashboard && isActiveTab('reservations') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Mes Réservations
                  </Link>
                  <Link 
                    to="/client?tab=documents" 
                    className={`nav-link ${isOnDashboard && isActiveTab('documents') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Mes Documents
                  </Link>
                  <Link to="/favorites" className="nav-link" onClick={closeMenu}>Favoris</Link>
                  <Link to="/comparator" className="nav-link" onClick={closeMenu}>Comparateur</Link>
                  <Link to="/map" className="nav-link" onClick={closeMenu}>Carte</Link>
                  <Link to="/messages" className="nav-link" onClick={closeMenu}>Messages</Link>
                </>
              )}
              
              {isAgency && (
                <>
                  <Link 
                    to="/agency?tab=vehicles" 
                    className={`nav-link ${isOnDashboard && isActiveTab('vehicles') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Véhicules
                  </Link>
                  <Link 
                    to="/agency?tab=reservations" 
                    className={`nav-link ${isOnDashboard && isActiveTab('reservations') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Réservations
                  </Link>
                  <Link 
                    to="/agency?tab=stats" 
                    className={`nav-link ${isOnDashboard && isActiveTab('stats') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Statistiques
                  </Link>
                  <Link 
                    to="/agency?tab=documents" 
                    className={`nav-link ${isOnDashboard && isActiveTab('documents') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Documents
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <>
                      <Link 
                        to="/agency?tab=members" 
                        className={`nav-link ${isOnDashboard && isActiveTab('members') ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        Membres
                      </Link>
                      <Link 
                        to="/agency?tab=join-requests" 
                        className={`nav-link ${isOnDashboard && isActiveTab('join-requests') ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        Demandes
                      </Link>
                      <Link 
                        to="/agency?tab=settings" 
                        className={`nav-link ${isOnDashboard && isActiveTab('settings') ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        Paramètres
                      </Link>
                      <Link 
                        to="/agency?tab=profile" 
                        className={`nav-link ${isOnDashboard && isActiveTab('profile') ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        Profil
                      </Link>
                    </>
                  )}
                  <Link to="/messages" className="nav-link" onClick={closeMenu}>Messages</Link>
                </>
              )}
            </>
          ) : (
            <Link to="/auth" className="auth-link" onClick={closeMenu}>
              Connexion / Inscription
            </Link>
          )}
        </nav>
        
        {isAuthenticated ? (
          <div className="user-menu">
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
            <span className="user-name">
              {user?.first_name} {user?.last_name}
            </span>
          </div>
        ) : (
          <Link to="/auth" className="auth-link-header">
            Connexion
          </Link>
        )}
        
        {menuOpen && <div className="menu-overlay" onClick={closeMenu} />}
      </div>
    </header>
  );
};

export default Header;
