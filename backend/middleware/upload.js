const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage pour les images de véhicules
const vehicleImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/vehicles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'vehicle-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage pour les PDFs de conditions (véhicules)
const vehicleTermsPdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/vehicles/terms/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'terms-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage pour les logos et PDFs d'agence
const agencyFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/agencies/';
    if (file.fieldname === 'rental_conditions_pdf') {
      dir += 'terms/';
    } else if (file.fieldname === 'logo') {
      dir += 'logos/';
    }
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'logo' ? 'logo-' : 'terms-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour images uniquement
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, webp)'));
  }
};

// Filtre pour PDFs uniquement
const pdfFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase() === '.pdf';
  const mimetype = file.mimetype === 'application/pdf';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers PDF sont autorisés'));
  }
};

// Filtre mixte pour images + PDFs (agences)
const agencyFileFilter = (req, file, cb) => {
  if (file.fieldname === 'logo') {
    imageFilter(req, file, cb);
  } else if (file.fieldname === 'rental_conditions_pdf') {
    pdfFilter(req, file, cb);
  } else {
    cb(new Error('Champ de fichier non reconnu'));
  }
};

// Upload pour images de véhicules
const uploadVehicleImages = multer({
  storage: vehicleImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: imageFilter
});

// Upload pour PDF de conditions de véhicule
const uploadVehicleTermsPdf = multer({
  storage: vehicleTermsPdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max pour PDF
  fileFilter: pdfFilter
});

// Upload pour fichiers d'agence (logo + PDF)
const uploadAgencyFiles = multer({
  storage: agencyFileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: agencyFileFilter
});

// Export de l'ancien upload (compatibilité)
const upload = uploadVehicleImages;

module.exports = {
  upload,
  uploadVehicleImages,
  uploadVehicleTermsPdf,
  uploadAgencyFiles
};
