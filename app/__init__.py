from flask import Flask
from flask_cors import CORS

from app.config import Config


def create_app(config_class=Config):
    app = Flask(__name__, template_folder="templates")
    app.config.from_object(config_class)
    CORS(app)

    from app.routes.auth import auth_bp
    from app.routes.stocks import stocks_bp
    from app.routes.trades import trades_bp
    from app.routes.portfolio import portfolio_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(stocks_bp, url_prefix="/api/stocks")
    app.register_blueprint(trades_bp, url_prefix="/api/trades")
    app.register_blueprint(portfolio_bp, url_prefix="/api/portfolio")

    from app.routes.ui import ui_bp
    app.register_blueprint(ui_bp)

    with app.app_context():
        import logging
        try:
            from app.services import dynamodb_service as db
            from app.services import stock_price_service as sps
            db.create_tables(app)
            sps.seed_stocks(app)
        except Exception as exc:  # pragma: no cover
            logging.getLogger(__name__).warning(
                "AWS initialization skipped: %s. "
                "Run infrastructure/setup_aws.py to create tables.",
                exc,
            )

    return app
