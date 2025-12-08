-- Table pour stocker les documents d'identité des clients
CREATE TABLE IF NOT EXISTS client_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  reservation_id INT NULL,
  document_type ENUM('id_card', 'driving_license', 'passport') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Données extraites par OCR
  extracted_data JSON NULL,
  
  -- Métadonnées de l'image
  image_metadata JSON NULL,
  
  -- Scores de validation (0-100)
  technical_score INT DEFAULT 0, -- Qualité technique de l'image
  format_score INT DEFAULT 0,    -- Validité du format des données
  coherence_score INT DEFAULT 0, -- Cohérence entre documents
  overall_score INT DEFAULT 0,   -- Score global
  
  -- Statut de validation
  validation_status ENUM('pending', 'approved', 'rejected', 'manual_review') DEFAULT 'pending',
  validation_notes TEXT NULL,
  validated_by INT NULL, -- ID de l'agent qui a validé
  validated_at TIMESTAMP NULL,
  
  -- Flags de détection de fraude
  is_screenshot BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  suspicious_patterns TEXT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
  FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_user_documents (user_id),
  INDEX idx_validation_status (validation_status),
  INDEX idx_reservation (reservation_id)
);

-- Table pour l'historique de validation
CREATE TABLE IF NOT EXISTS document_validation_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  validator_id INT NOT NULL,
  action ENUM('approved', 'rejected', 'flagged', 'comment') NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES client_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (validator_id) REFERENCES users(id) ON DELETE CASCADE
);
