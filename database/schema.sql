-- ============================================================
--  TranspoBot — Base de données MySQL
--  Projet GLSi L3 — ESP/UCAD
-- ============================================================

-- Encodage : sans ceci, les INSERT avec accents peuvent être stockés en latin1 (affichage « ThiÃ¨s », etc.).
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Véhicules
CREATE TABLE vehicules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    immatriculation VARCHAR(20) NOT NULL UNIQUE,
    type ENUM('bus','minibus','taxi') NOT NULL,
    capacite INT NOT NULL,
    statut ENUM('actif','maintenance','hors_service') DEFAULT 'actif',
    kilometrage INT DEFAULT 0,
    date_acquisition DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chauffeurs
CREATE TABLE chauffeurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    numero_permis VARCHAR(30) UNIQUE NOT NULL,
    categorie_permis VARCHAR(5),
    disponibilite BOOLEAN DEFAULT TRUE,
    vehicule_id INT,
    date_embauche DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicule_id) REFERENCES vehicules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lignes / trajets types
CREATE TABLE lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    nom VARCHAR(100),
    origine VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DECIMAL(6,2),
    duree_minutes INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tarifs
CREATE TABLE tarifs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ligne_id INT NOT NULL,
    type_client ENUM('normal','etudiant','senior') DEFAULT 'normal',
    prix DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (ligne_id) REFERENCES lignes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trajets effectués
CREATE TABLE trajets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ligne_id INT NOT NULL,
    chauffeur_id INT NOT NULL,
    vehicule_id INT NOT NULL,
    date_heure_depart DATETIME NOT NULL,
    date_heure_arrivee DATETIME,
    statut ENUM('planifie','en_cours','termine','annule') DEFAULT 'planifie',
    nb_passagers INT DEFAULT 0,
    recette DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ligne_id) REFERENCES lignes(id),
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id),
    FOREIGN KEY (vehicule_id) REFERENCES vehicules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incidents
CREATE TABLE incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trajet_id INT NOT NULL,
    type ENUM('panne','accident','retard','autre') NOT NULL,
    description TEXT,
    gravite ENUM('faible','moyen','grave') DEFAULT 'faible',
    date_incident DATETIME NOT NULL,
    resolu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Données de test (jeu étendu : flotte, chauffeurs, lignes, trajets, incidents)
-- ============================================================
INSERT INTO vehicules (immatriculation, type, capacite, statut, kilometrage, date_acquisition) VALUES
('DK-1234-AB', 'bus', 60, 'actif', 45200, '2021-03-15'),
('DK-5678-CD', 'minibus', 25, 'actif', 32100, '2022-06-01'),
('DK-9012-EF', 'bus', 60, 'maintenance', 78200, '2019-11-20'),
('DK-3456-GH', 'taxi', 5, 'actif', 120400, '2020-01-10'),
('DK-7890-IJ', 'minibus', 25, 'actif', 15200, '2023-09-05'),
('DK-2468-KL', 'bus', 60, 'actif', 38900, '2020-08-20'),
('DK-1357-MN', 'minibus', 22, 'actif', 21400, '2022-01-12'),
('DK-9753-OP', 'taxi', 5, 'actif', 98000, '2019-05-03'),
('DK-1122-QR', 'bus', 55, 'hors_service', 195000, '2017-02-14'),
('DK-3344-ST', 'minibus', 18, 'maintenance', 67000, '2018-11-01'),
('DK-5566-UV', 'taxi', 5, 'actif', 45000, '2021-09-09'),
('DK-7788-WX', 'bus', 60, 'actif', 12000, '2024-03-01'),
('DK-9900-YZ', 'minibus', 25, 'actif', 8800, '2024-06-15'),
('DK-2244-AA', 'bus', 60, 'actif', 56000, '2019-07-22'),
('DK-6688-BB', 'taxi', 5, 'actif', 72000, '2020-12-01');

