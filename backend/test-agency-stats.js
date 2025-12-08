const mysql = require('mysql2/promise');

async function testGetAgencyStats() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'car_rental'
  });

  console.log('✅ Connecté à MySQL\n');

  const agency_id = 3;

  try {
    console.log('Test 1: Informations agence');
    const [agency] = await connection.query(
      'SELECT id, name, email, phone, address, rental_conditions FROM agencies WHERE id = ?',
      [agency_id]
    );
    console.log('✅ Agency:', agency[0]);
  } catch (error) {
    console.error('❌ Erreur agency:', error.message);
  }

  try {
    console.log('\nTest 2: Vehicle count');
    const [vehicleCount] = await connection.query(
      'SELECT COUNT(*) as count FROM vehicles WHERE agency_id = ?',
      [agency_id]
    );
    console.log('✅ Vehicles:', vehicleCount[0]);
  } catch (error) {
    console.error('❌ Erreur vehicles:', error.message);
  }

  try {
    console.log('\nTest 3: Reservation stats');
    const [reservationStats] = await connection.query(
      `SELECT r.status, COUNT(*) as count
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
       GROUP BY r.status`,
      [agency_id]
    );
    console.log('✅ Reservations:', reservationStats);
  } catch (error) {
    console.error('❌ Erreur reservations:', error.message);
  }

  try {
    console.log('\nTest 4: Revenue');
    const [revenue] = await connection.query(
      `SELECT SUM(total_price) as total
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? AND r.status IN ('completed', 'accepted')`,
      [agency_id]
    );
    console.log('✅ Revenue:', revenue[0]);
  } catch (error) {
    console.error('❌ Erreur revenue:', error.message);
  }

  try {
    console.log('\nTest 5: Avg rating');
    const [avgRating] = await connection.query(
      `SELECT AVG(r.rating) as avg_rating
       FROM reviews r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?`,
      [agency_id]
    );
    console.log('✅ Avg rating:', avgRating[0]);
  } catch (error) {
    console.error('❌ Erreur rating:', error.message);
  }

  try {
    console.log('\nTest 6: Recent reservations');
    const [recentReservations] = await connection.query(
      `SELECT r.*, v.brand, v.model, u.first_name, u.last_name
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN users u ON r.client_id = u.id
       WHERE v.agency_id = ?
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [agency_id]
    );
    console.log('✅ Recent reservations:', recentReservations.length, 'items');
  } catch (error) {
    console.error('❌ Erreur recent reservations:', error.message);
  }

  await connection.end();
  console.log('\n✅ Test terminé');
}

testGetAgencyStats().catch(console.error);
