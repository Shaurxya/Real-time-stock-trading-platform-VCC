import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PERIODS = ['1D', '1W', '1M', '3M', '1Y'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 shadow-elevated">
      <p className="text-[10px] text-text-muted dark:text-dark-muted font-medium mb-0.5">{label}</p>
      <p className="text-[13px] font-bold text-text-primary dark:text-dark-text tabular-nums">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const StockChart = ({ symbol, data = [] }) => {
  const [activePeriod, setActivePeriod] = useState('1W');

  if (!data.length) return null;

  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const isUp = lastPrice >= firstPrice;
  const lineColor = isUp ? '#16a34a' : '#dc2626';

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-text-primary dark:text-dark-text tracking-tight">{symbol}</h2>
          <p className="text-[11px] text-text-muted dark:text-dark-muted mt-0.5">Price Chart — Historical Performance</p>
        </div>
        <div className="flex bg-surface-secondary dark:bg-dark-bg rounded-lg p-0.5 gap-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                activePeriod === p
                  ? 'bg-white dark:bg-dark-card text-text-primary dark:text-dark-text shadow-sm'
                  : 'text-text-muted dark:text-dark-muted hover:text-text-secondary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.08} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val?.split('-').slice(1).join('/')}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val.toFixed(0)}`}
              domain={['dataMin - 10', 'dataMax + 10']}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={1.8}
              fill="url(#chartGradient)"
              dot={false}
              activeDot={{ r: 3.5, stroke: lineColor, strokeWidth: 2, fill: '#fff' }}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
