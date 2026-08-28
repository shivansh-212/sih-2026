"""
Tests for admin-only endpoints and role enforcement.
"""


def test_admin_list_users(client, admin_headers):
    """Test admin can list users."""
    response = client.get("/api/v1/admin/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data


def test_normal_user_cannot_list_users(client, user_headers):
    """Test that normal users cannot access admin endpoints."""
    response = client.get("/api/v1/admin/users", headers=user_headers)
    assert response.status_code == 403


def test_admin_create_user(client, admin_headers):
    """Test admin can create users."""
    response = client.post(
        "/api/v1/admin/users",
        headers=admin_headers,
        json={
            "email": "created@test.com",
            "password": "pass123",
            "full_name": "Created User",
            "role": "USER",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "created@test.com"
    assert data["role"] == "USER"


def test_normal_user_cannot_create_user(client, user_headers):
    """Test that normal users cannot create users."""
    response = client.post(
        "/api/v1/admin/users",
        headers=user_headers,
        json={
            "email": "forbidden@test.com",
            "password": "pass123",
            "role": "USER",
        },
    )
    assert response.status_code == 403


def test_admin_change_user_role(client, admin_headers):
    """Test admin can change user roles."""
    # Create a user first
    create_resp = client.post(
        "/api/v1/admin/users",
        headers=admin_headers,
        json={"email": "rolechange@test.com", "password": "pass123", "role": "USER"},
    )
    user_id = create_resp.json()["id"]

    # Change role
    response = client.patch(
        f"/api/v1/admin/users/{user_id}/role",
        headers=admin_headers,
        json={"role": "ADMIN"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "ADMIN"


def test_admin_disable_user(client, admin_headers):
    """Test admin can disable users."""
    create_resp = client.post(
        "/api/v1/admin/users",
        headers=admin_headers,
        json={"email": "disable@test.com", "password": "pass123"},
    )
    user_id = create_resp.json()["id"]

    response = client.patch(
        f"/api/v1/admin/users/{user_id}/status",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_view_audit_logs(client, admin_headers):
    """Test admin can view audit logs."""
    response = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data


def test_normal_user_cannot_view_audit_logs(client, user_headers):
    """Test normal users cannot access audit logs."""
    response = client.get("/api/v1/admin/audit-logs", headers=user_headers)
    assert response.status_code == 403


def test_normal_user_cannot_upload_dataset(client, user_headers):
    """Test normal users cannot upload datasets."""
    response = client.post(
        "/api/v1/admin/datasets/upload",
        headers=user_headers,
        files={"file": ("test.csv", b"id,name\n1,test", "text/csv")},
        data={"source": "GOOGLE"},
    )
    assert response.status_code == 403
