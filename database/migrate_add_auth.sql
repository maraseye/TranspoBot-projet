-- =================================================================
--  TranspoBot — Migration : Ajout du système d'authentification
--  À exécuter sur une base transpobot EXISTANTE (sans recréer tout)
-- =================================================================

SET NAMES utf8mb4;

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
-- Hash bcrypt généré avec passlib (rounds=12)
INSERT IGNORE INTO utilisateurs (username, password_hash, role)
VALUES (
    'admin',
    '$2b$12$XmsIjfErwx9G4b4AhKg2uuU8gZCAHkrkV4MI5WlGu6e6J9SOMqoMa',
    'admin'
);
