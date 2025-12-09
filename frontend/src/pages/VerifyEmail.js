import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Vérification de votre email en cours...');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Token de vérification manquant');
        return;
      }

      try {
        const response = await axios.post('http://localhost:5000/api/auth/verify-email', {
          token: token
        });

        setStatus('success');
        setMessage(response.data.message || 'Email vérifié avec succès !');
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/auth', { state: { emailVerified: true } });
        }, 3000);

      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.error || 
          'Erreur lors de la vérification. Le lien a peut-être expiré.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendEmail = async () => {
    try {
      const email = searchParams.get('email');
      if (!email) {
        alert('Email non trouvé. Veuillez vous inscrire à nouveau.');
        return;
      }

      await axios.post('http://localhost:5000/api/auth/resend-verification', { email });
      setMessage('Un nouvel email de vérification a été envoyé !');
      setStatus('success');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Erreur lors de l\'envoi');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="verify-email-content">
          {status === 'verifying' && (
            <>
              <div className="spinner"></div>
              <h2>⏳ Vérification en cours...</h2>
              <p>{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="success-icon">✅</div>
              <h2>Email vérifié !</h2>
              <p>{message}</p>
              <p>Redirection vers la page de connexion...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="error-icon">❌</div>
              <h2>Erreur de vérification</h2>
              <p>{message}</p>
              <div className="verify-actions">
                <button 
                  className="primary-btn"
                  onClick={handleResendEmail}
                >
                  Renvoyer l'email de vérification
                </button>
                <button 
                  className="secondary-btn"
                  onClick={() => navigate('/auth')}
                >
                  Retour à la connexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
