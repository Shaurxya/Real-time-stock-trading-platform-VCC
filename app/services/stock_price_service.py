"""
Simulated real-time stock price service.

In production this would pull from a market data provider.  For this
virtual trading platform we maintain a small universe of stocks whose
prices are seeded into DynamoDB and updated with a simple random-walk
simulation on each refresh call.
"""
import random
from datetime import datetime, timezone

from app.services import dynamodb_service as db

# Default stock universe with realistic seed prices
DEFAULT_STOCKS = {
    "AAPL": {"name": "Apple Inc.", "price": 189.30},
    "GOOGL": {"name": "Alphabet Inc.", "price": 175.50},
    "MSFT": {"name": "Microsoft Corp.", "price": 415.20},
    "AMZN": {"name": "Amazon.com Inc.", "price": 185.60},
    "TSLA": {"name": "Tesla Inc.", "price": 177.80},
    "NVDA": {"name": "NVIDIA Corp.", "price": 875.40},
    "META": {"name": "Meta Platforms Inc.", "price": 520.10},
    "NFLX": {"name": "Netflix Inc.", "price": 680.25},
    "BRKB": {"name": "Berkshire Hathaway B", "price": 405.75},
    "JPM": {"name": "JPMorgan Chase & Co.", "price": 210.30},
}

# Maximum percentage change per simulated refresh (±2 %)
MAX_CHANGE_PCT = 2.0


def seed_stocks(app):
    """Populate DynamoDB with default stock data if not already present."""
    for symbol, info in DEFAULT_STOCKS.items():
        existing = db.get_stock(app, symbol)
        if not existing:
            db.upsert_stock(app, symbol, info["name"], info["price"], 0.0)


def get_current_price(app, symbol):
    """Return the current simulated price for *symbol*."""
    stock = db.get_stock(app, symbol)
    if not stock:
        return None
    return float(stock["price"])


def refresh_prices(app):
    """
    Apply a random-walk step to every stock price and persist to DynamoDB.
    Returns a list of updated stock dicts.
    """
    stocks = db.list_stocks(app)
    updated = []
    for stock in stocks:
        symbol = stock["symbol"]
        old_price = float(stock["price"])
        change_pct = random.uniform(-MAX_CHANGE_PCT, MAX_CHANGE_PCT)
        new_price = round(old_price * (1 + change_pct / 100), 2)
        new_price = max(new_price, 0.01)  # floor at 1 cent
        db.upsert_stock(app, symbol, stock["name"], new_price, change_pct)
        updated.append(
            {
                "symbol": symbol,
                "name": stock["name"],
                "price": new_price,
                "change_pct": round(change_pct, 4),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    return updated


def get_all_stocks(app):
    """Return all stocks with current prices."""
    stocks = db.list_stocks(app)
    return [
        {
            "symbol": s["symbol"],
            "name": s["name"],
            "price": float(s["price"]),
            "change_pct": float(s.get("change_pct", 0)),
            "updated_at": s.get("updated_at", ""),
        }
        for s in stocks
    ]
