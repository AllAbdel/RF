const mysql = require('mysql2/promise');

async function testSQL() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'car_rental'
  });

  console.log('✅ Connecté à MySQL');

  // Test de la requête qui pose problème
  const agencyId = 3;
  
  try {
    console.log('\n📊 Test reservationBreakdown query:');
    const [reservationBreakdown] = await connection.query(`
      SELECT r.status, COUNT(*) as count, SUM(r.total_price) as total
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE v.agency_id = ?
      GROUP BY r.status
    `, [agencyId]);
    console.log('✅ Résultat:', reservationBreakdown);
  } catch (error) {
    console.error('❌ Erreur reservationBreakdown:', error.message);
  }

  try {
    console.log('\n📈 Test monthlyRevenue query:');
    const [monthlyRevenue] = await connection.query(`
      SELECT 
        DATE_FORMAT(r.start_date, '%Y-%m') as month,
        SUM(r.total_price) as revenue,
        COUNT(*) as bookings
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE v.agency_id = ? AND r.payment_status = 'paid'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, [agencyId]);
    console.log('✅ Résultat:', monthlyRevenue);
  } catch (error) {
    console.error('❌ Erreur monthlyRevenue:', error.message);
  }

  await connection.end();
}

testSQL().catch(console.error);
