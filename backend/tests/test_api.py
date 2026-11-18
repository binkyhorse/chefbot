from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_menu_plan():
    response = client.post(
        "/api/menu-plan",
        json={
            "prompt": "Vegetarische Mahlzeiten für eine Woche",
            "foods": [
                {"name": "Linsen", "status": "bisher"},
                {"name": "Brokkoli", "status": "neu"},
            ],
            "meals": [
                {"day": "Mittwoch", "meal": "mittag"},
                {"day": "Montag", "meal": "abend"},
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert "menu" in body
    assert isinstance(body["sources"], list)
