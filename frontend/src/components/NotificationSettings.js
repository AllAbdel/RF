import React, { useState, useEffect } from 'react';
import pushService from '../services/pushNotificationService';
import '../styles/NotificationSettings.css';

const NotificationSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsSupported(pushService.isNotificationSupported());
    setPermission(pushService.getPermissionState());
    
    if (pushService.isNotificationSupported()) {
      const subscribed = await pushService.isSubscribed();
      setIsSubscribed(subscribed);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Demander permission si pas encore accordée
      if (permission !== 'granted') {
        const granted = await pushService.requestPermission();
        if (!granted) {
          setError('Permission refusée. Veuillez autoriser les notifications dans les paramètres de votre navigateur.');
          setLoading(false);
          return;
        }
        setPermission('granted');
      }

      // S'abonner
      const token = localStorage.getItem('token');
      await pushService.subscribe(token);
      setIsSubscribed(true);
      setSuccess('Notifications activées avec succès !');
    } catch (err) {
      console.error('Erreur abonnement:', err);
      setError(err.message || 'Erreur lors de l\'activation des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await pushService.unsubscribe(token);
      setIsSubscribed(false);
      setSuccess('Notifications désactivées');
    } catch (err) {
      console.error('Erreur désabonnement:', err);
      setError(err.message || 'Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await pushService.sendTestNotification(token);
      setSuccess('Notification de test envoyée !');
    } catch (err) {
      console.error('Erreur test:', err);
      setError(err.message || 'Erreur lors de l\'envoi du test');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <div className="notification-card unsupported">
          <div className="notification-icon">🔕</div>
          <h3>Notifications non supportées</h3>
          <p>Votre navigateur ne supporte pas les notifications push.</p>
          <p className="hint">Essayez avec Chrome, Firefox ou Edge.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="notification-card">
        <div className="notification-header">
          <div className="notification-icon">
            {isSubscribed ? '🔔' : '🔕'}
          </div>
          <div className="notification-info">
            <h3>Notifications Push</h3>
            <p className={`status ${isSubscribed ? 'active' : 'inactive'}`}>
              {isSubscribed ? 'Activées' : 'Désactivées'}
            </p>
          </div>
        </div>

        <div className="notification-description">
          <p>
            Recevez des notifications en temps réel pour :
          </p>
          <ul>
            <li>Nouvelles réservations</li>
            <li>Changements de statut</li>
            <li>Messages reçus</li>
            <li>Documents à signer</li>
          </ul>
        </div>

        {error && (
          <div className="notification-message error">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="notification-message success">
            <span>✓</span> {success}
          </div>
        )}

        <div className="notification-actions">
          {!isSubscribed ? (
            <button 
              className="subscribe-btn"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? 'Activation...' : '🔔 Activer les notifications'}
            </button>
          ) : (
            <>
              <button 
                className="test-btn"
                onClick={handleTestNotification}
                disabled={loading}
              >
                {loading ? 'Envoi...' : '📤 Tester'}
              </button>
              <button 
                className="unsubscribe-btn"
                onClick={handleUnsubscribe}
                disabled={loading}
              >
                {loading ? 'Désactivation...' : '🔕 Désactiver'}
              </button>
            </>
          )}
        </div>

        {permission === 'denied' && (
          <div className="notification-warning">
            <p>
              <strong>⚠️ Notifications bloquées</strong><br />
              Les notifications sont bloquées dans votre navigateur. 
              Pour les activer, cliquez sur l'icône de cadenas dans la barre d'adresse 
              et autorisez les notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
