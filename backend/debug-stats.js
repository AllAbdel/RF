require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugStats() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'car_rental'
  });

  console.log('\n🔍 === DEBUG COMPLET DES STATS ===\n');

  // 1. Vérifier l'agence et ses véhicules
  const [agencies] = await connection.query('SELECT id, name FROM agencies');
  console.log('📋 Agences:', agencies);

  const [vehicles] = await connection.query('SELECT id, brand, model, agency_id FROM vehicles');
  console.log('\n🚗 Véhicules:', vehicles);

  // 2. Vérifier les réservations
  const [reservations] = await connection.query(
    `SELECT r.id, r.vehicle_id, r.status, r.payment_status, r.total_price, r.start_date, v.agency_id 
     FROM reservations r 
     JOIN vehicles v ON r.vehicle_id = v.id`
  );
  console.log('\n📅 Réservations:', reservations);

  // 3. Tester la requête exacte utilisée par le backend
  for (const agency of agencies) {
    console.log(`\n📊 === STATS POUR AGENCE ${agency.id} (${agency.name || 'Sans nom'}) ===`);
    
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
      [agency.id]
    );
    
    console.log('💰 Revenus mensuels:', monthlyRevenue);

    const [breakdown] = await connection.query(
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(total_price) as total_value
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
       GROUP BY status`,
      [agency.id]
    );
    
    console.log('📊 Répartition par statut:', breakdown);
  }

  await connection.end();
}

debugStats().catch(console.error);
