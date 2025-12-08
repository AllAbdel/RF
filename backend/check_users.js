const db = require('./config/database');

(async () => {
  try {
    console.log('=== UTILISATEURS DES AGENCES ===\n');
    
    const [users] = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.user_type, u.agency_id, a.name as agency_name
      FROM users u
      LEFT JOIN agencies a ON u.agency_id = a.id
      WHERE u.user_type = 'agency_member'
      ORDER BY a.name, u.role
    `);
    
    console.log('Utilisateurs membres d\'agences:');
    users.forEach(user => {
      console.log(`\n- ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`  Rôle: ${user.role}`);
      console.log(`  Agence: ${user.agency_name || 'Aucune'} (ID: ${user.agency_id})`);
      console.log(`  isAdmin: ${user.role === 'admin' || user.role === 'super_admin' ? 'OUI ✅' : 'NON ❌'}`);
    });
    
    console.log('\n\n=== DEMANDES EN ATTENTE ===\n');
    
    const [requests] = await db.query(`
      SELECT jr.id, jr.status, jr.created_at,
             u.email as user_email, u.first_name, u.last_name,
             a.name as agency_name, a.id as agency_id
      FROM agency_join_requests jr
      JOIN users u ON jr.user_id = u.id
      JOIN agencies a ON jr.agency_id = a.id
      ORDER BY jr.created_at DESC
    `);
    
    if (requests.length === 0) {
      console.log('Aucune demande d\'adhésion');
    } else {
      requests.forEach(req => {
        console.log(`\n- ${req.first_name} ${req.last_name} (${req.user_email})`);
        console.log(`  Veut rejoindre: ${req.agency_name} (ID: ${req.agency_id})`);
        console.log(`  Status: ${req.status}`);
        console.log(`  Date: ${req.created_at}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
