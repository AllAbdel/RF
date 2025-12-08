const mysql = require('mysql2/promise');

async function testAllQueries() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'car_rental'
  });

  console.log('✅ Connecté à MySQL\n');

  const agency_id = 3;
  const dateFilter = '';
  const dateFilterWithAnd = '';

  const queries = [
    {
      name: '1. Monthly Revenue',
      sql: `SELECT 
        DATE_FORMAT(r.start_date, '%Y-%m') as month,
        SUM(r.total_price) as revenue,
        COUNT(DISTINCT r.id) as bookings
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         ${dateFilter}
       GROUP BY DATE_FORMAT(r.start_date, '%Y-%m')
       ORDER BY month DESC`
    },
    {
      name: '2. Vehicle Performance',
      sql: `SELECT 
        v.id,
        v.brand,
        v.model,
        COUNT(DISTINCT r.id) as total_bookings,
        SUM(CASE WHEN r.status IN ('completed', 'accepted') THEN r.total_price ELSE 0 END) as total_revenue,
        AVG(CASE WHEN r.status IN ('completed', 'accepted') THEN r.total_price ELSE NULL END) as avg_booking_value,
        AVG(rev.rating) as avg_rating,
        COUNT(DISTINCT rev.id) as review_count
       FROM vehicles v
       LEFT JOIN reservations r ON v.id = r.vehicle_id
       LEFT JOIN reviews rev ON v.id = rev.vehicle_id
       WHERE v.agency_id = ?
       GROUP BY v.id, v.brand, v.model
       ORDER BY total_revenue DESC`
    },
    {
      name: '3. Reservation Breakdown',
      sql: `SELECT 
        r.status,
        COUNT(*) as count,
        SUM(r.total_price) as total_value
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
       GROUP BY r.status`
    },
    {
      name: '4. Vehicle Count',
      sql: `SELECT COUNT(*) as count FROM vehicles WHERE agency_id = ?`
    },
    {
      name: '5. Avg Rating',
      sql: `SELECT AVG(rating) as avg_rating
       FROM reviews rev
       JOIN vehicles v ON rev.vehicle_id = v.id
       WHERE v.agency_id = ?`
    },
    {
      name: '6. Documents Stats',
      sql: `SELECT 
        d.document_type,
        COUNT(*) as count
       FROM documents d
       JOIN reservations r ON d.reservation_id = r.id
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
       GROUP BY d.document_type`
    },
    {
      name: '7. Occupancy Rate',
      sql: `SELECT 
        COUNT(DISTINCT DATE(r.start_date)) as days_booked,
        DATEDIFF(MAX(r.end_date), MIN(r.start_date)) as total_days
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('accepted', 'completed')
         AND r.start_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)`
    },
    {
      name: '8. Current Month Revenue',
      sql: `SELECT COALESCE(SUM(r.total_price), 0) as revenue
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         AND MONTH(r.start_date) = MONTH(CURRENT_DATE())
         AND YEAR(r.start_date) = YEAR(CURRENT_DATE())`
    },
    {
      name: '9. Last Month Revenue',
      sql: `SELECT COALESCE(SUM(r.total_price), 0) as revenue
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         AND MONTH(r.start_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
         AND YEAR(r.start_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`
    },
    {
      name: '10. Top Clients',
      sql: `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(DISTINCT r.id) as booking_count,
        SUM(r.total_price) as total_spent
       FROM users u
       JOIN reservations r ON u.id = r.client_id
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? AND r.status IN ('completed', 'accepted')
         ${dateFilterWithAnd}
       GROUP BY u.id, u.first_name, u.last_name, u.email
       ORDER BY total_spent DESC
       LIMIT 5`
    },
    {
      name: '11. Avg Metrics',
      sql: `SELECT 
        AVG(DATEDIFF(r.end_date, r.start_date)) as avg_rental_days,
        AVG(r.total_price) as avg_booking_value,
        AVG(r.total_price / NULLIF(DATEDIFF(r.end_date, r.start_date), 0)) as avg_daily_rate
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         ${dateFilterWithAnd}`
    },
    {
      name: '12. Conversion Rate',
      sql: `SELECT 
        SUM(CASE WHEN r.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        COUNT(*) as total_requests
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ?
         ${dateFilterWithAnd}`
    },
    {
      name: '13. Weekday Distribution',
      sql: `SELECT 
        DAYNAME(r.start_date) as day_name,
        DAYOFWEEK(r.start_date) as day_num,
        COUNT(*) as booking_count,
        SUM(r.total_price) as revenue
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE v.agency_id = ? 
         AND r.status IN ('completed', 'accepted')
         ${dateFilterWithAnd}
       GROUP BY day_name, day_num
       ORDER BY day_num`
    },
    {
      name: '14. Upcoming Reservations',
      sql: `SELECT 
        r.id,
        r.start_date,
        r.end_date,
        r.total_price,
        r.status,
        v.brand,
        v.model,
        u.first_name,
        u.last_name,
        DATEDIFF(r.start_date, NOW()) as days_until_start
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN users u ON r.client_id = u.id
       WHERE v.agency_id = ? 
         AND r.start_date > NOW()
         AND r.status IN ('accepted', 'pending')
       ORDER BY r.start_date ASC
       LIMIT 10`
    }
  ];

  for (const query of queries) {
    try {
      console.log(`\n📊 ${query.name}`);
      const [result] = await connection.query(query.sql, [agency_id]);
      console.log(`✅ OK - ${result.length} lignes`);
      if (result.length > 0) {
        console.log('   Premier résultat:', JSON.stringify(result[0]).substring(0, 100));
      }
    } catch (error) {
      console.error(`❌ ERREUR dans ${query.name}`);
      console.error('   Message:', error.message);
      console.error('   Code:', error.code);
      if (error.sql) {
        console.error('   SQL:', error.sql.substring(0, 200));
      }
    }
  }

  await connection.end();
  console.log('\n✅ Test terminé');
}

testAllQueries().catch(console.error);
