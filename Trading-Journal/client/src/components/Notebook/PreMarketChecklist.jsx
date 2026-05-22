import { useState, useCallback } from 'react';
import {
  Brain, BarChart2, Shield, Target, Activity, Plus, Trash2,
  TrendingUp, TrendingDown, Minus, Save, RotateCcw,
  Clock, History, ChevronRight, AlertCircle, Loader2,
  CheckCircle2, Star, BookOpen, Eye, Zap, DollarSign,
  AlertTriangle, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  usePreMarketChecklist,
  useChecklistHistory,
  getTodayKey,
} from '../../hooks/usePreMarketChecklist';

// ── Colour tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      '#0d0e11',
  surface: '#141518',
  card:    '#1a1c21',
  border:  '#252830',
  border2: '#2e323c',
  muted:   '#363a47',
  text:    '#dde1ec',
  text2:   '#818899',
  text3:   '#454a5a',
  emerald: '#3ecf8e',
  amber:   '#f5a623',
  rose:    '#f06166',
  indigo:  '#7b8cde',
  sky:     '#38bdf8',
  violet:  '#a78bfa',
  orange:  '#fb923c',
};

const font = { fontFamily: "'DM Sans','Segoe UI',sans-serif" };

const EMOTIONS = [
  { label: 'Calm',       color: C.emerald },
  { label: 'Focused',    color: C.sky     },
  { label: 'Confident',  color: C.violet  },
  { label: 'Anxious',    color: C.amber   },
  { label: 'Excited',    color: C.emerald },
  { label: 'FOMO',       color: C.rose    },
  { label: 'Greedy',     color: C.orange  },
  { label: 'Tilted',     color: C.rose    },
  { label: 'Distracted', color: C.text2   },
  { label: 'Revenge',    color: '#f43f5e' },
];

const SESSION_MODES = [
  { label: 'Full Send',  sub: 'Market + mind are aligned',     color: C.emerald },
  { label: 'Selective',  sub: 'A+ setups only, be patient',    color: C.sky     },
  { label: 'Observe',    sub: 'Watch & learn, no real trades', color: C.amber   },
  { label: 'Sit Out',    sub: 'Protect the account today',     color: C.rose    },
];

const MARKET_CONDITIONS = [
  { label: 'Trending',  color: C.emerald },
  { label: 'Ranging',   color: C.sky     },
  { label: 'Volatile',  color: C.amber   },
  { label: 'Choppy',    color: C.rose    },
];

const TRADE_RULES = [
  'Setup aligns with higher-timeframe bias',
  'Entry is at a key structure level (S/R, zone, wick)',
  'Risk:Reward is at least 1:2',
  'Stop loss placed at a logical market structure point',
  'No major news event within 30 minutes',
  'I am not entering out of boredom, revenge, or FOMO',
  'Position size respects my per-trade risk %',
  'I have a clear invalidation level — I know when Im wrong',
  'This is genuinely an A+ setup, not "looks okay"',
];

const DIRECTIONS = [
  { label: 'Long',     color: C.emerald, icon: TrendingUp   },
  { label: 'Short',    color: C.rose,    icon: TrendingDown  },
  { label: 'Watching', color: C.amber,   icon: Eye           },
  { label: 'Skip',     color: C.text3,   icon: Minus         },
];

// ── Readiness gate logic ───────────────────────────────────────────────────────
const getReadinessGate = (data) => {
  const score = data.mentalReadiness;
  const ready = data.readyToTrade;
  const emotion = data.emotion;
  const dangerEmotions = ['FOMO', 'Greedy', 'Tilted', 'Revenge', 'Anxious'];
  const isDangerous = dangerEmotions.includes(emotion);

  if (ready === 'No' || score < 4)
    return { level: 'STOP',    color: C.rose,    label: 'Sit Out Today',   msg: 'Your state is a liability. Protecting capital is the trade.' };
  if (isDangerous || score < 6)
    return { level: 'CAUTION', color: C.amber,   label: 'Trade with Caution', msg: 'Raise your setup threshold. Only pristine A+ entries.' };
  if (ready === 'Maybe' || score < 8)
    return { level: 'YELLOW',  color: C.amber,   label: 'Selective Mode',  msg: 'Be patient. Wait for obvious setups. Skip borderline ones.' };
  return { level: 'GO',        color: C.emerald, label: 'Ready to Trade',  msg: 'Conditions look right. Trust your edge, stick to your plan.' };
};

