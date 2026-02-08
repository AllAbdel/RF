const db = require('../config/database');

const createReservation = async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.body;

    // Vérifier la disponibilité
    const [conflicts] = await db.query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE vehicle_id = ? 
       AND status IN ('pending', 'accepted')
       AND (
         (start_date <= ? AND end_date >= ?) OR
         (start_date <= ? AND end_date >= ?) OR
         (start_date >= ? AND end_date <= ?)
       )`,
      [vehicle_id, start_date, start_date, end_date, end_date, start_date, end_date]
    );

    if (conflicts[0].count > 0) {
      return res.status(400).json({ error: 'Ce véhicule n\'est pas disponible pour ces dates' });
    }

    // Calculer le prix
    const [vehicle] = await db.query('SELECT price_per_hour, agency_id FROM vehicles WHERE id = ?', [vehicle_id]);
    if (vehicle.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    const total_price = hours * vehicle[0].price_per_hour;
    const agency_id = vehicle[0].agency_id;

    // Créer la réservation
    const [result] = await db.query(
      `INSERT INTO reservations (vehicle_id, client_id, agency_id, start_date, end_date, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vehicle_id, req.user.id, agency_id, start_date, end_date, total_price]
    );

    // Créer une notification pour l'agence
    const [agencyMembers] = await db.query(
      'SELECT id FROM users WHERE agency_id = ?',
      [agency_id]
    );

    for (const member of agencyMembers) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id)
         VALUES (?, 'new_reservation', 'Nouvelle réservation', 'Vous avez reçu une nouvelle demande de réservation', ?)`,
        [member.id, result.insertId]
      );
    }

    res.status(201).json({
      message: 'Réservation créée avec succès',
      reservation_id: result.insertId,
      total_price
    });
  } catch (error) {
    console.error('Erreur création réservation:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
  }
};

const getClientReservations = async (req, res) => {
  try {
    const [reservations] = await db.query(
      `SELECT r.*, v.brand, v.model, v.fuel_type, a.name as agency_name,
              (SELECT image_url FROM vehicle_images WHERE vehicle_id = v.id AND is_primary = 1 LIMIT 1) as vehicle_image,
              (SELECT COUNT(*) FROM reviews WHERE reservation_id = r.id) > 0 as has_review
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN agencies a ON v.agency_id = a.id
       WHERE r.client_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({ reservations });
  } catch (error) {
    console.error('Erreur récupération réservations client:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
};

const getAgencyReservations = async (req, res) => {
  try {
    const [reservations] = await db.query(
      `SELECT r.*, v.brand, v.model, u.first_name, u.last_name, u.email, u.phone,
              (SELECT image_url FROM vehicle_images WHERE vehicle_id = v.id AND is_primary = 1 LIMIT 1) as vehicle_image
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN users u ON r.client_id = u.id
       WHERE v.agency_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.agency_id]
    );

    res.json({ reservations });
  } catch (error) {
    console.error('Erreur récupération réservations agence:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
};

const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Vérifier que la réservation appartient à l'agence
    const [reservations] = await db.query(
      `SELECT r.*, v.agency_id, r.client_id, r.vehicle_id
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.id = ? AND v.agency_id = ?`,
      [id, req.user.agency_id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée ou accès refusé' });
    }

    const reservation = reservations[0];

    // Mettre à jour le statut de la réservation
    await db.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);

    // Mettre à jour le statut du véhicule selon le statut de la réservation
    if (status === 'accepted') {
      // Véhicule devient loué quand réservation acceptée
      await db.query('UPDATE vehicles SET status = ? WHERE id = ?', ['rented', reservation.vehicle_id]);
    } else if (status === 'completed' || status === 'rejected' || status === 'cancelled') {
      // Vérifier s'il y a d'autres réservations actives pour ce véhicule
      const [activeReservations] = await db.query(
        `SELECT COUNT(*) as count FROM reservations 
         WHERE vehicle_id = ? AND status = 'accepted' AND id != ?`,
        [reservation.vehicle_id, id]
      );

      // Si aucune autre réservation active, remettre disponible
      if (activeReservations[0].count === 0) {
        await db.query('UPDATE vehicles SET status = ? WHERE id = ?', ['available', reservation.vehicle_id]);
      }
    }

    // Créer une notification pour le client
    const notificationMessages = {
      accepted: 'Votre réservation a été acceptée',
      rejected: 'Votre réservation a été refusée',
      completed: 'Votre réservation est terminée'
    };

    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES (?, 'reservation_update', 'Mise à jour de réservation', ?, ?)`,
      [reservation.client_id, notificationMessages[status], id]
    );

    res.json({ message: 'Statut de la réservation mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour réservation:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la réservation' });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la réservation appartient au client
    const [reservations] = await db.query(
      'SELECT * FROM reservations WHERE id = ? AND client_id = ?',
      [id, req.user.id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (reservations[0].status === 'completed') {
      return res.status(400).json({ error: 'Impossible d\'annuler une réservation terminée' });
    }

    await db.query('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', id]);

    res.json({ message: 'Réservation annulée avec succès' });
  } catch (error) {
    console.error('Erreur annulation réservation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de la réservation' });
  }
};

const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.body;

    // Vérifier que la réservation appartient au client
    const [reservations] = await db.query(
      'SELECT * FROM reservations WHERE id = ? AND client_id = ?',
      [id, req.user.id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (reservations[0].status !== 'pending') {
      return res.status(400).json({ error: 'Seules les réservations en attente peuvent être modifiées' });
    }

    // Vérifier la disponibilité
    const [conflicts] = await db.query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE vehicle_id = ? 
       AND id != ?
       AND status IN ('pending', 'accepted')
       AND (
         (start_date <= ? AND end_date >= ?) OR
         (start_date <= ? AND end_date >= ?) OR
         (start_date >= ? AND end_date <= ?)
       )`,
      [reservations[0].vehicle_id, id, start_date, start_date, end_date, end_date, start_date, end_date]
    );

    if (conflicts[0].count > 0) {
      return res.status(400).json({ error: 'Le véhicule n\'est pas disponible pour ces nouvelles dates' });
    }

    // Recalculer le prix
    const [vehicle] = await db.query('SELECT price_per_hour FROM vehicles WHERE id = ?', [reservations[0].vehicle_id]);
    const start = new Date(start_date);
    const end = new Date(end_date);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    const total_price = hours * vehicle[0].price_per_hour;

    await db.query(
      'UPDATE reservations SET start_date = ?, end_date = ?, total_price = ? WHERE id = ?',
      [start_date, end_date, total_price, id]
    );

    res.json({ message: 'Réservation modifiée avec succès', total_price });
  } catch (error) {
    console.error('Erreur modification réservation:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la réservation' });
  }
};

module.exports = {
  createReservation,
  getClientReservations,
  getAgencyReservations,
  updateReservationStatus,
  cancelReservation,
  updateReservation
};
