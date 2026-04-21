-- À exécuter UNE FOIS si l’interface affiche encore « ThiÃ¨s » ou « AÃ©roport »
-- (données insérées avant SET NAMES utf8mb4 / charset des tables).
SET NAMES utf8mb4;

UPDATE lignes SET
  nom = 'Ligne Dakar-Thiès',
  origine = 'Dakar',
  destination = 'Thiès'
WHERE code = 'L1';

UPDATE lignes SET
  nom = 'Ligne Dakar-Mbour',
  origine = 'Dakar',
  destination = 'Mbour'
WHERE code = 'L2';

UPDATE lignes SET
  nom = 'Ligne Centre-Banlieue',
  origine = 'Plateau',
  destination = 'Pikine'
WHERE code = 'L3';

UPDATE lignes SET
  nom = 'Ligne Aéroport',
  origine = 'Centre-ville',
  destination = 'AIBD'
WHERE code = 'L4';
