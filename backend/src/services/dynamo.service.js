const { dynamoDB } = require('../config/aws.config');
require('dotenv').config();

const TABLES = {
  USERS: process.env.DYNAMO_USERS_TABLE || 'Users',
  STOCKS: process.env.DYNAMO_STOCKS_TABLE || 'Stocks',
  ORDERS: process.env.DYNAMO_ORDERS_TABLE || 'Orders',
  PORTFOLIO: process.env.DYNAMO_PORTFOLIO_TABLE || 'Portfolio'
};

const DynamoService = {
  // User operations
  async getUser(userId) {
    const params = {
      TableName: TABLES.USERS,
      Key: { user_id: userId }
    };
    const { Item } = await dynamoDB.get(params).promise();
    return Item;
  },

  async updateUserBalance(userId, newBalance) {
    const params = {
      TableName: TABLES.USERS,
      Key: { user_id: userId },
      UpdateExpression: 'set balance = :b',
      ExpressionAttributeValues: { ':b': newBalance }
    };
    return dynamoDB.update(params).promise();
  },

  // Stock operations
  async getStock(symbol) {
    const params = {
      TableName: TABLES.STOCKS,
      Key: { stock_symbol: symbol }
    };
    const { Item } = await dynamoDB.get(params).promise();
    return Item;
  },

  async updateStockPrice(symbol, price) {
    const params = {
      TableName: TABLES.STOCKS,
      Item: {
        stock_symbol: symbol,
        price,
        timestamp: new Date().toISOString()
      }
    };
    return dynamoDB.put(params).promise();
  },

  // Trade operations
  async createOrder(order) {
    const params = {
      TableName: TABLES.ORDERS,
      Item: {
        ...order,
        order_id: `ORD_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    };
    return dynamoDB.put(params).promise();
  },

  async getOrdersByUser(userId) {
    const params = {
      TableName: TABLES.ORDERS,
      FilterExpression: 'user_id = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    };
    const { Items } = await dynamoDB.scan(params).promise();
    return Items;
  },

  // Portfolio operations
  async getPortfolioItem(userId, symbol) {
    const params = {
      TableName: TABLES.PORTFOLIO,
      Key: { user_id: userId, stock_symbol: symbol }
    };
    const { Item } = await dynamoDB.get(params).promise();
    return Item;
  },

  async getPortfolio(userId) {
    const params = {
      TableName: TABLES.PORTFOLIO,
      FilterExpression: 'user_id = :uid',
      ExpressionAttributeValues: { ':uid': userId }
    };
    const { Items } = await dynamoDB.scan(params).promise();
    return Items;
  },

  async updatePortfolio(userId, symbol, quantity, avgPrice) {
    if (quantity === 0) {
      const params = {
        TableName: TABLES.PORTFOLIO,
        Key: { user_id: userId, stock_symbol: symbol }
      };
      return dynamoDB.delete(params).promise();
    }
    const params = {
      TableName: TABLES.PORTFOLIO,
      Item: {
        user_id: userId,
        stock_symbol: symbol,
        quantity,
        avg_price: avgPrice,
        updated_at: new Date().toISOString()
      }
    };
    return dynamoDB.put(params).promise();
  }
};

module.exports = DynamoService;
