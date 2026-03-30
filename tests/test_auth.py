"""Tests for the auth routes."""
import pytest


def test_register_success(client):
    res = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "name": "Alice", "password": "pass1234"},
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["email"] == "alice@example.com"
    assert data["name"] == "Alice"
    assert data["cash_balance"] == 100000.0


def test_register_duplicate_email(client):
    client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "name": "Dup", "password": "pass"},
    )
    res = client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "name": "Dup2", "password": "pass"},
    )
    assert res.status_code == 409


def test_register_missing_fields(client):
    res = client.post("/api/auth/register", json={"email": "x@x.com"})
    assert res.status_code == 400


def test_login_success(client):
    client.post(
        "/api/auth/register",
        json={"email": "bob@example.com", "name": "Bob", "password": "mypass"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": "bob@example.com", "password": "mypass"},
    )
    assert res.status_code == 200
    assert res.get_json()["email"] == "bob@example.com"


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "carol@example.com", "name": "Carol", "password": "right"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": "carol@example.com", "password": "wrong"},
    )
    assert res.status_code == 401


def test_me_authenticated(auth_client):
    res = auth_client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.get_json()["email"] == "trader@example.com"


def test_me_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_logout(auth_client):
    res = auth_client.post("/api/auth/logout")
    assert res.status_code == 200
    # After logout /me should return 401
    res2 = auth_client.get("/api/auth/me")
    assert res2.status_code == 401
