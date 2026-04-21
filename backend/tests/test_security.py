"""
test_security.py — Tests de la sécurisation des requêtes SQL générées par l'IA.
"""
import pytest
from unittest.mock import patch, AsyncMock
from fixtures import MOCK_LLM_SELECT, MOCK_LLM_NO_SQL, MOCK_LLM_BAD_SQL


class TestSecuriteSQL:
    """Tests de la couche de sécurité SQL dans /api/chat."""

    def test_requete_select_autorisee(self, client):
        """Une requête SELECT générée par l'IA doit être exécutée normalement."""
        with patch("backend.app.ask_llm", new_callable=AsyncMock, return_value=MOCK_LLM_SELECT), \
             patch("backend.app.execute_query", return_value=[{"id": 1}]), \
             patch("backend.app.llm_summarize_answer", new_callable=AsyncMock, return_value="Réponse synthétique."):
            response = client.post("/api/chat", json={"question": "Liste les véhicules"})
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert data["answer"] == "Réponse synthétique."

    def test_requete_drop_bloquee(self, client):
        """Une requête DROP générée par l'IA doit être bloquée avant exécution."""
        with patch("backend.app.ask_llm", new_callable=AsyncMock, return_value=MOCK_LLM_BAD_SQL), \
             patch("backend.app.execute_query") as mock_execute:
            response = client.post("/api/chat", json={"question": "Supprime tout !"})

        assert response.status_code == 200
        data = response.json()
        mock_execute.assert_not_called()
        assert data["answer"] == "Désolé, je ne peux pas répondre à cette question."
        assert data["data"] == []

    def test_requete_delete_bloquee(self, client):
        """Une requête DELETE doit aussi être bloquée."""
        mock_delete = {"sql": "DELETE FROM trajets WHERE id=1", "explication": "Suppression."}
        with patch("backend.app.ask_llm", new_callable=AsyncMock, return_value=mock_delete), \
             patch("backend.app.execute_query") as mock_execute:
            response = client.post("/api/chat", json={"question": "Supprime le trajet 1"})

        assert response.status_code == 200
        mock_execute.assert_not_called()

    def test_requete_insert_bloquee(self, client):
        """Une requête INSERT doit être bloquée."""
        mock_insert = {"sql": "INSERT INTO vehicules VALUES (99, 'TEST')", "explication": "Insertion."}
        with patch("backend.app.ask_llm", new_callable=AsyncMock, return_value=mock_insert), \
             patch("backend.app.execute_query") as mock_execute:
            response = client.post("/api/chat", json={"question": "Ajoute un véhicule"})

        assert response.status_code == 200
        mock_execute.assert_not_called()

    def test_pas_de_sql_renvoie_explication(self, client):
        """Quand l'IA ne génère pas de SQL, l'application doit renvoyer l'explication."""
        with patch("backend.app.ask_llm", new_callable=AsyncMock, return_value=MOCK_LLM_NO_SQL):
            response = client.post("/api/chat", json={"question": "Quel temps fait-il ?"})

        assert response.status_code == 200
        data = response.json()
        assert data["data"] == []
        assert data.get("count", 0) == 0
        assert len(data["answer"]) > 0

    @pytest.mark.parametrize("bad_sql", [
        "DROP TABLE vehicules",
        "TRUNCATE trajets",
        "UPDATE vehicules SET statut='hors_service'",
        "ALTER TABLE vehicules ADD colonne VARCHAR(10)",
    ])
    def test_variantes_requetes_dangereuses(self, client, bad_sql):
        """Vérifie que plusieurs types de requêtes dangereuses sont toutes bloquées."""
        mock_llm = {"sql": bad_sql, "explication": "Requête dangereuse"}
        with patch("backend.app.ask_llm", new_callable=AsyncMock, return_value=mock_llm), \
             patch("backend.app.execute_query") as mock_execute:
            response = client.post("/api/chat", json={"question": "test"})

        assert response.status_code == 200
        mock_execute.assert_not_called()
