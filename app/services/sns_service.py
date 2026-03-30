import json
import logging
import boto3
from botocore.exceptions import ClientError
from flask import current_app

logger = logging.getLogger(__name__)


def _get_sns(app=None):
    cfg = app.config if app else current_app.config
    kwargs = {"region_name": cfg["AWS_REGION"]}
    if cfg.get("AWS_ACCESS_KEY_ID"):
        kwargs["aws_access_key_id"] = cfg["AWS_ACCESS_KEY_ID"]
        kwargs["aws_secret_access_key"] = cfg["AWS_SECRET_ACCESS_KEY"]
    return boto3.client("sns", **kwargs)


def _publish(app, topic_arn, subject, message):
    """Publish a message to an SNS topic. Silently skips if topic ARN is unset."""
    if not topic_arn:
        logger.debug("SNS topic ARN not configured; skipping notification.")
        return None
    sns = _get_sns(app)
    try:
        resp = sns.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=json.dumps(message),
            MessageStructure="string",
        )
        return resp.get("MessageId")
    except ClientError as exc:
        logger.error("Failed to publish SNS message: %s", exc)
        return None


def notify_trade_executed(app, user_id, trade):
    """Send a trade confirmation notification."""
    topic_arn = app.config.get("TRADE_NOTIFICATIONS_TOPIC_ARN", "")
    subject = f"Trade Executed: {trade['trade_type'].upper()} {trade['quantity']} {trade['symbol']}"
    message = {
        "event": "trade_executed",
        "user_id": user_id,
        "trade": trade,
    }
    return _publish(app, topic_arn, subject, message)


def notify_price_alert(app, symbol, old_price, new_price, threshold_pct):
    """Send a price alert when a stock moves more than threshold_pct."""
    topic_arn = app.config.get("PRICE_ALERTS_TOPIC_ARN", "")
    subject = f"Price Alert: {symbol} moved {threshold_pct:.1f}%"
    message = {
        "event": "price_alert",
        "symbol": symbol,
        "old_price": old_price,
        "new_price": new_price,
        "change_pct": threshold_pct,
    }
    return _publish(app, topic_arn, subject, message)


def create_topics(app):
    """Create SNS topics and return their ARNs."""
    sns = _get_sns(app)
    arns = {}
    for name in ("TradeNotifications", "PriceAlerts"):
        try:
            resp = sns.create_topic(Name=name)
            arns[name] = resp["TopicArn"]
        except ClientError as exc:
            logger.error("Failed to create SNS topic %s: %s", name, exc)
    return arns
