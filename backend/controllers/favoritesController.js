const db = require('../config/database');

/**
 * Ajouter un véhicule aux favoris
 */
const addFavorite = async (req, res) => {
  try {
    const { vehicle_id } = req.body;
    const user_id = req.user.id;

    // Vérifier que le véhicule existe
    const [vehicle] = await db.query('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]);
    if (vehicle.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // Ajouter aux favoris (ignore si déjà existant)
    await db.query(
      'INSERT IGNORE INTO favorites (user_id, vehicle_id) VALUES (?, ?)',
      [user_id, vehicle_id]
    );

    res.json({ message: 'Véhicule ajouté aux favoris' });
  } catch (error) {
    console.error('Erreur ajout favori:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout aux favoris' });
  }
};

/**
 * Supprimer un véhicule des favoris
 */
const removeFavorite = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const user_id = req.user.id;

    await db.query(
      'DELETE FROM favorites WHERE user_id = ? AND vehicle_id = ?',
      [user_id, vehicle_id]
    );

    res.json({ message: 'Véhicule retiré des favoris' });
  } catch (error) {
    console.error('Erreur suppression favori:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du favori' });
  }
};

/**
 * Récupérer tous les favoris d'un utilisateur
 */
const getFavorites = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [favorites] = await db.query(
      `SELECT v.*, a.name as agency_name,
              (SELECT image_url FROM vehicle_images WHERE vehicle_id = v.id AND is_primary = 1 LIMIT 1) as primary_image,
              COALESCE((SELECT AVG(rating) FROM reviews WHERE vehicle_id = v.id), 0) as avg_rating,
              (SELECT COUNT(*) FROM reviews WHERE vehicle_id = v.id) as review_count,
              f.created_at as favorited_at
       FROM favorites f
       JOIN vehicles v ON f.vehicle_id = v.id
       JOIN agencies a ON v.agency_id = a.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [user_id]
    );

    res.json({ favorites });
  } catch (error) {
    console.error('Erreur récupération favoris:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des favoris' });
  }
};

/**
 * Vérifier si un véhicule est en favori
 */
const checkFavorite = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const user_id = req.user.id;

    const [result] = await db.query(
      'SELECT id FROM favorites WHERE user_id = ? AND vehicle_id = ?',
      [user_id, vehicle_id]
    );

    res.json({ isFavorite: result.length > 0 });
  } catch (error) {
    console.error('Erreur vérification favori:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
};

/**
 * Toggle favori (ajouter ou supprimer)
 */
const toggleFavorite = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const user_id = req.user.id;

    // Vérifier si déjà en favori
    const [existing] = await db.query(
      'SELECT id FROM favorites WHERE user_id = ? AND vehicle_id = ?',
      [user_id, vehicle_id]
    );

    if (existing.length > 0) {
      // Supprimer
      await db.query('DELETE FROM favorites WHERE user_id = ? AND vehicle_id = ?', [user_id, vehicle_id]);
      res.json({ isFavorite: false, message: 'Retiré des favoris' });
    } else {
      // Ajouter
      await db.query('INSERT INTO favorites (user_id, vehicle_id) VALUES (?, ?)', [user_id, vehicle_id]);
      res.json({ isFavorite: true, message: 'Ajouté aux favoris' });
    }
  } catch (error) {
    console.error('Erreur toggle favori:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du favori' });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
  toggleFavorite
};
