const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 🆕 IMPORT NETTOYAGE TOKENS
const { cleanupExpiredTokens } = require('./utils/tokenManager');

// 🔒 VÉRIFICATION JWT_SECRET AU DÉMARRAGE
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ ERREUR CRITIQUE: JWT_SECRET manquant ou trop court (min 32 caractères)');
  console.error('   Ajoutez JWT_SECRET=votre_secret_de_32_caracteres_minimum dans .env');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('⚠️  MODE DEV: Utilisation d\'un secret temporaire (NE PAS UTILISER EN PRODUCTION)');
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
  console.log('🧹 Nettoyage des tokens expirés...');
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api', require('./routes/reviews'));
app.use('/api/agency', require('./routes/agency'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/client-documents', require('./routes/clientDocuments'));

// Socket.io pour la messagerie en temps réel
const userSockets = new Map();
const db = require('./config/database');

io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.io:', socket.id, socket.user ? `(user ${socket.user.id})` : '(non auth)');

  socket.on('register', (userId) => {
    // 🔒 Vérifier que l'utilisateur s'enregistre avec son propre ID
    if (socket.user && socket.user.id !== userId) {
      console.warn(`⚠️ Tentative d'usurpation: user ${socket.user.id} essaie de s'enregistrer comme ${userId}`);
      return;
    }
    userSockets.set(userId, socket.id);
    console.log(`Utilisateur ${userId} enregistré avec socket ${socket.id}`);
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
          console.warn(`⚠️ Accès refusé: user ${socket.user.id} tente de rejoindre conversation ${conversationId}`);
          socket.emit('error', { message: 'Accès non autorisé à cette conversation' });
          return;
        }
      } catch (err) {
        console.error('Erreur vérification conversation:', err);
      }
    }
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} a rejoint la conversation ${conversationId}`);
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
        console.log(`Utilisateur ${userId} déconnecté`);
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
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = { app, io };
