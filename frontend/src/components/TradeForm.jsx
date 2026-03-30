import React, { useState } from 'react';
import axios from 'axios';
import { useUser, API_BASE } from '../context/UserContext';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const TradeForm = ({ symbol, price, onTradeComplete }) => {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState('BUY');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const { userId, fetchBalance } = useUser();

  const handleTrade = async (e) => {
    e.preventDefault();
    if (quantity < 1) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      const endpoint = orderType === 'BUY' ? 'buy' : 'sell';
      await axios.post(`${API_BASE}/trade/${endpoint}`, {
        userId,
        symbol,
        quantity: parseInt(quantity),
      });
      setFeedback({
        type: 'success',
        message: `${orderType} order for ${quantity} × ${symbol} executed at $${price.toFixed(2)}`,
      });
      fetchBalance();
      if (onTradeComplete) onTradeComplete();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Trade failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const total = (price * quantity).toFixed(2);

  return (
    <div className="card p-5">
      <h3 className="text-[13px] font-bold text-text-primary dark:text-dark-text mb-4 tracking-tight">Place Order</h3>

      {/* Buy / Sell Toggle */}
      <div className="flex bg-surface-secondary dark:bg-dark-bg rounded-xl p-1 mb-5 gap-1">
        {['BUY', 'SELL'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => { setOrderType(type); setFeedback(null); }}
            className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all duration-200 ${
              orderType === type
                ? type === 'BUY'
                  ? 'bg-profit text-white shadow-sm'
                  : 'bg-loss text-white shadow-sm'
                : 'text-text-muted dark:text-dark-muted hover:text-text-secondary'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <form onSubmit={handleTrade} className="space-y-3.5">
        {/* Quantity */}
        <div>
          <label className="block text-[11px] font-semibold text-text-secondary dark:text-dark-muted mb-1.5 uppercase tracking-wider">Qty</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input-field tabular-nums text-[13px]"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-[11px] font-semibold text-text-secondary dark:text-dark-muted mb-1.5 uppercase tracking-wider">Price</label>
          <div className="input-field bg-surface-secondary dark:bg-dark-bg cursor-default text-text-muted dark:text-dark-muted tabular-nums text-[13px]">
            ${price.toFixed(2)}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t border-surface-border dark:border-dark-border pt-3.5 space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-text-muted dark:text-dark-muted">Quantity</span>
            <span className="font-semibold text-text-primary dark:text-dark-text">{quantity}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-muted dark:text-dark-muted">Price</span>
            <span className="font-semibold text-text-primary dark:text-dark-text">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[13px] pt-2 border-t border-dashed border-surface-border dark:border-dark-border">
            <span className="font-semibold text-text-secondary dark:text-dark-muted">Total</span>
            <span className="font-bold text-text-primary dark:text-dark-text tabular-nums">${total}</span>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`flex items-start gap-2 p-3 rounded-xl text-[11px] font-medium animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-profit-light text-profit dark:bg-profit/10'
              : 'bg-loss-light text-loss dark:bg-loss/10'
          }`}>
            {feedback.type === 'success' ? <CheckCircle size={13} className="mt-0.5 shrink-0" /> : <AlertCircle size={13} className="mt-0.5 shrink-0" />}
            {feedback.message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || quantity < 1}
          className={`w-full py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            orderType === 'BUY'
              ? 'bg-profit hover:bg-green-700 text-white'
              : 'bg-loss hover:bg-red-700 text-white'
          } ${isLoading ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}`}
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {isLoading ? 'Executing...' : `${orderType} ${symbol}`}
        </button>
      </form>
    </div>
  );
};

export default TradeForm;
