const db = require('../config/database');

const getOrCreateConversation = async (req, res) => {
  try {
    const { agency_id } = req.body;
    const client_id = req.user.id;

    // Vérifier si une conversation existe déjà
    let [conversations] = await db.query(
      'SELECT * FROM conversations WHERE client_id = ? AND agency_id = ?',
      [client_id, agency_id]
    );

    let conversationId;

    if (conversations.length === 0) {
      // Créer une nouvelle conversation
      const [result] = await db.query(
        'INSERT INTO conversations (client_id, agency_id) VALUES (?, ?)',
        [client_id, agency_id]
      );
      conversationId = result.insertId;
    } else {
      conversationId = conversations[0].id;
    }

    res.json({ conversation_id: conversationId });
  } catch (error) {
    console.error('Erreur création conversation:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la conversation' });
  }
};

const getConversations = async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.user_type === 'client') {
      query = `
        SELECT c.*, a.name as agency_name,
               (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_date,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
        FROM conversations c
        JOIN agencies a ON c.agency_id = a.id
        WHERE c.client_id = ?
        ORDER BY c.updated_at DESC
      `;
      params = [req.user.id, req.user.id];
    } else {
      query = `
        SELECT c.*, u.first_name, u.last_name,
               (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_date,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id = c.client_id AND is_read = 0) as unread_count
        FROM conversations c
        JOIN users u ON c.client_id = u.id
        WHERE c.agency_id = ?
        ORDER BY c.updated_at DESC
      `;
      params = [req.user.agency_id];
    }

    const [conversations] = await db.query(query, params);
    res.json({ conversations });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;

    // Vérifier l'accès à la conversation
    const [conversations] = await db.query(
      'SELECT * FROM conversations WHERE id = ? AND (client_id = ? OR agency_id = ?)',
      [conversation_id, req.user.id, req.user.agency_id]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const [messages] = await db.query(
      `SELECT m.*, u.first_name, u.last_name, u.user_type
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversation_id]
    );

    // Marquer les messages comme lus
    await db.query(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
      [conversation_id, req.user.id]
    );

    res.json({ messages });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversation_id, message } = req.body;
    const file_url = req.file ? `/uploads/messages/${req.file.filename}` : null;
    const file_name = req.file ? req.file.originalname : null;

    // Vérifier l'accès à la conversation
    const [conversations] = await db.query(
      'SELECT * FROM conversations WHERE id = ? AND (client_id = ? OR agency_id = ?)',
      [conversation_id, req.user.id, req.user.agency_id]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const [result] = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, message, file_url, file_name) VALUES (?, ?, ?, ?, ?)',
      [conversation_id, req.user.id, message || '', file_url, file_name]
    );

    // Mettre à jour la conversation
    await db.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversation_id]);

    // Créer une notification pour le destinataire
    const conversation = conversations[0];
    
    // Si l'expéditeur est un client, notifier tous les membres de l'agence
    if (req.user.user_type === 'client') {
      const [agencyMembers] = await db.query(
        'SELECT id FROM users WHERE agency_id = ?',
        [conversation.agency_id]
      );
      
      for (const member of agencyMembers) {
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, related_id)
           VALUES (?, 'new_message', 'Nouveau message', 'Vous avez reçu un nouveau message', ?)`,
          [member.id, conversation_id]
        );
      }
    } else {
      // Notifier le client
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id)
         VALUES (?, 'new_message', 'Nouveau message', 'Vous avez reçu un nouveau message de l\'agence', ?)`,
        [conversation.client_id, conversation_id]
      );
    }

    res.status(201).json({
      message: 'Message envoyé avec succès',
      message_id: result.insertId,
      file_url,
      file_name
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage
};
