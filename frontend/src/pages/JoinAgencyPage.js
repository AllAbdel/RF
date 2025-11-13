import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/JoinAgency.css';

const JoinAgencyPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    verifyInvitation();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyInvitation = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/agency/invitation/${token}/verify`);
      setInvitation(response.data.invitation);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Invitation invalide ou expirée');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`http://localhost:5000/api/agency/invitation/${token}/accept`, {
        password
      });
      
      alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      navigate('/auth');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la création du compte');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="join-agency-page">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Vérification de l'invitation...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="join-agency-page">
        <Header />
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Invitation invalide</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="home-btn">
            Retour à l'accueil
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="join-agency-page">
      <Header />
      
      <div className="join-content">
        <div className="invitation-info">
          <div className="success-icon">✉️</div>
          <h1>Rejoindre une agence</h1>
          <p className="agency-name">Vous êtes invité(e) à rejoindre : <strong>{invitation.agency_name}</strong></p>
          
          <div className="invitation-details">
            <div className="detail-item">
              <span className="label">Nom :</span>
              <span className="value">{invitation.first_name} {invitation.last_name}</span>
            </div>
            <div className="detail-item">
              <span className="label">Email :</span>
              <span className="value">{invitation.email}</span>
            </div>
            <div className="detail-item">
              <span className="label">Rôle :</span>
              <span className="value role-badge">
                {invitation.role === 'admin' ? 'Administrateur' : 'Membre'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          <h2>Créer votre mot de passe</h2>
          <p className="form-description">
            Pour finaliser votre inscription, créez un mot de passe sécurisé.
          </p>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez votre mot de passe"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Création en cours...' : 'Créer mon compte'}
          </button>

          <p className="security-note">
            🔒 Votre mot de passe sera crypté et sécurisé.
          </p>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default JoinAgencyPage;
