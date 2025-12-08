// Script pour charger les données historiques dans la base de données
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function loadHistoricalData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'car_rental',
    multipleStatements: true
  });

  try {
    console.log('Connexion à la base de données...');
    
    // Vérifier d'abord les véhicules et clients existants
    const [vehicles] = await connection.query('SELECT COUNT(*) as count FROM vehicles');
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users WHERE user_type = "client"');
    
    console.log(`Véhicules dans la base : ${vehicles[0].count}`);
    console.log(`Clients dans la base : ${users[0].count}`);
    
    if (vehicles[0].count === 0) {
      console.log('⚠️ Aucun véhicule trouvé. Veuillez d\'abord exécuter database.sql et test-data.sql');
      return;
    }
    
    const sqlFile = fs.readFileSync(path.join(__dirname, 'historical-simple.sql'), 'utf8');
    
    console.log('Exécution du script SQL...');
    await connection.query(sqlFile);
    
    console.log('✅ Données historiques chargées avec succès !');
    
    // Vérifier le résultat
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        MIN(start_date) as oldest_reservation,
        MAX(start_date) as newest_reservation,
        SUM(CASE WHEN status IN ('completed', 'accepted') THEN total_price ELSE 0 END) as total_revenue
      FROM reservations
    `);
    
    console.log('\n📊 Résumé des réservations :');
    console.log('Total :', stats[0].total_reservations);
    console.log('Complétées :', stats[0].completed);
    console.log('Acceptées :', stats[0].accepted);
    console.log('En attente :', stats[0].pending);
    console.log('Plus ancienne :', stats[0].oldest_reservation);
    console.log('Plus récente :', stats[0].newest_reservation);
    console.log('Revenus totaux :', stats[0].total_revenue, '€');
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données :', error.message);
  } finally {
    await connection.end();
  }
}

loadHistoricalData();
