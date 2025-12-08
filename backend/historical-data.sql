-- Script pour ajouter des réservations historiques étendues
-- Exécuter après avoir créé la base de données et les données de test initiales

-- D'abord, vérifier et créer les clients si nécessaire
-- Utiliser des IDs temporaires pour éviter les conflits
SET @client1 = (SELECT id FROM users WHERE email = 'client1@email.fr' LIMIT 1);
SET @client2 = (SELECT id FROM users WHERE email = 'client2@email.fr' LIMIT 1);
SET @client3 = (SELECT id FROM users WHERE email = 'client3@email.fr' LIMIT 1);

-- Créer les clients seulement s'ils n'existent pas
INSERT INTO users (email, password, first_name, last_name, phone, user_type, role)
SELECT * FROM (SELECT 'client1@email.fr', '$2a$10$YourHashedPasswordHere', 'Sophie', 'Lefebvre', '06 45 67 89 01', 'client', 'member') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client1@email.fr');

INSERT INTO users (email, password, first_name, last_name, phone, user_type, role)
SELECT * FROM (SELECT 'client2@email.fr', '$2a$10$YourHashedPasswordHere', 'Thomas', 'Dubois', '06 56 78 90 12', 'client', 'member') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client2@email.fr');

INSERT INTO users (email, password, first_name, last_name, phone, user_type, role)
SELECT * FROM (SELECT 'client3@email.fr', '$2a$10$YourHashedPasswordHere', 'Emma', 'Laurent', '06 67 89 01 23', 'client', 'member') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'client3@email.fr');

-- Récupérer les IDs réels des clients après insertion
SET @client1 = (SELECT id FROM users WHERE email = 'client1@email.fr' LIMIT 1);
SET @client2 = (SELECT id FROM users WHERE email = 'client2@email.fr' LIMIT 1);
SET @client3 = (SELECT id FROM users WHERE email = 'client3@email.fr' LIMIT 1);

-- Ajouter des réservations historiques sur plusieurs années
-- 2023 - Anciennes réservations (véhicules 5 et 6)
INSERT INTO reservations (vehicle_id, client_id, start_date, end_date, total_price, status, payment_status) VALUES
-- Janvier 2023
(5, 4, '2023-01-15 10:00:00', '2023-01-17 10:00:00', 720.00, 'completed', 'paid'),
(6, 5, '2023-01-20 14:00:00', '2023-01-23 14:00:00', 2520.00, 'completed', 'paid'),
-- Mars 2023
(5, 6, '2023-03-10 09:00:00', '2023-03-14 09:00:00', 1440.00, 'completed', 'paid'),
(6, 4, '2023-03-25 11:00:00', '2023-03-27 11:00:00', 1680.00, 'completed', 'paid'),
-- Mai 2023
(5, 5, '2023-05-05 15:00:00', '2023-05-10 15:00:00', 1800.00, 'completed', 'paid'),
(6, 6, '2023-05-18 08:00:00', '2023-05-21 08:00:00', 2520.00, 'completed', 'paid'),
-- Juillet 2023
(5, 4, '2023-07-01 10:00:00', '2023-07-05 10:00:00', 1440.00, 'completed', 'paid'),
(6, 5, '2023-07-15 14:00:00', '2023-07-20 14:00:00', 4200.00, 'completed', 'paid'),
-- Septembre 2023
(5, 6, '2023-09-10 09:00:00', '2023-09-13 09:00:00', 1080.00, 'completed', 'paid'),
(6, 4, '2023-09-25 11:00:00', '2023-09-28 11:00:00', 2520.00, 'completed', 'paid'),
-- Novembre 2023
(5, 5, '2023-11-05 15:00:00', '2023-11-10 15:00:00', 1800.00, 'completed', 'paid'),
(6, 6, '2023-11-20 08:00:00', '2023-11-25 08:00:00', 4200.00, 'completed', 'paid');

