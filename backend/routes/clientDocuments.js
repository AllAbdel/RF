const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  uploadMiddleware,
  uploadDocuments,
  getUserDocuments,
  getPendingDocuments,
  validateDocument,
  downloadDocument
} = require('../controllers/clientDocumentController');

// Upload de documents (client)
router.post('/upload', 
  authMiddleware, 
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  uploadDocuments
);

// Lister mes documents (client)
router.get('/my-documents', 
  authMiddleware, 
  getUserDocuments
);

// Lister documents en attente (agence)
router.get('/pending', 
  authMiddleware, 
  getPendingDocuments
);

// Valider un document (agence)
router.put('/:documentId/validate', 
  authMiddleware, 
  validateDocument
);

// Télécharger un document
router.get('/:documentId/download', 
  authMiddleware, 
  downloadDocument
);

module.exports = router;
