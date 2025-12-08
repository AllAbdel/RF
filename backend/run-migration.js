const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'car_rental',
    multipleStatements: true
  });

  console.log('✅ Connecté à MySQL');

  const sqlFile = path.join(__dirname, 'migrations', 'add_client_documents.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  try {
    await connection.query(sql);
    console.log('✅ Migration exécutée avec succès');
    console.log('   - Table client_documents créée');
    console.log('   - Table document_validation_history créée');
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
  }

  await connection.end();
}

runMigration().catch(console.error);
