-- Migration pour ajouter le système de documents (factures, reçus, contrats)
USE car_rental;

-- Table pour les documents générés (factures, reçus, contrats)
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reservation_id INT NOT NULL,
  document_type ENUM('invoice', 'receipt', 'contract') NOT NULL,
  document_number VARCHAR(50) UNIQUE NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Table pour les signatures de contrats
CREATE TABLE IF NOT EXISTS contract_signatures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ajouter une colonne pour indiquer si le contrat a été signé
ALTER TABLE reservations 
ADD COLUMN contract_signed BOOLEAN DEFAULT FALSE AFTER payment_status;

-- Index pour optimiser les recherches
CREATE INDEX idx_document_type ON documents(document_type);
CREATE INDEX idx_document_reservation ON documents(reservation_id);
CREATE INDEX idx_signature_document ON contract_signatures(document_id);
