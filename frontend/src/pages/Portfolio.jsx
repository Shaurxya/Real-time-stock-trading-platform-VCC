import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser, API_BASE } from '../context/UserContext';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Activity, Briefcase } from 'lucide-react';

const Portfolio = () => {
  const { userId, balance } = useUser();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/trade/portfolio/${userId}`);
      setPortfolio(data.portfolio || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [userId]);

  const totalInvested = portfolio.reduce((acc, item) => acc + item.avg_price * item.quantity, 0);
  const totalCurrent = portfolio.reduce((acc, item) => acc + item.current_price * item.quantity, 0);
  const totalPL = portfolio.reduce((acc, item) => acc + item.profit_loss, 0);
  const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
  const isProfit = totalPL >= 0;

  const summaryCards = [
    {
      label: 'Current Value',
      value: `$${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: BarChart3,
      color: 'text-accent',
      bg: 'bg-accent-light dark:bg-accent/10',
    },
    {
      label: 'Total P&L',
      value: `${isProfit ? '+' : ''}$${Math.abs(totalPL).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: `${totalPLPercent.toFixed(2)}%`,
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? 'text-profit' : 'text-loss',
      bg: isProfit ? 'bg-profit-light dark:bg-profit/10' : 'bg-loss-light dark:bg-loss/10',
    },
    {
      label: 'Available Funds',
      value: `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-text-secondary dark:text-dark-muted',
      bg: 'bg-surface-tertiary dark:bg-dark-border/40',
    },
    {
      label: 'Holdings',
      value: `${portfolio.length} stocks`,
      icon: Briefcase,
      color: 'text-text-secondary dark:text-dark-muted',
      bg: 'bg-surface-tertiary dark:bg-dark-border/40',
    },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-text-primary dark:text-dark-text tracking-tight">Portfolio</h1>
        <p className="text-[12px] text-text-muted dark:text-dark-muted mt-0.5">Holdings & performance overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="card p-4 flex items-start gap-3">
            <div className={`p-2 rounded-xl ${c.bg}`}>
              <c.icon size={16} className={c.color} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider mb-0.5">{c.label}</p>
              <p className={`text-[15px] font-bold tabular-nums tracking-tight ${c.color === 'text-accent' || c.color === 'text-profit' || c.color === 'text-loss' ? c.color : 'text-text-primary dark:text-dark-text'}`}>
                {c.value}
              </p>
              {c.sub && <p className={`text-[11px] font-semibold ${c.color}`}>{c.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border dark:border-dark-border">
          <h2 className="text-[13px] font-bold text-text-primary dark:text-dark-text tracking-tight">Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-secondary dark:bg-dark-bg border-b border-surface-border dark:border-dark-border">
                <th className="table-header">Instrument</th>
                <th className="table-header text-right">Qty</th>
                <th className="table-header text-right">Avg. Price</th>
                <th className="table-header text-right">LTP</th>
                <th className="table-header text-right">Current Value</th>
                <th className="table-header text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border dark:divide-dark-border">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton h-4 w-16 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : portfolio.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-14">
                    <div className="w-10 h-10 bg-surface-tertiary dark:bg-dark-border/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Activity size={18} className="text-text-muted" />
                    </div>
                    <p className="text-[13px] text-text-muted dark:text-dark-muted">No holdings yet. Start trading to build your portfolio.</p>
                  </td>
                </tr>
              ) : (
                portfolio.map((item) => {
                  const currentVal = item.current_price * item.quantity;
                  const plUp = item.profit_loss >= 0;
                  return (
                    <tr key={item.stock_symbol} className="hover:bg-surface-hover dark:hover:bg-dark-border/30 transition-colors">
                      <td className="table-cell">
                        <p className="text-[13px] font-semibold text-text-primary dark:text-dark-text">{item.stock_symbol}</p>
                        <p className="text-[10px] text-text-muted dark:text-dark-muted">Equity</p>
                      </td>
                      <td className="table-cell text-right font-semibold text-text-primary dark:text-dark-text tabular-nums text-[13px]">{item.quantity}</td>
                      <td className="table-cell text-right text-text-secondary dark:text-dark-muted tabular-nums text-[13px]">${item.avg_price.toFixed(2)}</td>
                      <td className="table-cell text-right font-semibold text-text-primary dark:text-dark-text tabular-nums text-[13px]">${item.current_price.toFixed(2)}</td>
                      <td className="table-cell text-right font-semibold text-text-primary dark:text-dark-text tabular-nums text-[13px]">${currentVal.toFixed(2)}</td>
                      <td className="table-cell text-right">
                        <p className={`font-semibold tabular-nums text-[13px] ${plUp ? 'text-profit' : 'text-loss'}`}>
                          {plUp ? '+' : ''}{item.profit_loss.toFixed(2)}
                        </p>
                        <p className={`text-[10px] font-medium tabular-nums ${plUp ? 'text-profit' : 'text-loss'}`}>
                          {plUp ? '+' : ''}{item.profit_loss_percent.toFixed(2)}%
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
