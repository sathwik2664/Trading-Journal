import { formatCurrency } from '../../utils/helpers';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';

const G = '#00d48a';
const R = '#ff4560';
const pColor = v => (v >= 0 ? G : R);

const Card = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{
      background: 'linear-gradient(145deg,#12121e,#0e0e18)',
      border:     '1px solid rgba(255,255,255,0.07)',
      padding:    '14px 16px',
    }}
  >
    {children}
  </div>
);

const CardLabel = ({ children }) => (
  <p
    style={{
      fontSize:      9.5,
      color:         '#2e2e48',
      fontWeight:    700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      margin:        '0 0 6px',
    }}
  >
    {children}
  </p>
);

const BigValue = ({ children, color = '#dde0ff', size = 22 }) => (
  <p
    style={{
      fontSize:           size,
      fontWeight:         800,
      color,
      margin:             0,
      letterSpacing:      '-0.04em',
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {children}
  </p>
);

const StatsWidgets = ({ trades }) => {
  const { account } = useAccount();                        // ← pull from context

  const netPnl   = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winners  = trades.filter(t => t.pnl > 0);
  const losers   = trades.filter(t => t.pnl < 0);
  const winRate  = trades.length ? (winners.length / trades.length) * 100 : 0;
  const avgWin   = winners.length ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const avgLoss  = losers.length  ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 0;

  const profitFactor = avgLoss && losers.length
    ? (avgWin * winners.length) / (avgLoss * losers.length)
    : 0;

  const expectancy = trades.length
    ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
    : 0;

  // ── balance & P&L come from AccountContext, not hardcoded ─────────────────
  const accountBalance = account.currentBalance;
  const pnlVsStart     = account.currentBalance - account.startingBalance;

  return (
    <div className="flex flex-col gap-2" style={{ width: 210, flexShrink: 0 }}>

      {/* Account Balance */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardLabel>Account Balance &amp; P&amp;L</CardLabel>
            <BigValue size={20}>{formatCurrency(accountBalance)}</BigValue>
            <p
              style={{
                fontSize: 11,
                color: pColor(pnlVsStart),
                fontWeight: 700,
                margin: '4px 0 0',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              P&L: {formatCurrency(pnlVsStart)}
            </p>
          </div>
          {pnlVsStart >= 0
            ? <TrendingUp  size={20} color={G} style={{ marginTop: 2 }} />
            : <TrendingDown size={20} color={R} style={{ marginTop: 2 }} />
          }
        </div>
      </Card>

      {/* Trade Win % */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <CardLabel>Trade Win %</CardLabel>
          <div className="flex gap-1">
            <span style={{ fontSize:10, fontWeight:800, color:G, background:'rgba(0,212,138,0.1)', border:'1px solid rgba(0,212,138,0.2)', padding:'1px 6px', borderRadius:5 }}>
              {winners.length}W
            </span>
            <span style={{ fontSize:10, fontWeight:800, color:R, background:'rgba(255,69,96,0.1)', border:'1px solid rgba(255,69,96,0.2)', padding:'1px 6px', borderRadius:5 }}>
              {losers.length}L
            </span>
          </div>
        </div>
        <BigValue>{winRate.toFixed(2)}%</BigValue>
        <div className="mt-2 rounded-full overflow-hidden" style={{ height:4, background:'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full"
            style={{ width:`${Math.min(winRate,100)}%`, background:`linear-gradient(90deg,${G},#00ff9f)`, transition:'width 0.4s ease' }}
          />
        </div>
      </Card>

      {/* Profit Factor */}
      <Card>
        <CardLabel>Profit Factor</CardLabel>
        <BigValue>{profitFactor.toFixed(2)}</BigValue>
      </Card>

      {/* Trade Expectancy */}
      <Card>
        <CardLabel>Trade Expectancy</CardLabel>
        <BigValue color={pColor(expectancy)}>{formatCurrency(expectancy)}</BigValue>
      </Card>

    </div>
  );
};

export default StatsWidgets;