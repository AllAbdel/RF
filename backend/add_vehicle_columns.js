const db = require('./config/database');

(async () => {
  try {
    console.log('Ajout des colonnes manquantes...');
    
    // Vérifier et ajouter terms_pdf
    try {
      await db.query('ALTER TABLE vehicles ADD COLUMN terms_pdf VARCHAR(255) NULL AFTER description');
      console.log('✅ Colonne terms_pdf ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne terms_pdf existe déjà');
      } else throw e;
    }
    
    // Vérifier et ajouter pickup_address
    try {
      await db.query('ALTER TABLE vehicles ADD COLUMN pickup_address TEXT NULL AFTER location');
      console.log('✅ Colonne pickup_address ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne pickup_address existe déjà');
      } else throw e;
    }
    
    // Vérifier et ajouter return_address
    try {
      await db.query('ALTER TABLE vehicles ADD COLUMN return_address TEXT NULL AFTER pickup_address');
      console.log('✅ Colonne return_address ajoutée');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne return_address existe déjà');
      } else throw e;
    }
    
    console.log('\n✅ Vérification terminée!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