// ── Main component ─────────────────────────────────────────────────────────────
const PreMarketChecklist = () => {
  const [viewDate,    setViewDate]    = useState(getTodayKey());
  const [showHistory, setShowHistory] = useState(false);
  const [newSymbol,   setNewSymbol]   = useState('');
  const [newRule,     setNewRule]     = useState('');
  const [collapsed,   setCollapsed]   = useState({});

  const isToday = viewDate === getTodayKey();

  const {
    data, loading, saving, saved, error,
    update, save, deleteChecklist,
    addWatchItem, updateWatchItem, removeWatchItem,
    addCustomRule, removeCustomRule,
  } = usePreMarketChecklist(viewDate);

  const { history, loading: histLoading } = useChecklistHistory(30);

  // ── Risk budget calculator ─────────────────────────────────────────────────
  const acc          = parseFloat(data.accountSize)  || 0;
  const riskPct      = parseFloat(data.riskPerTrade) || 0;
  const maxLoss      = parseFloat(data.maxDailyLoss) || 0;
  const riskPerTrade = acc && riskPct ? (acc * riskPct) / 100 : 0;
  const worstCaseLosses = riskPerTrade && maxLoss ? Math.floor(maxLoss / riskPerTrade) : 0;
  const dailyLossPct = acc && maxLoss ? ((maxLoss / acc) * 100).toFixed(1) : 0;

  // ── Completion score ───────────────────────────────────────────────────────
  const checks = [
    data.emotion !== '',
    data.sleepQuality > 0,
    data.readyToTrade !== null && data.readyToTrade !== '',
    data.sessionMode !== '',
    data.marketBias !== '',
    data.marketCondition !== '',
    acc > 0,
    riskPct > 0,
    maxLoss > 0,
    (data.watchlist || []).length > 0,
    (data.sessionGoals || '').trim() !== '',
  ];
  const done  = checks.filter(Boolean).length;
  const total = checks.length;
  const pct   = Math.round((done / total) * 100);
  const pctColor = pct === 100 ? C.emerald : pct >= 60 ? C.amber : C.indigo;

  const gate = getReadinessGate(data);

  const today = new Date(viewDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const handleAddSymbol = () => {
    if (!newSymbol.trim()) return;
    addWatchItem({ symbol: newSymbol.trim().toUpperCase(), direction: 'Watching', keyLevels: '', notes: '' });
    setNewSymbol('');
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    addCustomRule(newRule.trim());
    setNewRule('');
  };

  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <Loader2 size={20} color={C.indigo} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.bg, ...font }}>

      {/* ── History sidebar ────────────────────────────────────────────── */}
      {showHistory && (
        <div style={{
          width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Session History</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <HistoryItem label="Today" active={viewDate === getTodayKey()} onClick={() => setViewDate(getTodayKey())} pct={pct} />
            {histLoading
              ? <p style={{ padding: '12px 16px', fontSize: 12, color: C.text3 }}>Loading…</p>
              : history.filter(h => h.date !== getTodayKey()).map(h => (
                <HistoryItem key={h.date} label={fmtDate(h.date)} active={viewDate === h.date}
                  onClick={() => setViewDate(h.date)} pct={h.completionPct}
                  emotion={h.emotion} readyToTrade={h.readyToTrade} />
              ))
            }
          </div>
        </div>
      )}

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', color: C.text }}>

        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowHistory(p => !p)} style={{ ...ghostBtn, background: showHistory ? C.muted : 'transparent' }}>
              <History size={13} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Clock size={10} color={C.text3} />
                <span style={{ fontSize: 11, color: C.text3 }}>{today}</span>
                {!isToday && <Badge color={C.amber}>Past Entry</Badge>}
              </div>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Pre-Market Checklist</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {error && <span style={{ fontSize: 11, color: C.rose, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{error}</span>}
            {saving && <span style={{ fontSize: 11, color: C.text3, display: 'flex', alignItems: 'center', gap: 5 }}><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />Saving…</span>}

            {/* Progress ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width={30} height={30} viewBox="0 0 40 40">
                <circle cx={20} cy={20} r={15} fill="none" stroke={C.border2} strokeWidth={3} />
                <circle cx={20} cy={20} r={15} fill="none" stroke={pctColor} strokeWidth={3}
                  strokeDasharray={`${(pct / 100) * 94.2} 94.2`} strokeDashoffset={23.6}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s' }} />
                <text x={20} y={24} textAnchor="middle" fontSize={9} fontWeight={700} fill={pctColor}>{pct}%</text>
              </svg>
              <span style={{ fontSize: 11, color: C.text3 }}>{done}/{total}</span>
            </div>

            {isToday && (
              <>
                <button onClick={async () => { if (!window.confirm('Reset this checklist?')) return; await deleteChecklist(); }} style={ghostBtn}>
                  <RotateCcw size={12} /> Reset
                </button>
                <button onClick={save} disabled={saving} style={saved ? savedBtn : primaryBtn}>
                  {saved ? <><CheckCircle2 size={12} /> Saved</> : <><Save size={12} /> Save</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '18px 24px', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* ── READINESS GATE (always visible, no collapse) ──────────── */}
          {data.emotion && data.readyToTrade && (
            <div style={{
              padding: '14px 18px',
              background: gate.color + '0d',
              border: `1px solid ${gate.color}30`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: gate.color + '18', border: `1px solid ${gate.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {gate.level === 'GO'
                  ? <Zap size={16} color={gate.color} />
                  : gate.level === 'STOP'
                  ? <AlertTriangle size={16} color={gate.color} />
                  : <Info size={16} color={gate.color} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: gate.color }}>{gate.label}</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>·</span>
                  <span style={{ fontSize: 11, color: C.text2 }}>{data.emotion} · Readiness {data.mentalReadiness}/10</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{gate.msg}</p>
              </div>
              {riskPerTrade > 0 && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.emerald }}>${riskPerTrade.toFixed(0)}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>per trade</p>
                </div>
              )}
            </div>
          )}

          {/* ── 1. Trader State ───────────────────────────────────────── */}
          <Section
            icon={Brain} color={C.indigo} title="Trader State"
            badge="Psychology" sectionKey="mental"
            collapsed={collapsed} onToggle={toggleSection}
          >
            <Label>How are you feeling right now?</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {EMOTIONS.map(e => (
                <Pill key={e.label} label={e.label} color={e.color}
                  active={data.emotion === e.label}
                  onClick={() => update('emotion', e.label)} disabled={!isToday} />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
              <div>
                <Label>Sleep quality</Label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => isToday && update('sleepQuality', s)}
                      style={{ background: 'none', border: 'none', cursor: isToday ? 'pointer' : 'default', padding: 2 }}>
                      <Star size={18} style={{ color: s <= data.sleepQuality ? C.amber : C.border2, fill: s <= data.sleepQuality ? C.amber : 'none' }} />
                    </button>
                  ))}
                  <span style={{ fontSize: 11, color: C.text3, marginLeft: 6 }}>
                    {['','Poor','Below avg','Average','Good','Excellent'][data.sleepQuality] || '—'}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Label noMargin>Mental readiness</Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: data.mentalReadiness >= 7 ? C.emerald : data.mentalReadiness >= 4 ? C.amber : C.rose }}>
                    {data.mentalReadiness}/10
                  </span>
                </div>
                <input type="range" min={1} max={10} step={1} value={data.mentalReadiness}
                  onChange={e => isToday && update('mentalReadiness', +e.target.value)} disabled={!isToday}
                  style={{ width: '100%', accentColor: C.indigo, cursor: isToday ? 'pointer' : 'default' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.text3 }}>
                  <span>Not ready</span><span>Peak</span>
                </div>
              </div>
            </div>

            <Label>Ready to trade today?</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {[{ l: 'Yes', c: C.emerald }, { l: 'Maybe', c: C.amber }, { l: 'No', c: C.rose }].map(({ l, c }) => (
                <button key={l} onClick={() => isToday && update('readyToTrade', l)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  cursor: isToday ? 'pointer' : 'default',
                  border: `1px solid ${data.readyToTrade === l ? c + '60' : C.border}`,
                  background: data.readyToTrade === l ? c + '18' : C.surface,
                  color: data.readyToTrade === l ? c : C.text2, ...font,
                }}>{l}</button>
              ))}
            </div>

            <Label>Session mode for today</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
              {SESSION_MODES.map(({ label, sub, color }) => {
                const active = data.sessionMode === label;
                return (
                  <button key={label} onClick={() => isToday && update('sessionMode', label)} style={{
                    padding: '10px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    cursor: isToday ? 'pointer' : 'default',
                    border: `1px solid ${active ? color + '60' : C.border}`,
                    background: active ? color + '15' : C.surface,
                    color: active ? color : C.text3,
                    textAlign: 'center', lineHeight: 1.4, ...font,
                  }}>
                    <div style={{ marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, color: active ? color + 'cc' : C.text3 }}>{sub}</div>
                  </button>
                );
              })}
            </div>

            <Label>Mindset notes (optional)</Label>
            <textarea rows={2} placeholder="How are you really feeling? Any distractions outside trading?"
              value={data.mindsetNotes || ''} onChange={e => update('mindsetNotes', e.target.value)} readOnly={!isToday}
              style={textareaStyle} />
          </Section>

          {/* ── 2. Session Risk Budget ────────────────────────────────── */}
          <Section
            icon={Shield} color={C.emerald} title="Session Risk Budget"
            badge="Risk" sectionKey="risk"
            collapsed={collapsed} onToggle={toggleSection}
          >
            {/* Philosophy callout */}
            <div style={{
              marginBottom: 16, padding: '12px 14px',
              background: C.indigo + '0a', border: `1px solid ${C.indigo}22`,
              borderRadius: 8,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                <span style={{ color: C.indigo, fontWeight: 700 }}>You don't need a trade limit.</span>{' '}
                Set your per-trade risk and your max daily loss. Those two numbers protect you regardless of
                whether you take 2 trades or 20. The daily limit is your natural kill switch.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <InputBox label="Account Size ($)" placeholder="e.g. 10000"
                value={data.accountSize || ''} onChange={v => update('accountSize', v)} disabled={!isToday} />
              <InputBox label="Risk per Trade (%)" placeholder="e.g. 1"
                value={data.riskPerTrade || ''} onChange={v => update('riskPerTrade', v)} disabled={!isToday} />
              <InputBox label="Max Daily Loss ($)" placeholder="e.g. 300"
                value={data.maxDailyLoss || ''} onChange={v => update('maxDailyLoss', v)} disabled={!isToday} />
            </div>

            {/* Risk budget display */}
            {acc > 0 && riskPct > 0 && maxLoss > 0 && (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '16px 20px',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
                marginBottom: 14,
              }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Per-trade risk</p>
                  <p style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 700, color: C.emerald, ...font }}>${riskPerTrade.toFixed(0)}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{riskPct}% of account</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Worst-case losing streak</p>
                  <p style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 700, color: C.amber, ...font }}>{worstCaseLosses} losses</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>before daily limit hit</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily loss limit</p>
                  <p style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 700, color: C.sky, ...font }}>${maxLoss.toFixed(0)}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{dailyLossPct}% account drawdown</p>
                </div>
              </div>
            )}

            {/* If winning — extra clarity */}
            {acc > 0 && riskPct > 0 && maxLoss > 0 && (
              <div style={{
                padding: '11px 14px', marginBottom: 14,
                background: C.emerald + '07', border: `1px solid ${C.emerald}20`,
                borderRadius: 8,
              }}>
                <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                  <span style={{ color: C.emerald, fontWeight: 600 }}>How this protects you:</span>{' '}
                  If you're up on the day, your risk budget grows — you can take more setups.
                  If you're down <span style={{ color: C.amber, fontWeight: 600 }}>${(maxLoss / 2).toFixed(0)}</span> (halfway),
                  consider tightening your filter. At <span style={{ color: C.rose, fontWeight: 600 }}>${maxLoss.toFixed(0)}</span> down, the session ends — no exceptions.
                </p>
              </div>
            )}

            <Label>Hard stop condition for today</Label>
            <textarea rows={2}
              placeholder="e.g. Stop trading if I'm down $300, break 2 rules, or feel frustrated or revenge-seeking…"
              value={data.stopTradingIf || ''} onChange={e => update('stopTradingIf', e.target.value)} readOnly={!isToday}
              style={textareaStyle} />
          </Section>

          {/* ── 3. Market Overview ────────────────────────────────────── */}
          <Section
            icon={BarChart2} color={C.sky} title="Market Overview"
            badge="Context" sectionKey="market"
            collapsed={collapsed} onToggle={toggleSection}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div>
                <Label>Overall bias</Label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { l: 'Bullish', c: C.emerald, I: TrendingUp   },
                    { l: 'Bearish', c: C.rose,    I: TrendingDown  },
                    { l: 'Neutral', c: C.amber,   I: Minus         },
                  ].map(({ l, c, I }) => (
                    <button key={l} onClick={() => isToday && update('marketBias', l)} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.marketBias === l ? c + '60' : C.border}`,
                      background: data.marketBias === l ? c + '18' : C.surface,
                      color: data.marketBias === l ? c : C.text2,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, ...font,
                    }}>
                      <I size={12} color={data.marketBias === l ? c : C.text3} />{l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Market condition</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {MARKET_CONDITIONS.map(({ label, color }) => (
                    <button key={label} onClick={() => isToday && update('marketCondition', label)} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.marketCondition === label ? color + '60' : C.border}`,
                      background: data.marketCondition === label ? color + '18' : C.surface,
                      color: data.marketCondition === label ? color : C.text2, ...font,
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Volatility</Label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ l: 'Low', c: C.emerald }, { l: 'Med', c: C.amber }, { l: 'High', c: C.rose }].map(({ l, c }) => (
                    <button key={l} onClick={() => isToday && update('volatility', l)} style={{
                      flex: 1, padding: '8px 4px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.volatility === l ? c + '60' : C.border}`,
                      background: data.volatility === l ? c + '18' : C.surface,
                      color: data.volatility === l ? c : C.text2, ...font,
                    }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label>Key news & events today</Label>
                <textarea rows={3} placeholder="CPI 8:30am, FOMC minutes, earnings: AAPL…"
                  value={data.keyNews || ''} onChange={e => update('keyNews', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
              <div>
                <Label>Market notes</Label>
                <textarea rows={3} placeholder="Key levels, overnight moves, sentiment, gaps…"
                  value={data.marketNotes || ''} onChange={e => update('marketNotes', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
            </div>
          </Section>

          {/* ── 4. Watchlist ──────────────────────────────────────────── */}
          <Section
            icon={Eye} color={C.amber} title="Watchlist & Setups"
            badge="Setups" sectionKey="watchlist"
            collapsed={collapsed} onToggle={toggleSection}
          >
            <p style={{ margin: '0 0 14px', fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
              Your radar for today — not a commitment list. Add instruments you're watching. Mark your bias
              and key levels. Let setups come to you.
            </p>

            {isToday && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={newSymbol} onChange={e => setNewSymbol(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSymbol()}
                  placeholder="Add symbol… BTC, EUR/USD, AAPL, NAS100, Gold…"
                  style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' }} />
                <button onClick={handleAddSymbol} style={addBtn}><Plus size={13} /> Add</button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.watchlist || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: C.text3, fontSize: 12 }}>
                  No instruments yet. Add symbols above to start your watchlist.
                </div>
              )}
              {(data.watchlist || []).map((item, i) => (
                <WatchItem key={i} item={item} disabled={!isToday}
                  onChange={(field, val) => updateWatchItem(i, field, val)}
                  onRemove={() => removeWatchItem(i)} />
              ))}
            </div>
          </Section>

          {/* ── 5. Pre-Trade Rules ────────────────────────────────────── */}
          <Section
            icon={Target} color={C.violet} title="Pre-Trade Rules"
            badge="Rules" sectionKey="rules"
            collapsed={collapsed} onToggle={toggleSection}
          >
            <p style={{ margin: '0 0 14px', fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
              Internalize these before <em>every single trade</em> you take today. These aren't a form to submit —
              they're the filter your instincts should run through automatically.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {TRADE_RULES.map((rule, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px', borderRadius: 8,
                  background: C.surface, border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    background: C.violet + '18', border: `1px solid ${C.violet}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={11} color={C.violet} />
                  </div>
                  <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{rule}</span>
                </div>
              ))}

              {(data.customRules || []).map((rule, i) => (
                <div key={`custom-${i}`} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px', borderRadius: 8,
                  background: C.violet + '08', border: `1px solid ${C.violet}28`,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    background: C.violet + '25', border: `1px solid ${C.violet}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={11} color={C.violet} />
                  </div>
                  <span style={{ fontSize: 12, color: C.text, flex: 1, lineHeight: 1.5 }}>{rule}</span>
                  {isToday && (
                    <button onClick={() => removeCustomRule(i)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.text3, padding: 2, display: 'flex', flexShrink: 0,
                    }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isToday && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newRule} onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddRule()}
                  placeholder="Add your own rule — e.g. No trades during first 15 min of market open"
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleAddRule} style={addBtn}><Plus size={13} /> Add</button>
              </div>
            )}
          </Section>

          {/* ── 6. Session Plan ───────────────────────────────────────── */}
          <Section
            icon={BookOpen} color={C.sky} title="Session Plan"
            badge="Intentions" sectionKey="plan"
            collapsed={collapsed} onToggle={toggleSection}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <Label>Process goals for today</Label>
                <textarea rows={4}
                  placeholder="What does a good session look like regardless of P&L?&#10;e.g. Only A+ setups, wait for confirmation, no FOMO entries…"
                  value={data.sessionGoals || ''} onChange={e => update('sessionGoals', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
              <div>
                <Label>What to avoid today</Label>
                <textarea rows={4}
                  placeholder="Traps, patterns, or habits to watch out for…&#10;e.g. No news trades, no overtrading after a big winner…"
                  value={data.avoidToday || ''} onChange={e => update('avoidToday', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
            </div>

            <Label>Affirmation / mindset anchor (optional)</Label>
            <textarea rows={2}
              placeholder="One thing to remind yourself of today… e.g. 'I trade my plan, not the noise.'"
              value={data.affirmation || ''} onChange={e => update('affirmation', e.target.value)} readOnly={!isToday}
              style={textareaStyle} />
          </Section>

          {/* ── Summary footer ────────────────────────────────────────── */}
          {saved && data.updatedAt && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: C.emerald + '15', border: `1px solid ${C.emerald}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={13} color={C.emerald} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.text }}>Saved</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>
                    {new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {data.emotion && <SmallPill label={data.emotion} color={EMOTIONS.find(e => e.label === data.emotion)?.color || C.text2} />}
                {data.sessionMode && <SmallPill label={data.sessionMode} color={SESSION_MODES.find(s => s.label === data.sessionMode)?.color || C.text2} />}
                {data.marketBias && <SmallPill label={data.marketBias} color={data.marketBias === 'Bullish' ? C.emerald : data.marketBias === 'Bearish' ? C.rose : C.amber} />}
                {riskPerTrade > 0 && <SmallPill label={`$${riskPerTrade.toFixed(0)}/trade`} color={C.emerald} />}
                {(data.watchlist || []).length > 0 && <SmallPill label={`${data.watchlist.length} watching`} color={C.amber} />}
              </div>
            </div>
          )}

          <div style={{ height: 32 }} />
        </div>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#252830;border-radius:3px}
        ::placeholder{color:#454a5a}
        textarea,input{font-family:'DM Sans','Segoe UI',sans-serif}
        button{transition:all 0.15s}
        input[type="range"]{height:4px}
      `}</style>
    </div>
  );
};

// ── WatchItem ──────────────────────────────────────────────────────────────────
const WatchItem = ({ item, onChange, onRemove, disabled }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 9, padding: 14,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{
        minWidth: 80, padding: '5px 10px', background: C.card, border: `1px solid ${C.border2}`,
        borderRadius: 6, fontSize: 13, fontWeight: 700, color: C.text,
        textAlign: 'center', letterSpacing: '0.06em',
      }}>
        {item.symbol}
      </div>
      <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
        {DIRECTIONS.map(({ label, color, icon: Icon }) => {
          const active = item.direction === label;
          return (
            <button key={label} onClick={() => !disabled && onChange('direction', label)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              cursor: disabled ? 'default' : 'pointer',
              border: `1px solid ${active ? color + '60' : C.border}`,
              background: active ? color + '18' : 'transparent',
              color: active ? color : C.text3,
              display: 'flex', alignItems: 'center', gap: 5, ...font,
            }}>
              <Icon size={11} />{label}
            </button>
          );
        })}
      </div>
      {!disabled && (
        <button onClick={onRemove} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.text3, padding: 4, display: 'flex', borderRadius: 5,
        }}>
          <Trash2 size={13} />
        </button>
      )}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div>
        <Label>Key levels</Label>
        <input value={item.keyLevels || ''} onChange={e => onChange('keyLevels', e.target.value)}
          placeholder="Support / Resistance / Entry zone…" disabled={disabled}
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
      </div>
      <div>
        <Label>Setup idea</Label>
        <input value={item.notes || ''} onChange={e => onChange('notes', e.target.value)}
          placeholder="e.g. Break & retest of 1.0850, wait for H1 close…" disabled={disabled}
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
      </div>
    </div>
  </div>
);

// ── Section (collapsible card) ─────────────────────────────────────────────────
const Section = ({ icon: Icon, color, title, badge, sectionKey, collapsed, onToggle, children }) => {
  const isCollapsed = collapsed[sectionKey];
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      <button onClick={() => onToggle(sectionKey)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: isCollapsed ? 'none' : `1px solid ${C.border}`,
        background: C.surface, border: 'none', cursor: 'pointer', ...font,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: color + '15', border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={12} color={color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 4,
            textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700,
            color, background: color + '12', border: `1px solid ${color}28`,
          }}>{badge}</span>
          {isCollapsed
            ? <ChevronDown size={14} color={C.text3} />
            : <ChevronUp size={14} color={C.text3} />}
        </div>
      </button>
      {!isCollapsed && (
        <div style={{ padding: '16px 16px' }}>{children}</div>
      )}
    </div>
  );
};

// ── Misc components ────────────────────────────────────────────────────────────
const Label = ({ children, noMargin }) => (
  <p style={{
    margin: 0, marginBottom: noMargin ? 0 : 8,
    fontSize: 10, color: C.text3,
    textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700,
  }}>{children}</p>
);

const Pill = ({ label, color, active, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '5px 13px', borderRadius: 6, fontSize: 12, fontWeight: 500,
    cursor: disabled ? 'default' : 'pointer',
    border: `1px solid ${active ? color + '60' : C.border}`,
    background: active ? color + '18' : C.surface,
    color: active ? color : C.text2, ...font,
  }}>{label}</button>
);

const SmallPill = ({ label, color }) => (
  <span style={{
    padding: '3px 10px', borderRadius: 5, fontSize: 11,
    background: color + '14', color, border: `1px solid ${color}28`, fontWeight: 500,
  }}>{label}</span>
);

const Badge = ({ color, children }) => (
  <span style={{
    fontSize: 10, color, background: color + '15',
    border: `1px solid ${color}30`, borderRadius: 4, padding: '1px 7px',
  }}>{children}</span>
);

const InputBox = ({ label, placeholder, value, onChange, disabled }) => (
  <div>
    <Label>{label}</Label>
    <input type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)} disabled={disabled}
      style={inputStyle} />
  </div>
);

const HistoryItem = ({ label, active, onClick, pct, emotion, readyToTrade }) => {
  const pc = pct === 100 ? C.emerald : pct >= 60 ? C.amber : C.indigo;
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '10px 16px',
      borderBottom: `1px solid ${C.border}`,
      background: active ? C.card : 'transparent',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', border: 'none', borderBottom: `1px solid ${C.border}`, ...font,
    }}>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: active ? C.text : C.text2 }}>{label}</p>
        {emotion && <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>{emotion}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {readyToTrade && (
          <span style={{ fontSize: 10, color: readyToTrade === 'Yes' ? C.emerald : C.rose }}>
            {readyToTrade === 'Yes' ? '✓' : '✗'}
          </span>
        )}
        {pct !== null && <span style={{ fontSize: 10, fontWeight: 700, color: pc }}>{pct}%</span>}
        <ChevronRight size={11} color={C.muted} />
      </div>
    </button>
  );
};

