import {
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ResponsiveContainer
} from 'recharts';

const ZellaScore = ({ trades }) => {
  const winners = trades.filter(t => t.pnl > 0);
  const winRate = trades.length ? (winners.length / trades.length) * 100 : 0;
  const avgWin = winners.length
    ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const losers = trades.filter(t => t.pnl < 0);
  const avgLoss = losers.length
    ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 1;
  const profitFactor = avgLoss ? (avgWin / avgLoss) : 0;
  const consistency = trades.length > 5 ? 70 : 40;

  const zellaScore = Math.min(
    100,
    ((winRate * 0.4) + (Math.min(profitFactor, 3) / 3 * 40) + (consistency * 0.2))
  ).toFixed(2);

  const data = [
    { metric: 'Win %', value: winRate },
    { metric: 'Avg Win/Loss', value: Math.min((avgWin / avgLoss) * 33, 100) },
    { metric: 'Profit Factor', value: Math.min(profitFactor * 33, 100) },
  ];

  const getScoreColor = (score) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-xs">Zella Score</p>
        <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-600/30">
          BETA
        </span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#2a2a2a" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <Radar
              dataKey="value"
              stroke="#7c3aed"
              fill="#7c3aed"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center mt-1">
        <span className="text-sm text-gray-400">Your Zella Score: </span>
        <span
          className="text-sm font-bold"
          style={{ color: getScoreColor(zellaScore) }}
        >
          {zellaScore}
        </span>
      </div>
    </div>
  );
};

export default ZellaScore;