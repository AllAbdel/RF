const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authMiddleware } = require('../middleware/auth');
const path = require('path');

// Générer une facture (agence uniquement)
router.post('/generate-invoice/:reservation_id', authMiddleware, documentController.createInvoice);

// Générer un reçu (agence uniquement)
router.post('/generate-receipt/:reservation_id', authMiddleware, documentController.createReceipt);

// Générer un contrat (agence uniquement)
router.post('/generate-contract/:reservation_id', authMiddleware, documentController.createContract);

// Signer un contrat (client uniquement)
router.post('/sign-contract/:document_id', authMiddleware, documentController.signContract);

// Obtenir les documents d'une réservation
router.get('/reservation/:reservation_id', authMiddleware, documentController.getDocuments);

// Télécharger un document
router.get('/download/:document_id', authMiddleware, async (req, res) => {
  try {
    const db = require('../config/database');
    const { document_id } = req.params;

    // Vérifier l'accès
    let query, params;
    if (req.user.user_type === 'client') {
      query = `SELECT d.file_path FROM documents d
               JOIN reservations r ON d.reservation_id = r.id
               WHERE d.id = ? AND r.client_id = ?`;
      params = [document_id, req.user.id];
    } else {
      query = `SELECT d.file_path FROM documents d
               JOIN reservations r ON d.reservation_id = r.id
               JOIN vehicles v ON r.vehicle_id = v.id
               WHERE d.id = ? AND v.agency_id = ?`;
      params = [document_id, req.user.agency_id];
    }

    const [documents] = await db.query(query, params);

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    const filePath = path.join(__dirname, '..', documents[0].file_path);
    res.download(filePath);
  } catch (error) {
    console.error('Erreur téléchargement document:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
});

module.exports = router;