const fmtDate = (s) => {
  const d = new Date(s + 'T00:00:00');
  const diff = Math.round((new Date() - d) / 86400000);
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 7, padding: '8px 10px', fontSize: 12, color: C.text,
  outline: 'none', fontFamily: "'DM Sans','Segoe UI',sans-serif",
};

const textareaStyle = {
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 7, padding: '9px 12px', fontSize: 12, color: C.text,
  outline: 'none', resize: 'vertical', lineHeight: 1.7,
  fontFamily: "'DM Sans','Segoe UI',sans-serif",
};

const ghostBtn = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px',
  borderRadius: 7, fontSize: 12, background: 'transparent',
  border: `1px solid ${C.border}`, color: C.text2, cursor: 'pointer',
  fontFamily: "'DM Sans','Segoe UI',sans-serif",
};

const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
  borderRadius: 7, fontSize: 12, fontWeight: 600,
  background: C.indigo, border: `1px solid ${C.indigo}`,
  color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans','Segoe UI',sans-serif",
};

const savedBtn = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
  borderRadius: 7, fontSize: 12, fontWeight: 600,
  background: C.emerald + '15', border: `1px solid ${C.emerald}40`,
  color: C.emerald, cursor: 'pointer', fontFamily: "'DM Sans','Segoe UI',sans-serif",
};

const addBtn = {
  padding: '8px 14px', background: C.amber + '15', border: `1px solid ${C.amber}40`,
  borderRadius: 7, color: C.amber, fontSize: 12, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 5,
  fontFamily: "'DM Sans','Segoe UI',sans-serif", fontWeight: 600,
};

export default PreMarketChecklist;