import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('client');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
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
        // Créer FormData pour l'upload
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

              {userType === 'agency_member' && (
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
