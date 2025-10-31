const db = require('../config/database');
const bcrypt = require('bcryptjs');

const getAgencyMembers = async (req, res) => {
  try {
    const [members] = await db.query(
      `SELECT id, email, first_name, last_name, phone, role, created_at
       FROM users
       WHERE agency_id = ? AND user_type = 'agency_member'
       ORDER BY role DESC, created_at ASC`,
      [req.user.agency_id]
    );

    res.json({ members });
  } catch (error) {
    console.error('Erreur récupération membres:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des membres' });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { email, first_name, last_name, phone, role } = req.body;

    // Vérifier si l'email existe déjà
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const [result] = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role)
       VALUES (?, ?, ?, ?, ?, 'agency_member', ?, ?)`,
      [email, hashedPassword, first_name, last_name, phone, req.user.agency_id, role || 'member']
    );

    res.status(201).json({
      message: 'Membre invité avec succès',
      user_id: result.insertId,
      temp_password: tempPassword
    });
  } catch (error) {
    console.error('Erreur invitation membre:', error);
    res.status(500).json({ error: 'Erreur lors de l\'invitation du membre' });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { member_id } = req.params;
    const { role } = req.body;

    // Vérifier que le membre appartient à la même agence
    const [members] = await db.query(
      'SELECT * FROM users WHERE id = ? AND agency_id = ?',
      [member_id, req.user.agency_id]
    );

    if (members.length === 0) {
      return res.status(404).json({ error: 'Membre non trouvé' });
    }

    // Empêcher de modifier son propre rôle
    if (parseInt(member_id) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, member_id]);

    res.json({ message: 'Rôle du membre mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour rôle:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { member_id } = req.params;

    // Vérifier que le membre appartient à la même agence
    const [members] = await db.query(
      'SELECT * FROM users WHERE id = ? AND agency_id = ?',
      [member_id, req.user.agency_id]
    );

    if (members.length === 0) {
      return res.status(404).json({ error: 'Membre non trouvé' });
    }

    // Empêcher de se supprimer soi-même
    if (parseInt(member_id) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
    }

    // Empêcher de supprimer le dernier super admin
    if (members[0].role === 'super_admin') {
      const [superAdmins] = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE agency_id = ? AND role = ?',
        [req.user.agency_id, 'super_admin']
      );

      if (superAdmins[0].count <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier super administrateur' });
      }
    }

    await db.query('DELETE FROM users WHERE id = ?', [member_id]);

    res.json({ message: 'Membre supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression membre:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du membre' });
  }
};

const getAgencyStats = async (req, res) => {
  try {
    // Nombre total de véhicules
    const [vehicleCount] = await db.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE agency_id = ?',
      [req.user.agency_id]
    );

    // Nombre de réservations par statut
    const [reservationStats] = await db.query(
      `SELECT status, COUNT(*) as count
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
       GROUP BY status`,
      [req.user.agency_id]
    );

    // Revenus totaux
    const [revenue] = await db.query(
      `SELECT SUM(total_price) as total
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? AND r.status IN ('completed', 'accepted')`,
      [req.user.agency_id]
    );

    // Note moyenne
    const [avgRating] = await db.query(
      `SELECT AVG(r.rating) as avg_rating
       FROM reviews r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?`,
      [req.user.agency_id]
    );

    // Réservations récentes
    const [recentReservations] = await db.query(
      `SELECT r.*, v.brand, v.model, u.first_name, u.last_name
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN users u ON r.client_id = u.id
       WHERE v.agency_id = ?
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [req.user.agency_id]
    );

    res.json({
      vehicle_count: vehicleCount[0].count,
      reservation_stats: reservationStats,
      total_revenue: revenue[0].total || 0,
      avg_rating: avgRating[0].avg_rating || 0,
      recent_reservations: recentReservations
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

const updateAgencyInfo = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    await db.query(
      'UPDATE agencies SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone, address, req.user.agency_id]
    );

    res.json({ message: 'Informations de l\'agence mises à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour agence:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des informations' });
  }
};

module.exports = {
  getAgencyMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getAgencyStats,
  updateAgencyInfo
};
