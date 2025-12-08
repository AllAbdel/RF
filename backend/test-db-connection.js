const db = require('./config/database');

async function testDB() {
  try {
    console.log('🔍 Test de connexion à la base de données...\n');
    
    // Test connexion
    const [testResult] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ Connexion BDD: OK\n');
    
    // Compter les utilisateurs
    const [users] = await db.query('SELECT COUNT(*) as total FROM users');
    console.log(`👥 Utilisateurs: ${users[0].total}`);
    
    // Compter les véhicules
    const [vehicles] = await db.query('SELECT COUNT(*) as total FROM vehicles');
    console.log(`🚗 Véhicules: ${vehicles[0].total}`);
    
    // Compter les agences
    const [agencies] = await db.query('SELECT COUNT(*) as total FROM agencies');
    console.log(`🏢 Agences: ${agencies[0].total}`);
    
    // Compter les réservations
    const [reservations] = await db.query('SELECT COUNT(*) as total FROM reservations');
    console.log(`📅 Réservations: ${reservations[0].total}`);
    
    // Tester un utilisateur spécifique
    const [testUser] = await db.query('SELECT id, email, user_type FROM users LIMIT 1');
    if (testUser.length > 0) {
      console.log(`\n✅ Exemple utilisateur:`);
      console.log(`   ID: ${testUser[0].id}`);
      console.log(`   Email: ${testUser[0].email}`);
      console.log(`   Type: ${testUser[0].user_type}`);
    }
    
    // Tester un véhicule
    const [testVehicle] = await db.query('SELECT id, brand, model, daily_rate FROM vehicles LIMIT 1');
    if (testVehicle.length > 0) {
      console.log(`\n✅ Exemple véhicule:`);
      console.log(`   ID: ${testVehicle[0].id}`);
      console.log(`   Marque: ${testVehicle[0].brand} ${testVehicle[0].model}`);
      console.log(`   Prix/jour: ${testVehicle[0].daily_rate}€`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Code:', error.code);
    if (error.sqlMessage) {
      console.error('SQL:', error.sqlMessage);
    }
    process.exit(1);
  }
}

testDB();
