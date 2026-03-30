from flask import Blueprint, jsonify, current_app

from app.services import stock_price_service as sps

stocks_bp = Blueprint("stocks", __name__)


@stocks_bp.route("/", methods=["GET"])
def list_stocks():
    """Return all tracked stocks with current prices."""
    app = current_app._get_current_object()
    stocks = sps.get_all_stocks(app)
    return jsonify(stocks)


@stocks_bp.route("/<symbol>", methods=["GET"])
def get_stock(symbol):
    """Return current data for a single stock."""
    app = current_app._get_current_object()
    from app.services import dynamodb_service as db
    stock = db.get_stock(app, symbol.upper())
    if not stock:
        return jsonify({"error": "Stock not found"}), 404
    return jsonify({
        "symbol": stock["symbol"],
        "name": stock["name"],
        "price": float(stock["price"]),
        "change_pct": float(stock.get("change_pct", 0)),
        "updated_at": stock.get("updated_at", ""),
    })


@stocks_bp.route("/refresh", methods=["POST"])
def refresh_prices():
    """Simulate a market tick by updating all stock prices."""
    app = current_app._get_current_object()
    updated = sps.refresh_prices(app)
    return jsonify({"updated": len(updated), "stocks": updated})
