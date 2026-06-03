import { useState, useEffect } from 'react';
import { useTrades } from '../hooks/useTrades';
import { useAccount } from '../context/AccountContext';
import CalendarView from '../components/Dashboard/CalendarView';
import StatsWidgets from '../components/Dashboard/StatsWidgets';
import ZellaScore from '../components/Dashboard/ZellaScore';
import Loader from '../components/shared/Loader';
import {
  AreaChart, Area, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../utils/helpers';
import dayjs from 'dayjs';
import {
  TrendingUp, TrendingDown, Activity,
  Target, Zap, Clock,
} from 'lucide-react';

const G       = '#00d48a';
const R       = '#ff4560';
const pColor  = v => (v >= 0 ? G : R);
const panel   = {
  background: 'linear-gradient(145deg,#12121e,#0e0e18)',
  border:     '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
};

// ── custom equity tooltip ─────────────────────────────────────────────────────
const EquityTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{
      background: '#13131f', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 9, padding: '7px 12px',
    }}>
      <p style={{ color: '#444', margin: '0 0 3px', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{
        color: pColor(val), fontWeight: 800, margin: 0,
        fontSize: 13, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
      }}>
        {val >= 0 ? '+' : ''}{formatCurrency(val)}
      </p>
    </div>
  );
};

