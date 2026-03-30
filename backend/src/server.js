const http = require('http');
const app = require('./app');
const socketIo = require('socket.io');
const StockService = require('./services/stock.service');

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Poll stock prices every 5 seconds for connected clients
  const interval = setInterval(async () => {
    try {
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
      const updates = await Promise.all(symbols.map(async (symbol) => {
        const price = await StockService.getStockPrice(symbol);
        return { symbol, price };
      }));
      socket.emit('stockUpdates', updates);
    } catch (err) {
      console.error('Error polling stock prices:', err);
    }
  }, 5000);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(interval);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
