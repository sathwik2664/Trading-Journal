import { formatCurrency } from '../../utils/helpers';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, subtitle, color }) => (
  <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-400 text-xs">{title}</span>
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    {subtitle && <div className="text-gray-500 text-xs mt-1">{subtitle}</div>}
  </div>
);

const StatsWidgets = ({ trades }) => {
  const netPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winners = trades.filter(t => t.pnl > 0);
  const losers = trades.filter(t => t.pnl < 0);
  const winRate = trades.length ? ((winners.length / trades.length) * 100).toFixed(2) : 0;
  const avgWin = winners.length ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const avgLoss = losers.length ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 0;
  const profitFactor = avgLoss ? (avgWin * winners.length / (avgLoss * losers.length)).toFixed(2) : 0;
  const tradeExpectancy = trades.length
    ? ((winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss).toFixed(2)
    : 0;
  const accountBalance = 32000 + netPnl;

  return (
    <div className="space-y-3">
      {/* Account Balance */}
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs mb-1">Account Balance & P&L</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(accountBalance)}</p>
            <p className={`text-sm mt-1 ${netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              P&L: {formatCurrency(netPnl)}
            </p>
          </div>
          {netPnl >= 0
            ? <TrendingUp className="text-green-400" size={24} />
            : <TrendingDown className="text-red-400" size={24} />
          }
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
        <p className="text-gray-400 text-xs mb-2">Trade Win %</p>
        <div className="flex items-center justify-between">
          <p className="text-white text-2xl font-bold">{winRate}%</p>
          <div className="flex gap-2 text-xs">
            <span className="text-green-400">{winners.length} W</span>
            <span className="text-red-400">{losers.length} L</span>
          </div>
        </div>
        <div className="mt-2 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Profit Factor */}
      <StatCard
        title="Profit Factor"
        value={profitFactor}
        color="text-white"
      />

      {/* Trade Expectancy */}
      <StatCard
        title="Trade Expectancy"
        value={formatCurrency(Number(tradeExpectancy))}
        color={tradeExpectancy >= 0 ? 'text-green-400' : 'text-red-400'}
      />
    </div>
  );
};

export default StatsWidgets;