// ── KPI card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, color, icon }) => (
  <div style={{ ...panel, padding: '9px 14px', minWidth: 104 }}>
    <p style={{
      fontSize: 8.5, color: '#2e2e48', fontWeight: 700,
      letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 5px',
    }}>
      {label}
    </p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {icon && <span style={{ color, lineHeight: 0 }}>{icon}</span>}
      <span style={{
        fontSize: 15, fontWeight: 800, color,
        letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { trades, loading } = useTrades();
  const { account }         = useAccount();
  const [time, setTime]     = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <Loader />;

  // ── greeting ───────────────────────────────────────────────────────────
  const hour     = time.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const timeStr  = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  // ── core stats ─────────────────────────────────────────────────────────
  const winners  = trades.filter(t => t.pnl > 0);
  const losers   = trades.filter(t => t.pnl < 0);
  const netPnl   = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate  = trades.length ? (winners.length / trades.length) * 100 : 0;

  const todayKey    = dayjs().format('YYYY-MM-DD');
  const todayTrades = trades.filter(t => dayjs(t.date).format('YYYY-MM-DD') === todayKey);
  const todayPnl    = todayTrades.reduce((s, t) => s + t.pnl, 0);

  // ── streak ─────────────────────────────────────────────────────────────
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

  // ── equity curve — cumulative PnL grouped by date ──────────────────────
  const sortedAsc = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cum = 0;
  const equityCurve = sortedAsc.reduce((acc, t) => {
    cum += t.pnl;
    const label = dayjs(t.date).format('MM/DD');
    const last  = acc[acc.length - 1];
    if (last && last.date === label) {
      last.equity = parseFloat(cum.toFixed(2));
    } else {
      acc.push({ date: label, equity: parseFloat(cum.toFixed(2)) });
    }
    return acc;
  }, []);

  // ── recent trades (last 6) ─────────────────────────────────────────────
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div style={{ padding: '22px 24px', minHeight: '100vh', background: '#09090f' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 18,
      }}>
        {/* left: title + streak badge + clock */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <h1 style={{
              color: '#e4e6ff', fontSize: 22, fontWeight: 800,
              margin: 0, letterSpacing: '-0.04em',
            }}>
              Dashboard
            </h1>

            {streak !== 0 && (
              <div style={{
                background: streak > 0 ? 'rgba(0,212,138,0.09)' : 'rgba(255,69,96,0.09)',
                border:     `1px solid ${streak > 0 ? 'rgba(0,212,138,0.26)' : 'rgba(255,69,96,0.26)'}`,
                color:      streak > 0 ? G : R,
                fontSize: 9.5, fontWeight: 800, borderRadius: 6, padding: '2px 9px',
                letterSpacing: '0.05em',
              }}>
                {streak > 0
                  ? `🔥 ${streak}-WIN STREAK`
                  : `❄️ ${Math.abs(streak)}-LOSS STREAK`}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={11} color="#2a2a46" />
            <p style={{
              color: '#2e2e46', fontSize: 11, margin: 0,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {greeting} &nbsp;·&nbsp; {timeStr}
            </p>
          </div>
        </div>

        {/* right: KPI strip */}
        <div style={{ display: 'flex', gap: 8 }}>
          <KpiCard
            label="Today's P&L"
            value={`${todayPnl >= 0 ? '+' : ''}${formatCurrency(todayPnl)}`}
            color={pColor(todayPnl)}
            icon={todayPnl >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          />
          <KpiCard
            label="Net P&L"
            value={`${netPnl >= 0 ? '+' : ''}${formatCurrency(netPnl)}`}
            color={pColor(netPnl)}
          />
          <KpiCard
            label="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            color="#a78bfa"
            icon={<Target size={13} />}
          />
          <KpiCard
            label="Total Trades"
            value={trades.length}
            color="#6868a0"
            icon={<Zap size={13} />}
          />
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <CalendarView trades={trades} />
        <div style={{
          width: 220, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <StatsWidgets trades={trades} />
          <ZellaScore   trades={trades} />
        </div>
      </div>

      {/* ── BOTTOM ROW ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14 }}>

        {/* Equity curve */}
        <div style={{ ...panel, flex: 1, padding: '16px 18px' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div>
              <p style={{
                fontSize: 9, color: '#2e2e48', fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px',
              }}>
                Equity Curve
              </p>
              <p style={{
                fontSize: 20, fontWeight: 800, color: pColor(netPnl),
                margin: 0, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
              }}>
                {netPnl >= 0 ? '+' : ''}{formatCurrency(netPnl)}
              </p>
            </div>
            <Activity size={15} color="#2a2a46" style={{ marginTop: 4 }} />
          </div>

          {equityCurve.length > 1 ? (
            <ResponsiveContainer width="100%" height={132}>
              <AreaChart data={equityCurve} margin={{ top: 4, right: 2, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={pColor(netPnl)} stopOpacity={0.26} />
                    <stop offset="95%" stopColor={pColor(netPnl)} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.028)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#2a2a44', fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip content={<EquityTooltip />} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke={pColor(netPnl)}
                  strokeWidth={2}
                  fill="url(#eqGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: pColor(netPnl),
                    stroke: '#0e0e18',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 132, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#1c1c2e', fontSize: 11,
            }}>
              Start trading to see your equity curve
            </div>
          )}
        </div>

        {/* Recent trades feed */}
        <div style={{ ...panel, width: 305, flexShrink: 0, padding: '16px 18px' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12,
          }}>
            <p style={{
              fontSize: 9, color: '#2e2e48', fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0,
            }}>
              Recent Trades
            </p>
            <span style={{ fontSize: 9, color: '#2a2a46', fontWeight: 700 }}>
              {trades.length} total
            </span>
          </div>

          {recentTrades.length === 0 ? (
            <div style={{
              color: '#1c1c2e', fontSize: 11,
              textAlign: 'center', paddingTop: 30,
            }}>
              No trades recorded yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {recentTrades.map((trade, i) => {
                const win = trade.pnl >= 0;
                return (
                  <div
                    key={trade._id || i}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      background: win
                        ? 'rgba(0,212,138,0.045)'
                        : 'rgba(255,69,96,0.045)',
                      border: `1px solid ${win
                        ? 'rgba(0,212,138,0.1)'
                        : 'rgba(255,69,96,0.1)'}`,
                      borderRadius: 9,
                      padding: '7px 11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: pColor(trade.pnl), flexShrink: 0,
                        boxShadow: `0 0 6px ${pColor(trade.pnl)}55`,
                      }} />
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#c8caff', margin: 0 }}>
                          {trade.symbol || '—'}
                        </p>
                        <p style={{ fontSize: 9, color: '#2e2e48', margin: 0 }}>
                          {dayjs(trade.date).format('MMM D, YYYY')}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 800,
                        color: pColor(trade.pnl),
                        fontVariantNumeric: 'tabular-nums',
                        display: 'block',
                      }}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </span>
                      {trade.r != null && (
                        <span style={{
                          fontSize: 9, color: pColor(trade.pnl),
                          opacity: 0.55, fontVariantNumeric: 'tabular-nums',
                        }}>
                          {trade.r >= 0 ? '+' : ''}{trade.r.toFixed(2)}R
                        </span>
                      )}
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

export default Dashboard;