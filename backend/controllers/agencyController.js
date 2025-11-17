const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Rechercher des agences (pour les utilisateurs qui veulent rejoindre)
const searchAgencies = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.length < 2) {
      return res.json({ agencies: [] });
    }

    const [agencies] = await db.query(
      `SELECT id, name, logo, email 
       FROM agencies 
       WHERE name LIKE ? 
       ORDER BY name ASC 
       LIMIT 10`,
      [`%${search}%`]
    );

    res.json({ agencies });
  } catch (error) {
    console.error('Erreur recherche agences:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche d\'agences' });
  }
};

// Demander à rejoindre une agence
const requestToJoinAgency = async (req, res) => {
  try {
    const { agency_id } = req.body;
    const user_id = req.user.id;

    // Vérifier que l'utilisateur n'appartient pas déjà à une agence
    const [user] = await db.query('SELECT agency_id FROM users WHERE id = ?', [user_id]);
    if (user[0].agency_id) {
      return res.status(400).json({ error: 'Vous appartenez déjà à une agence' });
    }

    // Vérifier qu'une demande n'existe pas déjà
    const [existing] = await db.query(
      'SELECT id FROM agency_join_requests WHERE user_id = ? AND agency_id = ? AND status = ?',
      [user_id, agency_id, 'pending']
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà une demande en attente pour cette agence' });
    }

    // Créer la demande
    await db.query(
      'INSERT INTO agency_join_requests (user_id, agency_id) VALUES (?, ?)',
      [user_id, agency_id]
    );

    res.status(201).json({ message: 'Demande envoyée avec succès' });
  } catch (error) {
    console.error('Erreur demande adhésion:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la demande' });
  }
};

// Obtenir les demandes en attente pour une agence
const getPendingJoinRequests = async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT jr.id, jr.user_id, jr.created_at,
              u.email, u.first_name, u.last_name, u.phone
       FROM agency_join_requests jr
       JOIN users u ON jr.user_id = u.id
       WHERE jr.agency_id = ? AND jr.status = 'pending'
       ORDER BY jr.created_at DESC`,
      [req.user.agency_id]
    );

    res.json({ requests });
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
};

// Accepter ou refuser une demande
const handleJoinRequest = async (req, res) => {
  try {
    const { request_id, action } = req.body; // action: 'accept' ou 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }

    // Récupérer la demande
    const [requests] = await db.query(
      `SELECT jr.*, u.user_type 
       FROM agency_join_requests jr
       JOIN users u ON jr.user_id = u.id
       WHERE jr.id = ? AND jr.agency_id = ? AND jr.status = 'pending'`,
      [request_id, req.user.agency_id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const request = requests[0];

    if (action === 'accept') {
      // Mettre à jour l'utilisateur pour l'ajouter à l'agence
      await db.query(
        `UPDATE users 
         SET agency_id = ?, user_type = 'agency_member', role = 'member' 
         WHERE id = ?`,
        [req.user.agency_id, request.user_id]
      );

      // Mettre à jour le statut de la demande
      await db.query(
        'UPDATE agency_join_requests SET status = ? WHERE id = ?',
        ['accepted', request_id]
      );

      res.json({ message: 'Demande acceptée avec succès' });
    } else {
      // Refuser la demande
      await db.query(
        'UPDATE agency_join_requests SET status = ? WHERE id = ?',
        ['rejected', request_id]
      );

      res.json({ message: 'Demande refusée' });
    }
  } catch (error) {
    console.error('Erreur traitement demande:', error);
    res.status(500).json({ error: 'Erreur lors du traitement de la demande' });
  }
};

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

    // Vérifier si une invitation existe déjà pour cet email
    const [existingInvitation] = await db.query(
      'SELECT id FROM agency_invitations WHERE email = ? AND agency_id = ? AND status = ?',
      [email, req.user.agency_id, 'pending']
    );
    if (existingInvitation.length > 0) {
      return res.status(400).json({ error: 'Une invitation est déjà en attente pour cet email' });
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    
    // Expiration dans 7 jours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Créer l'invitation
    await db.query(
      `INSERT INTO agency_invitations (agency_id, email, first_name, last_name, phone, role, token, invited_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.agency_id, email, first_name, last_name, phone, role || 'member', token, req.user.id, expiresAt]
    );

    // Récupérer le nom de l'agence
    const [agency] = await db.query('SELECT name FROM agencies WHERE id = ?', [req.user.agency_id]);

    res.status(201).json({
      message: 'Invitation envoyée avec succès',
      invitation_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join-agency/${token}`,
      agency_name: agency[0].name
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

// Vérifier une invitation
const verifyInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const [invitations] = await db.query(
      `SELECT i.*, a.name as agency_name
       FROM agency_invitations i
       JOIN agencies a ON i.agency_id = a.id
       WHERE i.token = ? AND i.status = ?`,
      [token, 'pending']
    );

    if (invitations.length === 0) {
      return res.status(404).json({ error: 'Invitation introuvable ou déjà utilisée' });
    }

    const invitation = invitations[0];

    // Vérifier expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await db.query('UPDATE agency_invitations SET status = ? WHERE id = ?', ['expired', invitation.id]);
      return res.status(400).json({ error: 'Cette invitation a expiré' });
    }

    res.json({
      invitation: {
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        phone: invitation.phone,
        role: invitation.role,
        agency_name: invitation.agency_name
      }
    });
  } catch (error) {
    console.error('Erreur vérification invitation:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'invitation' });
  }
};

// Accepter une invitation
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Récupérer l'invitation
    const [invitations] = await db.query(
      'SELECT * FROM agency_invitations WHERE token = ? AND status = ?',
      [token, 'pending']
    );

    if (invitations.length === 0) {
      return res.status(404).json({ error: 'Invitation introuvable ou déjà utilisée' });
    }

    const invitation = invitations[0];

    // Vérifier expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await db.query('UPDATE agency_invitations SET status = ? WHERE id = ?', ['expired', invitation.id]);
      return res.status(400).json({ error: 'Cette invitation a expiré' });
    }

    // Vérifier si l'email existe déjà
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [invitation.email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Créer le compte
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role)
       VALUES (?, ?, ?, ?, ?, 'agency_member', ?, ?)`,
      [invitation.email, hashedPassword, invitation.first_name, invitation.last_name, 
       invitation.phone, invitation.agency_id, invitation.role]
    );

    // Marquer l'invitation comme acceptée
    await db.query('UPDATE agency_invitations SET status = ? WHERE id = ?', ['accepted', invitation.id]);

    res.status(201).json({
      message: 'Compte créé avec succès',
      user_id: result.insertId
    });
  } catch (error) {
    console.error('Erreur acceptation invitation:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
};

// Lister les invitations en attente
const getPendingInvitations = async (req, res) => {
  try {
    const [invitations] = await db.query(
      `SELECT i.*, u.first_name as inviter_first_name, u.last_name as inviter_last_name
       FROM agency_invitations i
       JOIN users u ON i.invited_by = u.id
       WHERE i.agency_id = ? AND i.status = ?
       ORDER BY i.created_at DESC`,
      [req.user.agency_id, 'pending']
    );

    res.json({ invitations });
  } catch (error) {
    console.error('Erreur récupération invitations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des invitations' });
  }
};

module.exports = {
  searchAgencies,
  requestToJoinAgency,
  getPendingJoinRequests,
  handleJoinRequest,
  getAgencyMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getAgencyStats,
  updateAgencyInfo,
  verifyInvitation,
  acceptInvitation,
  getPendingInvitations
};
