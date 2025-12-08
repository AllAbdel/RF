const db = require('../config/database');
const documentValidationService = require('../services/documentValidationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration multer pour l'upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'documents', req.user.id.toString());
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou PDF.'));
    }
  }
}).fields([
  { name: 'id_card', maxCount: 1 },
  { name: 'driving_license', maxCount: 1 }
]);

// Upload et analyse de documents
const uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reservation_id } = req.body;
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'Aucun document fourni' });
    }
    
    const documents = [];
    const analysisResults = {};
    
    // Analyser chaque document
    for (const [docType, files] of Object.entries(req.files)) {
      const file = files[0];
      const filePath = file.path;
      
      console.log(`📄 Analyse de ${docType}...`);
      
      // 1. Analyse technique
      const technicalAnalysis = await documentValidationService.analyzeTechnicalQuality(filePath);
      console.log(`✅ Score technique: ${technicalAnalysis.score}/100`);
      
      // 2. Détection d'édition
      const isEdited = await documentValidationService.detectEditing(filePath);
      
      // 3. Hash pour duplicatas
      const imageHash = await documentValidationService.getImageHash(filePath);
      
      // 4. Vérifier duplicata
      const [existingDocs] = await db.query(
        'SELECT id FROM client_documents WHERE image_metadata->>"$.hash" = ?',
        [imageHash]
      );
      const isDuplicate = existingDocs.length > 0;
      
      // 5. OCR - Extraction de texte
      console.log(`🔍 Extraction OCR de ${docType}...`);
      const ocrResult = await documentValidationService.extractText(filePath);
      
      // 6. Validation du format selon le type
      let formatValidation;
      if (docType === 'driving_license') {
        formatValidation = documentValidationService.validateDrivingLicense(ocrResult.text);
      } else if (docType === 'id_card') {
        formatValidation = documentValidationService.validateIdCard(ocrResult.text);
      }
      
      console.log(`✅ Score format: ${formatValidation.total}/100`);
      
      // Préparer les métadonnées
      const metadata = {
        hash: imageHash,
        ...technicalAnalysis.details,
        ocrConfidence: ocrResult.confidence
      };
      
      // Insérer dans la BDD
      const [result] = await db.query(
        `INSERT INTO client_documents 
        (user_id, reservation_id, document_type, file_path, original_filename, 
         file_size, mime_type, extracted_data, image_metadata, technical_score, 
         format_score, is_screenshot, is_edited, is_duplicate, validation_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          reservation_id || null,
          docType,
          filePath,
          file.originalname,
          file.size,
          file.mimetype,
          JSON.stringify(formatValidation.data),
          JSON.stringify(metadata),
          technicalAnalysis.score,
          formatValidation.total,
          technicalAnalysis.details.isScreenshot || false,
          isEdited,
          isDuplicate,
          'pending'
        ]
      );
      
      documents.push({
        id: result.insertId,
        type: docType,
        technicalScore: technicalAnalysis.score,
        formatScore: formatValidation.total,
        flags: {
          isScreenshot: technicalAnalysis.details.isScreenshot,
          isEdited,
          isDuplicate
        }
      });
      
      analysisResults[docType] = formatValidation.data;
    }
    
    // 7. Vérifier la cohérence si on a les deux documents
    let coherenceScore = 0;
    if (analysisResults.id_card && analysisResults.driving_license) {
      const coherence = documentValidationService.checkCoherence(
        analysisResults.id_card,
        analysisResults.driving_license
      );
      coherenceScore = coherence.score;
      
      // Mettre à jour le score de cohérence
      for (const doc of documents) {
        await db.query(
          'UPDATE client_documents SET coherence_score = ? WHERE id = ?',
          [coherenceScore, doc.id]
        );
        doc.coherenceScore = coherenceScore;
      }
    }
    
    // 8. Calculer le score global
    for (const doc of documents) {
      const overallScore = documentValidationService.calculateOverallScore(
        doc.technicalScore,
        doc.formatScore,
        doc.coherenceScore || 0
      );
      
      // Déterminer le statut automatiquement
      let status = 'pending';
      if (overallScore < 50) {
        status = 'rejected';
      } else if (overallScore > 80 && !doc.flags.isScreenshot && !doc.flags.isEdited && !doc.flags.isDuplicate) {
        status = 'approved';
      } else {
        status = 'manual_review';
      }
      
      await db.query(
        'UPDATE client_documents SET overall_score = ?, validation_status = ? WHERE id = ?',
        [overallScore, status, doc.id]
      );
      
      doc.overallScore = overallScore;
      doc.status = status;
    }
    
    res.json({
      message: 'Documents analysés avec succès',
      documents,
      recommendation: documents.some(d => d.status === 'manual_review') 
        ? 'Validation manuelle requise' 
        : documents.every(d => d.status === 'approved')
        ? 'Documents acceptés automatiquement'
        : 'Documents rejetés'
    });
    
  } catch (error) {
    console.error('Erreur upload documents:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse des documents' });
  }
};

// Lister les documents d'un utilisateur
const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [documents] = await db.query(
      `SELECT id, document_type, original_filename, file_size, 
              technical_score, format_score, coherence_score, overall_score,
              validation_status, is_screenshot, is_edited, is_duplicate,
              extracted_data, validation_notes, created_at
       FROM client_documents
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({ documents });
    
  } catch (error) {
    console.error('Erreur récupération documents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
};

// Lister les documents en attente de validation (pour les agences)
const getPendingDocuments = async (req, res) => {
  try {
    if (!req.user.agency_id) {
      return res.status(403).json({ error: 'Réservé aux membres d\'agence' });
    }
    
    const [documents] = await db.query(
      `SELECT d.*, u.first_name, u.last_name, u.email, r.id as reservation_id,
              v.brand, v.model
       FROM client_documents d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN reservations r ON d.reservation_id = r.id
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE d.validation_status IN ('pending', 'manual_review')
       AND (r.id IS NULL OR v.agency_id = ?)
       ORDER BY d.overall_score ASC, d.created_at ASC`,
      [req.user.agency_id]
    );
    
    res.json({ documents });
    
  } catch (error) {
    console.error('Erreur récupération documents en attente:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
};

// Valider/Rejeter un document
const validateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { action, notes } = req.body; // action: 'approved' | 'rejected'
    
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }
    
    // Mettre à jour le document
    await db.query(
      `UPDATE client_documents 
       SET validation_status = ?, validation_notes = ?, 
           validated_by = ?, validated_at = NOW()
       WHERE id = ?`,
      [action, notes || null, req.user.id, documentId]
    );
    
    // Enregistrer dans l'historique
    await db.query(
      `INSERT INTO document_validation_history 
       (document_id, validator_id, action, notes) 
       VALUES (?, ?, ?, ?)`,
      [documentId, req.user.id, action, notes || null]
    );
    
    res.json({ message: `Document ${action === 'approved' ? 'approuvé' : 'rejeté'} avec succès` });
    
  } catch (error) {
    console.error('Erreur validation document:', error);
    res.status(500).json({ error: 'Erreur lors de la validation' });
  }
};

// Télécharger un document
const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const [documents] = await db.query(
      'SELECT file_path, original_filename, mime_type, user_id FROM client_documents WHERE id = ?',
      [documentId]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    const doc = documents[0];
    
    // Vérifier les permissions
    if (doc.user_id !== req.user.id && !req.user.agency_id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    res.download(doc.file_path, doc.original_filename);
    
  } catch (error) {
    console.error('Erreur téléchargement document:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement' });
  }
};

module.exports = {
  uploadMiddleware,
  uploadDocuments,
  getUserDocuments,
  getPendingDocuments,
  validateDocument,
  downloadDocument
};
