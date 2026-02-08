const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// 🆕 IMPORT NETTOYAGE TOKENS
const { cleanupExpiredTokens } = require('./utils/tokenManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
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
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.io:', socket.id);

  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`Utilisateur ${userId} enregistré avec socket ${socket.id}`);
  });

  socket.on('join_conversation', (conversationId) => {
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
