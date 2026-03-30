import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")
    AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")

    # DynamoDB table names
    USERS_TABLE = os.environ.get("USERS_TABLE", "stock_platform_users")
    PORTFOLIOS_TABLE = os.environ.get("PORTFOLIOS_TABLE", "stock_platform_portfolios")
    TRADES_TABLE = os.environ.get("TRADES_TABLE", "stock_platform_trades")
    STOCKS_TABLE = os.environ.get("STOCKS_TABLE", "stock_platform_stocks")

    # SNS topic ARNs
    TRADE_NOTIFICATIONS_TOPIC_ARN = os.environ.get("TRADE_NOTIFICATIONS_TOPIC_ARN", "")
    PRICE_ALERTS_TOPIC_ARN = os.environ.get("PRICE_ALERTS_TOPIC_ARN", "")

    # Initial virtual cash balance for new users
    INITIAL_BALANCE = float(os.environ.get("INITIAL_BALANCE", "100000.0"))

    # Use mock AWS services for local development/testing
    USE_MOCK_AWS = os.environ.get("USE_MOCK_AWS", "false").lower() == "true"
    DYNAMODB_ENDPOINT_URL = os.environ.get("DYNAMODB_ENDPOINT_URL", None)


class TestConfig(Config):
    TESTING = True
    USE_MOCK_AWS = True
    INITIAL_BALANCE = 100000.0
