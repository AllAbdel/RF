const db = require('../config/database');

// Fonctions helper pour nettoyer les valeurs
const cleanValue = (val) => {
  if (val === undefined || val === null || val === 'undefined' || val === 'null' || val === '') {
    return null;
  }
  return val;
};

const cleanNumeric = (val) => {
  const cleaned = cleanValue(val);
  if (cleaned === null) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const getAllVehicles = async (req, res) => {
  try {
    const { search, fuel_type, min_price, max_price, location, sort } = req.query;
    
    let query = `
      SELECT v.*, a.name as agency_name,
             (SELECT image_url FROM vehicle_images WHERE vehicle_id = v.id AND is_primary = 1 LIMIT 1) as primary_image,
             COALESCE((SELECT AVG(rating) FROM reviews WHERE vehicle_id = v.id), 0) as avg_rating,
             (SELECT COUNT(*) FROM reviews WHERE vehicle_id = v.id) as review_count,
             (SELECT COUNT(*) FROM reservations WHERE vehicle_id = v.id AND status IN ('accepted', 'completed')) as reservation_count,
             (SELECT end_date FROM reservations WHERE vehicle_id = v.id AND status IN ('accepted', 'pending') AND end_date > NOW() ORDER BY end_date ASC LIMIT 1) as current_reservation_end,
             (SELECT start_date FROM reservations WHERE vehicle_id = v.id AND status IN ('accepted', 'pending') AND end_date > NOW() ORDER BY end_date ASC LIMIT 1) as current_reservation_start
      FROM vehicles v
      JOIN agencies a ON v.agency_id = a.id
    `;
    
    const params = [];

    // Afficher tous les véhicules (disponibles, loués et réservés)
    query += ` WHERE v.status IN ('available', 'rented', 'reserved')`;

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
              a.rental_conditions, a.rental_conditions_pdf,
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

    // Récupérer les réservations actives pour bloquer les dates
    const [reservations] = await db.query(
      `SELECT start_date, end_date 
       FROM reservations 
       WHERE vehicle_id = ? 
       AND status IN ('pending', 'accepted') 
       AND end_date >= NOW()
       ORDER BY start_date ASC`,
      [id]
    );

    res.json({
      vehicle: vehicles[0],
      images,
      reviews,
      reservations
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
      fuel_type, description, release_date, location, pickup_address, return_address,
      latitude, longitude
    } = req.body;

    // Récupérer le fichier PDF s'il existe
    let termsPdfPath = null;
    if (req.files && req.files.terms_pdf && req.files.terms_pdf.length > 0) {
      termsPdfPath = `/uploads/vehicles/terms/${req.files.terms_pdf[0].filename}`;
    }

    const [result] = await db.query(
      `INSERT INTO vehicles (agency_id, brand, model, seats, engine, tank_capacity, 
       price_per_hour, fuel_type, description, terms_pdf, release_date, location, pickup_address, return_address, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.agency_id, brand, model, cleanNumeric(seats), cleanValue(engine), cleanNumeric(tank_capacity), 
       price_per_hour, fuel_type, cleanValue(description), termsPdfPath, cleanValue(release_date), cleanValue(location), cleanValue(pickup_address), cleanValue(return_address), 
       cleanNumeric(latitude), 
       cleanNumeric(longitude)]
    );

    // Gérer les images si elles sont uploadées
    if (req.files && req.files.images && req.files.images.length > 0) {
      for (let i = 0; i < req.files.images.length; i++) {
        await db.query(
          'INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES (?, ?, ?)',
          [result.insertId, `/uploads/vehicles/${req.files.images[i].filename}`, i === 0]
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
      fuel_type, description, release_date, location, pickup_address, return_address, status,
      latitude, longitude,
      imagesToDelete
    } = req.body;

    console.log('🔄 Update vehicle:', id);
    console.log('📝 Body:', JSON.stringify(req.body, null, 2));
    console.log('📁 Files:', req.files);
    console.log('👤 User:', req.user);

    if (!req.user || !req.user.agency_id) {
      console.error('❌ User ou agency_id manquant');
      return res.status(401).json({ error: 'Non authentifié ou agence non trouvée' });
    }

    // Vérifier que le véhicule appartient à l'agence
    const [vehicles] = await db.query(
      'SELECT * FROM vehicles WHERE id = ? AND agency_id = ?',
      [id, req.user.agency_id]
    );

    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé ou accès refusé' });
    }

    // Supprimer les images demandées
    if (imagesToDelete) {
      try {
        const imageIds = JSON.parse(imagesToDelete);
        console.log('🗑️ Images à supprimer:', imageIds);
        
        if (Array.isArray(imageIds) && imageIds.length > 0) {
          // Récupérer les chemins des images avant suppression (pour supprimer les fichiers physiques)
          const [imagesToRemove] = await db.query(
            'SELECT image_url FROM vehicle_images WHERE id IN (?) AND vehicle_id = ?',
            [imageIds, id]
          );
          
          // Supprimer de la base de données
          await db.query('DELETE FROM vehicle_images WHERE id IN (?) AND vehicle_id = ?', [imageIds, id]);
          
          // Supprimer les fichiers physiques
          const fs = require('fs');
          const path = require('path');
          imagesToRemove.forEach(img => {
            const filePath = path.join(__dirname, '..', img.image_url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log('✅ Fichier supprimé:', filePath);
            }
          });
        }
      } catch (parseError) {
        console.error('⚠️ Erreur parsing imagesToDelete:', parseError);
      }
    }

    // Ajouter les nouvelles images
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageFiles = req.files.images;
      console.log('➕ Nouvelles images:', imageFiles.length);
      
      // Vérifier s'il existe déjà une image primaire pour ce véhicule
      const [existingPrimary] = await db.query(
        'SELECT id FROM vehicle_images WHERE vehicle_id = ? AND is_primary = 1',
        [id]
      );
      const hasPrimary = existingPrimary.length > 0;
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        // La première image devient primaire s'il n'y en a pas déjà une
        const isPrimary = (!hasPrimary && i === 0) ? 1 : 0;
        await db.query(
          'INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES (?, ?, ?)',
          [id, `/uploads/vehicles/${file.filename}`, isPrimary]
        );
      }
    }

    // Récupérer le nouveau fichier PDF s'il existe
    let termsPdfPath = vehicles[0].terms_pdf; // Conserver l'ancien si pas de nouveau
    if (req.files && req.files.terms_pdf && req.files.terms_pdf.length > 0) {
      const termsPdfFile = req.files.terms_pdf[0];
      termsPdfPath = `/uploads/vehicles/terms/${termsPdfFile.filename}`;
      // TODO: Supprimer l'ancien PDF si nécessaire
    }

    await db.query(
      `UPDATE vehicles SET brand = ?, model = ?, seats = ?, engine = ?, 
       tank_capacity = ?, price_per_hour = ?, fuel_type = ?, description = ?, terms_pdf = ?,
       release_date = ?, location = ?, pickup_address = ?, return_address = ?, status = ?,
       latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        brand, 
        model, 
        cleanNumeric(seats), 
        cleanValue(engine), 
        cleanNumeric(tank_capacity), 
        price_per_hour, 
        fuel_type, 
        cleanValue(description), 
        termsPdfPath, 
        cleanValue(release_date), 
        cleanValue(location), 
        cleanValue(pickup_address), 
        cleanValue(return_address), 
        status || 'available',
        cleanNumeric(latitude),
        cleanNumeric(longitude),
        id
      ]
    );

    console.log('✅ Véhicule mis à jour avec succès');
    res.json({ message: 'Véhicule mis à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur mise à jour véhicule:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Message:', error.message);
    console.error('❌ SQL:', error.sql);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du véhicule', details: error.message });
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

    // Récupérer toutes les images pour chaque véhicule
    for (let vehicle of vehicles) {
      const [images] = await db.query(
        'SELECT id, image_url, is_primary FROM vehicle_images WHERE vehicle_id = ? ORDER BY is_primary DESC, id ASC',
        [vehicle.id]
      );
      vehicle.images = images;
    }

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

// Récupérer les localisations distinctes des véhicules
const getVehicleLocations = async (req, res) => {
  try {
    const [locations] = await db.query(
      `SELECT DISTINCT location FROM vehicles 
       WHERE location IS NOT NULL AND location != '' 
       AND status IN ('available', 'rented', 'reserved')
       ORDER BY location ASC`
    );
    
    // Extraire uniquement les noms de villes (avant la virgule si format "Ville, Pays")
    const cities = locations
      .map(l => {
        const loc = l.location.trim();
        // Si format "Ville, France" ou "Ville, Pays", garder juste la ville
        const commaIndex = loc.indexOf(',');
        return commaIndex > 0 ? loc.substring(0, commaIndex).trim() : loc;
      })
      .filter((city, index, self) => city && self.indexOf(city) === index); // Déduplique
    
    res.json({ locations: cities });
  } catch (error) {
    console.error('Erreur récupération localisations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des localisations' });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAgencyVehicles,
  checkAvailability,
  getVehicleLocations
};
