const DynamoService = require('../services/dynamo.service');
const StockService = require('../services/stock.service');
const SnsService = require('../services/sns.service');

const TradeController = {
  async buy(req, res) {
    const { userId, symbol, quantity } = req.body;
    try {
      const user = await DynamoService.getUser(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const price = await StockService.getStockPrice(symbol);
      const totalCost = price * quantity;

      if (user.balance < totalCost) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // 1. Update user balance
      const newBalance = user.balance - totalCost;
      await DynamoService.updateUserBalance(userId, newBalance);

      // 2. Update portfolio
      const portfolioItem = await DynamoService.getPortfolioItem(userId, symbol);
      let newQuantity = quantity;
      let newAvgPrice = price;

      if (portfolioItem) {
        newQuantity = portfolioItem.quantity + quantity;
        newAvgPrice = (portfolioItem.avg_price * portfolioItem.quantity + price * quantity) / newQuantity;
      }
      await DynamoService.updatePortfolio(userId, symbol, newQuantity, newAvgPrice);

      // 3. Create order history
      const order = {
        user_id: userId,
        stock_symbol: symbol,
        type: 'BUY',
        quantity,
        price,
        total_cost: totalCost
      };
      await DynamoService.createOrder(order);

      // 4. Send SNS alert
      await SnsService.sendTradeConfirmation(userId, { ...order, order_id: `ORD_${Date.now()}` });

      res.status(201).json({ message: 'Buy successful', balance: newBalance });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to complete buy operation' });
    }
  },

  async sell(req, res) {
    const { userId, symbol, quantity } = req.body;
    try {
      const user = await DynamoService.getUser(userId);
      const portfolioItem = await DynamoService.getPortfolioItem(userId, symbol);

      if (!portfolioItem || portfolioItem.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient stock holdings' });
      }

      const price = await StockService.getStockPrice(symbol);
      const totalGain = price * quantity;

      // 1. Update user balance
      const newBalance = user.balance + totalGain;
      await DynamoService.updateUserBalance(userId, newBalance);

      // 2. Update portfolio
      const newQuantity = portfolioItem.quantity - quantity;
      await DynamoService.updatePortfolio(userId, symbol, newQuantity, portfolioItem.avg_price);

      // 3. Create order history
      const order = {
        user_id: userId,
        stock_symbol: symbol,
        type: 'SELL',
        quantity,
        price,
        total_gain: totalGain
      };
      await DynamoService.createOrder(order);

      // 4. Send SNS alert
      await SnsService.sendTradeConfirmation(userId, { ...order, order_id: `ORD_${Date.now()}` });

      res.status(201).json({ message: 'Sell successful', balance: newBalance });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to complete sell operation' });
    }
  },

  async getPortfolio(req, res) {
    const { userId } = req.params;
    try {
      const user = await DynamoService.getUser(userId);
      if (!user) {
        // Create user if not exists for demo purposes
        await DynamoService.updateUserBalance(userId, 50000); // 50k starting balance
        return res.json({ profile: { user_id: userId, balance: 50000 }, portfolio: [] });
      }
      const portfolio = await DynamoService.getPortfolio(userId);
      
      // Enriched portfolio with current prices
      const enrichedPortfolio = await Promise.all(portfolio.map(async (item) => {
        const currentPrice = await StockService.getStockPrice(item.stock_symbol);
        const profitLoss = (currentPrice - item.avg_price) * item.quantity;
        return {
          ...item,
          current_price: currentPrice,
          profit_loss: profitLoss,
          profit_loss_percent: ((currentPrice - item.avg_price) / item.avg_price) * 100
        };
      }));

      res.json({ profile: user, portfolio: enrichedPortfolio });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
  },

  async getOrderHistory(req, res) {
    const { userId } = req.params;
    try {
      const orders = await DynamoService.getOrdersByUser(userId);
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch order history' });
    }
  }
};

module.exports = TradeController;
