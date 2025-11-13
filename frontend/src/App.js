import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ClientDashboard from './pages/ClientDashboard';
import AgencyDashboard from './pages/AgencyDashboard';
import ThemeSwitcher from './components/ThemeSwitcher';
import VehicleDetails from './pages/VehicleDetails';
import MessagesPage from './pages/MessagesPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PartnerPage from './pages/PartnerPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CookiesPage from './pages/CookiesPage';

import './styles/App.css';

// Composant pour protéger les routes
const ProtectedRoute = ({ children, requireClient, requireAgency }) => {
  const { isAuthenticated, isClient, isAgency, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireClient && !isClient) {
    return <Navigate to="/agency" replace />;
  }

  if (requireAgency && !isAgency) {
    return <Navigate to="/client" replace />;
  }

  return children;
};

// Composant pour rediriger les utilisateurs authentifiés
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, isClient, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={isClient ? '/client' : '/agency'} replace />;
  }

  return children;
};

// Route
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Route d'accueil publique - accessible à tous */}
            <Route path="/" element={<HomePage />} />

            {/* Route de connexion/inscription */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Route des détails de véhicule - accessible à tous */}
            <Route path="/vehicle/:id" element={<VehicleDetails />} />

            {/* Pages publiques */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />

            {/* Routes protégées - Messages */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Routes Client */}
            <Route
              path="/client"
              element={
                <ProtectedRoute requireClient>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />

            {/* Routes Agence */}
            <Route
              path="/agency"
              element={
                <ProtectedRoute requireAgency>
                  <AgencyDashboard />
                </ProtectedRoute>
              }
            />

            {/* Route par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* ⬇️ AJOUT DU THEME SWITCHER (NOUVEAU) */}
          {/* Le bouton flottant apparaîtra en bas à droite sur toutes les pages */}
          <ThemeSwitcher />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;