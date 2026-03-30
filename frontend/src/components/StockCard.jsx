import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { STOCK_NAMES } from './Navbar';

const StockCard = ({ stock, onSelect, isSelected }) => {
  const { symbol, price, historicalData = [] } = stock;

  const seed = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1);
  const change = ((seed % 700) / 100 - 3).toFixed(2);
  const isUp = parseFloat(change) >= 0;
  const companyName = STOCK_NAMES[symbol] || symbol;

  return (
    <div
      onClick={() => onSelect(stock)}
      className={`group relative p-4 rounded-xl border bg-white dark:bg-dark-card cursor-pointer transition-all duration-200 hover:shadow-card-hover ${
        isSelected
          ? 'border-accent/30 ring-1 ring-accent/20 shadow-card-hover'
          : 'border-surface-border dark:border-dark-border hover:border-slate-300 shadow-card'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold text-text-primary dark:text-dark-text tracking-tight">{symbol}</h3>
          <p className="text-[11px] text-text-muted dark:text-dark-muted truncate mt-0.5">{companyName}</p>
        </div>
        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
          isUp ? 'bg-profit-light text-profit dark:bg-profit/10' : 'bg-loss-light text-loss dark:bg-loss/10'
        }`}>
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isUp ? '+' : ''}{change}%
        </div>
      </div>

      {/* Price */}
      <p className="text-[17px] font-bold text-text-primary dark:text-dark-text tabular-nums tracking-tight mb-2">
        ${price.toFixed(2)}
      </p>

      {/* Sparkline */}
      <div className="h-9 -mx-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historicalData}>
            <defs>
              <linearGradient id={`spark-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? '#16a34a' : '#dc2626'} stopOpacity={0.2} />
                <stop offset="100%" stopColor={isUp ? '#16a34a' : '#dc2626'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="price"
              stroke={isUp ? '#16a34a' : '#dc2626'}
              strokeWidth={1.5}
              fill={`url(#spark-${symbol})`}
              dot={false}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockCard;
