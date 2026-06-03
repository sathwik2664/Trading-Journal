import {
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ResponsiveContainer,
} from 'recharts';

const G = '#00d48a';
const R = '#ff4560';
const Y = '#f59e0b';
const P = '#8b5cf6';

// ── SVG Arc Gauge (270° sweep, gap at bottom) ─────────────────────────────────
// Circle natural start = 3 o'clock. rotate(135°) moves start to 7:30 position.
// 270° arc then sweeps clockwise through 9, 12, 3, ending at 4:30.
// Gap = 4:30 → 7:30 (through 6 o'clock = bottom). ✓
const ArcGauge = ({ score, color }) => {
  const SIZE    = 118;
  const STROKE  = 9;
  const R_      = (SIZE - STROKE * 2) / 2;
  const cx      = SIZE / 2;
  const cy      = SIZE / 2;
  const CIRC    = 2 * Math.PI * R_;
  const ARC_LEN = CIRC * 0.75;             // 270° = 75% of full circle
  const filled  = ARC_LEN * (Math.min(Math.max(score, 0), 100) / 100);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ overflow: 'visible' }}
    >
      {/* glow behind score arc */}
      <circle
        cx={cx} cy={cy} r={R_}
        fill="none"
        stroke={color}
        strokeWidth={STROKE + 6}
        strokeDasharray={`${filled} ${CIRC - filled}`}
        strokeLinecap="round"
        transform={`rotate(135, ${cx}, ${cy})`}
        opacity={0.08}
      />
      {/* background track */}
      <circle
        cx={cx} cy={cy} r={R_}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={STROKE}
        strokeDasharray={`${ARC_LEN} ${CIRC - ARC_LEN}`}
        strokeLinecap="round"
        transform={`rotate(135, ${cx}, ${cy})`}
      />
      {/* score fill */}
      <circle
        cx={cx} cy={cy} r={R_}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={`${filled} ${CIRC - filled}`}
        strokeLinecap="round"
        transform={`rotate(135, ${cx}, ${cy})`}
        style={{
          transition: 'stroke-dasharray 1.3s cubic-bezier(.4,0,.2,1)',
          filter: `drop-shadow(0 0 5px ${color}70)`,
        }}
      />
    </svg>
  );
};

