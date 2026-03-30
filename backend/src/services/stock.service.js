const axios = require('axios');
require('dotenv').config();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;

const StockService = {
  async getStockPrice(symbol) {
    if (!FINNHUB_API_KEY) {
      console.warn('STOCK_API_KEY is not defined. Using mock price for development.');
      // Return a random price between 100 and 500
      return Math.random() * (500 - 100) + 100;
    }
    try {
      // Finnhub quote endpoint
      const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
      if (response.data && response.data.c) {
        return response.data.c; // current price
      }
      throw new Error(`Invalid stock symbol: ${symbol}`);
    } catch (err) {
      console.error('Error fetching stock price:', err);
      return Math.random() * (500 - 100) + 100; // Return mock price on error
    }
  },

  async getHistoricalData(symbol) {
    // This could fetch historical data for charts
    // For simplicity, we'll return mock data for last 10 days
    const mockData = [];
    for (let i = 10; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockData.push({
        date: date.toISOString().split('T')[0],
        price: Math.random() * (500 - 100) + 100
      });
    }
    return mockData;
  }
};

module.exports = StockService;
