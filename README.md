# Real-Time Stock Trading Platform

A production-ready full-stack simulation platform for stock trading built with Node.js, React, and AWS (DynamoDB, SNS, IAM).

## 🚀 Overview
This project provides a comprehensive dashboard for users to track real-time stock prices, execute simulated BUY/SELL orders, and manage a portfolio with live P/L calculations.

## 🏗️ Technology Stack
- **Frontend**: React, Tailwind CSS, Recharts, Lucide-React, Socket.io-Client.
- **Backend**: Node.js, Express, Socket.io, AWS-SDK.
- **Database**: AWS DynamoDB (NoSQL).
- **Notifications**: AWS SNS (Simple Notification Service).
- **External API**: Finnhub / Alpha Vantage.

## 📁 Key Directories
- `/backend`: Node.js/Express server logic and AWS integrations.
- `/frontend`: React dashboard UI and WebSocket client support.

## 🛠️ Instructions
Please refer to the detailed [Setup Guide](setup_guide.md) for environment configuration and AWS infrastructure setup.

## ✨ Features
- **Live Trading Dashboard**: Real-time ticker updates via WebSockets.
- **Dynamic Charts**: Interactive area charts for historical price analysis.
- **Portfolio Management**: Holistic view of total value, holdings, and individual performance metrics.
- **Transaction Ledger**: Historical record of every execution for audit purposes.
- **SNS Alerts**: Instant e-mail or SMS notifications for executed trades.

---
Developed as a complete cloud-integrated simulation project.
