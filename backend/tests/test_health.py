"""
test_health.py — Tests de base pour vérifier que l'API est opérationnelle.
La fixture `client` est injectée automatiquement depuis conftest.py.
"""


def test_health_endpoint_status(client):
    """La route /health doit retourner un code HTTP 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_endpoint_content(client):
    """La route /health doit retourner le statut 'ok' et le nom de l'app."""
    data = client.get("/health").json()
    assert data["status"] == "ok"
    assert data["app"] == "TranspoBot"
