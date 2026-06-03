import { formatCurrency } from '../../utils/helpers';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';

const G      = '#00d48a';
const R      = '#ff4560';
const pColor = v => (v >= 0 ? G : R);

// ── primitives ────────────────────────────────────────────────────────────────
const Card = ({ children, full = false }) => (
  <div
    style={{
      background:   'linear-gradient(145deg,#12121e,#0e0e18)',
      border:       '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding:      '11px 13px',
      gridColumn:   full ? 'span 2' : 'span 1',
      boxSizing:    'border-box',
    }}
  >
    {children}
  </div>
);

const Label = ({ children }) => (
  <p style={{
    fontSize:      8.5,
    color:         '#2e2e48',
    fontWeight:    700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    margin:        '0 0 5px',
  }}>
    {children}
  </p>
);

const Value = ({ children, color = '#dde0ff', size = 17 }) => (
  <p style={{
    fontSize:           size,
    fontWeight:         800,
    color,
    margin:             0,
    letterSpacing:      '-0.04em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight:         1,
  }}>
    {children}
  </p>
);

const MiniBar = ({ pct, color }) => (
  <div style={{
    height:       3,
    background:   'rgba(255,255,255,0.05)',
    borderRadius: 2,
    marginTop:    6,
    overflow:     'hidden',
  }}>
    <div style={{
      height:     '100%',
      width:      `${Math.min(Math.max(pct, 0), 100)}%`,
      background: color,
      borderRadius: 2,
      transition: 'width 0.55s ease',
    }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const StatsWidgets = ({ trades }) => {
  const { account } = useAccount();

  // ── derived metrics ───────────────────────────────────────────────────
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
    : 0;

  const grossWin  = winners.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));

  const profitFactor = grossLoss ? grossWin / grossLoss : 0;

  const expectancy = trades.length
    ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
    : 0;

  // max drawdown from running equity
  const sortedAsc = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runPnl = 0, peak = 0, maxDD = 0;
  sortedAsc.forEach(t => {
    runPnl += t.pnl;
    if (runPnl > peak) peak = runPnl;
    const dd = peak - runPnl;
    if (dd > maxDD) maxDD = dd;
  });

  // best & worst single trade
  const bestTrade  = trades.length ? Math.max(...trades.map(t => t.pnl)) : 0;
  const worstTrade = trades.length ? Math.min(...trades.map(t => t.pnl)) : 0;

  // current streak (by date, most recent first)
  const byDate = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  if (byDate.length) {
    const isWin = byDate[0].pnl >= 0;
    for (const t of byDate) {
      if ((t.pnl >= 0) === isWin) streak++;
      else break;
    }
    if (!isWin) streak = -streak;
  }

  // account
  const balance    = account.currentBalance;
  const pnlVsStart = account.currentBalance - account.startingBalance;

  // profit factor colour
  const pfColor = profitFactor >= 1.5 ? G : profitFactor >= 1 ? '#f59e0b' : R;

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: '1fr 1fr',
      gap:                 8,
      width:               220,
      flexShrink:          0,
    }}>

      {/* ── Account Balance — full width ─────────────────────────────── */}
      <Card full>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <Label>Account Balance</Label>
            <Value size={19}>{formatCurrency(balance)}</Value>
            <p style={{
              fontSize:           10,
              color:              pColor(pnlVsStart),
              fontWeight:         700,
              margin:             '4px 0 0',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {pnlVsStart >= 0 ? '+' : ''}{formatCurrency(pnlVsStart)} all time
            </p>
          </div>
          {pnlVsStart >= 0
            ? <TrendingUp  size={17} color={G} style={{ marginTop: 2, flexShrink: 0 }} />
            : <TrendingDown size={17} color={R} style={{ marginTop: 2, flexShrink: 0 }} />
          }
        </div>
      </Card>

      {/* ── Win Rate ─────────────────────────────────────────────────── */}
      <Card>
        <Label>Win Rate</Label>
        <Value color={winRate >= 50 ? G : R}>{winRate.toFixed(1)}%</Value>
        <MiniBar pct={winRate} color={winRate >= 50 ? G : R} />
        <p style={{ fontSize: 8.5, color: '#2a2a46', margin: '4px 0 0', fontWeight: 600 }}>
          {winners.length}W &middot; {losers.length}L
        </p>
      </Card>

      {/* ── Profit Factor ─────────────────────────────────────────────── */}
      <Card>
        <Label>Profit Factor</Label>
        <Value color={pfColor}>{profitFactor.toFixed(2)}</Value>
        <MiniBar pct={Math.min(profitFactor / 3, 1) * 100} color={pfColor} />
      </Card>

      {/* ── Expectancy ───────────────────────────────────────────────── */}
      <Card>
        <Label>Expectancy</Label>
        <Value color={pColor(expectancy)} size={14}>{formatCurrency(expectancy)}</Value>
        <p style={{ fontSize: 8.5, color: '#2a2a46', margin: '4px 0 0' }}>per trade</p>
      </Card>

      {/* ── Max Drawdown ──────────────────────────────────────────────── */}
      <Card>
        <Label>Max Drawdown</Label>
        <Value color={R} size={14}>
          {maxDD > 0 ? `-${formatCurrency(maxDD)}` : '$0.00'}
        </Value>
        <p style={{ fontSize: 8.5, color: '#2a2a46', margin: '4px 0 0' }}>from peak</p>
      </Card>

      {/* ── Avg Win vs Avg Loss — full width ─────────────────────────── */}
      <Card full>
        <Label>Avg Win vs Avg Loss</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 8.5, color: G, opacity: 0.65,
              fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.04em',
            }}>
              AVG WIN
            </p>
            <Value color={G} size={13}>{formatCurrency(avgWin)}</Value>
          </div>

          <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

          <div style={{ flex: 1, textAlign: 'right' }}>
            <p style={{
              fontSize: 8.5, color: R, opacity: 0.65,
              fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.04em',
            }}>
              AVG LOSS
            </p>
            <Value color={R} size={13}>{formatCurrency(avgLoss)}</Value>
          </div>
        </div>

        {/* ratio bar */}
        {(avgWin + avgLoss) > 0 && (
          <div style={{
            height: 3, background: `rgba(255,69,96,0.3)`,
            borderRadius: 2, marginTop: 8, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width:  `${(avgWin / (avgWin + avgLoss)) * 100}%`,
              background: G, borderRadius: 2,
              transition: 'width 0.55s ease',
            }} />
          </div>
        )}
      </Card>

      {/* ── Best Trade ───────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <Award size={9} color={G} />
          <Label>Best Trade</Label>
        </div>
        <Value color={G} size={13}>
          {bestTrade > 0 ? '+' : ''}{formatCurrency(bestTrade)}
        </Value>
      </Card>

      {/* ── Worst Trade ──────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <AlertTriangle size={9} color={R} />
          <Label>Worst Trade</Label>
        </div>
        <Value color={R} size={13}>{formatCurrency(worstTrade)}</Value>
      </Card>

      {/* ── Current Streak — full width ──────────────────────────────── */}
      <Card full>
        <Label>Current Streak</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize:      28,
            fontWeight:    900,
            color:         streak >= 0 ? G : R,
            letterSpacing: '-0.05em',
            lineHeight:    1,
          }}>
            {Math.abs(streak)}
          </span>
          <div>
            <p style={{
              fontSize:   11,
              fontWeight: 700,
              color:      streak >= 0 ? G : R,
              margin:     0,
              lineHeight: 1.3,
            }}>
              {streak === 0
                ? 'No active streak'
                : streak > 0
                ? 'Win Streak 🔥'
                : 'Loss Streak ❄️'}
            </p>
            <p style={{ fontSize: 8.5, color: '#2a2a46', margin: 0 }}>
              consecutive {streak >= 0 ? 'wins' : 'losses'}
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default StatsWidgets;