// ── Metric breakdown row ──────────────────────────────────────────────────────
const MetricRow = ({ label, display, pct }) => (
  <div>
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      marginBottom: 2,
    }}>
      <span style={{ fontSize: 8.5, color: '#2e2e46', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 8.5, color: '#4a4a68', fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {display}
      </span>
    </div>
    <div style={{
      height: 2.5, background: 'rgba(255,255,255,0.04)',
      borderRadius: 2, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width:  `${Math.min(Math.max(pct, 0), 100)}%`,
        background: P, borderRadius: 2, opacity: 0.75,
        transition: 'width 1s ease',
      }} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const ZellaScore = ({ trades }) => {
  const winners = trades.filter(t => t.pnl > 0);
  const losers  = trades.filter(t => t.pnl < 0);

  const winRate = trades.length
    ? (winners.length / trades.length) * 100
    : 0;

  const avgWin = winners.length
    ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length
    : 0;

  const avgLoss = losers.length
    ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length)
    : 1;

  const rr = avgLoss ? avgWin / avgLoss : 0;

  const grossWin  = winners.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
  const pf        = grossLoss ? grossWin / grossLoss : 0;

  // consistency: more trades = more data = higher confidence
  const consistency =
    trades.length >= 30 ? 90
    : trades.length >= 20 ? 75
    : trades.length >= 10 ? 55
    : trades.length >= 5  ? 35
    : 15;

  const expectancy = trades.length
    ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
    : 0;

  // ── weighted Zella Score ──────────────────────────────────────────────
  const rrScore          = Math.min(rr / 3, 1) * 100;
  const pfScore          = Math.min(pf / 3, 1) * 100;
  const expectancyScore  = expectancy > 0
    ? Math.min(expectancy / 500, 1) * 100
    : 0;

  const zellaScore = Math.min(100, Math.round(
    winRate         * 0.30 +
    rrScore         * 0.25 +
    pfScore         * 0.20 +
    consistency     * 0.15 +
    expectancyScore * 0.10,
  ));

  // letter grade
  const grade =
    zellaScore >= 90 ? 'S'
    : zellaScore >= 75 ? 'A'
    : zellaScore >= 60 ? 'B'
    : zellaScore >= 45 ? 'C'
    : 'D';

  const gradeColor =
    zellaScore >= 75 ? G
    : zellaScore >= 55 ? Y
    : R;

  // radar data (all values 0–100)
  const radarData = [
    { metric: 'Win %',       value: winRate },
    { metric: 'Risk:Reward', value: rrScore },
    { metric: 'P. Factor',   value: pfScore },
    { metric: 'Consistency', value: consistency },
    { metric: 'Expectancy',  value: expectancyScore },
  ];

  // breakdown rows
  const metrics = [
    { label: 'Win Rate',      display: `${winRate.toFixed(1)}%`,        pct: winRate },
    { label: 'Risk : Reward', display: `${rr.toFixed(2)}`,              pct: rrScore },
    { label: 'Profit Factor', display: `${pf.toFixed(2)}`,              pct: pfScore },
    { label: 'Consistency',   display: `${consistency}%`,               pct: consistency },
    { label: 'Expectancy',    display: `$${expectancy.toFixed(2)}`,     pct: expectancyScore },
  ];

  return (
    <div style={{
      background:   'linear-gradient(145deg,#12121e,#0e0e18)',
      border:       '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding:      '14px 16px',
    }}>

      {/* ── header ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 6,
      }}>
        <p style={{
          fontSize: 9, color: '#2e2e48', fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0,
        }}>
          Zella Score
        </p>
        <span style={{
          fontSize: 8.5,
          background: 'rgba(139,92,246,0.12)',
          color: '#a78bfa',
          border: '1px solid rgba(139,92,246,0.22)',
          borderRadius: 4,
          padding: '2px 6px',
          fontWeight: 800,
          letterSpacing: '0.06em',
        }}>
          BETA
        </span>
      </div>

      {/* ── arc gauge + grade ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
        <div style={{ position: 'relative', width: 118, height: 118 }}>
          <ArcGauge score={zellaScore} color={gradeColor} />

          {/* center overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            paddingTop: 8,
          }}>
            <span style={{
              fontSize: 28, fontWeight: 900,
              color: gradeColor, letterSpacing: '-0.06em', lineHeight: 1,
            }}>
              {zellaScore}
            </span>
            <span style={{ fontSize: 8, color: '#2a2a46', fontWeight: 700, letterSpacing: '0.06em' }}>
              / 100
            </span>
          </div>
        </div>

        {/* grade badge — absolute top-right */}
        <div style={{
          position: 'absolute', right: 0, top: '50%',
          transform: 'translateY(-50%)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: `rgba(${
              gradeColor === G ? '0,212,138'
              : gradeColor === Y ? '245,158,11'
              : '255,69,96'
            },0.12)`,
            border: `1px solid ${gradeColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 20, fontWeight: 900,
              color: gradeColor, letterSpacing: '-0.04em',
            }}>
              {grade}
            </span>
          </div>
        </div>
      </div>

      {/* ── radar chart ───────────────────────────────────────────────── */}
      <div style={{ height: 116, marginBottom: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#2e2e46', fontSize: 7.5, fontWeight: 700 }}
            />
            <Radar
              dataKey="value"
              stroke={P}
              fill={P}
              fillOpacity={0.18}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ── score breakdown ───────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: 10,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {metrics.map(m => (
          <MetricRow key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
};

export default ZellaScore;