"""
Tests for authentication endpoints.
"""


def test_register_user(client):
    """Test user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "securepass123",
            "full_name": "New User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "USER"
    assert data["is_active"] is True
    # Never return password hash
    assert "password_hash" not in data
    assert "password" not in data


def test_register_duplicate_email(client):
    """Test that duplicate email registration fails."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "dup@test.com", "password": "pass123"},
    )
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "dup@test.com", "password": "pass456"},
    )
    assert response.status_code == 409


def test_login_success(client):
    """Test successful login returns JWT."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "login@test.com", "password": "pass123"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@test.com", "password": "pass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    """Test login with wrong password fails."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpass@test.com", "password": "pass123"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@test.com", "password": "wrongpass"},
    )
    assert response.status_code == 401


def test_login_nonexistent_email(client):
    """Test login with nonexistent email fails."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@test.com", "password": "pass123"},
    )
    assert response.status_code == 401


def test_get_me_authenticated(client, user_token):
    """Test /auth/me with valid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"


def test_get_me_no_token(client):
    """Test /auth/me without token fails."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_me_invalid_token(client):
    """Test /auth/me with invalid token fails."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token-here"},
    )
    assert response.status_code == 401
