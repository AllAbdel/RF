const db = require('../config/database');
const logger = require('../utils/logger');

// Récupérer toutes les demandes de création d'agence
const getAgencyRequests = async (req, res) => {
  try {
    const { status } = req.query; // 'pending', 'approved', 'rejected', ou vide pour tout
    
    let query = `
      SELECT acr.*, 
             u.first_name, u.last_name, u.email as user_email, u.phone as user_phone,
             rv.first_name as reviewer_first_name, rv.last_name as reviewer_last_name
      FROM agency_creation_requests acr
      JOIN users u ON acr.user_id = u.id
      LEFT JOIN users rv ON acr.reviewed_by = rv.id
    `;
    const params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query += ' WHERE acr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY acr.created_at DESC';

    const [requests] = await db.query(query, params);
    res.json({ requests });
  } catch (error) {
    logger.error('Erreur récupération demandes agence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
};

// Approuver une demande de création d'agence
const approveAgencyRequest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { request_id } = req.params;
    const { admin_notes } = req.body;

    // Récupérer la demande
    const [requests] = await connection.query(
      'SELECT * FROM agency_creation_requests WHERE id = ? AND status = ?',
      [request_id, 'pending']
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Demande non trouvée ou déjà traitée' });
    }

    const request = requests[0];

    // Créer l'agence
    const [agencyResult] = await connection.query(
      'INSERT INTO agencies (name, email, phone, address, description, logo) VALUES (?, ?, ?, ?, ?, ?)',
      [
        request.agency_name,
        request.agency_email,
        request.agency_phone,
        request.agency_address,
        request.agency_description,
        request.logo_path
      ]
    );

    const agencyId = agencyResult.insertId;

    // Convertir l'utilisateur en agency_member + super_admin
    await connection.query(
      'UPDATE users SET user_type = ?, agency_id = ?, role = ? WHERE id = ?',
      ['agency_member', agencyId, 'super_admin', request.user_id]
    );

    // Mettre à jour la demande
    await connection.query(
      'UPDATE agency_creation_requests SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['approved', admin_notes || null, req.user.id, request_id]
    );

    // Créer une notification pour l'utilisateur
    try {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id)
         VALUES (?, 'agency_approved', 'Agence approuvée', 'Votre demande de création d\\'agence "${request.agency_name}" a été approuvée ! Vous pouvez maintenant gérer votre agence.', ?)`,
        [request.user_id, agencyId]
      );
    } catch (notifError) {
      logger.warn('Erreur notification approbation:', notifError.message);
    }

    await connection.commit();

    logger.info('Agence approuvée', { requestId: request_id, agencyId, userId: request.user_id });
    res.json({ 
      message: 'Agence approuvée avec succès',
      agency_id: agencyId
    });
  } catch (error) {
    await connection.rollback();
    logger.error('Erreur approbation agence:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  } finally {
    connection.release();
  }
};

// Rejeter une demande de création d'agence
const rejectAgencyRequest = async (req, res) => {
  try {
    const { request_id } = req.params;
    const { admin_notes } = req.body;

    if (!admin_notes) {
      return res.status(400).json({ error: 'Veuillez fournir une raison du refus' });
    }

    const [requests] = await db.query(
      'SELECT * FROM agency_creation_requests WHERE id = ? AND status = ?',
      [request_id, 'pending']
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée ou déjà traitée' });
    }

    const request = requests[0];

    // Mettre à jour la demande
    await db.query(
      'UPDATE agency_creation_requests SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['rejected', admin_notes, req.user.id, request_id]
    );

    // Créer une notification pour l'utilisateur
    try {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'agency_rejected', 'Demande refusée', ?)`,
        [request.user_id, `Votre demande de création d'agence "${request.agency_name}" a été refusée. Raison: ${admin_notes}`]
      );
    } catch (notifError) {
      logger.warn('Erreur notification refus:', notifError.message);
    }

    logger.info('Agence refusée', { requestId: request_id, userId: request.user_id });
    res.json({ message: 'Demande refusée' });
  } catch (error) {
    logger.error('Erreur refus agence:', error.message);
    res.status(500).json({ error: 'Erreur lors du refus' });
  }
};