INSERT INTO chauffeurs (nom, prenom, telephone, numero_permis, categorie_permis, vehicule_id, date_embauche) VALUES
('FAMA', 'Adja', '+221771100101', 'P-2024-201', 'D', 1, '2024-01-15'),
('NDIAYE', 'Seynabou', '+221771100102', 'P-2024-202', 'D', 2, '2024-02-01'),
('RASSOUL', 'Mohamed', '+221771100103', 'P-2024-203', 'D', 3, '2024-02-10'),
('SEYE', 'Mara', '+221771100104', 'P-2024-204', 'B', 4, '2023-11-20'),
('NGOM', 'Mor', '+221771100105', 'P-2024-205', 'D', 5, '2024-03-01'),
('DIOP', 'Mamadou', '+221771234567', 'P-2019-001', 'D', 6, '2019-04-01'),
('FALL', 'Ibrahima', '+221772345678', 'P-2020-002', 'D', 7, '2020-07-15'),
('SALL', 'Khadim', '+221773456001', 'P-2023-206', 'D', 8, '2023-05-12'),
('GUEYE', 'Astou', '+221773456002', 'P-2022-207', 'B', 9, '2022-09-01'),
('THIAM', 'Cheikh', '+221773456003', 'P-2021-208', 'D', 10, '2021-03-18'),
('CISSE', 'Fatou', '+221773456004', 'P-2020-209', 'D', 11, '2020-01-07'),
('TOURE', 'Aïssatou', '+221773456005', 'P-2023-210', 'B', 12, '2023-08-22'),
('SARR', 'Malick', '+221773456006', 'P-2022-211', 'D', 13, '2022-04-30'),
('BA', 'Codou', '+221773456007', 'P-2024-212', 'D', 14, '2024-01-02'),
('SY', 'Moussa', '+221773456008', 'P-2019-213', 'D', 15, '2019-10-10'),
('WADE', 'Bineta', '+221773456009', 'P-2021-214', 'B', NULL, '2021-06-14'),
('KANE', 'Alioune', '+221773456010', 'P-2020-215', 'D', NULL, '2020-11-25'),
('LY', 'Pape', '+221773456011', 'P-2023-216', 'D', NULL, '2023-02-28');

INSERT INTO chauffeurs (nom, prenom, telephone, numero_permis, categorie_permis, vehicule_id, date_embauche) VALUES
('NIANG', 'Myriam', '+221781100301', 'P-2025-301', 'B', NULL, '2025-01-10'),
('TOURE', 'Penda', '+221781100302', 'P-2025-302', 'D', 1, '2025-02-01'),
('FAYE', 'Abdourahmane', '+221781100303', 'P-2025-303', 'D', 2, '2020-05-15'),
('FAYE', 'Ousmane', '+221781100304', 'P-2025-304', 'D', 3, '2024-09-01'),
('DIALLO', 'Maimouna', '+221781100305', 'P-2025-305', 'B', 4, '2023-11-20');

INSERT INTO lignes (code, nom, origine, destination, distance_km, duree_minutes) VALUES
('L1', 'Ligne Dakar-Thiès', 'Dakar', 'Thiès', 70.5, 90),
('L2', 'Ligne Dakar-Mbour', 'Dakar', 'Mbour', 82.0, 120),
('L3', 'Ligne Centre-Banlieue', 'Plateau', 'Pikine', 15.0, 45),
('L4', 'Ligne Aéroport', 'Centre-ville', 'AIBD', 45.0, 60),
('L5', 'Ligne Dakar-Saint-Louis', 'Dakar', 'Saint-Louis', 260.0, 240),
('L6', 'Ligne Dakar-Kaolack', 'Dakar', 'Kaolack', 210.0, 180),
('L7', 'Ligne Rufisque express', 'Dakar', 'Rufisque', 28.0, 50),
('L8', 'Ligne Parcelles-Ouakam', 'Parcelles Assainies', 'Ouakam', 18.0, 40);

INSERT INTO tarifs (ligne_id, type_client, prix) VALUES
(1, 'normal', 2500), (1, 'etudiant', 1500), (1, 'senior', 1800),
(2, 'normal', 3000), (2, 'etudiant', 1800), (2, 'senior', 2200),
(3, 'normal', 500),  (3, 'etudiant', 300),  (3, 'senior', 400),
(4, 'normal', 5000), (4, 'etudiant', 3000), (4, 'senior', 4000),
(5, 'normal', 8000), (5, 'etudiant', 5000), (5, 'senior', 6500),
(6, 'normal', 6500), (6, 'etudiant', 4000), (6, 'senior', 5500),
(7, 'normal', 800),  (7, 'etudiant', 500),  (7, 'senior', 600),
(8, 'normal', 600),  (8, 'etudiant', 350),  (8, 'senior', 450);

