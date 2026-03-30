const StockService = require('../services/stock.service');

const StockController = {
  async getStock(req, res) {
    const { symbol } = req.params;
    try {
      const price = await StockService.getStockPrice(symbol);
      const historicalData = await StockService.getHistoricalData(symbol);
      return res.json({ symbol, price, historicalData });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch stock information' });
    }
  },

  async getAllStocks(req, res) {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA', 'BABA', 'ORCL'];
    try {
      const promises = symbols.map(async (symbol) => {
        const price = await StockService.getStockPrice(symbol);
        return { symbol, price };
      });
      const stocks = await Promise.all(promises);
      res.json(stocks);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch all stocks' });
    }
  }
};

module.exports = StockController;
