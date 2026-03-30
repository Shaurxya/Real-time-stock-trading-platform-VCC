import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser, API_BASE } from '../context/UserContext';
import { History, ArrowUpRight, ArrowDownRight, Search, Download } from 'lucide-react';

const Orders = () => {
  const { userId } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/trade/orders/${userId}`);
      const sorted = (data || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setOrders(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const filtered = orders.filter((o) => {
    const matchesType = filterType === 'ALL' || o.type === filterType;
    const matchesSearch = o.stock_symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary dark:text-dark-text tracking-tight">Order History</h1>
          <p className="text-[12px] text-text-muted dark:text-dark-muted mt-0.5">All executed transactions</p>
        </div>
        <button className="btn-secondary flex items-center gap-1.5 text-[12px] py-1.5 px-3 rounded-xl">
          <Download size={13} />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
          <input
            type="text"
            placeholder="Search by symbol..."
            className="input-field pl-8 py-1.5 text-[12px] rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex bg-surface-secondary dark:bg-dark-bg rounded-xl p-0.5 gap-0.5">
          {['ALL', 'BUY', 'SELL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                filterType === type
                  ? 'bg-white dark:bg-dark-card text-text-primary dark:text-dark-text shadow-sm'
                  : 'text-text-muted dark:text-dark-muted hover:text-text-secondary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-secondary dark:bg-dark-bg border-b border-surface-border dark:border-dark-border">
                <th className="table-header">Time</th>
                <th className="table-header">Type</th>
                <th className="table-header">Instrument</th>
                <th className="table-header text-right">Qty</th>
                <th className="table-header text-right">Price</th>
                <th className="table-header text-right">Value</th>
                <th className="table-header text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border dark:divide-dark-border">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="table-cell"><div className="skeleton h-4 w-14 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-cell text-center py-14">
                    <div className="w-10 h-10 bg-surface-tertiary dark:bg-dark-border/40 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <History size={18} className="text-text-muted" />
                    </div>
                    <p className="text-[13px] text-text-muted dark:text-dark-muted">
                      {orders.length === 0 ? 'No orders placed yet.' : 'No matching orders found.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const isBuy = order.type === 'BUY';
                  const total = order.price * order.quantity;
                  return (
                    <tr key={order.order_id} className="hover:bg-surface-hover dark:hover:bg-dark-border/30 transition-colors">
                      <td className="table-cell">
                        <p className="text-[13px] font-medium text-text-primary dark:text-dark-text">
                          {new Date(order.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-text-muted dark:text-dark-muted">
                          {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isBuy ? 'bg-profit-light text-profit dark:bg-profit/10' : 'bg-loss-light text-loss dark:bg-loss/10'
                        }`}>
                          {isBuy ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {order.type}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-text-primary dark:text-dark-text text-[13px]">{order.stock_symbol}</td>
                      <td className="table-cell text-right font-medium text-text-primary dark:text-dark-text tabular-nums text-[13px]">{order.quantity}</td>
                      <td className="table-cell text-right text-text-secondary dark:text-dark-muted tabular-nums text-[13px]">${order.price.toFixed(2)}</td>
                      <td className="table-cell text-right font-semibold text-text-primary dark:text-dark-text tabular-nums text-[13px]">${total.toFixed(2)}</td>
                      <td className="table-cell text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent-light dark:bg-accent/10 text-accent text-[10px] font-bold">
                          Executed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-text-muted dark:text-dark-muted text-right">
          Showing {filtered.length} of {orders.length} orders
        </p>
      )}
    </div>
  );
};

export default Orders;
