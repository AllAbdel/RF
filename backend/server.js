const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 📋 LOGGER STRUCTURÉ
const logger = require('./utils/logger');

// 🆕 IMPORT NETTOYAGE TOKENS
const { cleanupExpiredTokens } = require('./utils/tokenManager');

// 🔒 VÉRIFICATION JWT_SECRET AU DÉMARRAGE
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  logger.error('ERREUR CRITIQUE: JWT_SECRET manquant ou trop court (min 32 caractères)');
  logger.error('Ajoutez JWT_SECRET=votre_secret_de_32_caracteres_minimum dans .env');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('MODE DEV: Utilisation d\'un secret temporaire (NE PAS UTILISER EN PRODUCTION)');
  }
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// 🔒 AUTHENTIFICATION SOCKET.IO AVEC JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  
  if (!token) {
    // Permettre la connexion sans token en dev pour les tests
    if (process.env.NODE_ENV !== 'production') {
      socket.user = null;
      return next();
    }
    return next(new Error('Token d\'authentification requis'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production');
    socket.user = decoded;
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      socket.user = null;
      return next();
    }
    return next(new Error('Token invalide'));
  }
});

// 🆕 NETTOYAGE AUTOMATIQUE DES TOKENS EXPIRÉS
// Exécuter toutes les 6 heures
setInterval(async () => {
  logger.info('Nettoyage des tokens expirés...');
  await cleanupExpiredTokens(require('./config/database'));
}, 6 * 60 * 60 * 1000);

// Nettoyage au démarrage
cleanupExpiredTokens(require('./config/database'));

// Middlewares
// 🔒 HELMET: Headers de sécurité HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permet le chargement des images/fichiers
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false // Désactivé en dev
}));

// ⚡ COMPRESSION: Gzip des réponses
app.use(compression());

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limite taille JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// 📋 HTTP REQUEST LOGGING
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api', require('./routes/reviews'));
app.use('/api/agency', require('./routes/agency'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/client-documents', require('./routes/clientDocuments'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/push', require('./routes/push'));

// Socket.io pour la messagerie en temps réel
const userSockets = new Map();
const db = require('./config/database');

io.on('connection', (socket) => {
  logger.debug('Nouvelle connexion Socket.io', { socketId: socket.id, userId: socket.user?.id || 'non auth' });

  socket.on('register', (userId) => {
    // 🔒 Vérifier que l'utilisateur s'enregistre avec son propre ID
    if (socket.user && socket.user.id !== userId) {
      logger.warn('Tentative d\'usurpation socket', { realUserId: socket.user.id, attemptedUserId: userId });
      return;
    }
    userSockets.set(userId, socket.id);
    logger.debug('Utilisateur enregistré sur socket', { userId, socketId: socket.id });
  });

  socket.on('join_conversation', async (conversationId) => {
    // 🔒 Vérifier que l'utilisateur fait partie de la conversation
    if (socket.user) {
      try {
        const [conv] = await db.query(
          'SELECT id FROM conversations WHERE id = ? AND (client_id = ? OR agency_id = ?)',
          [conversationId, socket.user.id, socket.user.agency_id]
        );
        if (conv.length === 0) {
          logger.warn('Accès conversation refusé', { userId: socket.user.id, conversationId });
          socket.emit('error', { message: 'Accès non autorisé à cette conversation' });
          return;
        }
      } catch (err) {
        logger.error('Erreur vérification conversation', { error: err.message, conversationId });
      }
    }
    socket.join(`conversation_${conversationId}`);
    logger.debug('Socket a rejoint conversation', { socketId: socket.id, conversationId });
  });

  socket.on('send_message', (data) => {
    io.to(`conversation_${data.conversation_id}`).emit('new_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(`conversation_${data.conversation_id}`).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        logger.debug('Utilisateur déconnecté', { userId });
        break;
      }
    }
  });
});

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API de location de voitures - Serveur en ligne' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  logger.error('Erreur serveur', { error: err.message, stack: err.stack, url: req.originalUrl });
  res.status(500).json({ error: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
});

module.exports = { app, io };