-- 2024 - Année complète (véhicules 5 et 6)
INSERT INTO reservations (vehicle_id, client_id, start_date, end_date, total_price, status, payment_status) VALUES
-- Janvier 2024
(5, 4, '2024-01-08 10:00:00', '2024-01-11 10:00:00', 1080.00, 'completed', 'paid'),
(6, 5, '2024-01-22 14:00:00', '2024-01-26 14:00:00', 3360.00, 'completed', 'paid'),
-- Février 2024
(5, 6, '2024-02-05 09:00:00', '2024-02-09 09:00:00', 1440.00, 'completed', 'paid'),
(6, 4, '2024-02-18 11:00:00', '2024-02-21 11:00:00', 2520.00, 'completed', 'paid'),
-- Mars 2024
(5, 5, '2024-03-03 15:00:00', '2024-03-07 15:00:00', 1440.00, 'completed', 'paid'),
(6, 6, '2024-03-20 08:00:00', '2024-03-24 08:00:00', 3360.00, 'completed', 'paid'),
-- Avril 2024
(5, 4, '2024-04-10 10:00:00', '2024-04-13 10:00:00', 1080.00, 'completed', 'paid'),
(6, 5, '2024-04-25 14:00:00', '2024-04-28 14:00:00', 2520.00, 'completed', 'paid'),
-- Mai 2024
(5, 6, '2024-05-05 09:00:00', '2024-05-10 09:00:00', 1800.00, 'completed', 'paid'),
(6, 4, '2024-05-20 11:00:00', '2024-05-23 11:00:00', 2520.00, 'completed', 'paid'),
-- Juin 2024
(5, 5, '2024-06-02 15:00:00', '2024-06-07 15:00:00', 1800.00, 'completed', 'paid'),
(6, 6, '2024-06-18 08:00:00', '2024-06-22 08:00:00', 3360.00, 'completed', 'paid'),
-- Juillet 2024
(5, 4, '2024-07-01 10:00:00', '2024-07-06 10:00:00', 1800.00, 'completed', 'paid'),
(6, 5, '2024-07-15 14:00:00', '2024-07-20 14:00:00', 4200.00, 'completed', 'paid'),
(5, 6, '2024-07-28 09:00:00', '2024-08-01 09:00:00', 1440.00, 'completed', 'paid'),
-- Août 2024
(6, 4, '2024-08-05 10:00:00', '2024-08-09 10:00:00', 3360.00, 'completed', 'paid'),
(5, 5, '2024-08-18 14:00:00', '2024-08-22 14:00:00', 1440.00, 'completed', 'paid'),
-- Septembre 2024
(6, 6, '2024-09-03 09:00:00', '2024-09-07 09:00:00', 3360.00, 'completed', 'paid'),
(5, 4, '2024-09-20 11:00:00', '2024-09-23 11:00:00', 1080.00, 'completed', 'paid'),
-- Octobre 2024
(6, 5, '2024-10-05 15:00:00', '2024-10-10 15:00:00', 4200.00, 'completed', 'paid'),
(5, 6, '2024-10-22 08:00:00', '2024-10-26 08:00:00', 1440.00, 'completed', 'paid'),
-- Novembre 2024
(6, 4, '2024-11-02 10:00:00', '2024-11-05 10:00:00', 2520.00, 'completed', 'paid'),
(5, 5, '2024-11-18 14:00:00', '2024-11-22 14:00:00', 1440.00, 'completed', 'paid'),
-- Décembre 2024
(6, 6, '2024-12-05 09:00:00', '2024-12-09 09:00:00', 3360.00, 'completed', 'paid'),
(5, 4, '2024-12-20 11:00:00', '2024-12-23 11:00:00', 1080.00, 'completed', 'paid');

-- 2025 - Année en cours (véhicules 5 et 6)
INSERT INTO reservations (vehicle_id, client_id, start_date, end_date, total_price, status, payment_status) VALUES
-- Janvier 2025
(6, 5, '2025-01-10 10:00:00', '2025-01-14 10:00:00', 3360.00, 'completed', 'paid'),
(5, 6, '2025-01-25 14:00:00', '2025-01-29 14:00:00', 1440.00, 'completed', 'paid'),
-- Février 2025
(6, 4, '2025-02-08 09:00:00', '2025-02-11 09:00:00', 2520.00, 'completed', 'paid'),
(5, 5, '2025-02-20 11:00:00', '2025-02-24 11:00:00', 1440.00, 'completed', 'paid'),
-- Mars 2025
(6, 6, '2025-03-05 15:00:00', '2025-03-09 15:00:00', 3360.00, 'completed', 'paid'),
(5, 4, '2025-03-22 08:00:00', '2025-03-26 08:00:00', 1440.00, 'completed', 'paid'),
-- Avril 2025
(6, 5, '2025-04-10 10:00:00', '2025-04-14 10:00:00', 3360.00, 'completed', 'paid'),
(5, 6, '2025-04-25 14:00:00', '2025-04-29 14:00:00', 1440.00, 'completed', 'paid'),
-- Mai 2025
(6, 4, '2025-05-05 09:00:00', '2025-05-08 09:00:00', 2520.00, 'completed', 'paid'),
(5, 5, '2025-05-20 11:00:00', '2025-05-24 11:00:00', 1440.00, 'completed', 'paid'),
-- Juin 2025
(6, 6, '2025-06-02 15:00:00', '2025-06-07 15:00:00', 4200.00, 'completed', 'paid'),
(5, 4, '2025-06-18 08:00:00', '2025-06-21 08:00:00', 1080.00, 'completed', 'paid'),
-- Juillet 2025
(6, 5, '2025-07-01 10:00:00', '2025-07-06 10:00:00', 4200.00, 'completed', 'paid'),
(5, 6, '2025-07-15 14:00:00', '2025-07-20 14:00:00', 1800.00, 'completed', 'paid'),
-- Août 2025
(6, 4, '2025-08-03 09:00:00', '2025-08-08 09:00:00', 4200.00, 'completed', 'paid'),
(5, 5, '2025-08-18 11:00:00', '2025-08-22 11:00:00', 1440.00, 'completed', 'paid'),
-- Septembre 2025
(6, 6, '2025-09-05 15:00:00', '2025-09-10 15:00:00', 4200.00, 'completed', 'paid'),
(5, 4, '2025-09-22 08:00:00', '2025-09-25 08:00:00', 1080.00, 'completed', 'paid'),
-- Octobre 2025
(6, 5, '2025-10-05 10:00:00', '2025-10-09 10:00:00', 3360.00, 'completed', 'paid'),
(5, 6, '2025-10-20 14:00:00', '2025-10-25 14:00:00', 1800.00, 'completed', 'paid'),
-- Novembre 2025
(6, 4, '2025-11-02 09:00:00', '2025-11-05 09:00:00', 2520.00, 'completed', 'paid'),
(5, 5, '2025-11-18 11:00:00', '2025-11-22 11:00:00', 1440.00, 'completed', 'paid');

