const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, user_type, agency_name } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    let agencyId = null;

    // Si c'est un membre d'agence, créer l'agence
    if (user_type === 'agency_member') {
      const [agencyResult] = await db.query(
        'INSERT INTO agencies (name, email) VALUES (?, ?)',
        [agency_name, email]
      );
      agencyId = agencyResult.insertId;
    }

    // Créer l'utilisateur
    const [result] = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, first_name, last_name, phone, user_type, agencyId, 
       user_type === 'agency_member' ? 'super_admin' : 'member']
    );

    const token = jwt.sign(
      { 
        id: result.insertId, 
        email, 
        user_type,
        agency_id: agencyId,
        role: user_type === 'agency_member' ? 'super_admin' : 'member'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: result.insertId,
        email,
        first_name,
        last_name,
        user_type,
        agency_id: agencyId,
        role: user_type === 'agency_member' ? 'super_admin' : 'member'
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, user_type } = req.body;

    // Récupérer l'utilisateur
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND user_type = ?',
      [email, user_type]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        user_type: user.user_type,
        agency_id: user.agency_id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        agency_id: user.agency_id,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.*, a.name as agency_name 
       FROM users u 
       LEFT JOIN agencies a ON u.agency_id = a.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];
    delete user.password;

    res.json({ user });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
};

module.exports = {
  register,
  login,
  getProfile
};
