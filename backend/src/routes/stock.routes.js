const express = require('express');
const router = express.Router();
const StockController = require('../controllers/stock.controller');

router.get('/:symbol', StockController.getStock);
router.get('/', StockController.getAllStocks);

module.exports = router;
