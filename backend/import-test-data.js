const pool = require('./config/database');
const bcrypt = require('bcrypt');

async function importTestData() {
  try {
    console.log('🔄 Import des données de test...\n');
    
    // Hash du mot de passe "password123"
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // 1. Agences
    console.log('📦 Import des agences...');
    await pool.query(`
      INSERT INTO agencies (name, email, phone, address) VALUES
      ('Location Premium Paris', 'contact@premium-paris.fr', '01 23 45 67 89', '15 Avenue des Champs-Élysées, 75008 Paris'),
      ('Auto Rent Lyon', 'info@autorent-lyon.fr', '04 78 90 12 34', '45 Rue de la République, 69002 Lyon'),
      ('Voitures Express Marseille', 'contact@express-marseille.fr', '04 91 23 45 67', '78 La Canebière, 13001 Marseille')
      ON DUPLICATE KEY UPDATE name=name
    `);
    console.log('✅ 3 agences importées\n');
    
    // 2. Utilisateurs agence
    console.log('👥 Import des utilisateurs agence...');
    await pool.query(`
      INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role, email_verified) VALUES
      ('admin@premium-paris.fr', ?, 'Jean', 'Dupont', '06 12 34 56 78', 'agency_member', 1, 'super_admin', TRUE),
      ('manager@autorent-lyon.fr', ?, 'Marie', 'Martin', '06 23 45 67 89', 'agency_member', 2, 'super_admin', TRUE),
      ('team@express-marseille.fr', ?, 'Pierre', 'Bernard', '06 34 56 78 90', 'agency_member', 3, 'admin', TRUE)
      ON DUPLICATE KEY UPDATE email=email
    `, [hashedPassword, hashedPassword, hashedPassword]);
    console.log('✅ 3 membres d\'agence importés\n');
    
    // 3. Clients
    console.log('👤 Import des clients...');
    await pool.query(`
      INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role, email_verified) VALUES
      ('client1@email.fr', ?, 'Sophie', 'Lefebvre', '06 45 67 89 01', 'client', NULL, 'member', TRUE),
      ('client2@email.fr', ?, 'Thomas', 'Dubois', '06 56 78 90 12', 'client', NULL, 'member', TRUE),
      ('client3@email.fr', ?, 'Emma', 'Laurent', '06 67 89 01 23', 'client', NULL, 'member', TRUE)
      ON DUPLICATE KEY UPDATE email=email
    `, [hashedPassword, hashedPassword, hashedPassword]);
    console.log('✅ 3 clients importés\n');
    
    // 4. Véhicules
    console.log('🚗 Import des véhicules...');
    await pool.query(`
      INSERT INTO vehicles (agency_id, brand, model, seats, engine, tank_capacity, price_per_hour, fuel_type, description, release_date, location, status) VALUES
      (1, 'Renault', 'Clio', 5, '1.5 dCi', 45, 15.00, 'diesel', 'Petite citadine économique, parfaite pour la ville', '2022-03-15', 'Paris', 'available'),
      (1, 'Peugeot', '3008', 5, '2.0 BlueHDi', 53, 35.00, 'diesel', 'SUV spacieux et confortable pour les longs trajets', '2023-01-20', 'Paris', 'available'),
      (1, 'Tesla', 'Model 3', 5, 'Électrique', 0, 45.00, 'electrique', 'Berline électrique haut de gamme avec autopilot', '2023-06-10', 'Paris', 'available'),
      (2, 'Citroën', 'C3', 5, '1.2 PureTech', 45, 18.00, 'essence', 'Citadine moderne et économique', '2022-09-05', 'Lyon', 'available'),
      (2, 'Volkswagen', 'Golf', 5, '1.5 TSI', 50, 25.00, 'essence', 'Compacte polyvalente, idéale pour tous les trajets', '2023-02-28', 'Lyon', 'available'),
      (2, 'BMW', 'X3', 5, '2.0d xDrive', 65, 50.00, 'diesel', 'SUV premium avec toutes les options', '2023-05-15', 'Lyon', 'available'),
      (3, 'Renault', 'Zoe', 5, 'Électrique', 0, 20.00, 'electrique', 'Citadine électrique pratique et écologique', '2022-11-30', 'Marseille', 'available'),
      (3, 'Mercedes', 'Classe A', 5, '1.5 dCi', 43, 40.00, 'diesel', 'Berline compacte premium', '2023-03-20', 'Marseille', 'available'),
      (3, 'Audi', 'Q5', 5, '2.0 TDI', 75, 55.00, 'diesel', 'SUV haut de gamme spacieux et puissant', '2023-04-10', 'Marseille', 'available')
    `);
    
    const [vehicles] = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    console.log(`✅ ${vehicles[0].count} véhicules dans la base\n`);
    
    // 5. Images des véhicules
    console.log('🖼️  Import des images...');
    await pool.query(`
      INSERT INTO vehicle_images (vehicle_id, image_url, is_primary) VALUES
      (1, '/uploads/vehicles/renault-clio-1.jpg', 1),
      (1, '/uploads/vehicles/renault-clio-2.jpg', 0),
      (2, '/uploads/vehicles/peugeot-3008-1.jpg', 1),
      (2, '/uploads/vehicles/peugeot-3008-2.jpg', 0),
      (3, '/uploads/vehicles/tesla-model3-1.jpg', 1),
      (3, '/uploads/vehicles/tesla-model3-2.jpg', 0),
      (4, '/uploads/vehicles/citroen-c3-1.jpg', 1),
      (5, '/uploads/vehicles/vw-golf-1.jpg', 1),
      (6, '/uploads/vehicles/bmw-x3-1.jpg', 1),
      (7, '/uploads/vehicles/renault-zoe-1.jpg', 1),
      (8, '/uploads/vehicles/mercedes-a-1.jpg', 1),
      (9, '/uploads/vehicles/audi-q5-1.jpg', 1)
      ON DUPLICATE KEY UPDATE image_url=image_url
    `);
    console.log('✅ Images importées\n');
    
    console.log('═══════════════════════════════════════');
    console.log('✅ IMPORT TERMINÉ !');
    console.log('═══════════════════════════════════════');
    console.log('\n📋 Comptes de test créés :');
    console.log('   Email: admin@premium-paris.fr');
    console.log('   Mot de passe: password123\n');
    console.log('   Email: client1@email.fr');
    console.log('   Mot de passe: password123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message);
    process.exit(1);
  }
}

importTestData();
