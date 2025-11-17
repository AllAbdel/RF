-- Migration pour ajouter le système de demandes d'adhésion aux agences
-- Date: 2025-11-17

USE car_rental;

-- Table pour les demandes d'adhésion aux agences
CREATE TABLE IF NOT EXISTS agency_join_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  agency_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_agency (user_id, agency_id)
);

-- Ajouter un index pour optimiser les recherches
CREATE INDEX idx_status ON agency_join_requests(status);
CREATE INDEX idx_agency_status ON agency_join_requests(agency_id, status);
