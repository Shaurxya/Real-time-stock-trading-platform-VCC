import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import StockCard from '../components/StockCard';
import StockChart from '../components/StockChart';
import TradeForm from '../components/TradeForm';
import { STOCK_NAMES } from '../components/Navbar';
import { API_BASE } from '../context/UserContext';
import { Search, RefreshCw, TrendingUp, BarChart2 } from 'lucide-react';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/stocks`);
      setStocks(data);
      if (data.length > 0 && !selectedStock) {
        const { data: detail } = await axios.get(`${API_BASE}/stocks/${data[0].symbol}`);
        setSelectedStock(detail);
      }
    } catch (err) {
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();

    const socket = io('https://98.93.37.160.nip.io');
    socket.on('stockUpdates', (updates) => {
      setStocks((prev) =>
        prev.map((s) => {
          const update = updates.find((u) => u.symbol === s.symbol);
          return update ? { ...s, price: update.price } : s;
        })
      );
      setSelectedStock((prev) => {
        if (!prev) return prev;
        const update = updates.find((u) => u.symbol === prev.symbol);
        return update ? { ...prev, price: update.price } : prev;
      });
    });

    return () => socket.disconnect();
  }, []);

  const handleSelectStock = async (stock) => {
    try {
      const { data } = await axios.get(`${API_BASE}/stocks/${stock.symbol}`);
      setSelectedStock(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStocks = stocks.filter((s) =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    (STOCK_NAMES[s.symbol] || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary dark:text-dark-text tracking-tight">Dashboard</h1>
          <p className="text-[12px] text-text-muted dark:text-dark-muted mt-0.5">Market overview & trading</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
            <input
              type="text"
              placeholder="Search stocks..."
              className="input-field pl-8 pr-3 w-52 py-1.5 text-[12px] rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchStocks}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover dark:hover:bg-dark-border/50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {selectedStock ? (
            <StockChart symbol={selectedStock.symbol} data={selectedStock.historicalData} />
          ) : (
            <div className="card p-14 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 bg-surface-tertiary dark:bg-dark-border/40 rounded-xl flex items-center justify-center mb-3">
                <BarChart2 size={20} className="text-text-muted" />
              </div>
              <p className="text-[13px] font-medium text-text-secondary dark:text-dark-muted">
                Select a stock to view its chart
              </p>
            </div>
          )}

          {/* Stock Grid */}
          <div>
            <h2 className="text-[11px] font-semibold text-text-muted dark:text-dark-muted mb-3 uppercase tracking-wider">
              Market Watch
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {loading && stocks.length === 0
                ? Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)
                : filteredStocks.map((stock) => (
                    <StockCard
                      key={stock.symbol}
                      stock={stock}
                      isSelected={selectedStock?.symbol === stock.symbol}
                      onSelect={handleSelectStock}
                    />
                  ))
              }
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {selectedStock && (
            <TradeForm
              symbol={selectedStock.symbol}
              price={selectedStock.price}
              onTradeComplete={fetchStocks}
            />
          )}

          {/* Watchlist */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border dark:border-dark-border">
              <h3 className="text-[13px] font-bold text-text-primary dark:text-dark-text tracking-tight">Watchlist</h3>
            </div>
            <div className="divide-y divide-surface-border dark:divide-dark-border">
              {stocks.slice(0, 6).map((s) => {
                const seed = s.symbol.charCodeAt(0) + s.symbol.charCodeAt(s.symbol.length - 1);
                const change = ((seed % 700) / 100 - 3).toFixed(2);
                const isUp = parseFloat(change) >= 0;

                return (
                  <div
                    key={s.symbol}
                    onClick={() => handleSelectStock(s)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover dark:hover:bg-dark-border/30 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-text-primary dark:text-dark-text">{s.symbol}</p>
                      <p className="text-[10px] text-text-muted dark:text-dark-muted truncate">
                        {STOCK_NAMES[s.symbol] || 'Equity'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-text-primary dark:text-dark-text tabular-nums">
                        ${s.price.toFixed(2)}
                      </p>
                      <p className={`text-[10px] font-semibold tabular-nums ${isUp ? 'text-profit' : 'text-loss'}`}>
                        {isUp ? '+' : ''}{change}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
