const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Rechercher des agences (pour les utilisateurs qui veulent rejoindre)
const searchAgencies = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Si la recherche est vide ou trop courte, retourner toutes les agences
    let query, params;
    if (!search || search.trim().length === 0) {
      query = `SELECT id, name, logo, email FROM agencies ORDER BY name ASC LIMIT 10`;
      params = [];
    } else {
      query = `SELECT id, name, logo, email FROM agencies WHERE name LIKE ? ORDER BY name ASC LIMIT 10`;
      params = [`%${search}%`];
    }

    const [agencies] = await db.query(query, params);

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
    // Vérifier que l'utilisateur a une agence
    if (!req.user.agency_id) {
      return res.status(400).json({ error: 'Utilisateur non associé à une agence' });
    }

    // Informations de l'agence
    const [agency] = await db.query(
      'SELECT id, name, email, phone, address, rental_conditions FROM agencies WHERE id = ?',
      [req.user.agency_id]
    );

    if (agency.length === 0) {
      return res.status(404).json({ error: 'Agence non trouvée' });
    }

    // Nombre total de véhicules
    const [vehicleCount] = await db.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE agency_id = ?',
      [req.user.agency_id]
    );

    // Nombre de réservations par statut
    const [reservationStats] = await db.query(
      `SELECT r.status, COUNT(*) as count
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
       GROUP BY r.status`,
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
      agency: agency[0],
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
    const { name, phone, address, rental_conditions } = req.body;

    // Vérifier que l'utilisateur a une agence
    if (!req.user.agency_id) {
      return res.status(400).json({ error: 'Utilisateur non associé à une agence' });
    }

    // Construire la requête dynamiquement selon les champs fournis
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (rental_conditions !== undefined) {
      updates.push('rental_conditions = ?');
      values.push(rental_conditions);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    values.push(req.user.agency_id);

    await db.query(
      `UPDATE agencies SET ${updates.join(', ')} WHERE id = ?`,
      values
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

// Obtenir des statistiques détaillées pour le dashboard
const getDetailedStats = async (req, res) => {
  try {
    if (!req.user.agency_id) {
      return res.status(400).json({ error: 'Utilisateur non associé à une agence' });
    }

    const agency_id = req.user.agency_id;
    const { period = 'all' } = req.query; // all, 12m, 6m, 3m, 1m

    // Calculer la date de début selon la période
    let dateFilter = '';
    let dateFilterWithAnd = '';
    switch(period) {
      case '12m':
        dateFilter = 'AND r.start_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)';
        dateFilterWithAnd = 'AND r.start_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)';
        break;
      case '6m':
        dateFilter = 'AND r.start_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)';
        dateFilterWithAnd = 'AND r.start_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)';
        break;
      case '3m':
        dateFilter = 'AND r.start_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
        dateFilterWithAnd = 'AND r.start_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
        break;
      case '1m':
        dateFilter = 'AND r.start_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        dateFilterWithAnd = 'AND r.start_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
        break;
      default:
        dateFilter = '';
        dateFilterWithAnd = '';
    }

    // 1. Revenus par mois (toutes les données ou filtrées)
    const [monthlyRevenue] = await db.query(
      `SELECT 
        DATE_FORMAT(r.start_date, '%Y-%m') as month,
        SUM(r.total_price) as revenue,
        COUNT(DISTINCT r.id) as bookings
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         ${dateFilter}
       GROUP BY DATE_FORMAT(r.start_date, '%Y-%m')
       ORDER BY month DESC`,
      [agency_id]
    );

    // 2. Performance par véhicule (toutes les réservations)
    const [vehiclePerformance] = await db.query(
      `SELECT 
        v.id,
        v.brand,
        v.model,
        COUNT(DISTINCT r.id) as total_bookings,
        SUM(CASE WHEN r.status IN ('completed', 'accepted') THEN r.total_price ELSE 0 END) as total_revenue,
        AVG(CASE WHEN r.status IN ('completed', 'accepted') THEN r.total_price ELSE NULL END) as avg_booking_value,
        AVG(rev.rating) as avg_rating,
        COUNT(DISTINCT rev.id) as review_count
       FROM vehicles v
       LEFT JOIN reservations r ON v.id = r.vehicle_id
       LEFT JOIN reviews rev ON v.id = rev.vehicle_id
       WHERE v.agency_id = ?
       GROUP BY v.id, v.brand, v.model
       ORDER BY total_revenue DESC`,
      [agency_id]
    );

    // 3. Statistiques des réservations par statut (détaillé)
    const [reservationBreakdown] = await db.query(
      `SELECT 
        r.status,
        COUNT(*) as count,
        SUM(r.total_price) as total_value
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
       GROUP BY r.status`,
      [agency_id]
    );

    // 4. Nombre de véhicules et note moyenne
    const [vehicleCount] = await db.query(
      `SELECT COUNT(*) as count FROM vehicles WHERE agency_id = ?`,
      [agency_id]
    );

    const [avgRating] = await db.query(
      `SELECT AVG(rating) as avg_rating
       FROM reviews rev
       JOIN vehicles v ON rev.vehicle_id = v.id
       WHERE v.agency_id = ?`,
      [agency_id]
    );

    // 5. Documents générés
    const [documentsStats] = await db.query(
      `SELECT 
        d.document_type,
        COUNT(*) as count
       FROM documents d
       JOIN reservations r ON d.reservation_id = r.id
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
       GROUP BY d.document_type`,
      [agency_id]
    );

    // 6. Taux d'occupation (pourcentage de jours réservés - 3 derniers mois)
    const [occupancyRate] = await db.query(
      `SELECT 
        COUNT(DISTINCT DATE(r.start_date)) as days_booked,
        DATEDIFF(MAX(r.end_date), MIN(r.start_date)) as total_days
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('accepted', 'completed')
         AND r.start_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)`,
      [agency_id]
    );

    // 7. Revenus ce mois vs mois dernier
    const [currentMonthRevenue] = await db.query(
      `SELECT COALESCE(SUM(r.total_price), 0) as revenue
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         AND MONTH(r.start_date) = MONTH(CURRENT_DATE())
         AND YEAR(r.start_date) = YEAR(CURRENT_DATE())`,
      [agency_id]
    );

    const [lastMonthRevenue] = await db.query(
      `SELECT COALESCE(SUM(r.total_price), 0) as revenue
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         AND MONTH(r.start_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
         AND YEAR(r.start_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`,
      [agency_id]
    );

    // 8. Top 5 clients (selon période)
    const [topClients] = await db.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(DISTINCT r.id) as booking_count,
        SUM(r.total_price) as total_spent
       FROM users u
       JOIN reservations r ON u.id = r.client_id
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? AND r.status IN ('completed', 'accepted')
         ${dateFilterWithAnd}
       GROUP BY u.id, u.first_name, u.last_name, u.email
       ORDER BY total_spent DESC
       LIMIT 5`,
      [agency_id]
    );

    // 9. Durée moyenne de location et valeur moyenne
    const [avgMetrics] = await db.query(
      `SELECT 
        AVG(DATEDIFF(r.end_date, r.start_date)) as avg_rental_days,
        AVG(r.total_price) as avg_booking_value,
        AVG(r.total_price / NULLIF(DATEDIFF(r.end_date, r.start_date), 0)) as avg_daily_rate
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         ${dateFilterWithAnd}`,
      [agency_id]
    );

    // 10. Taux de conversion (acceptées vs refusées)
    const [conversionRate] = await db.query(
      `SELECT 
        SUM(CASE WHEN r.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        COUNT(*) as total_requests
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
         ${dateFilterWithAnd}`,
      [agency_id]
    );

    // 11. Répartition par jour de semaine
    const [weekdayDistribution] = await db.query(
      `SELECT 
        DAYNAME(r.start_date) as day_name,
        DAYOFWEEK(r.start_date) as day_num,
        COUNT(*) as booking_count,
        SUM(r.total_price) as revenue
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         ${dateFilterWithAnd}
       GROUP BY day_name, day_num
       ORDER BY day_num`,
      [agency_id]
    );

    // 12. Réservations à venir (futures)
    const [upcomingReservations] = await db.query(
      `SELECT 
        r.id,
        r.start_date,
        r.end_date,
        r.total_price,
        r.status,
        v.brand,
        v.model,
        u.first_name,
        u.last_name,
        DATEDIFF(r.start_date, NOW()) as days_until_start
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN users u ON r.client_id = u.id
       WHERE v.agency_id = ? 
         AND r.start_date > NOW()
         AND r.status IN ('accepted', 'pending')
       ORDER BY r.start_date ASC
       LIMIT 10`,
      [agency_id]
    );

    // Calculer les variations
    const currentRevenue = currentMonthRevenue[0]?.revenue || 0;
    const lastRevenue = lastMonthRevenue[0]?.revenue || 0;
    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1) : 0;

    const occupancy = occupancyRate[0]?.total_days > 0 
      ? ((occupancyRate[0].days_booked / occupancyRate[0].total_days) * 100).toFixed(1)
      : 0;

    // Calculer taux de conversion
    const conversionData = conversionRate[0] || {};
    const acceptanceRate = conversionData.total_requests > 0
      ? ((conversionData.accepted_count / conversionData.total_requests) * 100).toFixed(1)
      : 0;

    res.json({
      monthlyRevenue,
      vehiclePerformance,
      reservationBreakdown,
      documentsStats,
      vehicleCount: vehicleCount[0]?.count || 0,
      avgRating: avgRating[0]?.avg_rating || 0,
      occupancyRate: parseFloat(occupancy),
      currentMonthRevenue: currentRevenue,
      lastMonthRevenue: lastRevenue,
      revenueChange: parseFloat(revenueChange),
      topClients,
      avgRentalDays: avgMetrics[0]?.avg_rental_days || 0,
      avgBookingValue: avgMetrics[0]?.avg_booking_value || 0,
      avgDailyRate: avgMetrics[0]?.avg_daily_rate || 0,
      acceptanceRate: parseFloat(acceptanceRate),
      conversionStats: conversionData,
      weekdayDistribution,
      upcomingReservations,
      appliedPeriod: period
    });

  } catch (error) {
    console.error('Erreur statistiques détaillées:', error);
    console.error('Message:', error.message);
    console.error('SQL:', error.sql);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

// Promouvoir un membre (membre -> admin) - réservé aux super_admin
const promoteMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Vérifier que l'utilisateur est super_admin
    if (requestingUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Seuls les super administrateurs peuvent promouvoir des membres' });
    }

    // Vérifier que l'utilisateur cible existe et appartient à la même agence
    const [targetUser] = await db.query(
      'SELECT id, role, agency_id, first_name, last_name FROM users WHERE id = ?',
      [userId]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (targetUser[0].agency_id !== requestingUser.agency_id) {
      return res.status(403).json({ error: 'Cet utilisateur n\'appartient pas à votre agence' });
    }

    // Vérifier que l'utilisateur n'est pas déjà admin ou super_admin
    if (targetUser[0].role === 'admin' || targetUser[0].role === 'super_admin') {
      return res.status(400).json({ error: 'Cet utilisateur est déjà administrateur' });
    }

    // Promouvoir le membre en admin
    await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      ['admin', userId]
    );

    res.json({ 
      message: 'Membre promu avec succès',
      user: {
        id: targetUser[0].id,
        first_name: targetUser[0].first_name,
        last_name: targetUser[0].last_name,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Erreur promotion membre:', error);
    res.status(500).json({ error: 'Erreur lors de la promotion du membre' });
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
  getPendingInvitations,
  getDetailedStats,
  promoteMember
};
