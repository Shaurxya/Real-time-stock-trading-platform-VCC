# Real-Time Stock Trading Platform (VCC)

A simulated real-time stock trading platform that lets users **track stock prices**, **execute buy/sell orders**, and **manage a virtual portfolio**.  Built with Python/Flask and deployed on AWS using **EC2**, **DynamoDB**, **SNS**, and **IAM**.

---

## Architecture

```
Browser ─► Flask App (EC2) ─► DynamoDB  (users, portfolios, trades, stocks)
                           └─► SNS      (trade confirmations, price alerts)

IAM Role attached to EC2 grants least-privilege access to DynamoDB & SNS.
```

### AWS Services Used

| Service | Usage |
|---------|-------|
| **EC2** | Hosts the Flask web application (Docker container) |
| **DynamoDB** | Stores users, portfolios, trade history, and stock prices |
| **SNS** | Publishes trade confirmation and price-alert notifications |
| **IAM** | Least-privilege policy that grants the EC2 instance access only to the required DynamoDB tables and SNS topics |

---

## Features

- **User authentication** — register, login, logout with hashed passwords stored in DynamoDB
- **Live market view** — simulated stock prices for 10 popular tickers with auto-refresh every 30 s
- **Buy / Sell orders** — validates available cash (buy) or shares (sell), updates portfolio atomically
- **Virtual portfolio** — real-time unrealized P&L, average cost basis, total value breakdown
- **Trade history** — full audit trail of all executed orders
- **SNS notifications** — publishes a message to an SNS topic on every trade execution and on significant price movements
- **Responsive UI** — dark-mode single-page interface; no build tools required

---

## Project Structure

```
.
├── main.py                        # Application entry point
├── app/
│   ├── __init__.py                # Flask app factory
│   ├── config.py                  # Configuration (env vars)
│   ├── routes/
│   │   ├── auth.py                # /api/auth  — register, login, logout, me
│   │   ├── stocks.py              # /api/stocks — list, get, refresh
│   │   ├── trades.py              # /api/trades — buy, sell, history
│   │   ├── portfolio.py           # /api/portfolio — holdings & P&L
│   │   └── ui.py                  # Serves HTML pages
│   ├── services/
│   │   ├── dynamodb_service.py    # All DynamoDB read/write helpers
│   │   ├── sns_service.py         # SNS publish helpers
│   │   └── stock_price_service.py # Simulated price engine
│   └── templates/
│       ├── base.html
│       ├── index.html             # Market + trade modal
│       └── dashboard.html         # Portfolio & trade history
├── infrastructure/
│   ├── setup_aws.py               # One-time AWS bootstrap script
│   └── iam_policy.json            # IAM policy for EC2 instance role
├── tests/
│   ├── conftest.py                # pytest fixtures (moto mocks)
│   ├── test_auth.py
│   ├── test_stocks.py
│   ├── test_trades.py
│   └── test_portfolio.py
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## Local Development

### Prerequisites

- Python 3.11+
- AWS credentials (or use a mock — see below)

### Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Bootstrap AWS resources (run once against real AWS)
python -m infrastructure.setup_aws

# 3. Start the app
python main.py
# → Open http://localhost:5000
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key-change-in-prod` | Flask session secret |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | _(empty)_ | AWS credentials (omit on EC2 with IAM role) |
| `AWS_SECRET_ACCESS_KEY` | _(empty)_ | AWS credentials |
| `USERS_TABLE` | `stock_platform_users` | DynamoDB table |
| `PORTFOLIOS_TABLE` | `stock_platform_portfolios` | DynamoDB table |
| `TRADES_TABLE` | `stock_platform_trades` | DynamoDB table |
| `STOCKS_TABLE` | `stock_platform_stocks` | DynamoDB table |
| `TRADE_NOTIFICATIONS_TOPIC_ARN` | _(empty)_ | SNS topic (output by setup script) |
| `PRICE_ALERTS_TOPIC_ARN` | _(empty)_ | SNS topic (output by setup script) |
| `INITIAL_BALANCE` | `100000.0` | Virtual cash given to new users |

---

## Running Tests

Tests use **moto** to mock all AWS calls — no real AWS credentials needed.

```bash
python -m pytest tests/ -v
```

---

## Docker / EC2 Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and push to ECR, then pull on the EC2 instance:
docker build -t stock-trading-platform .
```

On EC2, attach an IAM instance profile using the policy in `infrastructure/iam_policy.json`.  The application will automatically use the instance metadata credentials — no `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` environment variables required.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | ✓ | Logout |
| GET | `/api/auth/me` | ✓ | Current user info |
| GET | `/api/stocks/` | — | List all stocks |
| GET | `/api/stocks/<symbol>` | — | Get single stock |
| POST | `/api/stocks/refresh` | — | Simulate market tick |
| POST | `/api/trades/buy` | ✓ | Execute buy order |
| POST | `/api/trades/sell` | ✓ | Execute sell order |
| GET | `/api/trades/history` | ✓ | Trade history |
| GET | `/api/portfolio/` | ✓ | Portfolio with P&L |