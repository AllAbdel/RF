const db = require('./config/database');

async function fixReservationStatusEnum() {
  try {
    console.log('🔧 Modification de l\'ENUM status dans reservations...');
    
    // Modifier l'ENUM pour ajouter 'confirmed' et 'in_progress'
    await db.query(`
      ALTER TABLE reservations 
      MODIFY COLUMN status ENUM('pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled') 
      DEFAULT 'pending'
    `);
    
    console.log('✅ ENUM status mis à jour avec succès !');
    console.log('   Valeurs disponibles: pending, confirmed, accepted, in_progress, completed, rejected, cancelled');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixReservationStatusEnum();
