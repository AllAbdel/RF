require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  // Test update query
  try {
    await db.query(
      `UPDATE vehicles SET brand = ?, model = ?, seats = ?, engine = ?, 
       tank_capacity = ?, price_per_hour = ?, fuel_type = ?, description = ?, terms_pdf = ?,
       release_date = ?, location = ?, pickup_address = ?, return_address = ?, status = ?
       WHERE id = ?`,
      ['Test', 'Model', 4, 'engine', 50, 10.00, 'essence', 'desc', null, null, 'Paris', 'addr1', 'addr2', 'available', 1]
    );
    console.log('✅ Update SQL OK');
  } catch (err) {
    console.error('❌ Erreur SQL:', err.message);
    console.error('Code:', err.code);
    console.error('SQL State:', err.sqlState);
  }
  
  await db.end();
})();
