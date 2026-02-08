// Push Notification Service Worker

self.addEventListener('install', (event) => {
  console.log('Push Service Worker installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Push Service Worker activé');
  event.waitUntil(self.clients.claim());
});

// Gestionnaire de notifications push
self.addEventListener('push', (event) => {
  console.log('Push reçu:', event);

  let data = {
    title: 'CarRental',
    body: 'Vous avez une nouvelle notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {}
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestionnaire de clic sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification cliquée:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Déterminer l'URL de redirection selon le type de notification
  if (data.type === 'reservation') {
    url = data.role === 'agency' ? '/agency' : '/client';
  } else if (data.type === 'message') {
    url = '/messages';
  } else if (data.url) {
    url = data.url;
  }

  // Gérer les actions de la notification
  if (event.action) {
    switch (event.action) {
      case 'view':
        url = data.url || url;
        break;
      case 'dismiss':
        return;
      default:
        break;
    }
  }

  // Ouvrir ou focus sur la fenêtre
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre déjà ouverte
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Gestionnaire de fermeture de notification
self.addEventListener('notificationclose', (event) => {
  console.log('Notification fermée:', event);
});
