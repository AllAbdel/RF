import React from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { isAuthenticated, isClient, isAgency, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const currentTab = searchParams.get('tab');
  const isOnDashboard = location.pathname === '/client' || location.pathname === '/agency';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActiveTab = (tab) => {
    return currentTab === tab;
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
                  <Link 
                    to="/client?tab=reservations" 
                    className={`nav-link ${isOnDashboard && isActiveTab('reservations') ? 'active' : ''}`}
                  >
                    Mes Réservations
                  </Link>
                  <Link 
                    to="/client?tab=documents" 
                    className={`nav-link ${isOnDashboard && isActiveTab('documents') ? 'active' : ''}`}
                  >
                    Mes Documents
                  </Link>
                  <Link to="/favorites" className="nav-link">Favoris</Link>
                  <Link to="/comparator" className="nav-link">Comparateur</Link>
                  <Link to="/map" className="nav-link">Carte</Link>
                  <Link to="/messages" className="nav-link">Messages</Link>
                </>
              )}
              
              {isAgency && (
                <>
                  <Link 
                    to="/agency?tab=vehicles" 
                    className={`nav-link ${isOnDashboard && isActiveTab('vehicles') ? 'active' : ''}`}
                  >
                    Véhicules
                  </Link>
                  <Link 
                    to="/agency?tab=reservations" 
                    className={`nav-link ${isOnDashboard && isActiveTab('reservations') ? 'active' : ''}`}
                  >
                    Réservations
                  </Link>
                  <Link 
                    to="/agency?tab=stats" 
                    className={`nav-link ${isOnDashboard && isActiveTab('stats') ? 'active' : ''}`}
                  >
                    Statistiques
                  </Link>
                  <Link 
                    to="/agency?tab=documents" 
                    className={`nav-link ${isOnDashboard && isActiveTab('documents') ? 'active' : ''}`}
                  >
                    Documents
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <>
                      <Link 
                        to="/agency?tab=members" 
                        className={`nav-link ${isOnDashboard && isActiveTab('members') ? 'active' : ''}`}
                      >
                        Membres
                      </Link>
                      <Link 
                        to="/agency?tab=join-requests" 
                        className={`nav-link ${isOnDashboard && isActiveTab('join-requests') ? 'active' : ''}`}
                      >
                        Demandes
                      </Link>
                      <Link 
                        to="/agency?tab=settings" 
                        className={`nav-link ${isOnDashboard && isActiveTab('settings') ? 'active' : ''}`}
                      >
                        Paramètres
                      </Link>
                      <Link 
                        to="/agency?tab=profile" 
                        className={`nav-link ${isOnDashboard && isActiveTab('profile') ? 'active' : ''}`}
                      >
                        Profil
                      </Link>
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
