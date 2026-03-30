"""
Trade execution routes — buy and sell orders.
"""
from flask import Blueprint, request, jsonify, session, current_app

from app.routes.auth import login_required
from app.services import dynamodb_service as db
from app.services import sns_service
from app.services import stock_price_service as sps

trades_bp = Blueprint("trades", __name__)


@trades_bp.route("/buy", methods=["POST"])
@login_required
def buy():
    data = request.get_json(force=True)
    symbol = (data.get("symbol") or "").upper()
    try:
        quantity = int(data.get("quantity", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "quantity must be a positive integer"}), 400

    if not symbol or quantity <= 0:
        return jsonify({"error": "symbol and positive quantity are required"}), 400

    app = current_app._get_current_object()
    user_id = session["user_id"]

    # Get current price
    price = sps.get_current_price(app, symbol)
    if price is None:
        return jsonify({"error": f"Unknown stock symbol: {symbol}"}), 404

    total_cost = price * quantity

    # Check user balance
    user = db.get_user_by_id(app, user_id)
    cash_balance = float(user["cash_balance"])
    if cash_balance < total_cost:
        return jsonify({
            "error": "Insufficient funds",
            "required": total_cost,
            "available": cash_balance,
        }), 400

    # Deduct cash
    new_balance = cash_balance - total_cost
    db.update_user_balance(app, user_id, new_balance)

    # Update portfolio holding
    holding = db.get_holding(app, user_id, symbol)
    if holding:
        old_qty = float(holding["quantity"])
        old_avg = float(holding["avg_price"])
        new_qty = old_qty + quantity
        new_avg = ((old_avg * old_qty) + (price * quantity)) / new_qty
    else:
        new_qty = quantity
        new_avg = price

    db.upsert_holding(app, user_id, symbol, new_qty, new_avg)

    # Record trade
    trade = db.record_trade(app, user_id, symbol, "buy", quantity, price)

    # SNS notification
    sns_service.notify_trade_executed(app, user_id, trade)

    return jsonify({
        "trade": trade,
        "new_cash_balance": new_balance,
    }), 201


@trades_bp.route("/sell", methods=["POST"])
@login_required
def sell():
    data = request.get_json(force=True)
    symbol = (data.get("symbol") or "").upper()
    try:
        quantity = int(data.get("quantity", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "quantity must be a positive integer"}), 400

    if not symbol or quantity <= 0:
        return jsonify({"error": "symbol and positive quantity are required"}), 400

    app = current_app._get_current_object()
    user_id = session["user_id"]

    # Get current price
    price = sps.get_current_price(app, symbol)
    if price is None:
        return jsonify({"error": f"Unknown stock symbol: {symbol}"}), 404

    # Check holdings
    holding = db.get_holding(app, user_id, symbol)
    if not holding or float(holding["quantity"]) < quantity:
        available = float(holding["quantity"]) if holding else 0
        return jsonify({
            "error": "Insufficient shares",
            "required": quantity,
            "available": available,
        }), 400

    total_proceeds = price * quantity

    # Update holding
    new_qty = float(holding["quantity"]) - quantity
    if new_qty == 0:
        db.delete_holding(app, user_id, symbol)
    else:
        db.upsert_holding(app, user_id, symbol, new_qty, float(holding["avg_price"]))

    # Credit cash
    user = db.get_user_by_id(app, user_id)
    new_balance = float(user["cash_balance"]) + total_proceeds
    db.update_user_balance(app, user_id, new_balance)

    # Record trade
    trade = db.record_trade(app, user_id, symbol, "sell", quantity, price)

    # SNS notification
    sns_service.notify_trade_executed(app, user_id, trade)

    return jsonify({
        "trade": trade,
        "new_cash_balance": new_balance,
    }), 201


@trades_bp.route("/history", methods=["GET"])
@login_required
def trade_history():
    app = current_app._get_current_object()
    user_id = session["user_id"]
    limit = min(int(request.args.get("limit", 50)), 200)
    trades = db.get_user_trades(app, user_id, limit=limit)
    return jsonify(trades)
