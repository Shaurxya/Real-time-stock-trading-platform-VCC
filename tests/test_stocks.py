"""Tests for stock price routes."""
import pytest


def test_list_stocks(client):
    res = client.get("/api/stocks/")
    assert res.status_code == 200
    stocks = res.get_json()
    assert isinstance(stocks, list)
    assert len(stocks) > 0
    symbols = [s["symbol"] for s in stocks]
    assert "AAPL" in symbols


def test_get_stock(client):
    res = client.get("/api/stocks/AAPL")
    assert res.status_code == 200
    data = res.get_json()
    assert data["symbol"] == "AAPL"
    assert data["price"] > 0


def test_get_stock_not_found(client):
    res = client.get("/api/stocks/NOTREAL")
    assert res.status_code == 404


def test_refresh_prices(client):
    res = client.post("/api/stocks/refresh")
    assert res.status_code == 200
    data = res.get_json()
    assert "updated" in data
    assert data["updated"] > 0
    # Prices in the refreshed list should be positive
    for s in data["stocks"]:
        assert s["price"] > 0
