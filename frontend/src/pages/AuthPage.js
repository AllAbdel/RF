import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AgencySearch from '../components/AgencySearch';
import { agencyAPI } from '../services/api';
import '../styles/Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('client');
  const [agencyMode, setAgencyMode] = useState('create'); // 'create' ou 'join'
  const [agencySearch, setAgencySearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    license_date: '',
    agency_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupérer l'URL de retour depuis le state
  const returnTo = location.state?.returnTo;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password, userType);
        if (result.success) {
          // Rediriger vers la page de retour ou le dashboard approprié
          if (returnTo) {
            navigate(returnTo);
          } else {
            navigate(userType === 'client' ? '/client' : '/agency');
          }
        } else {
          setError(result.error);
        }
      } else {
        // Mode inscription
        if (userType === 'agency_member' && agencyMode === 'join') {
          // Rejoindre une agence existante
          if (!selectedAgency) {
            setError('Veuillez sélectionner une agence');
            setLoading(false);
            return;
          }

          // Créer d'abord l'utilisateur en tant que client temporaire
          const submitData = new FormData();
          submitData.append('email', formData.email);
          submitData.append('password', formData.password);
          submitData.append('first_name', formData.first_name);
          submitData.append('last_name', formData.last_name);
          submitData.append('phone', formData.phone);
          submitData.append('user_type', 'client'); // Temporairement client
          submitData.append('pending_agency_join', 'true'); // Flag pour bypasser validation dates

          const registerResult = await register(submitData);
          if (registerResult.success) {
            // Envoyer la demande pour rejoindre l'agence
            try {
              await agencyAPI.requestToJoin(selectedAgency.id);
              alert('Votre demande a été envoyée à l\'agence. Vous serez notifié une fois accepté.');
              navigate('/');
            } catch (joinError) {
              setError('Erreur lors de l\'envoi de la demande');
            }
          } else {
            setError(registerResult.error);
          }
        } else {
          // Créer FormData pour l'upload (création agence ou inscription client)
          const submitData = new FormData();
          Object.keys(formData).forEach(key => {
            if (formData[key]) {
              submitData.append(key, formData[key]);
            }
          });
          submitData.append('user_type', userType);

          const result = await register(submitData);
          if (result.success) {
            // Rediriger vers la page de retour ou le dashboard approprié
            if (returnTo) {
              navigate(returnTo);
            } else {
              navigate(userType === 'client' ? '/client' : '/agency');
            }
          } else {
            setError(result.error);
          }
        }
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button 
          className="back-to-home-btn" 
          onClick={() => navigate('/')}
          title="Retour à l'accueil"
        >
          ← Retour
        </button>

        <div className="auth-header">
          <h1>Location de Voitures</h1>
          <p>{isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}</p>
        </div>

        <div className="user-type-selector">
          <button
            className={`type-btn ${userType === 'client' ? 'active' : ''}`}
            onClick={() => setUserType('client')}
          >
            Client
          </button>
          <button
            className={`type-btn ${userType === 'agency_member' ? 'active' : ''}`}
            onClick={() => setUserType('agency_member')}
          >
            Agence
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {userType === 'agency_member' && !isLogin && (
                <>
                  <div className="agency-mode-selector">
                    <button
                      type="button"
                      className={`mode-btn ${agencyMode === 'create' ? 'active' : ''}`}
                      onClick={() => {
                        setAgencyMode('create');
                        setSelectedAgency(null);
                      }}
                    >
                      Créer une agence
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${agencyMode === 'join' ? 'active' : ''}`}
                      onClick={() => {
                        setAgencyMode('join');
                        setFormData({...formData, agency_name: ''});
                      }}
                    >
                      Rejoindre une agence
                    </button>
                  </div>

                  {agencyMode === 'create' ? (
                    <>
                      <div className="form-group">
                        <label>Nom de l'agence</label>
                        <input
                          type="text"
                          name="agency_name"
                          value={formData.agency_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Logo de l'agence</label>
                        <input
                          type="file"
                          name="logo"
                          accept="image/*"
                          onChange={(e) => setFormData({...formData, logo: e.target.files[0]})}
                        />
                      </div>
                    </>
                  ) : (
                    <AgencySearch
                      onSelectAgency={setSelectedAgency}
                      selectedAgency={selectedAgency}
                    />
                  )}
                </>
              )}

              {userType === 'agency_member' && isLogin && (
            <>
              <div className="form-group">
                <label>Nom de l'agence</label>
                <input
                  type="text"
                  name="agency_name"
                  value={formData.agency_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Logo de l'agence</label>
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, logo: e.target.files[0]})}
                />
              </div>
            </>
          )}

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {(userType === 'client' || (userType === 'agency_member' && agencyMode === 'create')) && (
                <>
                  <div className="form-group">
                    <label>Date de naissance</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date d'obtention du permis</label>
                    <input
                      type="date"
                      name="license_date"
                      value={formData.license_date}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="age-info">
                    {formData.birth_date && (
                      <span>
                        Âge: {Math.floor((new Date() - new Date(formData.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))} ans
                      </span>
                    )}
                    {formData.license_date && (
                      <span>
                        Permis depuis: {Math.floor((new Date() - new Date(formData.license_date)) / (365.25 * 24 * 60 * 60 * 1000))} ans
                      </span>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <div className="auth-footer">
          <button 
            className="toggle-btn" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin 
              ? "Vous n'avez pas de compte ? Inscrivez-vous" 
              : "Vous avez déjà un compte ? Connectez-vous"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
