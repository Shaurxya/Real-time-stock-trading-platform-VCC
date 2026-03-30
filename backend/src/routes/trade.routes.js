const express = require('express');
const router = express.Router();
const TradeController = require('../controllers/trade.controller');

router.post('/buy', TradeController.buy);
router.post('/sell', TradeController.sell);
router.get('/portfolio/:userId', TradeController.getPortfolio);
router.get('/orders/:userId', TradeController.getOrderHistory);

module.exports = router;
