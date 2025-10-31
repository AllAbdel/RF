const db = require('../config/database');

// AVIS
const createReview = async (req, res) => {
  try {
    const { reservation_id, rating, comment } = req.body;

    // Vérifier que la réservation existe et est terminée
    const [reservations] = await db.query(
      'SELECT * FROM reservations WHERE id = ? AND client_id = ? AND status = ?',
      [reservation_id, req.user.id, 'completed']
    );

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée ou non terminée' });
    }

    // Vérifier qu'un avis n'existe pas déjà
    const [existingReview] = await db.query(
      'SELECT id FROM reviews WHERE reservation_id = ?',
      [reservation_id]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ error: 'Un avis existe déjà pour cette réservation' });
    }

    const [result] = await db.query(
      'INSERT INTO reviews (reservation_id, client_id, vehicle_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [reservation_id, req.user.id, reservations[0].vehicle_id, rating, comment]
    );

    res.status(201).json({
      message: 'Avis créé avec succès',
      review_id: result.insertId
    });
  } catch (error) {
    console.error('Erreur création avis:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'avis' });
  }
};

const getVehicleReviews = async (req, res) => {
  try {
    const { vehicle_id } = req.params;

    const [reviews] = await db.query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       WHERE r.vehicle_id = ?
       ORDER BY r.created_at DESC`,
      [vehicle_id]
    );

    res.json({ reviews });
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des avis' });
  }
};

// NOTIFICATIONS
const getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    res.json({ notifications });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur mise à jour notification:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification' });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur mise à jour notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des notifications' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({ unread_count: result[0].count });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ error: 'Erreur lors du comptage des notifications' });
  }
};

module.exports = {
  createReview,
  getVehicleReviews,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount
};