INSERT INTO trajets (ligne_id, chauffeur_id, vehicule_id, date_heure_depart, date_heure_arrivee, statut, nb_passagers, recette) VALUES
(1, 1, 1, '2026-03-01 06:00:00', '2026-03-01 07:30:00', 'termine', 55, 137500),
(1, 2, 2, '2026-03-01 08:00:00', '2026-03-01 09:30:00', 'termine', 20, 50000),
(2, 3, 3, '2026-03-02 07:00:00', '2026-03-02 09:00:00', 'termine', 24, 72000),
(3, 4, 4, '2026-03-05 07:30:00', '2026-03-05 08:15:00', 'termine', 22, 11000),
(1, 6, 6, '2026-03-10 06:00:00', '2026-03-10 07:30:00', 'termine', 58, 145000),
(4, 7, 7, '2026-03-12 09:00:00', '2026-03-12 10:00:00', 'termine', 18, 90000),
(1, 5, 1, '2026-03-20 06:00:00', NULL, 'en_cours', 45, 112500),
(5, 8, 6, '2026-03-15 05:00:00', '2026-03-15 09:10:00', 'termine', 52, 416000),
(6, 9, 8, '2026-03-16 07:00:00', '2026-03-16 10:20:00', 'termine', 38, 247000),
(7, 10, 10, '2026-03-17 06:45:00', '2026-03-17 07:35:00', 'termine', 19, 15200),
(8, 11, 11, '2026-03-18 08:00:00', '2026-03-18 08:38:00', 'termine', 12, 7200),
(2, 12, 12, '2026-03-19 17:00:00', '2026-03-19 19:05:00', 'termine', 21, 63000),
(3, 13, 13, '2026-03-21 07:15:00', '2026-03-21 07:58:00', 'termine', 20, 10000),
(4, 14, 14, '2026-03-22 10:30:00', '2026-03-22 11:25:00', 'termine', 3, 15000),
(1, 15, 1, '2026-03-23 06:00:00', '2026-03-23 07:28:00', 'termine', 52, 130000),
(5, 16, 6, '2026-03-24 05:30:00', '2026-03-24 09:45:00', 'termine', 48, 384000),
(6, 17, 8, '2026-03-25 06:30:00', NULL, 'en_cours', 35, 227500),
(7, 18, 7, '2026-03-26 06:45:00', '2026-03-26 07:40:00', 'termine', 17, 13600),
(2, 1, 2, '2026-03-27 08:00:00', '2026-03-27 10:05:00', 'termine', 23, 69000),
(4, 2, 4, '2026-03-28 14:00:00', '2026-03-28 14:55:00', 'termine', 4, 20000),
(1, 3, 3, '2026-03-29 06:00:00', '2026-03-29 07:25:00', 'termine', 60, 150000),
(8, 4, 5, '2026-03-30 09:00:00', '2026-03-30 09:42:00', 'termine', 10, 6000),
(6, 5, 8, '2026-04-01 07:00:00', '2026-04-01 10:15:00', 'annule', 0, 0),
(3, 6, 9, '2026-04-02 07:30:00', '2026-04-02 08:12:00', 'termine', 24, 12000),
(5, 7, 6, '2026-04-03 05:00:00', '2026-04-03 09:00:00', 'termine', 50, 400000),
(7, 8, 10, '2026-04-04 06:30:00', NULL, 'planifie', 0, 0),
(2, 9, 12, '2026-04-05 18:00:00', NULL, 'planifie', 0, 0),
(1, 10, 6, '2026-04-06 06:00:00', '2026-04-06 07:22:00', 'termine', 57, 142500),
(4, 11, 11, '2026-04-07 11:00:00', '2026-04-07 11:50:00', 'termine', 2, 10000),
(8, 12, 13, '2026-04-08 07:00:00', '2026-04-08 07:35:00', 'termine', 15, 9000),
(6, 13, 8, '2026-04-09 06:45:00', '2026-04-09 09:55:00', 'termine', 40, 260000),
(3, 14, 14, '2026-04-10 07:20:00', '2026-04-10 08:05:00', 'termine', 18, 9000),
(5, 15, 6, '2026-04-11 05:15:00', '2026-04-11 09:30:00', 'termine', 47, 376000),
(1, 16, 1, '2026-04-12 06:00:00', '2026-04-12 07:35:00', 'termine', 54, 135000),
(2, 17, 7, '2026-04-13 07:30:00', '2026-04-13 09:40:00', 'termine', 25, 75000),
(4, 18, 4, '2026-04-14 16:00:00', '2026-04-14 16:48:00', 'termine', 3, 15000),
(1, 19, 1, '2026-04-20 06:00:00', '2026-04-20 07:30:00', 'termine', 42, 105000),
(2, 20, 2, '2026-04-21 08:00:00', '2026-04-21 10:00:00', 'termine', 20, 60000),
(3, 21, 4, '2026-04-22 07:30:00', '2026-04-22 08:15:00', 'termine', 22, 11000),
(1, 22, 5, '2026-04-23 06:00:00', '2026-04-23 07:28:00', 'termine', 50, 125000),
(4, 23, 11, '2026-04-24 10:00:00', '2026-04-24 10:50:00', 'termine', 2, 10000);

