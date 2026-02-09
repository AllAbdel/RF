import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI } from '../services/api';
import socketService from '../services/socket';
import '../styles/Messages.css';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ show: false, messageId: null });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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
  }, [user.id, selectedConversation]);

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

  const handleDeleteMessage = async (messageId) => {
    try {
      await messageAPI.deleteMessage(messageId);
      setDeleteModal({ show: false, messageId: null });
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Erreur suppression message:', error);
      alert('Erreur lors de la suppression du message');
    }
  };

  const openDeleteModal = (messageId) => {
    setDeleteModal({ show: true, messageId });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, messageId: null });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return 'hsl(220, 70%, 50%)';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 55%)`;
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
    if (!fileName) return '[Fichier]';
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'Image';
    if (['pdf'].includes(ext)) return 'PDF';
    if (['doc', 'docx'].includes(ext)) return 'DOC';
    if (['xls', 'xlsx'].includes(ext)) return 'XLS';
    if (['zip', 'rar'].includes(ext)) return 'Archive';
    return '[Fichier]';
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
        </div>
        
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>Aucune conversation</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const displayName = user.user_type === 'client' 
                ? conv.agency_name 
                : `${conv.first_name} ${conv.last_name}`;
              const initials = getInitials(displayName);
              const avatarColor = getAvatarColor(displayName);
              
              return (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div 
                    className="conversation-avatar"
                    style={{ background: avatarColor }}
                  >
                    <span className="avatar-initials">{initials}</span>
                    <span className="avatar-status online"></span>
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-name">
                      {displayName}
                    </div>
                    <div className="conversation-last-message">
                      {conv.last_message || 'Pas de messages'}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="unread-badge">{conv.unread_count}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="messages-content">
        <div className="messages-topbar">
          <button
                type="button"
                className="back-btn"
                onClick={() => navigate(-1)}
                aria-label="Retour"
              >
                Retour
              </button>

          <h3>
            {selectedConversation
              ? (user.user_type === 'client'
                  ? selectedConversation.agency_name
                  : `${selectedConversation.first_name} ${selectedConversation.last_name}`)
              : 'Messages'}
          </h3>
        </div>

        {selectedConversation ? (
          <>
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === user.id ? 'sent' : 'received'} ${msg.deleted_at ? 'deleted' : ''}`}
                >
                  <div className="message-content">
                    {msg.deleted_at ? (
                      <p className="deleted-message">
                        <em>[Message supprimé par {msg.deleted_by_first_name} {msg.deleted_by_last_name}]</em>
                      </p>
                    ) : (
                      <>
                        {msg.message && <p>{msg.message}</p>}
                        {msg.file_url && (
                          <div className="message-file">
                            {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                              msg.file_name?.split('.').pop()?.toLowerCase()
                            ) ? (
                              <div className="message-image-container">
                                <img 
                                  src={`http://localhost:5000${msg.file_url}`} 
                                  alt={msg.file_name}
                                  className="message-image"
                                  onClick={() => window.open(`http://localhost:5000${msg.file_url}`, '_blank')}
                                />
                                <span className="image-filename">{msg.file_name}</span>
                              </div>
                            ) : (
                              <a 
                                href={`http://localhost:5000${msg.file_url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download={msg.file_name}
                              >
                                {getFileIcon(msg.file_name)} {msg.file_name}
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="message-footer">
                    <span className="message-time">{formatDate(msg.created_at)}</span>
                    {!msg.deleted_at && (
                      <button 
                        className="delete-message-btn"
                        onClick={() => openDeleteModal(msg.id)}
                        title="Supprimer ce message"
                      >
                        <FaTrash />
                      </button>
                    )}
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
                    Supprimer
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
                  Joindre
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="message-input"
                />
                
                <button type="submit" className="send-btn" disabled={!newMessage.trim() && !selectedFile}>
                  Envoyer
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

      {/* Modal de confirmation de suppression */}
      {deleteModal.show && (
        <div className="delete-modal-overlay" onClick={closeDeleteModal}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <button className="delete-modal-close" onClick={closeDeleteModal}>
              <FaTimes />
            </button>
            <div className="delete-modal-icon">
              <FaExclamationTriangle />
            </div>
            <h3>Supprimer ce message ?</h3>
            <p>Cette action est irréversible. Le message sera supprimé définitivement.</p>
            <div className="delete-modal-actions">
              <button className="delete-modal-cancel" onClick={closeDeleteModal}>
                Annuler
              </button>
              <button 
                className="delete-modal-confirm" 
                onClick={() => handleDeleteMessage(deleteModal.messageId)}
              >
                <FaTrash /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;