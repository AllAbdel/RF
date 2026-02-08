const db = require('./config/database');

const setup = async () => {
  try {
    // Table login_attempts
    await db.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255),
        ip_address VARCHAR(45),
        success BOOLEAN DEFAULT FALSE,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_ip (ip_address),
        INDEX idx_attempted_at (attempted_at)
      )
    `);
    console.log('✅ Table login_attempts créée');
    
    // Table token_blacklist
    await db.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token_jti VARCHAR(255) NOT NULL,
        user_id INT,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token_jti (token_jti),
        INDEX idx_expires_at (expires_at)
      )
    `);
    console.log('✅ Table token_blacklist créée');
    
    // Table refresh_tokens (si elle n'existe pas)
    await db.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        last_used_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      )
    `);
    console.log('✅ Table refresh_tokens créée');
    
    // Table password_history (si elle n'existe pas)
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);
    console.log('✅ Table password_history créée');
    
    console.log('\n✅ Toutes les tables de sécurité ont été créées');
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
};

setup();
