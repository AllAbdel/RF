const db = require('./config/database');

(async () => {
  try {
    console.log('=== VÉRIFICATION TABLE AGENCIES ===\n');
    
    const [result] = await db.query('DESCRIBE agencies');
    console.log('Colonnes de la table agencies:');
    result.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n=== VÉRIFICATION DONNÉES ===\n');
    const [agencies] = await db.query('SELECT id, name, rental_conditions FROM agencies LIMIT 3');
    console.log('Échantillon des agences:');
    agencies.forEach(agency => {
      console.log(`\nAgence: ${agency.name}`);
      console.log(`Conditions: ${agency.rental_conditions ? 'Définies' : 'NULL'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('ERREUR:', error.message);
    console.error('\nLa colonne rental_conditions n\'existe probablement pas encore.');
    console.error('Exécutez le fichier backend/migration_agency_conditions.sql dans phpMyAdmin');
    process.exit(1);
  }
})();
