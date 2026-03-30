"""
Shared pytest fixtures for all tests.

Uses moto to mock AWS services so tests run without real AWS credentials.
"""
import os
import pytest
import boto3
from moto import mock_aws

# Point tests at fake AWS
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SECURITY_TOKEN", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")


@pytest.fixture
def aws_mock():
    """Activate moto mocking for DynamoDB and SNS."""
    with mock_aws():
        yield


@pytest.fixture
def app(aws_mock):
    """Create a Flask test application with mocked AWS."""
    from app.config import TestConfig
    from app import create_app

    _app = create_app(TestConfig)
    _app.config["TESTING"] = True
    _app.config["SECRET_KEY"] = "test-secret"

    with _app.app_context():
        yield _app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_client(client):
    """Return a test client that is already logged in as a test user."""
    client.post(
        "/api/auth/register",
        json={"email": "trader@example.com", "name": "Test Trader", "password": "secret123"},
    )
    return client
