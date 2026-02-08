const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
  toggleFavorite
} = require('../controllers/favoritesController');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/favorites - Récupérer tous les favoris
router.get('/', getFavorites);

// POST /api/favorites - Ajouter un favori
router.post('/', addFavorite);

// GET /api/favorites/check/:vehicle_id - Vérifier si un véhicule est en favori
router.get('/check/:vehicle_id', checkFavorite);

// POST /api/favorites/toggle/:vehicle_id - Toggle favori
router.post('/toggle/:vehicle_id', toggleFavorite);

// DELETE /api/favorites/:vehicle_id - Supprimer un favori
router.delete('/:vehicle_id', removeFavorite);

module.exports = router;
