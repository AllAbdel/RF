const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DocumentValidationService {
  
  // Analyse technique de l'image
  async analyzeTechnicalQuality(filePath) {
    const score = { total: 0, details: {} };
    
    try {
      const metadata = await sharp(filePath).metadata();
      const stats = await sharp(filePath).stats();
      
      // 1. Résolution (max 30 points)
      const minDimension = Math.min(metadata.width, metadata.height);
      if (minDimension >= 1200) score.total += 30;
      else if (minDimension >= 800) score.total += 20;
      else if (minDimension >= 600) score.total += 10;
      score.details.resolution = minDimension;
      
      // 2. Format d'image (10 points)
      if (['jpeg', 'jpg', 'png'].includes(metadata.format)) {
        score.total += 10;
      }
      score.details.format = metadata.format;
      
      // 3. Détection de compression excessive (20 points)
      const buffer = await fs.readFile(filePath);
      const fileSize = buffer.length;
      const expectedSize = metadata.width * metadata.height * 3; // RGB
      const compressionRatio = fileSize / expectedSize;
      
      if (compressionRatio > 0.1) score.total += 20;
      else if (compressionRatio > 0.05) score.total += 10;
      score.details.compressionRatio = compressionRatio.toFixed(3);
      
      // 4. Netteté de l'image (20 points) - via analyse des stats
      const avgSharpness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
      if (avgSharpness > 100) score.total += 20;
      else if (avgSharpness > 50) score.total += 10;
      score.details.sharpness = avgSharpness.toFixed(2);
      
      // 5. Détection de capture d'écran (20 points perdus si détecté)
      const isScreenshot = await this.detectScreenshot(filePath, metadata);
      if (!isScreenshot) {
        score.total += 20;
      } else {
        score.details.isScreenshot = true;
      }
      
      return { score: score.total, details: score.details };
      
    } catch (error) {
      console.error('Erreur analyse technique:', error);
      return { score: 0, details: { error: error.message } };
    }
  }
  
  // Détection de capture d'écran
  async detectScreenshot(filePath, metadata) {
    try {
      // Les captures d'écran ont souvent des dimensions exactes (multiples de 8)
      const exactDimensions = metadata.width % 8 === 0 && metadata.height % 8 === 0;
      
      // Vérifie les métadonnées EXIF
      if (metadata.exif) {
        const buffer = await fs.readFile(filePath);
        const exifString = buffer.toString('utf8', 0, 1000);
        if (exifString.includes('Screenshot') || exifString.includes('screen')) {
          return true;
        }
      }
      
      // Ratio d'écran commun (16:9, 16:10)
      const ratio = metadata.width / metadata.height;
      const commonScreenRatios = [16/9, 16/10, 4/3, 21/9];
      const isCommonRatio = commonScreenRatios.some(r => Math.abs(ratio - r) < 0.01);
      
      return exactDimensions && isCommonRatio && metadata.density < 100;
      
    } catch (error) {
      return false;
    }
  }
  
  // Détection d'édition Photoshop
  async detectEditing(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const content = buffer.toString('utf8', 0, 5000);
      
      // Recherche de signatures Adobe
      const adobeSignatures = ['Adobe', 'Photoshop', 'photoshop', 'GIMP', 'Paint.NET'];
      const isEdited = adobeSignatures.some(sig => content.includes(sig));
      
      return isEdited;
      
    } catch (error) {
      return false;
    }
  }
  
  // Hash de l'image pour détection de duplicata
  async getImageHash(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error) {
      return null;
    }
  }
  
  // OCR - Extraction de texte
  async extractText(filePath) {
    try {
      const { data } = await Tesseract.recognize(filePath, 'fra', {
        logger: m => console.log('OCR:', m.status, m.progress)
      });
      
      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words.map(w => ({ text: w.text, confidence: w.confidence }))
      };
      
    } catch (error) {
      console.error('Erreur OCR:', error);
      return { text: '', confidence: 0, words: [] };
    }
  }
  
  // Validation du format de permis de conduire français
  validateDrivingLicense(extractedText) {
    const score = { total: 0, data: {} };
    
    // Format numéro de permis : 12 chiffres
    const licenseNumberRegex = /\b\d{12}\b/;
    const licenseMatch = extractedText.match(licenseNumberRegex);
    
    if (licenseMatch) {
      score.total += 30;
      score.data.licenseNumber = licenseMatch[0];
    }
    
    // Recherche de date de naissance
    const dobRegex = /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/g;
    const dobMatch = extractedText.match(dobRegex);
    if (dobMatch) {
      score.total += 20;
      score.data.dateOfBirth = dobMatch[0];
    }
    
    // Date de délivrance et expiration
    const dates = extractedText.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/g);
    if (dates && dates.length >= 2) {
      score.total += 20;
      score.data.dates = dates;
      
      // Vérifier que le permis n'est pas expiré
      const expiryDate = this.parseDate(dates[dates.length - 1]);
      if (expiryDate && expiryDate > new Date()) {
        score.total += 30;
        score.data.isValid = true;
      } else {
        score.data.isValid = false;
        score.data.expired = true;
      }
    }
    
    return score;
  }
  
  // Validation carte d'identité française
  validateIdCard(extractedText) {
    const score = { total: 0, data: {} };
    
    // Format numéro CNI : 12 caractères alphanumériques
    const idNumberRegex = /\b[A-Z0-9]{12}\b/;
    const idMatch = extractedText.match(idNumberRegex);
    
    if (idMatch) {
      score.total += 40;
      score.data.idNumber = idMatch[0];
    }
    
    // Recherche "CARTE NATIONALE D'IDENTITÉ" ou "RÉPUBLIQUE FRANÇAISE"
    if (extractedText.includes('CARTE') || extractedText.includes('IDENTITE') || 
        extractedText.includes('REPUBLIQUE') || extractedText.includes('FRANCAISE')) {
      score.total += 20;
    }
    
    // Date de naissance
    const dobRegex = /\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/g;
    const dobMatch = extractedText.match(dobRegex);
    if (dobMatch) {
      score.total += 20;
      score.data.dateOfBirth = dobMatch[0];
    }
    
    // Nom et prénom (mots en majuscules)
    const upperWords = extractedText.match(/\b[A-Z]{2,}\b/g);
    if (upperWords && upperWords.length >= 2) {
      score.total += 20;
      score.data.names = upperWords.slice(0, 3);
    }
    
    return score;
  }
  
  // Vérifier la cohérence entre deux documents
  checkCoherence(doc1Data, doc2Data) {
    let score = 0;
    const issues = [];
    
    // Comparer dates de naissance
    if (doc1Data.dateOfBirth && doc2Data.dateOfBirth) {
      if (doc1Data.dateOfBirth === doc2Data.dateOfBirth) {
        score += 50;
      } else {
        issues.push('Dates de naissance différentes');
      }
    }
    
    // Comparer noms (basique)
    if (doc1Data.names && doc2Data.names) {
      const commonNames = doc1Data.names.filter(n => doc2Data.names.includes(n));
      if (commonNames.length > 0) {
        score += 50;
      } else {
        issues.push('Aucun nom en commun');
      }
    }
    
    return { score, issues };
  }
  
  // Parser une date
  parseDate(dateStr) {
    try {
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } catch (error) {
      return null;
    }
    return null;
  }
  
  // Calculer le score global
  calculateOverallScore(technicalScore, formatScore, coherenceScore) {
    // Pondération : 30% technique, 40% format, 30% cohérence
    return Math.round(
      technicalScore * 0.3 +
      formatScore * 0.4 +
      coherenceScore * 0.3
    );
  }
}

module.exports = new DocumentValidationService();
