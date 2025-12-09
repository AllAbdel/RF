const pool = require('./config/database');

async function verifyAllUsers() {
  try {
    const [result] = await pool.query('UPDATE users SET email_verified = TRUE');
    console.log(`✅ Tous les utilisateurs sont maintenant vérifiés (${result.affectedRows} utilisateurs)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

verifyAllUsers();
