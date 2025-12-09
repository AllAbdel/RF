import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AgencySearch from '../components/AgencySearch';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
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
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [show2FAInput, setShow2FAInput] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

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
        const result = await login(formData.email, formData.password, userType, twoFactorCode);
        
        // Gérer le cas où 2FA est requis
        if (result.requires2FA) {
          setShow2FAInput(true);
          setError('');
          setLoading(false);
          return;
        }
        
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
        // Valider la force du mot de passe avant inscription
        if (!passwordStrength || !passwordStrength.valid) {
          setError('Le mot de passe ne respecte pas les critères de sécurité');
          setLoading(false);
          return;
        }

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
            // Afficher message de vérification email
            if (result.emailVerificationRequired) {
              setShowEmailVerification(true);
              setError('');
              setLoading(false);
              return;
            }
            
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

        {showEmailVerification && (
          <div className="success-message">
            <h3>✅ Inscription réussie !</h3>
            <p>Un email de vérification a été envoyé à <strong>{formData.email}</strong></p>
            <p>Veuillez vérifier votre boîte mail et cliquer sur le lien pour activer votre compte.</p>
            <button 
              className="primary-btn"
              onClick={() => navigate('/')}
              style={{marginTop: '15px'}}
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {show2FAInput && !showEmailVerification && (
          <div className="twofa-prompt">
            <h3>🔒 Authentification à deux facteurs</h3>
            <p>Entrez le code à 6 chiffres depuis votre application d'authentification</p>
            <input
              type="text"
              className="twofa-input"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength="6"
              autoFocus
            />
            <button 
              className="submit-btn"
              onClick={handleSubmit}
              disabled={twoFactorCode.length !== 6 || loading}
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
            <button 
              className="secondary-btn"
              onClick={() => {
                setShow2FAInput(false);
                setTwoFactorCode('');
              }}
            >
              Annuler
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" style={{display: (showEmailVerification || show2FAInput) ? 'none' : 'block'}}>
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
              minLength="8"
            />
            {!isLogin && (
              <PasswordStrengthMeter 
                password={formData.password}
                onStrengthChange={setPasswordStrength}
              />
            )}
          </div>

          {!isLogin && (
            <div className="password-requirements">
              <small>Le mot de passe doit contenir :</small>
              <ul>
                <li>Au moins 8 caractères</li>
                <li>Une majuscule et une minuscule</li>
                <li>Un chiffre</li>
                <li>Un caractère spécial (!@#$%...)</li>
              </ul>
            </div>
          )}

          {isLogin && (
            <div className="forgot-password-link">
              <button 
                type="button"
                onClick={() => navigate('/reset-password')}
                className="link-btn"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

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
