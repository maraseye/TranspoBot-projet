"""
fixtures.py — Données de test réutilisables à importer dans les fichiers de tests.
"""

MOCK_STATS = {
    "total_trajets": 6,
    "trajets_en_cours": 1,
    "vehicules_actifs": 4,
    "vehicules_maintenance": 2,
    "incidents_ouverts": 1,
    "recette_mois": 558000,
}

MOCK_VEHICULES = [
    {"id": 1, "immatriculation": "DK-1234-AB", "type": "bus", "capacite": 60, "statut": "actif"},
    {"id": 2, "immatriculation": "DK-5678-CD", "type": "minibus", "capacite": 25, "statut": "actif"},
]

MOCK_TRAJETS = [
    {
        "id": 1, "ligne": "Ligne Dakar-Thiès", "chauffeur_nom": "DIOP",
        "immatriculation": "DK-1234-AB", "date_heure_depart": "2026-03-01T06:00:00",
        "statut": "termine"
    }
]

MOCK_LLM_SELECT = {
    "sql": "SELECT * FROM vehicules LIMIT 100",
    "explication": "Liste tous les véhicules.",
}
MOCK_LLM_NO_SQL = {
    "sql": None,
    "explication": "Désolé, je ne peux pas répondre à cette question.",
}
MOCK_LLM_BAD_SQL = {"sql": "DROP TABLE vehicules", "explication": "Suppression."}
