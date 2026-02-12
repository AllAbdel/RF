import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaBars, FaTimes, FaHome, FaCalendarAlt, FaFileAlt, FaHeart, FaBalanceScale, FaMap, FaEnvelope, FaCar, FaChartBar, FaUsers, FaUserPlus, FaCog, FaUserCircle, FaSignOutAlt, FaSignInAlt, FaBuilding, FaShieldAlt, FaHeadset } from 'react-icons/fa';
import { messageAPI } from '../services/api';
import '../styles/Header.css';

const Header = () => {
  const { isAuthenticated, isClient, isAgency, isSiteAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  const currentTab = searchParams.get('tab');
  const isOnDashboard = location.pathname === '/client' || location.pathname === '/agency';

  // Récupérer le nombre de messages non lus
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (isAuthenticated) {
        try {
          const response = await messageAPI.getConversations();
          const total = response.data.conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
          setUnreadMessages(total);
        } catch (error) {
          console.error('Erreur récupération messages non lus:', error);
        }
      }
    };
    fetchUnreadMessages();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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

        {/* Navigation directe visible sur desktop */}
        <nav className="header-nav-desktop">
          <Link to="/" className="header-nav-link">
            Louer un véhicule
          </Link>
          {isAuthenticated && isClient && (
            <Link to="/client?tab=reservations" className="header-nav-link header-nav-link-accent">
              Mes Réservations
            </Link>
          )}
          {isAuthenticated && isAgency && (
            <Link to="/agency?tab=reservations" className="header-nav-link header-nav-link-accent">
              Mes Réservations
            </Link>
          )}
          <Link to="/messages" className="header-nav-link">
            Assistance
          </Link>
        </nav>

        {/* Zone utilisateur à droite */}
        {isAuthenticated ? (
          <div className="header-user-area">
            <span className="header-user-name">{user?.first_name}</span>
            <Link to={isClient ? "/client?tab=profile" : isAgency ? "/agency?tab=profile" : "/admin"} className="header-profile-btn" title="Mon Profil">
              <FaUserCircle />
            </Link>
            <button onClick={handleLogout} className="header-logout-btn" title="Déconnexion">
              <FaSignOutAlt />
            </button>
          </div>
        ) : (
          <div className="header-user-area">
            <Link to="/auth" className="header-login-btn" title="Connexion">
              <FaSignInAlt />
              <span>Connexion</span>
            </Link>
          </div>
        )}

        <button className="burger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          {isAuthenticated && (
            <div className="menu-user-header">
              <div className="menu-user-avatar">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </div>
              <div className="menu-user-info">
                <span className="menu-user-name">{user?.first_name} {user?.last_name}</span>
                <span className="menu-user-role">
                  {isSiteAdmin ? 'Administrateur' : isClient ? 'Client' : isAgency ? 'Agence' : ''}
                  {user?.role === 'admin' && !isSiteAdmin && ' - Admin'}
                  {user?.role === 'super_admin' && !isSiteAdmin && ' - Super Admin'}
                </span>
              </div>
            </div>
          )}
          
          <div className="menu-section">
            <Link to="/" className="nav-link" onClick={closeMenu}>
              <FaHome className="nav-icon" />
              <span>Accueil</span>
            </Link>
          </div>
          
          {isAuthenticated ? (
            <>
              {isClient && (
                <div className="menu-section">
                  <span className="menu-section-title">Mon Espace</span>
                  <Link 
                    to="/client?tab=reservations" 
                    className={`nav-link ${isOnDashboard && isActiveTab('reservations') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FaCalendarAlt className="nav-icon" />
                    <span>Mes Réservations</span>
                  </Link>
                  <Link 
                    to="/client?tab=documents" 
                    className={`nav-link ${isOnDashboard && isActiveTab('documents') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FaFileAlt className="nav-icon" />
                    <span>Mes Documents</span>
                  </Link>
                  <Link to="/favorites" className="nav-link" onClick={closeMenu}>
                    <FaHeart className="nav-icon" />
                    <span>Favoris</span>
                  </Link>
                  <Link to="/comparator" className="nav-link" onClick={closeMenu}>
                    <FaBalanceScale className="nav-icon" />
                    <span>Comparateur</span>
                  </Link>
                  <Link to="/map" className="nav-link" onClick={closeMenu}>
                    <FaMap className="nav-icon" />
                    <span>Carte</span>
                  </Link>
                  <Link to="/messages" className="nav-link" onClick={closeMenu}>
                    <FaEnvelope className="nav-icon" />
                    <span>Messages</span>
                    {unreadMessages > 0 && <span className="nav-badge">{unreadMessages}</span>}
                  </Link>
                  <Link to="/create-agency" className="nav-link" onClick={closeMenu}>
                    <FaBuilding className="nav-icon" />
                    <span>Créer une agence</span>
                  </Link>
                </div>
              )}
              
              {isAgency && (
                <div className="menu-section">
                  <span className="menu-section-title">Gestion</span>
                  <Link 
                    to="/agency?tab=vehicles" 
                    className={`nav-link ${isOnDashboard && isActiveTab('vehicles') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FaCar className="nav-icon" />
                    <span>Véhicules</span>
                  </Link>
                  <Link 
                    to="/agency?tab=reservations" 
                    className={`nav-link ${isOnDashboard && isActiveTab('reservations') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FaCalendarAlt className="nav-icon" />
                    <span>Réservations</span>
                  </Link>
                  <Link 
                    to="/agency?tab=stats" 
                    className={`nav-link ${isOnDashboard && isActiveTab('stats') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FaChartBar className="nav-icon" />
                    <span>Statistiques</span>
                  </Link>
                  <Link 
                    to="/agency?tab=documents" 
                    className={`nav-link ${isOnDashboard && isActiveTab('documents') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FaFileAlt className="nav-icon" />
                    <span>Documents</span>
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <>
                      <span className="menu-section-title">Administration</span>
                      <Link 
                        to="/agency?tab=members" 
                        className={`nav-link ${isOnDashboard && isActiveTab('members') ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        <FaUsers className="nav-icon" />
                        <span>Membres</span>
                      </Link>
                      <Link 
                        to="/agency?tab=join-requests" 
                        className={`nav-link ${isOnDashboard && isActiveTab('join-requests') ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        <FaUserPlus className="nav-icon" />
                        <span>Demandes</span>
                      </Link>
                      <Link 
                        to="/agency?tab=settings" 
                        className={`nav-link ${isOnDashboard && isActiveTab('settings') ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        <FaCog className="nav-icon" />
                        <span>Paramètres</span>
                      </Link>
                      <Link 
                        to="/agency?tab=profile" 
                        className={`nav-link ${isOnDashboard && isActiveTab('profile') ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        <FaUserCircle className="nav-icon" />
                        <span>Profil</span>
                      </Link>
                    </>
                  )}
                  <Link to="/messages" className="nav-link" onClick={closeMenu}>
                    <FaEnvelope className="nav-icon" />
                    <span>Messages</span>
                    {unreadMessages > 0 && <span className="nav-badge">{unreadMessages}</span>}
                  </Link>
                </div>
              )}

              {isSiteAdmin && (
                <div className="menu-section">
                  <span className="menu-section-title">Administration</span>
                  <Link to="/admin" className="nav-link" onClick={closeMenu}>
                    <FaShieldAlt className="nav-icon" />
                    <span>Panel Admin</span>
                  </Link>
                </div>
              )}
              
              <div className="menu-section menu-logout-section">
                <button onClick={handleLogout} className="nav-link logout-link">
                  <FaSignOutAlt className="nav-icon" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </>
          ) : (
            <div className="menu-section">
              <Link to="/auth" className="nav-link auth-menu-link" onClick={closeMenu}>
                <FaSignInAlt className="nav-icon" />
                <span>Connexion / Inscription</span>
              </Link>
            </div>
          )}
        </nav>
        
        {menuOpen && <div className="menu-overlay" onClick={closeMenu} />}
      </div>
    </header>
  );
};

export default Header;
