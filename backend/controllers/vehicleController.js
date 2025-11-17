const db = require('../config/database');

const getAllVehicles = async (req, res) => {
  try {
    const { search, fuel_type, min_price, max_price, location, sort } = req.query;
    
    let query = `
      SELECT v.*, a.name as agency_name,
             (SELECT image_url FROM vehicle_images WHERE vehicle_id = v.id AND is_primary = 1 LIMIT 1) as primary_image,
             (SELECT AVG(rating) FROM reviews WHERE vehicle_id = v.id) as avg_rating,
             (SELECT COUNT(*) FROM reviews WHERE vehicle_id = v.id) as review_count,
             (SELECT end_date FROM reservations WHERE vehicle_id = v.id AND status IN ('accepted') AND end_date > NOW() ORDER BY end_date ASC LIMIT 1) as current_reservation_end
      FROM vehicles v
      JOIN agencies a ON v.agency_id = a.id
    `;
    
    const params = [];

    // Filtrer uniquement les véhicules disponibles
    query += ` WHERE v.status = 'available'`;

    if (search) {
      query += ` AND (v.brand LIKE ? OR v.model LIKE ? OR a.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (fuel_type) {
      query += ` AND v.fuel_type = ?`;
      params.push(fuel_type);
    }

    if (min_price) {
      query += ` AND v.price_per_hour >= ?`;
      params.push(min_price);
    }

    if (max_price) {
      query += ` AND v.price_per_hour <= ?`;
      params.push(max_price);
    }

    if (location) {
      query += ` AND v.location LIKE ?`;
      params.push(`%${location}%`);
    }

    if (sort === 'price_asc') {
      query += ` ORDER BY v.price_per_hour ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY v.price_per_hour DESC`;
    } else if (sort === 'rating') {
      query += ` ORDER BY avg_rating DESC`;
    } else {
      query += ` ORDER BY v.created_at DESC`;
    }

    const [vehicles] = await db.query(query, params);
    res.json({ vehicles });
  } catch (error) {
    console.error('Erreur récupération véhicules:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des véhicules' });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicles] = await db.query(
      `SELECT v.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email,
              (SELECT AVG(rating) FROM reviews WHERE vehicle_id = v.id) as avg_rating,
              (SELECT COUNT(*) FROM reviews WHERE vehicle_id = v.id) as review_count
       FROM vehicles v
       JOIN agencies a ON v.agency_id = a.id
       WHERE v.id = ?`,
      [id]
    );

    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    const [images] = await db.query(
      'SELECT * FROM vehicle_images WHERE vehicle_id = ? ORDER BY is_primary DESC',
      [id]
    );

    const [reviews] = await db.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       WHERE r.vehicle_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({
      vehicle: vehicles[0],
      images,
      reviews
    });
  } catch (error) {
    console.error('Erreur récupération véhicule:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du véhicule' });
  }
};

const createVehicle = async (req, res) => {
  try {
    const {
      brand, model, seats, engine, tank_capacity, price_per_hour,
      fuel_type, description, release_date, location
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO vehicles (agency_id, brand, model, seats, engine, tank_capacity, 
       price_per_hour, fuel_type, description, release_date, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.agency_id, brand, model, seats, engine, tank_capacity, 
       price_per_hour, fuel_type, description, release_date, location]
    );

    // Gérer les images si elles sont uploadées
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await db.query(
          'INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES (?, ?, ?)',
          [result.insertId, `/uploads/vehicles/${req.files[i].filename}`, i === 0]
        );
      }
    }

    res.status(201).json({
      message: 'Véhicule créé avec succès',
      vehicle_id: result.insertId
    });
  } catch (error) {
    console.error('Erreur création véhicule:', error);
    res.status(500).json({ error: 'Erreur lors de la création du véhicule' });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand, model, seats, engine, tank_capacity, price_per_hour,
      fuel_type, description, release_date, location, status
    } = req.body;

    // Vérifier que le véhicule appartient à l'agence
    const [vehicles] = await db.query(
      'SELECT * FROM vehicles WHERE id = ? AND agency_id = ?',
      [id, req.user.agency_id]
    );

    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé ou accès refusé' });
    }

    await db.query(
      `UPDATE vehicles SET brand = ?, model = ?, seats = ?, engine = ?, 
       tank_capacity = ?, price_per_hour = ?, fuel_type = ?, description = ?, 
       release_date = ?, location = ?, status = ?
       WHERE id = ?`,
      [brand, model, seats, engine, tank_capacity, price_per_hour, 
       fuel_type, description, release_date, location, status, id]
    );

    res.json({ message: 'Véhicule mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour véhicule:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du véhicule' });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le véhicule appartient à l'agence
    const [vehicles] = await db.query(
      'SELECT * FROM vehicles WHERE id = ? AND agency_id = ?',
      [id, req.user.agency_id]
    );

    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé ou accès refusé' });
    }

    await db.query('DELETE FROM vehicles WHERE id = ?', [id]);

    res.json({ message: 'Véhicule supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression véhicule:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du véhicule' });
  }
};

const getAgencyVehicles = async (req, res) => {
  try {
    const [vehicles] = await db.query(
      `SELECT v.*,
              (SELECT image_url FROM vehicle_images WHERE vehicle_id = v.id AND is_primary = 1 LIMIT 1) as primary_image,
              (SELECT COUNT(*) FROM reservations WHERE vehicle_id = v.id AND status IN ('pending', 'accepted')) as active_reservations
       FROM vehicles v
       WHERE v.agency_id = ?
       ORDER BY v.created_at DESC`,
      [req.user.agency_id]
    );

    res.json({ vehicles });
  } catch (error) {
    console.error('Erreur récupération véhicules agence:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des véhicules' });
  }
};

const checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const [conflicts] = await db.query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE vehicle_id = ? 
       AND status IN ('pending', 'accepted')
       AND (
         (start_date <= ? AND end_date >= ?) OR
         (start_date <= ? AND end_date >= ?) OR
         (start_date >= ? AND end_date <= ?)
       )`,
      [id, start_date, start_date, end_date, end_date, start_date, end_date]
    );

    res.json({ 
      available: conflicts[0].count === 0,
      conflicts: conflicts[0].count
    });
  } catch (error) {
    console.error('Erreur vérification disponibilité:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de disponibilité' });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAgencyVehicles,
  checkAvailability
};