INSERT INTO incidents (trajet_id, type, description, gravite, date_incident, resolu) VALUES
(2, 'retard', 'Embouteillage sur la VDN', 'faible', '2026-03-01 08:45:00', TRUE),
(3, 'panne', 'Crevaison pneu avant droit', 'moyen', '2026-03-02 07:30:00', TRUE),
(6, 'accident', 'Accrochage léger au rond-point', 'grave', '2026-03-12 09:20:00', FALSE),
(8, 'retard', 'Contrôle routier prolongé', 'moyen', '2026-03-15 06:30:00', TRUE),
(9, 'panne', 'Surchauffe moteur', 'grave', '2026-03-16 08:15:00', FALSE),
(10, 'autre', 'Passager indisposé, arrêt sanitaire', 'faible', '2026-03-17 07:00:00', TRUE),
(11, 'retard', 'Manifestation sur l''axe', 'moyen', '2026-03-18 08:10:00', TRUE),
(12, 'accident', 'Rayure sur portière en stationnement', 'faible', '2026-03-19 18:30:00', TRUE),
(13, 'panne', 'Problème de batterie', 'faible', '2026-03-21 07:20:00', TRUE),
(14, 'autre', 'Bagage oublié, retour au terminal', 'faible', '2026-03-22 10:40:00', TRUE),
(15, 'accident', 'Choc avec deux-roues, dégâts mineurs', 'grave', '2026-03-23 06:45:00', FALSE),
(16, 'retard', 'Route barrée après orage', 'moyen', '2026-03-24 06:00:00', TRUE),
(17, 'panne', 'Fuite liquide de refroidissement', 'moyen', '2026-03-25 07:50:00', FALSE),
(18, 'autre', 'Vérification administrative prolongée', 'faible', '2026-03-26 07:00:00', TRUE),
(19, 'accident', 'Sortie de route sur bas-côté', 'grave', '2026-03-27 08:30:00', FALSE),
(20, 'retard', 'Fortes pluies, circulation ralentie', 'faible', '2026-03-28 14:15:00', TRUE),
(21, 'panne', 'Courroie accessoires cassée', 'moyen', '2026-03-29 06:20:00', TRUE),
(22, 'autre', 'Client en retard, attente prolongée', 'faible', '2026-03-30 09:05:00', TRUE),
(23, 'accident', 'Collision avec obstacle fixe', 'grave', '2026-04-01 07:10:00', FALSE),
(24, 'retard', 'Embouteillage à Pikine', 'faible', '2026-04-02 07:40:00', TRUE),
(25, 'panne', 'Panne électrique tableau de bord', 'moyen', '2026-04-03 05:45:00', TRUE),
(26, 'autre', 'Signalisation défaillante signalée', 'faible', '2026-04-04 06:35:00', TRUE),
(27, 'accident', 'Tapis roulant bagages, dégât matériel', 'moyen', '2026-04-07 11:15:00', TRUE),
(28, 'retard', 'File d''attente carburant sur l''itinéraire', 'moyen', '2026-04-08 07:05:00', TRUE),
(29, 'panne', 'Problème de frein à main', 'faible', '2026-04-09 07:00:00', TRUE),
(30, 'autre', 'Déclaration de colis suspect (faux alerte)', 'grave', '2026-04-10 07:30:00', FALSE),
(31, 'accident', 'Choc arrière à faible vitesse', 'faible', '2026-04-11 08:00:00', TRUE),
(32, 'retard', 'Coupure de courant aux feux', 'faible', '2026-04-12 06:15:00', TRUE),
(33, 'panne', 'Défaillance climatisation bus', 'faible', '2026-04-13 07:45:00', TRUE),
(34, 'autre', 'Route nationale ralentie par convoi', 'moyen', '2026-04-14 16:20:00', TRUE),
(1, 'retard', 'Démarrage retardé dépôt', 'faible', '2026-03-01 06:10:00', TRUE),
(4, 'autre', 'Contrôle technique aléatoire', 'faible', '2026-03-05 07:40:00', TRUE),
(35, 'accident', 'Griffures carrosserie zone aéroport', 'faible', '2026-04-14 16:10:00', TRUE);

-- ============================================================
--  Utilisateurs (authentification)
-- ============================================================

-- Table utilisateurs (admin + gestionnaires)
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','gestionnaire') DEFAULT 'gestionnaire',
    bloque BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compte admin par défaut : admin / admin123
-- Hash bcrypt de "admin123" généré avec passlib
INSERT IGNORE INTO utilisateurs (username, password_hash, role)
VALUES (
    'admin',
    '$2b$12$XmsIjfErwx9G4b4AhKg2uuU8gZCAHkrkV4MI5WlGu6e6J9SOMqoMa',
    'admin'
);

-- ============================================================
--  Refresh Tokens (authentification persistante)
-- ============================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
