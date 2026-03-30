import React from 'react';
import { LayoutDashboard, Briefcase, History, TrendingUp, Moon, Sun, Wallet } from 'lucide-react';
import { useUser } from '../context/UserContext';

const STOCK_NAMES = {
  AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', GOOGL: 'Alphabet Inc.', AMZN: 'Amazon.com Inc.',
  TSLA: 'Tesla Inc.', META: 'Meta Platforms', NFLX: 'Netflix Inc.', NVDA: 'NVIDIA Corp.',
  BABA: 'Alibaba Group', ORCL: 'Oracle Corp.'
};

export { STOCK_NAMES };

const Navbar = ({ activePage, setActivePage }) => {
  const { balance, darkMode, toggleDarkMode } = useUser();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'orders', label: 'Orders', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border-b border-surface-border dark:border-dark-border">
      <div className="max-w-[1400px] mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-bold text-text-primary dark:text-dark-text tracking-tight">
            StockTrade<span className="text-accent">Pro</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5 bg-surface-secondary dark:bg-dark-bg/50 rounded-xl p-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                activePage === item.id
                  ? 'bg-white dark:bg-dark-card text-accent shadow-sm'
                  : 'text-text-muted dark:text-dark-muted hover:text-text-primary dark:hover:text-dark-text'
              }`}
            >
              <item.icon size={14} strokeWidth={activePage === item.id ? 2.5 : 2} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-text-muted dark:text-dark-muted hover:bg-surface-hover dark:hover:bg-dark-border/50 transition-colors"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="h-7 w-px bg-surface-border dark:bg-dark-border" />

          <div className="flex items-center gap-2.5 bg-surface-secondary dark:bg-dark-bg/50 rounded-xl px-3 py-1.5">
            <Wallet size={14} className="text-accent" />
            <div>
              <p className="text-[10px] font-semibold text-text-muted dark:text-dark-muted uppercase tracking-wider leading-none mb-0.5">Balance</p>
              <p className="text-[13px] font-bold text-text-primary dark:text-dark-text tabular-nums leading-none">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
