"""
conftest.py — Fixtures partagées pour les tests TranspoBot.

pytest charge ce fichier AUTOMATIQUEMENT — ne jamais l'importer explicitement.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Patch mysql.connector AVANT d'importer l'app
# pour éviter toute tentative de connexion réelle à la BDD
with patch("mysql.connector.connect", return_value=MagicMock()):
    from backend.app import app


@pytest.fixture
def client():
    """Fournit un client de test HTTP pour l'application FastAPI."""
    with TestClient(app) as c:
        yield c
