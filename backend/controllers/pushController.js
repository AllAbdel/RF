const db = require('../config/database');
const webpush = require('web-push');

// Configuration VAPID (à configurer dans .env)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.SMTP_USER || 'contact@carental.com'),
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * Récupérer la clé publique VAPID
 */
const getVapidPublicKey = (req, res) => {
  if (!vapidPublicKey) {
    return res.status(503).json({ 
      error: 'Notifications push non configurées',
      message: 'Les clés VAPID ne sont pas configurées sur le serveur'
    });
  }
  res.json({ publicKey: vapidPublicKey });
};

/**
 * Souscrire aux notifications push
 */
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    const user_id = req.user.id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription invalide' });
    }

    // Supprimer les anciennes subscriptions de cet utilisateur
    await db.query('DELETE FROM push_subscriptions WHERE user_id = ?', [user_id]);

    // Ajouter la nouvelle subscription
    await db.query(
      'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
      [user_id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );

    res.json({ message: 'Abonnement aux notifications réussi' });
  } catch (error) {
    console.error('Erreur subscription push:', error);
    res.status(500).json({ error: 'Erreur lors de l\'abonnement' });
  }
};

/**
 * Se désabonner des notifications
 */
const unsubscribe = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    await db.query('DELETE FROM push_subscriptions WHERE user_id = ?', [user_id]);
    
    res.json({ message: 'Désabonnement réussi' });
  } catch (error) {
    console.error('Erreur désabonnement push:', error);
    res.status(500).json({ error: 'Erreur lors du désabonnement' });
  }
};

/**
 * Envoyer une notification à un utilisateur spécifique
 */
const sendNotificationToUser = async (userId, title, body, data = {}) => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('⚠️ Push notifications non configurées (VAPID keys manquantes)');
    return false;
  }

  try {
    const [subscriptions] = await db.query(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subscriptions.length === 0) {
      return false;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data
    });

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          return true;
        } catch (err) {
          console.error('Erreur envoi push:', err);
          // Supprimer les subscriptions invalides
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
          }
          return false;
        }
      })
    );

    return results.some(r => r);
  } catch (error) {
    console.error('Erreur sendNotificationToUser:', error);
    return false;
  }
};

/**
 * Envoyer une notification à tous les membres d'une agence
 */
const sendNotificationToAgency = async (agencyId, title, body, data = {}) => {
  try {
    const [members] = await db.query(
      'SELECT id FROM users WHERE agency_id = ?',
      [agencyId]
    );

    await Promise.all(
      members.map(member => sendNotificationToUser(member.id, title, body, data))
    );

    return true;
  } catch (error) {
    console.error('Erreur sendNotificationToAgency:', error);
    return false;
  }
};

/**
 * Test d'envoi de notification (pour debug)
 */
const testNotification = async (req, res) => {
  try {
    const success = await sendNotificationToUser(
      req.user.id,
      'Test de notification',
      'Si vous voyez ce message, les notifications fonctionnent !',
      { type: 'test' }
    );

    if (success) {
      res.json({ message: 'Notification de test envoyée' });
    } else {
      res.status(400).json({ error: 'Échec de l\'envoi (pas d\'abonnement actif)' });
    }
  } catch (error) {
    console.error('Erreur test notification:', error);
    res.status(500).json({ error: 'Erreur lors du test' });
  }
};

/**
 * Vérifier le statut d'abonnement
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const [subs] = await db.query(
      'SELECT id, created_at FROM push_subscriptions WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ 
      subscribed: subs.length > 0,
      subscribedAt: subs.length > 0 ? subs[0].created_at : null
    });
  } catch (error) {
    console.error('Erreur statut subscription:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  testNotification,
  getSubscriptionStatus,
  sendNotificationToUser,
  sendNotificationToAgency
};
