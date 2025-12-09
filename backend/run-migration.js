const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345678',
      database: process.env.DB_NAME || 'car_rental',
      multipleStatements: true
    });

    console.log('✅ Connecté à MySQL');
    console.log('');

    // Migration sécurité
    const securityFile = path.join(__dirname, 'migrations', '001_security_enhancements.sql');
    
    if (fs.existsSync(securityFile)) {
      console.log('📖 Exécution: 001_security_enhancements.sql');
      const securitySql = fs.readFileSync(securityFile, 'utf8');
      
      try {
        await connection.query(securitySql);
        console.log('✅ Migration sécurité exécutée avec succès!');
        console.log('   - 8 colonnes ajoutées à la table users');
        console.log('   - Table password_history créée');
        console.log('   - Table token_blacklist créée');
        console.log('   - Table refresh_tokens créée');
        console.log('   - Table login_attempts créée');
        console.log('');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠️  Migration sécurité déjà appliquée');
          console.log('');
        } else {
          throw error;
        }
      }
    }

    // Migration documents clients (si existe)
    const sqlFile = path.join(__dirname, 'migrations', 'add_client_documents.sql');
    
    if (fs.existsSync(sqlFile)) {
      console.log('📖 Exécution: add_client_documents.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');
      
      try {
        await connection.query(sql);
        console.log('✅ Migration documents exécutée avec succès!');
        console.log('   - Table client_documents créée');
        console.log('   - Table document_validation_history créée');
        console.log('');
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠️  Migration documents déjà appliquée');
          console.log('');
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 Toutes les migrations sont à jour!');
    console.log('');
    console.log('➡️  Redémarre le serveur avec: npm start');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 MySQL n\'est pas accessible');
      console.error('   Vérifie que MySQL est démarré');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Identifiants MySQL incorrects');
      console.error('   Vérifie DB_USER et DB_PASSWORD dans .env');
    } else {
      console.error('   Détails:', error);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration().catch(console.error);
