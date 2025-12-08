const mysql = require('mysql2/promise');

async function checkSchema() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'car_rental'
  });
  
  const [cols] = await conn.query('DESCRIBE vehicles');
  console.log('Colonnes de la table vehicles:');
  cols.forEach(c => console.log(`  - ${c.Field} (${c.Type})`));
  
  await conn.end();
}

checkSchema().catch(console.error);
