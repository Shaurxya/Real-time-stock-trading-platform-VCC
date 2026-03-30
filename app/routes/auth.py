"""
Authentication routes.

Uses simple session-based auth with hashed passwords stored in DynamoDB.
In production, replace with a proper JWT/OAuth flow.
"""
import hashlib
import secrets
from functools import wraps

from flask import Blueprint, request, jsonify, session

from app.services import dynamodb_service as db

auth_bp = Blueprint("auth", __name__)


def _hash_password(password):
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{h}"


def _verify_password(password, stored_hash):
    parts = stored_hash.split(":")
    if len(parts) != 2:
        return False
    salt, h = parts
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == h


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip()
    password = data.get("password") or ""

    if not email or not name or not password:
        return jsonify({"error": "email, name and password are required"}), 400

    from flask import current_app
    if db.get_user_by_email(current_app._get_current_object(), email):
        return jsonify({"error": "Email already registered"}), 409

    user = db.create_user(
        current_app._get_current_object(),
        email,
        name,
        _hash_password(password),
    )
    session["user_id"] = user["user_id"]
    return jsonify({
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "cash_balance": float(user["cash_balance"]),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    from flask import current_app
    app = current_app._get_current_object()
    user = db.get_user_by_email(app, email)
    if not user or not _verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"] = user["user_id"]
    return jsonify({
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "cash_balance": float(user["cash_balance"]),
    })


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    from flask import current_app
    app = current_app._get_current_object()
    user = db.get_user_by_id(app, session["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "cash_balance": float(user["cash_balance"]),
    })
