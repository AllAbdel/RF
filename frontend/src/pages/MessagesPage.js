import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI } from '../services/api';
import socketService from '../services/socket';
import '../styles/Messages.css';

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadConversations();
    
    // Connexion Socket.io
    socketService.connect(user.id);
    
    socketService.onNewMessage((data) => {
      if (selectedConversation && data.conversation_id === selectedConversation.id) {
        setMessages(prev => [...prev, data]);
        scrollToBottom();
      }
      loadConversations(); // Refresh pour mettre à jour last_message
    });

    return () => {
      socketService.disconnect();
    };
  }, [user.id]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      socketService.joinConversation(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append('conversation_id', selectedConversation.id);
    formData.append('message', newMessage);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      await messageAPI.sendMessage(formData);
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx'].includes(ext)) return '📗';
    if (['zip', 'rar'].includes(ext)) return '📦';
    return '📄';
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-sidebar">
        <div className="sidebar-header">
          <h2>💬 Messages</h2>
        </div>
        
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>Aucune conversation</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="conversation-avatar">
                  {user.user_type === 'client' ? '🏢' : '👤'}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {user.user_type === 'client' 
                      ? conv.agency_name 
                      : `${conv.first_name} ${conv.last_name}`}
                  </div>
                  <div className="conversation-last-message">
                    {conv.last_message || 'Pas de messages'}
                  </div>
                </div>
                {conv.unread_count > 0 && (
                  <div className="unread-badge">{conv.unread_count}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="messages-content">
        {selectedConversation ? (
          <>
            <div className="messages-header">
              <h3>
                {user.user_type === 'client' 
                  ? selectedConversation.agency_name 
                  : `${selectedConversation.first_name} ${selectedConversation.last_name}`}
              </h3>
            </div>

            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {msg.message && <p>{msg.message}</p>}
                    {msg.file_url && (
                      <div className="message-file">
                        <a 
                          href={`http://localhost:5000${msg.file_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download={msg.file_name}
                        >
                          {getFileIcon(msg.file_name)} {msg.file_name}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="message-time">
                    {formatDate(msg.created_at)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
              {selectedFile && (
                <div className="selected-file">
                  {getFileIcon(selectedFile.name)} {selectedFile.name}
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <div className="input-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier"
                >
                  📎
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="message-input"
                />
                
                <button type="submit" className="send-btn" disabled={!newMessage.trim() && !selectedFile}>
                  ➤
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="no-conversation-selected">
            <p>Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;