const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function runMigration() {
  console.log('=== Migration: Système admin site + demandes agence ===\n');

  try {
    // 1. Modifier l'ENUM user_type
    console.log('1. Modification ENUM user_type...');
    await db.query("ALTER TABLE users MODIFY COLUMN user_type ENUM('client', 'agency_member', 'site_admin') NOT NULL");
    console.log('   OK\n');

    // 2. Créer la table agency_creation_requests
    console.log('2. Création table agency_creation_requests...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS agency_creation_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        agency_name VARCHAR(255) NOT NULL,
        agency_email VARCHAR(255),
        agency_phone VARCHAR(20),
        agency_address TEXT,
        agency_description TEXT,
        logo_path VARCHAR(500),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        admin_notes TEXT,
        reviewed_by INT NULL,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('   OK\n');

    // 3. Créer le compte admin du site
    console.log('3. Création compte admin...');
    const [existing] = await db.query("SELECT id FROM users WHERE email = 'admin@rentflow.fr'");
    if (existing.length > 0) {
      console.log('   Compte admin existe déjà, mise à jour du user_type...');
      await db.query("UPDATE users SET user_type = 'site_admin', role = 'super_admin' WHERE email = 'admin@rentflow.fr'");
    } else {
      const hashedPassword = await bcrypt.hash('Admin@2026!', 10);
      await db.query(
        `INSERT INTO users (email, password, first_name, last_name, phone, user_type, role, email_verified)
         VALUES (?, ?, 'Admin', 'Rentflow', '', 'site_admin', 'super_admin', TRUE)`,
        ['admin@rentflow.fr', hashedPassword]
      );
      console.log('   Compte créé: admin@rentflow.fr / Admin@2026!');
    }
    console.log('   OK\n');

    console.log('=== Migration terminée avec succès ! ===');
    console.log('\nCompte admin:');
    console.log('  Email: admin@rentflow.fr');
    console.log('  Mot de passe: Admin@2026!');
    console.log('  IMPORTANT: Changez ce mot de passe en production !\n');

  } catch (error) {
    console.error('Erreur migration:', error.message);
  } finally {
    process.exit();
  }
}

runMigration();
