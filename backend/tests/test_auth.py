def test_register_and_login(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "a@example.com", "password": "secret123", "full_name": "A"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["user"]["email"] == "a@example.com"
    assert body["access_token"]

    resp = client.post("/api/auth/login", json={"email": "a@example.com", "password": "secret123"})
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_wrong_password_fails(client):
    client.post("/api/auth/register", json={"email": "b@example.com", "password": "secret123"})
    resp = client.post("/api/auth/login", json={"email": "b@example.com", "password": "wrong"})
    assert resp.status_code == 401


def test_duplicate_email_rejected(client):
    client.post("/api/auth/register", json={"email": "c@example.com", "password": "secret123"})
    resp = client.post("/api/auth/register", json={"email": "c@example.com", "password": "secret123"})
    assert resp.status_code == 400


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_token(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"
