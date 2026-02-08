// Push Notification Service
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

class PushNotificationService {
  constructor() {
    this.swRegistration = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Vérifier si les notifications sont supportées
  isNotificationSupported() {
    return this.isSupported;
  }

  // Demander la permission pour les notifications
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Push notifications non supportées');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Obtenir l'état actuel de la permission
  getPermissionState() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission;
  }

  // Enregistrer le service worker
  async registerServiceWorker() {
    if (!this.isSupported) return null;

    try {
      this.swRegistration = await navigator.serviceWorker.register('/push-sw.js');
      console.log('Service Worker enregistré:', this.swRegistration);
      return this.swRegistration;
    } catch (error) {
      console.error('Erreur enregistrement Service Worker:', error);
      return null;
    }
  }

  // S'abonner aux notifications push
  async subscribe(token) {
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) {
      throw new Error('Service Worker non disponible');
    }

    try {
      // Récupérer la clé publique VAPID
      const vapidResponse = await axios.get(`${API_URL}/push/vapid-public-key`);
      const vapidPublicKey = vapidResponse.data.publicKey;

      if (!vapidPublicKey) {
        throw new Error('Clé VAPID non configurée sur le serveur');
      }

      // Convertir la clé en Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // S'abonner
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Envoyer l'abonnement au serveur
      await axios.post(
        `${API_URL}/push/subscribe`,
        { subscription: subscription.toJSON() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Abonnement push réussi');
      return true;
    } catch (error) {
      console.error('Erreur abonnement push:', error);
      throw error;
    }
  }

  // Se désabonner des notifications
  async unsubscribe(token) {
    if (!this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        // Désabonner côté serveur
        await axios.post(
          `${API_URL}/push/unsubscribe`,
          { endpoint: subscription.endpoint },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Désabonner localement
        await subscription.unsubscribe();
      }

      console.log('Désabonnement réussi');
      return true;
    } catch (error) {
      console.error('Erreur désabonnement:', error);
      throw error;
    }
  }

  // Vérifier si on est abonné
  async isSubscribed() {
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.swRegistration) return false;

    const subscription = await this.swRegistration.pushManager.getSubscription();
    return !!subscription;
  }

  // Envoyer une notification de test
  async sendTestNotification(token) {
    try {
      await axios.post(
        `${API_URL}/push/test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return true;
    } catch (error) {
      console.error('Erreur envoi notification test:', error);
      throw error;
    }
  }

  // Helper: convertir clé VAPID base64 en Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Afficher une notification locale (pour test)
  showLocalNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });
    }
  }
}

// Singleton
const pushService = new PushNotificationService();
export default pushService;
