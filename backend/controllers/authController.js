const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, birth_date, license_date, user_type, agency_name } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Validation pour les clients : âge minimum et permis
    if (user_type === 'client') {
      if (!birth_date || !license_date) {
        return res.status(400).json({ error: 'La date de naissance et la date d\'obtention du permis sont obligatoires pour les clients' });
      }

      const today = new Date();
      const birthDateObj = new Date(birth_date);
      const licenseDateObj = new Date(license_date);
      
      // Calculer l'âge
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }

      // Vérifier l'âge minimum (18 ans)
      if (age < 18) {
        return res.status(400).json({ error: 'Vous devez avoir au moins 18 ans pour vous inscrire' });
      }

      // Vérifier que la date du permis n'est pas dans le futur
      if (licenseDateObj > today) {
        return res.status(400).json({ error: 'La date d\'obtention du permis ne peut pas être dans le futur' });
      }

      // Vérifier que la date du permis est après la date de naissance
      if (licenseDateObj <= birthDateObj) {
        return res.status(400).json({ error: 'La date d\'obtention du permis doit être après votre date de naissance' });
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    let agencyId = null;

    // Si c'est un membre d'agence, créer l'agence
    if (user_type === 'agency_member') {
      const logoPath = req.file ? `/uploads/agencies/${req.file.filename}` : null;
      const [agencyResult] = await db.query(
        'INSERT INTO agencies (name, email, logo) VALUES (?, ?, ?)',
        [agency_name, email, logoPath]
      );
      agencyId = agencyResult.insertId;
    }

    // Créer l'utilisateur
    const [result] = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, birth_date, license_date, user_type, agency_id, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, first_name, last_name, phone, birth_date || null, license_date || null, user_type, agencyId, 
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
