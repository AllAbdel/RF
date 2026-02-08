const db = require('./config/database');

const fixDatabase = async () => {
  try {
    console.log('🔧 Correction de la base de données...\n');

    // 1. Ajouter les colonnes manquantes à la table agencies
    const agencyColumns = [
      { name: 'description', sql: "ALTER TABLE agencies ADD COLUMN description TEXT AFTER logo" },
      { name: 'payment_link_paypal', sql: "ALTER TABLE agencies ADD COLUMN payment_link_paypal VARCHAR(500)" },
      { name: 'payment_link_stripe', sql: "ALTER TABLE agencies ADD COLUMN payment_link_stripe VARCHAR(500)" },
      { name: 'payment_link_other', sql: "ALTER TABLE agencies ADD COLUMN payment_link_other VARCHAR(500)" },
      { name: 'website', sql: "ALTER TABLE agencies ADD COLUMN website VARCHAR(500)" }
    ];

    for (const col of agencyColumns) {
      try {
        await db.query(col.sql);
        console.log(`✅ Colonne agencies.${col.name} ajoutée`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`ℹ️  Colonne agencies.${col.name} existe déjà`);
        } else {
          console.error(`❌ Erreur pour agencies.${col.name}:`, err.message);
        }
      }
    }

    // 2. Créer la table client_documents
    await db.query(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reservation_id INT,
        document_type ENUM('identity', 'license', 'proof_of_address', 'other') NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        original_name VARCHAR(255),
        file_size INT,
        mime_type VARCHAR(100),
        validation_status ENUM('pending', 'approved', 'rejected', 'manual_review') DEFAULT 'pending',
        rejection_reason TEXT,
        overall_score DECIMAL(3,2),
        validated_by INT,
        validated_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_reservation_id (reservation_id),
        INDEX idx_status (validation_status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table client_documents créée');

    // 3. Recréer la table token_blacklist avec la bonne structure
    try {
      await db.query('DROP TABLE IF EXISTS token_blacklist');
      await db.query(`
        CREATE TABLE token_blacklist (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token_jti VARCHAR(255) NOT NULL,
          user_id INT,
          expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_token_jti (token_jti),
          INDEX idx_expires_at (expires_at)
        )
      `);
      console.log('✅ Table token_blacklist recréée');
    } catch (err) {
      console.error('❌ Erreur token_blacklist:', err.message);
    }

    console.log('\n✅ Base de données corrigée avec succès!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
};

fixDatabase();
