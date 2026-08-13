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


def test_change_password_requires_auth(client):
    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": "x", "new_password": "newpass123", "confirm_new_password": "newpass123"},
    )
    assert resp.status_code == 401


def test_change_password_success(client, auth_headers):
    resp = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "testpass123",
            "new_password": "newpass456",
            "confirm_new_password": "newpass456",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "password" not in body
    assert "hashed_password" not in body

    # old password no longer works
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "testpass123"})
    assert resp.status_code == 401

    # new password works
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "newpass456"})
    assert resp.status_code == 200


def test_change_password_wrong_current_password_fails(client, auth_headers):
    resp = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "totally-wrong",
            "new_password": "newpass456",
            "confirm_new_password": "newpass456",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400

    # original password still works
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "testpass123"})
    assert resp.status_code == 200


def test_change_password_mismatched_confirmation_fails(client, auth_headers):
    resp = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "testpass123",
            "new_password": "newpass456",
            "confirm_new_password": "different789",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_user_cannot_change_other_users_password(client, auth_headers):
    """The target account always comes from the auth token, not a request field,
    so there is no way to steer this endpoint at another user's account. Supplying
    another user's password as 'current_password' is checked against the caller's
    own hash and is correctly rejected."""
    client.post("/api/auth/register", json={"email": "victim@example.com", "password": "victimpass123"})

    resp = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "victimpass123",
            "new_password": "hacked12345",
            "confirm_new_password": "hacked12345",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400

    # victim's original password is untouched
    resp = client.post("/api/auth/login", json={"email": "victim@example.com", "password": "victimpass123"})
    assert resp.status_code == 200

    # caller's (test@example.com) original password is also untouched
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "testpass123"})
    assert resp.status_code == 200
