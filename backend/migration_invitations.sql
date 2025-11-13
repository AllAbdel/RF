-- Migration pour ajouter la table des invitations d'agence
-- À exécuter sur une base de données existante

-- Créer la table des invitations d'agence
CREATE TABLE IF NOT EXISTS agency_invitations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  agency_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'member') NOT NULL DEFAULT 'member',
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_invitation_token ON agency_invitations(token);
CREATE INDEX idx_invitation_status ON agency_invitations(status);
CREATE INDEX idx_invitation_email ON agency_invitations(email);
