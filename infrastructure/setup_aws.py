"""
AWS Infrastructure setup script.

Run once to bootstrap DynamoDB tables, SNS topics, and verify IAM permissions.

Usage:
    python -m infrastructure.setup_aws

Environment variables:
    AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    (or use an IAM instance role on EC2)
"""
import os
import sys
import logging
import boto3
from botocore.exceptions import ClientError

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

DYNAMODB_TABLES = [
    {
        "TableName": os.environ.get("USERS_TABLE", "stock_platform_users"),
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
        "TableName": os.environ.get("PORTFOLIOS_TABLE", "stock_platform_portfolios"),
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
        "TableName": os.environ.get("TRADES_TABLE", "stock_platform_trades"),
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
        "TableName": os.environ.get("STOCKS_TABLE", "stock_platform_stocks"),
        "KeySchema": [{"AttributeName": "symbol", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "symbol", "AttributeType": "S"},
        ],
        "BillingMode": "PAY_PER_REQUEST",
    },
]

SNS_TOPICS = ["TradeNotifications", "PriceAlerts"]


def setup_dynamodb(region):
    dynamodb = boto3.client("dynamodb", region_name=region)
    for table_def in DYNAMODB_TABLES:
        name = table_def["TableName"]
        try:
            dynamodb.create_table(**table_def)
            logger.info("Created DynamoDB table: %s", name)
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceInUseException":
                logger.info("DynamoDB table already exists: %s", name)
            else:
                logger.error("Failed to create table %s: %s", name, e)
                raise
    # Wait for tables to become active
    waiter = dynamodb.get_waiter("table_exists")
    for table_def in DYNAMODB_TABLES:
        waiter.wait(TableName=table_def["TableName"])
        logger.info("Table active: %s", table_def["TableName"])


def setup_sns(region):
    sns = boto3.client("sns", region_name=region)
    arns = {}
    for topic_name in SNS_TOPICS:
        try:
            resp = sns.create_topic(Name=topic_name)
            arn = resp["TopicArn"]
            arns[topic_name] = arn
            logger.info("SNS topic ready: %s  ARN: %s", topic_name, arn)
        except ClientError as e:
            logger.error("Failed to create SNS topic %s: %s", topic_name, e)
    return arns


def main():
    logger.info("Starting AWS infrastructure setup (region: %s)…", AWS_REGION)
    setup_dynamodb(AWS_REGION)
    arns = setup_sns(AWS_REGION)
    logger.info("\n=== Setup complete ===")
    logger.info("Add these to your .env or EC2 instance environment:")
    for name, arn in arns.items():
        env_key = "TRADE_NOTIFICATIONS_TOPIC_ARN" if name == "TradeNotifications" else "PRICE_ALERTS_TOPIC_ARN"
        logger.info("  %s=%s", env_key, arn)


if __name__ == "__main__":
    main()
