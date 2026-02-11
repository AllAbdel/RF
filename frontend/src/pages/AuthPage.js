import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import '../styles/Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    license_date: ''
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
        const result = await login(formData.email, formData.password, twoFactorCode);
        
        if (result.requires2FA) {
          setShow2FAInput(true);
          setError('');
          setLoading(false);
          return;
        }
        
        if (result.success) {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          
          if (returnTo) {
            navigate(returnTo);
          } else if (storedUser?.user_type === 'site_admin') {
            navigate('/admin');
          } else if (storedUser?.user_type === 'agency_member') {
            navigate('/agency');
          } else {
            navigate('/client');
          }
        } else {
          setError(result.error);
        }
      } else {
        // Valider la force du mot de passe
        if (!passwordStrength || !passwordStrength.valid) {
          setError('Le mot de passe ne respecte pas les critères de sécurité');
          setLoading(false);
          return;
        }

        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key]) {
            submitData.append(key, formData[key]);
          }
        });

        const result = await register(submitData);
        if (result.success) {
          if (result.emailVerificationRequired) {
            setShowEmailVerification(true);
            setError('');
            setLoading(false);
            return;
          }
          navigate(returnTo || '/client');
        } else {
          setError(result.error);
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
          <h1>Rentflow</h1>
          <p>{isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showEmailVerification && (
          <div className="success-message">
            <h3>Inscription réussie !</h3>
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
            <h3>Authentification à deux facteurs</h3>
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

              <div className="form-group">
                <label>Date de naissance</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
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
                />
              </div>
              {(formData.birth_date || formData.license_date) && (
                <div className="age-info">
                  {formData.birth_date && (
                    <span>
                      Age: {Math.floor((new Date() - new Date(formData.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))} ans
                    </span>
                  )}
                  {formData.license_date && (
                    <span>
                      Permis depuis: {Math.floor((new Date() - new Date(formData.license_date)) / (365.25 * 24 * 60 * 60 * 1000))} ans
                    </span>
                  )}
                </div>
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
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
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
