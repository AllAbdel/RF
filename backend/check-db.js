const pool = require('./config/database');

async function checkDatabase() {
  try {
    // Compter les utilisateurs
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Utilisateurs: ${users[0].count}`);
    
    // Compter les agences
    const [agencies] = await pool.query('SELECT COUNT(*) as count FROM agencies');
    console.log(`🏢 Agences: ${agencies[0].count}`);
    
    // Compter les véhicules
    const [vehicles] = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    console.log(`🚗 Véhicules: ${vehicles[0].count}`);
    
    // Afficher quelques véhicules si ils existent
    if (vehicles[0].count > 0) {
      const [allVehicles] = await pool.query('SELECT id, model, brand, year FROM vehicles LIMIT 5');
      console.log('\nVéhicules en base:');
      allVehicles.forEach(v => console.log(`  - ${v.brand} ${v.model} (${v.year})`));
    } else {
      console.log('\n⚠️  Aucun véhicule trouvé en base de données');
      console.log('Vous devez importer les données de test avec: node test-data.sql');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkDatabase();
