CREATE DATABASE IF NOT EXISTS car_rental;
USE car_rental;

-- Table des agences
CREATE TABLE agencies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  description TEXT,
  website VARCHAR(255),
  logo VARCHAR(500),
  rental_conditions TEXT,
  rental_conditions_pdf VARCHAR(500),
  payment_link_paypal VARCHAR(500),
  payment_link_stripe VARCHAR(500),
  payment_link_other VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs (clients et membres d'agences)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  birth_date DATE NULL,
  license_date DATE NULL,
  user_type ENUM('client', 'agency_member') NOT NULL,
  agency_id INT NULL,
  role ENUM('super_admin', 'admin', 'member') DEFAULT 'member',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255) NULL,
  verification_token_expires DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
);

-- Table des véhicules
CREATE TABLE vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  agency_id INT NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  seats INT NOT NULL,
  engine VARCHAR(100),
  tank_capacity INT,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  fuel_type ENUM('essence', 'diesel', 'electrique', 'hybride') NOT NULL,
  description TEXT,
  terms_pdf VARCHAR(500),
  release_date DATE,
  location VARCHAR(255),
  pickup_address VARCHAR(500),
  return_address VARCHAR(500),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Table des images de véhicules
CREATE TABLE vehicle_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Table des réservations
CREATE TABLE reservations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  client_id INT NOT NULL,
  agency_id INT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Table des avis
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reservation_id INT NOT NULL,
  client_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Table des documents (factures, reçus, contrats)
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reservation_id INT NOT NULL,
  document_type ENUM('invoice', 'receipt', 'contract') NOT NULL,
  document_number VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Table des signatures de contrats
CREATE TABLE contract_signatures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  signature_data TEXT NOT NULL,
  ip_address VARCHAR(50),
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des conversations
CREATE TABLE conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  agency_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_conversation (client_id, agency_id)
);

-- Table des messages
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  file_url VARCHAR(500) NULL,
  file_name VARCHAR(255) NULL,
  is_read BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des notifications
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des invitations d'agences
CREATE TABLE agency_invitations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  agency_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

CREATE INDEX idx_token ON agency_invitations(token);
CREATE INDEX idx_email ON agency_invitations(email);

-- Table pour les demandes d'adhésion aux agences
CREATE TABLE agency_join_requests (
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

CREATE INDEX idx_status ON agency_join_requests(status);
CREATE INDEX idx_agency_status ON agency_join_requests(agency_id, status);

-- Table des documents clients
CREATE TABLE client_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  reservation_id INT NULL,
  document_type ENUM('id_card', 'driving_license', 'proof_of_address', 'other') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255),
  original_filename VARCHAR(255),
  file_size INT,
  mime_type VARCHAR(100),
  validation_status ENUM('pending', 'approved', 'rejected', 'manual_review') DEFAULT 'pending',
  rejection_reason TEXT,
  overall_score DECIMAL(5,2) DEFAULT NULL,
  technical_score DECIMAL(5,2) DEFAULT NULL,
  format_score DECIMAL(5,2) DEFAULT NULL,
  coherence_score DECIMAL(5,2) DEFAULT NULL,
  is_screenshot BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  extracted_data JSON DEFAULT NULL,
  validation_notes TEXT DEFAULT NULL,
  validated_by INT NULL,
  validated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
  FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_client_docs_user ON client_documents(user_id);
CREATE INDEX idx_client_docs_status ON client_documents(validation_status);

-- Table des tentatives de connexion (sécurité)
CREATE TABLE login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_email ON login_attempts(email);
CREATE INDEX idx_login_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_created ON login_attempts(created_at);

-- Table de la liste noire des tokens (sécurité)
CREATE TABLE token_blacklist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token_jti VARCHAR(255) UNIQUE NOT NULL,
  user_id INT,
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX idx_blacklist_expires ON token_blacklist(expires_at);

-- Table des refresh tokens
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);

-- Table de l'historique des mots de passe
CREATE TABLE password_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_user ON password_history(user_id);
