const path = require('path');
const fs = require('fs').promises;

/**
 * 🆕 VALIDATION MIME TYPE STRICTE
 * Vérifie les "magic bytes" du fichier (signature réelle) 
 * pour éviter le spoofing d'extension
 */
const validateFileMimeType = async (filePath, expectedMimeTypes) => {
  const fileType = await import('file-type');
  
  try {
    const buffer = await fs.readFile(filePath);
    const type = await fileType.fileTypeFromBuffer(buffer);
    
    if (!type) {
      return {
        valid: false,
        message: 'Type de fichier non reconnu ou corrompu'
      };
    }
    
    if (!expectedMimeTypes.includes(type.mime)) {
      return {
        valid: false,
        message: `Type MIME invalide. Attendu: ${expectedMimeTypes.join(', ')}, reçu: ${type.mime}`,
        detectedType: type.mime
      };
    }
    
    return {
      valid: true,
      mime: type.mime,
      ext: type.ext
    };
  } catch (error) {
    console.error('Erreur validation MIME type:', error);
    return {
      valid: false,
      message: 'Erreur lors de la validation du fichier'
    };
  }
};

/**
 * 🆕 MIDDLEWARE DE VALIDATION POST-UPLOAD
 * À utiliser après multer pour validation stricte
 */
const validateUploadedFiles = (allowedTypes) => {
  return async (req, res, next) => {
    try {
      // Collecter tous les fichiers uploadés
      const files = [];
      
      if (req.file) {
        files.push(req.file);
      }
      
      if (req.files) {
        if (Array.isArray(req.files)) {
          files.push(...req.files);
        } else {
          // req.files est un objet avec fieldnames
          Object.values(req.files).forEach(fileArray => {
            if (Array.isArray(fileArray)) {
              files.push(...fileArray);
            } else {
              files.push(fileArray);
            }
          });
        }
      }
      
      if (files.length === 0) {
        return next();
      }
      
      // Valider chaque fichier
      const validationErrors = [];
      
      for (const file of files) {
        const validation = await validateFileMimeType(file.path, allowedTypes);
        
        if (!validation.valid) {
          validationErrors.push({
            filename: file.originalname,
            error: validation.message
          });
          
          // Supprimer le fichier invalide
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Erreur suppression fichier invalide:', unlinkError);
          }
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation de fichiers échouée',
          details: validationErrors
        });
      }
      
      next();
    } catch (error) {
      console.error('Erreur middleware validation fichiers:', error);
      res.status(500).json({ error: 'Erreur lors de la validation des fichiers' });
    }
  };
};

/**
 * 🆕 SCANNER ANTIVIRUS (Simulation)
 * En production, intégrer ClamAV ou autre solution
 */
const scanForViruses = async (filePath) => {
  // TODO: Intégrer ClamAV en production
  // Exemple avec clamscan:
  // const clamscan = require('clamscan');
  // const scanner = await new clamscan().init();
  // const result = await scanner.isInfected(filePath);
  // return !result.isInfected;
  
  // Pour l'instant, simulation
  console.log(`🛡️ Scan antivirus simulé: ${path.basename(filePath)}`);
  
  // Vérifications basiques de sécurité
  const filename = path.basename(filePath).toLowerCase();
  
  // Bloquer extensions dangereuses
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.jar'];
  for (const ext of dangerousExtensions) {
    if (filename.endsWith(ext)) {
      return {
        safe: false,
        reason: `Extension dangereuse détectée: ${ext}`
      };
    }
  }
  
  // Vérifier taille fichier (protection DoS)
  try {
    const stats = await fs.stat(filePath);
    const maxSize = 50 * 1024 * 1024; // 50MB max absolu
    
    if (stats.size > maxSize) {
      return {
        safe: false,
        reason: `Fichier trop volumineux: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max 50MB)`
      };
    }
  } catch (error) {
    return {
      safe: false,
      reason: 'Erreur lecture fichier'
    };
  }
  
  return {
    safe: true,
    scanned: true
  };
};

