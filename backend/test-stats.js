require('dotenv').config();
const mysql = require('mysql2/promise');

async function testStats() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'car_rental'
  });

  const agency_id = 3;

  // Test 1: Revenus mensuels
  const [monthlyRevenue] = await connection.query(
    `SELECT 
      DATE_FORMAT(r.start_date, '%Y-%m') as month,
      SUM(r.total_price) as revenue,
      COUNT(DISTINCT r.id) as bookings
     FROM reservations r
     JOIN vehicles v ON r.vehicle_id = v.id
     WHERE v.agency_id = ? 
       AND r.status IN ('completed', 'accepted')
     GROUP BY DATE_FORMAT(r.start_date, '%Y-%m')
     ORDER BY month DESC`,
    [agency_id]
  );

  console.log('\n=== REVENUS MENSUELS (Agence 3) ===');
  console.table(monthlyRevenue);

  // Test 2: Stats globales
  const [stats] = await connection.query(
    `SELECT 
      COUNT(DISTINCT r.id) as total_reservations,
      SUM(CASE WHEN r.status IN ('completed', 'accepted') THEN r.total_price ELSE 0 END) as total_revenue,
      COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_reservations
     FROM reservations r
     JOIN vehicles v ON r.vehicle_id = v.id
     WHERE v.agency_id = ?`,
    [agency_id]
  );

  console.log('\n=== STATISTIQUES GLOBALES ===');
  console.table(stats);

  await connection.end();
}

testStats().catch(console.error);
