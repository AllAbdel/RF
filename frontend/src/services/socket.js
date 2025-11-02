import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    this.socket = io(SOCKET_URL);
    
    this.socket.on('connect', () => {
      console.log('Connecté au serveur Socket.io');
      this.socket.emit('register', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.io');
    });

    return this.socket;
  }

  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  sendMessage(data) {
    if (this.socket) {
      this.socket.emit('send_message', data);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  emitTyping(conversationId, userName) {
    if (this.socket) {
      this.socket.emit('typing', { conversation_id: conversationId, user_name: userName });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