-- Réservations en cours et à venir (Décembre 2025 et après) - véhicules 5 et 6
INSERT INTO reservations (vehicle_id, client_id, start_date, end_date, total_price, status, payment_status) VALUES
-- Déjà commencées
(5, 6, '2025-12-01 15:00:00', '2025-12-10 15:00:00', 3240.00, 'accepted', 'paid'),
(6, 4, '2025-12-05 08:00:00', '2025-12-12 08:00:00', 5880.00, 'accepted', 'paid'),
-- À venir très bientôt
(5, 5, '2025-12-10 10:00:00', '2025-12-15 10:00:00', 1800.00, 'accepted', 'paid'),
(6, 6, '2025-12-12 14:00:00', '2025-12-18 14:00:00', 5040.00, 'accepted', 'paid'),
(5, 4, '2025-12-15 09:00:00', '2025-12-20 09:00:00', 1800.00, 'accepted', 'paid'),
-- Fin décembre
(6, 5, '2025-12-20 11:00:00', '2025-12-26 11:00:00', 5040.00, 'pending', 'pending'),
(5, 6, '2025-12-25 15:00:00', '2025-12-31 15:00:00', 2160.00, 'pending', 'pending'),
-- Janvier 2026
(6, 4, '2026-01-05 08:00:00', '2026-01-10 08:00:00', 4200.00, 'pending', 'pending'),
(5, 5, '2026-01-15 10:00:00', '2026-01-20 10:00:00', 1800.00, 'pending', 'pending');

-- Ajouter des avis pour certaines réservations historiques
INSERT INTO reviews (reservation_id, client_id, vehicle_id, rating, comment) VALUES
-- Récupérer quelques IDs de réservations completed pour ajouter des avis
((SELECT id FROM reservations WHERE vehicle_id = 1 AND client_id = 4 AND status = 'completed' ORDER BY start_date DESC LIMIT 1), 4, 1, 5, 'Excellente voiture, très économique !'),
((SELECT id FROM reservations WHERE vehicle_id = 2 AND client_id = 5 AND status = 'completed' ORDER BY start_date DESC LIMIT 1), 5, 2, 4, 'SUV confortable pour la famille'),
((SELECT id FROM reservations WHERE vehicle_id = 3 AND client_id = 6 AND status = 'completed' ORDER BY start_date DESC LIMIT 1), 6, 3, 5, 'Tesla incroyable, autopilot au top !'),
((SELECT id FROM reservations WHERE vehicle_id = 8 AND client_id = 5 AND status = 'completed' ORDER BY start_date DESC LIMIT 1), 5, 8, 5, 'Mercedes classe A, un vrai bonheur'),
((SELECT id FROM reservations WHERE vehicle_id = 9 AND client_id = 6 AND status = 'completed' ORDER BY start_date DESC LIMIT 1), 6, 9, 4, 'Audi Q5 spacieux et puissant');

-- Vérifier le nombre total de réservations
SELECT 
  COUNT(*) as total_reservations,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
  MIN(start_date) as oldest_reservation,
  MAX(start_date) as newest_reservation
FROM reservations;

-- Vérifier les revenus par année
SELECT 
  YEAR(start_date) as year,
  COUNT(*) as bookings,
  SUM(total_price) as total_revenue
FROM reservations
WHERE status IN ('completed', 'accepted')
GROUP BY YEAR(start_date)
ORDER BY year DESC;
