const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const stockRoutes = require('./routes/stock.routes');
const tradeRoutes = require('./routes/trade.routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/trade', tradeRoutes);

// Simple health check
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
