import { useTrades } from '../hooks/useTrades';
import Loader from '../components/shared/Loader';
import { formatCurrency } from '../utils/helpers';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import dayjs from 'dayjs';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2">
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white text-sm font-bold">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const { trades, loading } = useTrades();

  if (loading) return <Loader />;

  // Stats
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winners = trades.filter(t => t.pnl > 0);
  const losers = trades.filter(t => t.pnl < 0);
  const winRate = trades.length ? ((winners.length / trades.length) * 100).toFixed(1) : 0;
  const avgWin = winners.length ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const avgLoss = losers.length ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 0;
  const profitFactor = avgLoss ? (avgWin * winners.length / (avgLoss * losers.length)).toFixed(2) : 0;
  const bestTrade = trades.length ? Math.max(...trades.map(t => t.pnl)) : 0;
  const worstTrade = trades.length ? Math.min(...trades.map(t => t.pnl)) : 0;
  const avgPnl = trades.length ? (netPnl / trades.length).toFixed(2) : 0;

  // Cumulative P&L
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulative = 0;
  const cumulativeData = sortedTrades.map(t => {
    cumulative += t.pnl;
    return {
      date: dayjs(t.date).format('MMM DD'),
      pnl: parseFloat(cumulative.toFixed(2)),
    };
  });

  // Daily P&L bar chart
  const dailyMap = {};
  sortedTrades.forEach(t => {
    const key = dayjs(t.date).format('MMM DD');
    dailyMap[key] = (dailyMap[key] || 0) + t.pnl;
  });
  const dailyData = Object.entries(dailyMap).map(([date, pnl]) => ({
    date,
    pnl: parseFloat(pnl.toFixed(2)),
  }));

  // Symbol breakdown
  const symbolMap = {};
  trades.forEach(t => {
    if (!symbolMap[t.symbol]) symbolMap[t.symbol] = { pnl: 0, count: 0 };
    symbolMap[t.symbol].pnl += t.pnl;
    symbolMap[t.symbol].count += 1;
  });
  const symbolData = Object.entries(symbolMap).map(([symbol, data]) => ({
    symbol,
    pnl: parseFloat(data.pnl.toFixed(2)),
    count: data.count,
  }));

  // Win/Loss pie
  const pieData = [
    { name: 'Winners', value: winners.length, color: '#22c55e' },
    { name: 'Losers', value: losers.length, color: '#ef4444' },
  ];

  const statCards = [
    { label: 'Net P&L', value: formatCurrency(netPnl), color: netPnl >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'Win Rate', value: `${winRate}%`, color: 'text-white' },
    { label: 'Profit Factor', value: profitFactor, color: 'text-white' },
    { label: 'Total Trades', value: trades.length, color: 'text-white' },
    { label: 'Avg Win', value: formatCurrency(avgWin), color: 'text-green-400' },
    { label: 'Avg Loss', value: formatCurrency(avgLoss), color: 'text-red-400' },
    { label: 'Best Trade', value: formatCurrency(bestTrade), color: 'text-green-400' },
    { label: 'Worst Trade', value: formatCurrency(worstTrade), color: 'text-red-400' },
    { label: 'Avg P&L/Trade', value: formatCurrency(Number(avgPnl)), color: avgPnl >= 0 ? 'text-green-400' : 'text-red-400' },
  ];

  return (
    <div className="p-6 min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Your full performance breakdown</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Cumulative P&L */}
        <div className="col-span-2 bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Cumulative P&L</h3>
          {cumulativeData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No trade data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cumulativeData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#7c3aed' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Win/Loss Pie */}
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Win / Loss</h3>
          {trades.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No trade data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map(({ name, color, value }) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-gray-400 text-xs">{name}: {value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Daily P&L */}
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Daily P&L</h3>
          {dailyData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No trade data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="pnl"
                  radius={[4, 4, 0, 0]}
                  fill="#7c3aed"
                  label={false}
                >
                  {dailyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Symbol Breakdown */}
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">P&L by Symbol</h3>
          {symbolData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No trade data yet
            </div>
          ) : (
            <div className="space-y-3">
              {symbolData.map(({ symbol, pnl, count }) => {
                const maxPnl = Math.max(...symbolData.map(s => Math.abs(s.pnl)));
                const width = maxPnl ? (Math.abs(pnl) / maxPnl) * 100 : 0;
                return (
                  <div key={symbol}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{symbol}</span>
                        <span className="text-gray-600 text-xs">{count} trades</span>
                      </div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: pnl >= 0 ? '#22c55e' : '#ef4444' }}
                      >
                        {formatCurrency(pnl)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: pnl >= 0 ? '#22c55e' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;