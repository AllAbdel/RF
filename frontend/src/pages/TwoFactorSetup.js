import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/TwoFactor.css';

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: QR code, 2: Vérification, 3: Codes secours
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState(null);

  useEffect(() => {
    checkTwoFAStatus();
  }, []);

  const checkTwoFAStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/2fa/status');
      setTwoFAStatus(response.data);
    } catch (error) {
      console.error('Erreur statut 2FA:', error);
    }
  };

  const handleSetup2FA = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'initialisation 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/2fa/verify-setup', {
        token: verificationCode
      });

      setBackupCodes(response.data.backupCodes);
      setStep(3);
      await checkTwoFAStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Entrez votre mot de passe pour confirmer :');
    if (!password) return;

    try {
      await axios.post('http://localhost:5000/api/auth/2fa/disable', { password });
      alert('2FA désactivée avec succès');
      await checkTwoFAStatus();
      setStep(0);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la désactivation');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const password = prompt('Entrez votre mot de passe pour confirmer :');
    if (!password) return;

    try {
      const response = await axios.post('http://localhost:5000/api/auth/2fa/regenerate-backup-codes', {
        password
      });
      setBackupCodes(response.data.backupCodes);
      alert('Nouveaux codes de secours générés !');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la régénération');
    }
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes-2fa.txt';
    a.click();
  };

  if (loading && !qrCode) {
    return (
      <div className="twofa-container">
        <div className="twofa-card">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="twofa-container">
      <div className="twofa-card">
        <button 
          className="back-btn" 
          onClick={() => navigate(-1)}
        >
          ← Retour
        </button>

        <div className="twofa-header">
          <h1>🔒 Authentification à Deux Facteurs (2FA)</h1>
          <p>Renforcez la sécurité de votre compte</p>
        </div>

        {/* Statut actuel */}
        {twoFAStatus && (
          <div className={`status-badge ${twoFAStatus.enabled ? 'enabled' : 'disabled'}`}>
            {twoFAStatus.enabled ? '✅ 2FA Activée' : '⚠️ 2FA Désactivée'}
            {twoFAStatus.enabled && twoFAStatus.backupCodesRemaining !== undefined && (
              <span className="backup-count">
                {twoFAStatus.backupCodesRemaining} codes de secours restants
              </span>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {/* Étape 0: Menu principal */}
        {step === 0 && (
          <div className="twofa-menu">
            {!twoFAStatus?.enabled ? (
              <>
                <p>La 2FA ajoute une couche de sécurité supplémentaire à votre compte.</p>
                <button 
                  className="primary-btn"
                  onClick={handleSetup2FA}
                >
                  Activer la 2FA
                </button>
              </>
            ) : (
              <>
                <p>Votre compte est protégé par l'authentification à deux facteurs.</p>
                <div className="twofa-actions">
                  <button 
                    className="secondary-btn"
                    onClick={handleRegenerateBackupCodes}
                  >
                    Régénérer les codes de secours
                  </button>
                  <button 
                    className="danger-btn"
                    onClick={handleDisable2FA}
                  >
                    Désactiver la 2FA
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Étape 1: Scanner QR Code */}
        {step === 1 && qrCode && (
          <div className="twofa-step">
            <h2>Étape 1: Scannez le QR Code</h2>
            <p>Utilisez une application d'authentification comme <strong>Google Authenticator</strong> ou <strong>Authy</strong></p>
            
            <div className="qr-code-container">
              <img src={qrCode} alt="QR Code 2FA" />
            </div>

            <div className="manual-entry">
              <p>Ou entrez manuellement cette clé :</p>
              <code className="secret-code">{secret}</code>
            </div>

            <button 
              className="primary-btn"
              onClick={() => setStep(2)}
            >
              Suivant →
            </button>
          </div>
        )}

        {/* Étape 2: Vérifier le code */}
        {step === 2 && (
          <div className="twofa-step">
            <h2>Étape 2: Vérifiez le code</h2>
            <p>Entrez le code à 6 chiffres affiché dans votre application</p>

            <input
              type="text"
              className="code-input"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength="6"
              autoFocus
            />

            <div className="button-group">
              <button 
                className="secondary-btn"
                onClick={() => setStep(1)}
              >
                ← Retour
              </button>
              <button 
                className="primary-btn"
                onClick={handleVerify2FA}
                disabled={verificationCode.length !== 6 || loading}
              >
                {loading ? 'Vérification...' : 'Activer la 2FA'}
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Codes de secours */}
        {step === 3 && backupCodes.length > 0 && (
          <div className="twofa-step">
            <h2>✅ 2FA Activée avec Succès !</h2>
            <p className="warning-text">
              ⚠️ <strong>IMPORTANT :</strong> Sauvegardez ces codes de secours dans un endroit sûr.
              Vous pourrez les utiliser si vous perdez accès à votre application d'authentification.
            </p>

            <div className="backup-codes-container">
              <h3>Codes de Secours</h3>
              <div className="backup-codes-grid">
                {backupCodes.map((code, index) => (
                  <code key={index} className="backup-code">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="backup-actions">
              <button 
                className="secondary-btn"
                onClick={downloadBackupCodes}
              >
                📥 Télécharger les codes
              </button>
              <button 
                className="primary-btn"
                onClick={() => navigate(-1)}
              >
                Terminé
              </button>
            </div>

            <div className="info-box">
              <p><strong>À savoir :</strong></p>
              <ul>
                <li>Chaque code ne peut être utilisé qu'une seule fois</li>
                <li>Vous avez {backupCodes.length} codes de secours</li>
                <li>Vous pouvez régénérer de nouveaux codes à tout moment</li>
              </ul>
            </div>
          </div>
        )}

        {/* Bouton initial si pas encore commencé */}
        {!twoFAStatus && step === 0 && (
          <button 
            className="primary-btn"
            onClick={handleSetup2FA}
          >
            Commencer la configuration
          </button>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;