/**
 * 🆕 MIDDLEWARE SCAN ANTIVIRUS
 */
const antivirusMiddleware = async (req, res, next) => {
  try {
    const files = [];
    
    if (req.file) {
      files.push(req.file);
    }
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        Object.values(req.files).forEach(fileArray => {
          if (Array.isArray(fileArray)) {
            files.push(...fileArray);
          } else {
            files.push(fileArray);
          }
        });
      }
    }
    
    if (files.length === 0) {
      return next();
    }
    
    // Scanner chaque fichier
    const threats = [];
    
    for (const file of files) {
      const scanResult = await scanForViruses(file.path);
      
      if (!scanResult.safe) {
        threats.push({
          filename: file.originalname,
          reason: scanResult.reason
        });
        
        // Supprimer fichier dangereux
        try {
          await fs.unlink(file.path);
          console.log(`⚠️ Fichier dangereux supprimé: ${file.originalname}`);
        } catch (unlinkError) {
          console.error('Erreur suppression fichier dangereux:', unlinkError);
        }
      }
    }
    
    if (threats.length > 0) {
      return res.status(400).json({
        error: 'Fichiers dangereux détectés',
        threats
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur scan antivirus:', error);
    res.status(500).json({ error: 'Erreur lors du scan de sécurité' });
  }
};

/**
 * 🆕 LIMITATION DÉBIT UPLOAD
 * Empêche abuse de bande passante
 */
const createUploadRateLimiter = () => {
  const uploads = new Map(); // Map<IP, { count, resetTime }>
  const maxUploadsPerHour = 20;
  const windowMs = 60 * 60 * 1000; // 1 heure
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    let record = uploads.get(ip);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      uploads.set(ip, record);
    }
    
    record.count++;
    
    if (record.count > maxUploadsPerHour) {
      return res.status(429).json({
        error: 'Trop d\'uploads',
        message: `Limite de ${maxUploadsPerHour} uploads par heure atteinte`,
        retryAfter: Math.ceil((record.resetTime - now) / 1000 / 60) + ' minutes'
      });
    }
    
    // Nettoyer anciennes entrées (toutes les heures)
    if (uploads.size > 1000) {
      for (const [key, value] of uploads.entries()) {
        if (now > value.resetTime) {
          uploads.delete(key);
        }
      }
    }
    
    next();
  };
};

/**
 * 🆕 VALIDATION TAILLE TOTALE UPLOAD
 * Limite la taille totale d'un batch d'uploads
 */
const validateTotalUploadSize = (maxTotalSize = 50 * 1024 * 1024) => {
  return (req, res, next) => {
    const files = [];
    
    if (req.file) {
      files.push(req.file);
    }
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        Object.values(req.files).forEach(fileArray => {
          if (Array.isArray(fileArray)) {
            files.push(...fileArray);
          } else {
            files.push(fileArray);
          }
        });
      }
    }
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    if (totalSize > maxTotalSize) {
      // Supprimer tous les fichiers
      files.forEach(file => {
        fs.unlink(file.path).catch(err => {
          console.error('Erreur suppression fichier:', err);
        });
      });
      
      return res.status(413).json({
        error: 'Taille totale dépassée',
        message: `La taille totale des fichiers (${(totalSize / 1024 / 1024).toFixed(2)}MB) dépasse la limite de ${maxTotalSize / 1024 / 1024}MB`
      });
    }
    
    next();
  };
};

// Types MIME autorisés par catégorie
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  pdfs: ['application/pdf'],
  all: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
};

module.exports = {
  validateFileMimeType,
  validateUploadedFiles,
  scanForViruses,
  antivirusMiddleware,
  createUploadRateLimiter,
  validateTotalUploadSize,
  ALLOWED_MIME_TYPES
};
