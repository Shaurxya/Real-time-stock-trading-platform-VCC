"""Tests for the portfolio routes."""
import pytest


def test_portfolio_empty(auth_client):
    res = auth_client.get("/api/portfolio/")
    assert res.status_code == 200
    data = res.get_json()
    assert data["cash_balance"] == 100000.0
    assert data["holdings"] == []
    assert data["total_market_value"] == 0.0


def test_portfolio_after_buy(auth_client):
    auth_client.post("/api/trades/buy", json={"symbol": "NVDA", "quantity": 2})
    res = auth_client.get("/api/portfolio/")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["holdings"]) == 1
    holding = data["holdings"][0]
    assert holding["symbol"] == "NVDA"
    assert holding["quantity"] == 2
    assert holding["market_value"] > 0


def test_portfolio_total_value(auth_client):
    auth_client.post("/api/trades/buy", json={"symbol": "AAPL", "quantity": 1})
    res = auth_client.get("/api/portfolio/")
    data = res.get_json()
    assert data["total_portfolio_value"] == round(data["cash_balance"] + data["total_market_value"], 2)


def test_portfolio_requires_auth(client):
    res = client.get("/api/portfolio/")
    assert res.status_code == 401


def test_portfolio_unrealized_pnl_calc(auth_client):
    """After buy the unrealized P&L should be zero (same price)."""
    auth_client.post("/api/trades/buy", json={"symbol": "JPM", "quantity": 4})
    res = auth_client.get("/api/portfolio/")
    data = res.get_json()
    holding = next(h for h in data["holdings"] if h["symbol"] == "JPM")
    # avg_price == current_price right after buying so P&L ≈ 0
    assert abs(holding["unrealized_pnl_pct"]) < 5  # allow small drift from refresh
