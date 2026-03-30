import boto3
import uuid
from datetime import datetime, timezone
from botocore.exceptions import ClientError
from flask import current_app


def _get_dynamodb(app=None):
    cfg = app.config if app else current_app.config
    kwargs = {
        "region_name": cfg["AWS_REGION"],
    }
    if cfg.get("AWS_ACCESS_KEY_ID"):
        kwargs["aws_access_key_id"] = cfg["AWS_ACCESS_KEY_ID"]
        kwargs["aws_secret_access_key"] = cfg["AWS_SECRET_ACCESS_KEY"]
    if cfg.get("DYNAMODB_ENDPOINT_URL"):
        kwargs["endpoint_url"] = cfg["DYNAMODB_ENDPOINT_URL"]
    return boto3.resource("dynamodb", **kwargs)


def create_tables(app):
    """Create DynamoDB tables if they don't exist. Called during setup."""
    dynamodb = _get_dynamodb(app)
    cfg = app.config

    tables = [
        {
            "TableName": cfg["USERS_TABLE"],
            "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
            "AttributeDefinitions": [
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "email", "AttributeType": "S"},
            ],
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "email-index",
                    "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            "BillingMode": "PAY_PER_REQUEST",
        },
        {
            "TableName": cfg["PORTFOLIOS_TABLE"],
            "KeySchema": [
                {"AttributeName": "user_id", "KeyType": "HASH"},
                {"AttributeName": "symbol", "KeyType": "RANGE"},
            ],
            "AttributeDefinitions": [
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "symbol", "AttributeType": "S"},
            ],
            "BillingMode": "PAY_PER_REQUEST",
        },
        {
            "TableName": cfg["TRADES_TABLE"],
            "KeySchema": [{"AttributeName": "trade_id", "KeyType": "HASH"}],
            "AttributeDefinitions": [
                {"AttributeName": "trade_id", "AttributeType": "S"},
                {"AttributeName": "user_id", "AttributeType": "S"},
            ],
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": "user-trades-index",
                    "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            "BillingMode": "PAY_PER_REQUEST",
        },
        {
            "TableName": cfg["STOCKS_TABLE"],
            "KeySchema": [{"AttributeName": "symbol", "KeyType": "HASH"}],
            "AttributeDefinitions": [
                {"AttributeName": "symbol", "AttributeType": "S"},
            ],
            "BillingMode": "PAY_PER_REQUEST",
        },
    ]

    for table_def in tables:
        try:
            dynamodb.create_table(**table_def)
        except ClientError as e:
            if e.response["Error"]["Code"] != "ResourceInUseException":
                raise


# ---------------------------------------------------------------------------
# User operations
# ---------------------------------------------------------------------------

def create_user(app, email, name, password_hash):
    """Persist a new user and return the created record."""
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["USERS_TABLE"])
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "password_hash": password_hash,
        "cash_balance": str(app.config["INITIAL_BALANCE"]),
        "created_at": now,
    }
    table.put_item(Item=item)
    return item


def get_user_by_id(app, user_id):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["USERS_TABLE"])
    resp = table.get_item(Key={"user_id": user_id})
    return resp.get("Item")


def get_user_by_email(app, email):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["USERS_TABLE"])
    resp = table.query(
        IndexName="email-index",
        KeyConditionExpression="email = :email",
        ExpressionAttributeValues={":email": email},
    )
    items = resp.get("Items", [])
    return items[0] if items else None


def update_user_balance(app, user_id, new_balance):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["USERS_TABLE"])
    table.update_item(
        Key={"user_id": user_id},
        UpdateExpression="SET cash_balance = :b",
        ExpressionAttributeValues={":b": str(new_balance)},
    )


# ---------------------------------------------------------------------------
# Portfolio operations
# ---------------------------------------------------------------------------

def get_portfolio(app, user_id):
    """Return all holdings for a user."""
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["PORTFOLIOS_TABLE"])
    resp = table.query(
        KeyConditionExpression="user_id = :uid",
        ExpressionAttributeValues={":uid": user_id},
    )
    return resp.get("Items", [])


def get_holding(app, user_id, symbol):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["PORTFOLIOS_TABLE"])
    resp = table.get_item(Key={"user_id": user_id, "symbol": symbol})
    return resp.get("Item")


def upsert_holding(app, user_id, symbol, quantity, avg_price):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["PORTFOLIOS_TABLE"])
    table.put_item(
        Item={
            "user_id": user_id,
            "symbol": symbol,
            "quantity": str(quantity),
            "avg_price": str(avg_price),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    )


def delete_holding(app, user_id, symbol):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["PORTFOLIOS_TABLE"])
    table.delete_item(Key={"user_id": user_id, "symbol": symbol})


# ---------------------------------------------------------------------------
# Trade operations
# ---------------------------------------------------------------------------

def record_trade(app, user_id, symbol, trade_type, quantity, price):
    """Persist a trade record and return it."""
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["TRADES_TABLE"])
    trade_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "trade_id": trade_id,
        "user_id": user_id,
        "symbol": symbol,
        "trade_type": trade_type,
        "quantity": str(quantity),
        "price": str(price),
        "total_value": str(quantity * price),
        "timestamp": now,
    }
    table.put_item(Item=item)
    return item


def get_user_trades(app, user_id, limit=50):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["TRADES_TABLE"])
    resp = table.query(
        IndexName="user-trades-index",
        KeyConditionExpression="user_id = :uid",
        ExpressionAttributeValues={":uid": user_id},
        ScanIndexForward=False,
        Limit=limit,
    )
    return resp.get("Items", [])


# ---------------------------------------------------------------------------
# Stock price operations
# ---------------------------------------------------------------------------

def get_stock(app, symbol):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["STOCKS_TABLE"])
    resp = table.get_item(Key={"symbol": symbol})
    return resp.get("Item")


def upsert_stock(app, symbol, name, price, change_pct):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["STOCKS_TABLE"])
    table.put_item(
        Item={
            "symbol": symbol,
            "name": name,
            "price": str(price),
            "change_pct": str(change_pct),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    )


def list_stocks(app):
    dynamodb = _get_dynamodb(app)
    table = dynamodb.Table(app.config["STOCKS_TABLE"])
    resp = table.scan()
    return resp.get("Items", [])
