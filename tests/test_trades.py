"""Tests for trade execution (buy/sell)."""
import pytest


def test_buy_stock(auth_client):
    res = auth_client.post("/api/trades/buy", json={"symbol": "AAPL", "quantity": 5})
    assert res.status_code == 201
    data = res.get_json()
    assert data["trade"]["symbol"] == "AAPL"
    assert data["trade"]["trade_type"] == "buy"
    assert int(data["trade"]["quantity"]) == 5
    assert data["new_cash_balance"] < 100000.0


def test_buy_insufficient_funds(auth_client):
    # Try to buy an enormous quantity
    res = auth_client.post("/api/trades/buy", json={"symbol": "AAPL", "quantity": 99999999})
    assert res.status_code == 400
    assert "Insufficient funds" in res.get_json()["error"]


def test_buy_unknown_symbol(auth_client):
    res = auth_client.post("/api/trades/buy", json={"symbol": "ZZZZ", "quantity": 1})
    assert res.status_code == 404


def test_buy_invalid_quantity(auth_client):
    res = auth_client.post("/api/trades/buy", json={"symbol": "AAPL", "quantity": 0})
    assert res.status_code == 400


def test_sell_stock(auth_client):
    # First buy
    auth_client.post("/api/trades/buy", json={"symbol": "MSFT", "quantity": 10})
    # Then sell half
    res = auth_client.post("/api/trades/sell", json={"symbol": "MSFT", "quantity": 5})
    assert res.status_code == 201
    data = res.get_json()
    assert data["trade"]["trade_type"] == "sell"
    assert int(data["trade"]["quantity"]) == 5


def test_sell_insufficient_shares(auth_client):
    res = auth_client.post("/api/trades/sell", json={"symbol": "GOOGL", "quantity": 100})
    assert res.status_code == 400
    assert "Insufficient shares" in res.get_json()["error"]


def test_sell_all_shares_removes_holding(auth_client, app):
    auth_client.post("/api/trades/buy", json={"symbol": "TSLA", "quantity": 3})
    res = auth_client.post("/api/trades/sell", json={"symbol": "TSLA", "quantity": 3})
    assert res.status_code == 201
    # Holding should be removed
    from app.services import dynamodb_service as db
    from flask import g
    with app.app_context():
        # Get user id from the DB
        user = db.get_user_by_email(app, "trader@example.com")
        holding = db.get_holding(app, user["user_id"], "TSLA")
        assert holding is None


def test_trade_requires_auth(client):
    res = client.post("/api/trades/buy", json={"symbol": "AAPL", "quantity": 1})
    assert res.status_code == 401


def test_trade_history(auth_client):
    auth_client.post("/api/trades/buy", json={"symbol": "AAPL", "quantity": 2})
    res = auth_client.get("/api/trades/history")
    assert res.status_code == 200
    trades = res.get_json()
    assert len(trades) >= 1
