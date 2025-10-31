-- Données de test pour la plateforme de location de voitures
-- À exécuter après avoir créé la base de données avec database.sql

USE car_rental;

-- Agences de test
INSERT INTO agencies (name, email, phone, address) VALUES
('Location Premium Paris', 'contact@premium-paris.fr', '01 23 45 67 89', '15 Avenue des Champs-Élysées, 75008 Paris'),
('Auto Rent Lyon', 'info@autorent-lyon.fr', '04 78 90 12 34', '45 Rue de la République, 69002 Lyon'),
('Voitures Express Marseille', 'contact@express-marseille.fr', '04 91 23 45 67', '78 La Canebière, 13001 Marseille');

-- Utilisateurs agence (mot de passe: "password123" pour tous)
INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role) VALUES
('admin@premium-paris.fr', '$2a$10$YourHashedPasswordHere', 'Jean', 'Dupont', '06 12 34 56 78', 'agency_member', 1, 'super_admin'),
('manager@autorent-lyon.fr', '$2a$10$YourHashedPasswordHere', 'Marie', 'Martin', '06 23 45 67 89', 'agency_member', 2, 'super_admin'),
('team@express-marseille.fr', '$2a$10$YourHashedPasswordHere', 'Pierre', 'Bernard', '06 34 56 78 90', 'agency_member', 3, 'admin');

-- Clients de test
INSERT INTO users (email, password, first_name, last_name, phone, user_type, agency_id, role) VALUES
('client1@email.fr', '$2a$10$YourHashedPasswordHere', 'Sophie', 'Lefebvre', '06 45 67 89 01', 'client', NULL, 'member'),
('client2@email.fr', '$2a$10$YourHashedPasswordHere', 'Thomas', 'Dubois', '06 56 78 90 12', 'client', NULL, 'member'),
('client3@email.fr', '$2a$10$YourHashedPasswordHere', 'Emma', 'Laurent', '06 67 89 01 23', 'client', NULL, 'member');

-- Véhicules de test
INSERT INTO vehicles (agency_id, brand, model, seats, engine, tank_capacity, price_per_hour, fuel_type, description, release_date, location, status) VALUES
(1, 'Renault', 'Clio', 5, '1.5 dCi', 45, 15.00, 'diesel', 'Petite citadine économique, parfaite pour la ville', '2022-03-15', 'Paris', 'available'),
(1, 'Peugeot', '3008', 5, '2.0 BlueHDi', 53, 35.00, 'diesel', 'SUV spacieux et confortable pour les longs trajets', '2023-01-20', 'Paris', 'available'),
(1, 'Tesla', 'Model 3', 5, 'Électrique', 0, 45.00, 'electrique', 'Berline électrique haut de gamme avec autopilot', '2023-06-10', 'Paris', 'available'),
(2, 'Citroën', 'C3', 5, '1.2 PureTech', 45, 18.00, 'essence', 'Citadine moderne et économique', '2022-09-05', 'Lyon', 'available'),
(2, 'Volkswagen', 'Golf', 5, '1.5 TSI', 50, 25.00, 'essence', 'Compacte polyvalente, idéale pour tous les trajets', '2023-02-28', 'Lyon', 'available'),
(2, 'BMW', 'X3', 5, '2.0d xDrive', 65, 50.00, 'diesel', 'SUV premium avec toutes les options', '2023-05-15', 'Lyon', 'available'),
(3, 'Renault', 'Zoe', 5, 'Électrique', 0, 20.00, 'electrique', 'Citadine électrique pratique et écologique', '2022-11-30', 'Marseille', 'available'),
(3, 'Mercedes', 'Classe A', 5, '1.5 dCi', 43, 40.00, 'diesel', 'Berline compacte premium', '2023-03-20', 'Marseille', 'available'),
(3, 'Audi', 'Q5', 5, '2.0 TDI', 75, 55.00, 'diesel', 'SUV haut de gamme spacieux et puissant', '2023-04-10', 'Marseille', 'available');

-- Images pour les véhicules (URLs d'exemple)
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
(9, '/uploads/vehicles/audi-q5-1.jpg', 1);

-- Réservations de test
INSERT INTO reservations (vehicle_id, client_id, start_date, end_date, total_price, status, payment_status) VALUES
(1, 4, '2024-11-01 10:00:00', '2024-11-03 10:00:00', 720.00, 'completed', 'paid'),
(2, 5, '2024-11-05 14:00:00', '2024-11-07 14:00:00', 1680.00, 'completed', 'paid'),
(3, 6, '2024-11-10 09:00:00', '2024-11-12 09:00:00', 2160.00, 'accepted', 'paid'),
(4, 4, '2024-11-15 11:00:00', '2024-11-17 11:00:00', 864.00, 'pending', 'pending'),
(5, 5, '2024-11-20 15:00:00', '2024-11-22 15:00:00', 1200.00, 'pending', 'pending');

-- Avis de test
INSERT INTO reviews (reservation_id, client_id, vehicle_id, rating, comment) VALUES
(1, 4, 1, 5, 'Excellente voiture, très économique et facile à conduire en ville !'),
(2, 5, 2, 4, 'SUV confortable, parfait pour notre week-end en famille. Juste un peu gourmand.'),
(3, 6, 3, 5, 'Tesla incroyable ! L''autopilot est impressionnant. Je recommande vivement.');

-- Conversations de test
INSERT INTO conversations (client_id, agency_id) VALUES
(4, 1),
(5, 2),
(6, 3);

-- Messages de test
INSERT INTO messages (conversation_id, sender_id, message, is_read) VALUES
(1, 4, 'Bonjour, je souhaiterais savoir si le véhicule est disponible ce week-end ?', 1),
(1, 1, 'Bonjour ! Oui, la Renault Clio est disponible. N''hésitez pas à réserver.', 1),
(2, 5, 'Est-ce que le véhicule a un GPS intégré ?', 1),
(2, 2, 'Oui, tous nos véhicules sont équipés de GPS récents.', 1);

-- Notifications de test
INSERT INTO notifications (user_id, type, title, message, is_read, related_id) VALUES
(1, 'new_reservation', 'Nouvelle réservation', 'Vous avez reçu une nouvelle demande de réservation', 1, 4),
(1, 'new_message', 'Nouveau message', 'Vous avez reçu un nouveau message d''un client', 1, 1),
(4, 'reservation_update', 'Réservation acceptée', 'Votre réservation a été acceptée par l''agence', 1, 3),
(5, 'new_message', 'Nouveau message', 'Vous avez reçu une réponse de l''agence', 0, 2);

-- Note: Les mots de passe hashés ci-dessus ne sont pas valides
-- Pour tester, utilisez le formulaire d'inscription pour créer de vrais comptes
-- ou remplacez les hashes par des vrais hashes bcrypt générés

-- Commandes utiles pour tester:
-- SELECT * FROM vehicles WHERE status = 'available';
-- SELECT * FROM reservations WHERE status = 'pending';
-- SELECT v.*, a.name as agency_name FROM vehicles v JOIN agencies a ON v.agency_id = a.id;
