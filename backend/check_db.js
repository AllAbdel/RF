const db = require('./config/database');

(async () => {
  try {
    console.log('=== VÉRIFICATION DE LA BASE DE DONNÉES ===\n');
    
    // Vérifier les agences
    const [agencies] = await db.query('SELECT id, name, email, logo FROM agencies');
    console.log('AGENCES DISPONIBLES:');
    console.log(JSON.stringify(agencies, null, 2));
    console.log('\n');
    
    // Vérifier si la table agency_join_requests existe
    try {
      const [requests] = await db.query('SELECT * FROM agency_join_requests WHERE status = "pending"');
      console.log('DEMANDES D\'ADHÉSION EN ATTENTE:');
      console.log(JSON.stringify(requests, null, 2));
    } catch (e) {
      console.log('❌ La table agency_join_requests n\'existe pas encore!');
      console.log('Vous devez exécuter le fichier fix_database.sql\n');
    }
    
    // Vérifier les clients sans agence
    const [clients] = await db.query(
      'SELECT id, email, first_name, last_name, user_type, agency_id, birth_date, license_date FROM users WHERE user_type="client" AND agency_id IS NULL'
    );
    console.log('\nCLIENTS SANS AGENCE:');
    console.log(JSON.stringify(clients, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