// Statistiques admin du site
const getSiteStats = async (req, res) => {
  try {
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users WHERE user_type != ?', ['site_admin']);
    const [totalClients] = await db.query('SELECT COUNT(*) as count FROM users WHERE user_type = ?', ['client']);
    const [totalAgencyMembers] = await db.query('SELECT COUNT(*) as count FROM users WHERE user_type = ?', ['agency_member']);
    const [totalAgencies] = await db.query('SELECT COUNT(*) as count FROM agencies');
    const [pendingRequests] = await db.query('SELECT COUNT(*) as count FROM agency_creation_requests WHERE status = ?', ['pending']);
    const [totalVehicles] = await db.query('SELECT COUNT(*) as count FROM vehicles');
    const [totalReservations] = await db.query('SELECT COUNT(*) as count FROM reservations');

    res.json({
      stats: {
        totalUsers: totalUsers[0].count,
        totalClients: totalClients[0].count,
        totalAgencyMembers: totalAgencyMembers[0].count,
        totalAgencies: totalAgencies[0].count,
        pendingRequests: pendingRequests[0].count,
        totalVehicles: totalVehicles[0].count,
        totalReservations: totalReservations[0].count
      }
    });
  } catch (error) {
    logger.error('Erreur stats admin:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

// Récupérer le statut de la demande d'agence pour un utilisateur
const getMyAgencyRequest = async (req, res) => {
  try {
    const [requests] = await db.query(
      'SELECT * FROM agency_creation_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (requests.length === 0) {
      return res.json({ request: null });
    }

    res.json({ request: requests[0] });
  } catch (error) {
    logger.error('Erreur récupération demande agence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération de la demande' });
  }
};

// Soumettre une demande de création d'agence
const submitAgencyRequest = async (req, res) => {
  try {
    const { agency_name, agency_email, agency_phone, agency_address, agency_description } = req.body;
    const user_id = req.user.id;

    // Vérifier que l'utilisateur est un client
    const [user] = await db.query('SELECT user_type, agency_id FROM users WHERE id = ?', [user_id]);
    if (user[0].user_type === 'agency_member' && user[0].agency_id) {
      return res.status(400).json({ error: 'Vous appartenez déjà à une agence' });
    }

    // Vérifier qu'il n'y a pas de demande en attente
    const [pending] = await db.query(
      'SELECT id FROM agency_creation_requests WHERE user_id = ? AND status = ?',
      [user_id, 'pending']
    );
    if (pending.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà une demande en attente' });
    }

    // Vérifier que le nom d'agence n'existe pas déjà
    const [existingAgency] = await db.query('SELECT id FROM agencies WHERE name = ?', [agency_name]);
    if (existingAgency.length > 0) {
      return res.status(400).json({ error: 'Ce nom d\'agence est déjà utilisé' });
    }

    const logoPath = req.file ? `/uploads/agencies/${req.file.filename}` : null;

    await db.query(
      `INSERT INTO agency_creation_requests (user_id, agency_name, agency_email, agency_phone, agency_address, agency_description, logo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, agency_name, agency_email || req.user.email, agency_phone, agency_address, agency_description, logoPath]
    );

    logger.info('Demande création agence soumise', { userId: user_id, agencyName: agency_name });
    res.status(201).json({ message: 'Votre demande a été soumise et sera examinée par un administrateur.' });
  } catch (error) {
    logger.error('Erreur soumission demande agence:', error.message);
    res.status(500).json({ error: 'Erreur lors de la soumission de la demande' });
  }
};

module.exports = {
  getAgencyRequests,
  approveAgencyRequest,
  rejectAgencyRequest,
  getSiteStats,
  getMyAgencyRequest,
  submitAgencyRequest
};
