const db = require('./config/database');

(async () => {
  try {
    console.log('Ajout colonne agency_id à reservations...');
    
    // Ajouter la colonne
    try {
      await db.query('ALTER TABLE reservations ADD COLUMN agency_id INT NULL AFTER client_id');
      console.log('✅ Colonne agency_id ajoutée');
      
      // Remplir avec les données existantes
      await db.query('UPDATE reservations r INNER JOIN vehicles v ON r.vehicle_id = v.id SET r.agency_id = v.agency_id');
      console.log('✅ Données migrées');
      
      // Rendre NOT NULL et ajouter contrainte
      await db.query('ALTER TABLE reservations MODIFY agency_id INT NOT NULL');
      await db.query('ALTER TABLE reservations ADD FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE');
      console.log('✅ Contraintes ajoutées');
      
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne agency_id existe déjà');
      } else {
        throw e;
      }
    }
    
    console.log('\n✅ Migration terminée!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();
