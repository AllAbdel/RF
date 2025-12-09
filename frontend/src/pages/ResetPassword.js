import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import '../styles/Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [step, setStep] = useState(token ? 'reset' : 'request'); // 'request' ou 'reset'
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Étape 1: Demander le reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/request-password-reset', {
        email: email
      });

      setMessage(response.data.message || 'Un email a été envoyé si le compte existe.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Réinitialiser avec le token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!passwordStrength || !passwordStrength.valid) {
      setError('Le mot de passe ne respecte pas les critères de sécurité');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        token: token,
        newPassword: newPassword
      });

      setMessage('Mot de passe réinitialisé avec succès !');
      
      // Rediriger vers login après 2 secondes
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button 
          className="back-to-home-btn" 
          onClick={() => navigate('/auth')}
        >
          ← Retour
        </button>

        {step === 'request' ? (
          <>
            <div className="auth-header">
              <h1>🔑 Mot de passe oublié</h1>
              <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleRequestReset} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@exemple.com"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>

            <div className="auth-footer">
              <button 
                className="toggle-btn" 
                onClick={() => navigate('/auth')}
              >
                Retour à la connexion
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="auth-header">
              <h1>🔐 Nouveau mot de passe</h1>
              <p>Choisissez un nouveau mot de passe sécurisé</p>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="8"
                />
                <PasswordStrengthMeter 
                  password={newPassword}
                  onStrengthChange={setPasswordStrength}
                />
              </div>

              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="8"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <small style={{color: '#e74c3c'}}>
                    ❌ Les mots de passe ne correspondent pas
                  </small>
                )}
              </div>

              <div className="password-requirements">
                <small>Le mot de passe doit contenir :</small>
                <ul>
                  <li>Au moins 8 caractères</li>
                  <li>Une majuscule et une minuscule</li>
                  <li>Un chiffre</li>
                  <li>Un caractère spécial (!@#$%...)</li>
                </ul>
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading || !passwordStrength?.valid}
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
