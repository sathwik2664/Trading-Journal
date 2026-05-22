import {
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ResponsiveContainer,
} from 'recharts';

const G = '#00d48a';
const R = '#ff4560';

const ZellaScore = ({ trades }) => {
  const winners  = trades.filter(t => t.pnl > 0);
  const losers   = trades.filter(t => t.pnl < 0);
  const winRate  = trades.length ? (winners.length / trades.length) * 100 : 0;
  const avgWin   = winners.length ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const avgLoss  = losers.length  ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 1;
  const pf       = avgLoss ? avgWin / avgLoss : 0;
  const consistency = trades.length > 5 ? 70 : 40;

  const zellaScore = Math.min(
    100,
    winRate * 0.4 + (Math.min(pf, 3) / 3) * 40 + consistency * 0.2,
  );

  const scoreColor =
    zellaScore >= 75 ? G : zellaScore >= 50 ? '#f59e0b' : R;

  const data = [
    { metric: 'Win %',      value: winRate },
    { metric: 'Avg W/L',    value: Math.min((avgWin / avgLoss) * 33, 100) },
    { metric: 'P. Factor',  value: Math.min(pf * 33, 100) },
  ];

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'linear-gradient(145deg,#12121e,#0e0e18)',
        border:     '1px solid rgba(255,255,255,0.07)',
        padding:    '14px 16px',
      }}
    >
      {/* header */}
      <div className="flex items-center justify-between mb-1">
        <p
          style={{
            fontSize:      9.5,
            color:         '#2e2e48',
            fontWeight:    700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            margin:        0,
          }}
        >
          Zella Score
        </p>
        <span
          style={{
            fontSize:      8.5,
            background:    'rgba(139,92,246,0.12)',
            color:         '#a78bfa',
            border:        '1px solid rgba(139,92,246,0.22)',
            borderRadius:  4,
            padding:       '2px 6px',
            fontWeight:    800,
            letterSpacing: '0.06em',
          }}
        >
          BETA
        </span>
      </div>

      {/* radar */}
      <div style={{ height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#2e2e46', fontSize: 8, fontWeight: 700 }}
            />
            <Radar
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.22}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* score */}
      <div
        className="text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}
      >
        <span style={{ fontSize: 11, color: '#3a3a55' }}>Your Zella Score: </span>
        <span
          style={{
            fontSize:      16,
            fontWeight:    900,
            color:         scoreColor,
            letterSpacing: '-0.04em',
          }}
        >
          {zellaScore.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ZellaScore;