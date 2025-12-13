const db = require('./config/database');

(async () => {
  try {
    console.log('Ajout des colonnes de conditions de location...');
    
    // Ajouter rental_conditions
    try {
      await db.query('ALTER TABLE agencies ADD COLUMN rental_conditions TEXT NULL AFTER address');
      console.log('✅ Colonne rental_conditions ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne rental_conditions existe déjà');
      } else throw e;
    }
    
    // Ajouter rental_conditions_pdf
    try {
      await db.query('ALTER TABLE agencies ADD COLUMN rental_conditions_pdf VARCHAR(255) NULL AFTER rental_conditions');
      console.log('✅ Colonne rental_conditions_pdf ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne rental_conditions_pdf existe déjà');
      } else throw e;
    }
    
    console.log('\n✅ Vérification terminée!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
