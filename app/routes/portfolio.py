from flask import Blueprint, jsonify, session, current_app

from app.routes.auth import login_required
from app.services import dynamodb_service as db
from app.services import stock_price_service as sps

portfolio_bp = Blueprint("portfolio", __name__)


@portfolio_bp.route("/", methods=["GET"])
@login_required
def get_portfolio():
    """Return the authenticated user's portfolio with current market values."""
    app = current_app._get_current_object()
    user_id = session["user_id"]

    user = db.get_user_by_id(app, user_id)
    holdings = db.get_portfolio(app, user_id)

    enriched = []
    total_market_value = 0.0
    total_cost_basis = 0.0

    for h in holdings:
        symbol = h["symbol"]
        quantity = float(h["quantity"])
        avg_price = float(h["avg_price"])
        current_price = sps.get_current_price(app, symbol) or avg_price

        market_value = current_price * quantity
        cost_basis = avg_price * quantity
        unrealized_pnl = market_value - cost_basis

        total_market_value += market_value
        total_cost_basis += cost_basis

        enriched.append({
            "symbol": symbol,
            "quantity": quantity,
            "avg_price": avg_price,
            "current_price": current_price,
            "market_value": round(market_value, 2),
            "cost_basis": round(cost_basis, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "unrealized_pnl_pct": round(
                (unrealized_pnl / cost_basis * 100) if cost_basis else 0, 2
            ),
        })

    cash_balance = float(user["cash_balance"])
    total_value = cash_balance + total_market_value

    return jsonify({
        "user_id": user_id,
        "cash_balance": round(cash_balance, 2),
        "holdings": enriched,
        "total_market_value": round(total_market_value, 2),
        "total_cost_basis": round(total_cost_basis, 2),
        "total_unrealized_pnl": round(total_market_value - total_cost_basis, 2),
        "total_portfolio_value": round(total_value, 2),
    })
