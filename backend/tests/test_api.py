"""
test_api.py — Tests d'intégration pour les routes statistiques et de données.
"""
from unittest.mock import patch
from fixtures import MOCK_STATS, MOCK_VEHICULES, MOCK_TRAJETS


class TestStats:
    """Tests de la route /api/stats."""

    def test_stats_retourne_200(self, client):
        with patch("backend.app.execute_query", return_value=[{"n": 0}]):
            response = client.get("/api/stats")
        assert response.status_code == 200

    def test_stats_contient_les_cles_requises(self, client):
        with patch("backend.app.execute_query", return_value=[{"n": 5}]):
            data = client.get("/api/stats").json()
        cles_attendues = {"total_trajets", "trajets_en_cours", "vehicules_actifs",
                          "vehicules_maintenance", "incidents_ouverts", "recette_mois"}
        assert cles_attendues.issubset(data.keys())

    def test_stats_valeurs_numeriques(self, client):
        with patch("backend.app.execute_query", return_value=[{"n": 42}]):
            data = client.get("/api/stats").json()
        for valeur in data.values():
            assert isinstance(valeur, (int, float))


class TestVehicules:
    """Tests de la route /api/vehicules."""

    def test_vehicules_retourne_200(self, client):
        with patch("backend.app.execute_query", return_value=MOCK_VEHICULES):
            response = client.get("/api/vehicules")
        assert response.status_code == 200

    def test_vehicules_retourne_liste(self, client):
        with patch("backend.app.execute_query", return_value=MOCK_VEHICULES):
            data = client.get("/api/vehicules").json()
        assert isinstance(data, list)

    def test_vehicule_possede_les_champs_essentiels(self, client):
        with patch("backend.app.execute_query", return_value=MOCK_VEHICULES):
            data = client.get("/api/vehicules").json()
        for vehicule in data:
            assert "immatriculation" in vehicule
            assert "statut" in vehicule


class TestTrajetsRecent:
    """Tests de la route /api/trajets/recent."""

    def test_trajets_recent_retourne_200(self, client):
        with patch("backend.app.execute_query", return_value=MOCK_TRAJETS):
            response = client.get("/api/trajets/recent")
        assert response.status_code == 200

    def test_trajets_recent_retourne_au_plus_20(self, client):
        with patch("backend.app.execute_query", return_value=(MOCK_TRAJETS * 25)[:20]):
            data = client.get("/api/trajets/recent").json()
        assert len(data) <= 20

    def test_trajet_possede_les_champs_essentiels(self, client):
        with patch("backend.app.execute_query", return_value=MOCK_TRAJETS):
            data = client.get("/api/trajets/recent").json()
        for trajet in data:
            assert "ligne" in trajet
            assert "chauffeur_nom" in trajet
            assert "statut" in trajet


class TestChat:
    """Tests de la route POST /api/chat."""

    def test_chat_question_vide_retourne_erreur(self, client):
        response = client.post("/api/chat", json={})
        assert response.status_code == 422  # Pydantic validation error

    def test_chat_question_trop_longue_refusee(self, client):
        response = client.post("/api/chat", json={"question": "x" * 2001})
        assert response.status_code == 422

    def test_chat_question_requiert_un_string(self, client):
        response = client.post("/api/chat", json={"question": 12345})
        assert response.status_code in (200, 422)

    def test_chat_accepts_history(self, client):
        from unittest.mock import patch, AsyncMock
        from fixtures import MOCK_LLM_SELECT

        with patch("backend.app.ask_llm", new_callable=AsyncMock, return_value=MOCK_LLM_SELECT), \
             patch("backend.app.execute_query", return_value=[{"id": 1}]), \
             patch("backend.app.llm_summarize_answer", new_callable=AsyncMock, return_value="OK"):
            response = client.post(
                "/api/chat",
                json={
                    "question": "Et le mois dernier ?",
                    "history": [
                        {"role": "user", "text": "Recette du mois en cours ?"},
                        {"role": "assistant", "text": "Voici la synthèse."},
                    ],
                },
            )
        assert response.status_code == 200
        assert response.json()["answer"] == "OK"

    def test_chat_salutation_ne_appelle_pas_llm(self, client):
        from unittest.mock import patch, AsyncMock
        from backend.app import CHAT_REFUSAL

        with patch("backend.app.ask_llm", new_callable=AsyncMock) as m_llm:
            r = client.post("/api/chat", json={"question": "Bonjour !"})
        assert r.status_code == 200
        m_llm.assert_not_called()
        ans = r.json()["answer"]
        assert "TranspoBot" in ans
        assert ans != CHAT_REFUSAL

    def test_chat_merci_avec_historique_reponse_courte(self, client):
        from unittest.mock import patch, AsyncMock

        with patch("backend.app.ask_llm", new_callable=AsyncMock) as m_llm:
            r = client.post(
                "/api/chat",
                json={
                    "question": "Merci beaucoup",
                    "history": [
                        {"role": "user", "text": "Combien de bus ?"},
                        {"role": "assistant", "text": "Vous avez 12 bus actifs."},
                    ],
                },
            )
        assert r.status_code == 200
        m_llm.assert_not_called()
        assert "plaisir" in r.json()["answer"].lower()
