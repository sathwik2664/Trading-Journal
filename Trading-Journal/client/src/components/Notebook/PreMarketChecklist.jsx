import { useState, useCallback, useRef } from 'react';
import {
  Brain, BarChart2, Shield, Target, Activity, Plus, Trash2,
  TrendingUp, TrendingDown, Minus, Save, RotateCcw,
  Clock, History, ChevronRight, AlertCircle, Loader2,
  CheckCircle2, Star, BookOpen, Eye, Zap, DollarSign,
  AlertTriangle, Info, ChevronDown, ChevronUp, Flame,
  BarChart, Coffee, Moon, Dumbbell, Tag, X, GripVertical,
  ArrowUpRight, Pencil, ChevronLeft, Award, TrendingUp as TUp,
  RefreshCw, Layers, Hash,
} from 'lucide-react';
import {
  usePreMarketChecklist,
  useChecklistHistory,
  useChecklistStats,
  getTodayKey,
} from '../../hooks/usePreMarketChecklist';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:       '#080a0e',
  surface:  '#0f1117',
  card:     '#13161e',
  cardHover:'#161920',
  border:   '#1e2230',
  border2:  '#262b3a',
  muted:    '#2e3447',
  text:     '#e2e6f3',
  text2:    '#7b8299',
  text3:    '#3d4259',
  emerald:  '#2dd48a',
  emeraldD: '#1a7a4e',
  amber:    '#f0a429',
  amberD:   '#7a5015',
  rose:     '#f0596a',
  roseD:    '#7a2d35',
  indigo:   '#7c8ef0',
  indigoD:  '#3d4578',
  sky:      '#38c4f8',
  skyD:     '#1c6280',
  violet:   '#a78bfa',
  violetD:  '#503d80',
  orange:   '#fb8c3c',
  cyan:     '#22d3ee',
  gold:     '#f7c948',
};
const font = { fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif" };

// ── Data constants ─────────────────────────────────────────────────────────────
const EMOTIONS = [
  { label: 'Sharp',       color: C.emerald, group: 'positive' },
  { label: 'Calm',        color: C.sky,     group: 'positive' },
  { label: 'Focused',     color: C.indigo,  group: 'positive' },
  { label: 'Confident',   color: C.violet,  group: 'positive' },
  { label: 'Excited',     color: C.amber,   group: 'neutral'  },
  { label: 'Neutral',     color: C.text2,   group: 'neutral'  },
  { label: 'Tired',       color: C.text3,   group: 'caution'  },
  { label: 'Anxious',     color: C.amber,   group: 'caution'  },
  { label: 'Distracted',  color: C.orange,  group: 'caution'  },
  { label: 'FOMO',        color: C.rose,    group: 'danger'   },
  { label: 'Greedy',      color: C.orange,  group: 'danger'   },
  { label: 'Tilted',      color: C.rose,    group: 'danger'   },
  { label: 'Revenge',     color: '#f43f5e', group: 'danger'   },
];

const EMOTION_GROUPS = {
  positive: { label: 'Peak State',   color: C.emerald },
  neutral:  { label: 'Neutral',      color: C.text2   },
  caution:  { label: 'Caution Zone', color: C.amber   },
  danger:   { label: 'Danger Zone',  color: C.rose    },
};

const SESSION_MODES = [
  { label: 'Full Send',  sub: 'Market + mind aligned',     color: C.emerald, icon: Zap         },
  { label: 'Selective',  sub: 'A+ setups only',            color: C.sky,     icon: Target      },
  { label: 'Observe',    sub: 'Watch, no live trades',      color: C.amber,   icon: Eye         },
  { label: 'Sit Out',    sub: 'Capital protection mode',    color: C.rose,    icon: Shield      },
];

const PHYSICAL_STATES = [
  { label: 'Great',    color: C.emerald },
  { label: 'Good',     color: C.sky     },
  { label: 'Tired',    color: C.amber   },
  { label: 'Sick',     color: C.rose    },
  { label: 'Stressed', color: C.orange  },
];

const CAFFEINE = [
  { label: 'None',         icon: '—'  },
  { label: 'Coffee',       icon: '☕' },
  { label: 'Tea',          icon: '🍵' },
  { label: 'Energy Drink', icon: '⚡' },
];

const MARKET_CONDITIONS = [
  { label: 'Trending',  color: C.emerald },
  { label: 'Ranging',   color: C.sky     },
  { label: 'Volatile',  color: C.amber   },
  { label: 'Choppy',    color: C.rose    },
];

const DXY_BIAS = [
  { label: 'Strong',  color: C.emerald },
  { label: 'Neutral', color: C.amber   },
  { label: 'Weak',    color: C.rose    },
];

const SETUP_GRADES = [
  { label: 'A+', color: C.gold    },
  { label: 'A',  color: C.emerald },
  { label: 'B',  color: C.sky     },
  { label: 'C',  color: C.text2   },
  { label: 'Watch', color: C.violet },
];

const DIRECTIONS = [
  { label: 'Long',     color: C.emerald, icon: TrendingUp  },
  { label: 'Short',    color: C.rose,    icon: TrendingDown },
  { label: 'Watching', color: C.amber,   icon: Eye          },
  { label: 'Skip',     color: C.text3,   icon: Minus        },
];

const TIMEFRAMES = ['M5','M15','M30','H1','H4','Daily'];

const CORE_TRADE_RULES = [
  { rule: 'Setup aligns with higher-timeframe bias',                 emoji: '📊' },
  { rule: 'Entry is at a key structure level (S/R, zone, wick)',     emoji: '🎯' },
  { rule: 'Risk:Reward is at least 1:2',                            emoji: '⚖️' },
  { rule: 'Stop loss placed at a logical market structure point',    emoji: '🛑' },
  { rule: 'No major news event within 30 minutes of entry',         emoji: '📰' },
  { rule: 'Not entering out of boredom, revenge, or FOMO',          emoji: '🧘' },
  { rule: 'Position size respects my per-trade risk %',             emoji: '💰' },
  { rule: 'I have a clear invalidation level — I know when Im wrong', emoji: '❌' },
  { rule: 'Confluence: at least 2 independent reasons for the trade',  emoji: '✅' },
  { rule: 'This is genuinely an A+ setup, not "looks okay"',         emoji: '⭐' },
];

const PRESET_TAGS = ['Good Day','Bad Day','High Vol','News Day','Trend Day','Reversal','Range','FOMO Risk','Disciplined','Patient'];

// ── Readiness gate ─────────────────────────────────────────────────────────────
const getReadinessGate = (data) => {
  const score    = data.mentalReadiness;
  const ready    = data.readyToTrade;
  const emotion  = data.emotion;
  const danger   = ['FOMO','Greedy','Tilted','Revenge'];
  const caution  = ['Anxious','Distracted','Tired'];
  const isDanger = danger.includes(emotion);
  const isCaution= caution.includes(emotion);

  if (ready === 'No' || score <= 3 || isDanger)
    return { level: 'STOP',    color: C.rose,    bg: C.roseD,    label: 'Sit Out Today',      msg: 'Your psychological state is a liability right now. The best trade is no trade. Protecting capital is an act of discipline — not weakness.', icon: AlertTriangle };
  if (isCaution || score <= 5 || ready === 'Maybe')
    return { level: 'CAUTION', color: C.amber,   bg: C.amberD,   label: 'Trade with Caution', msg: 'Raise your setup threshold to A+ only. Cut your position size in half. No chasing. One bad trade in this state can unwind a week of work.', icon: Info };
  if (score <= 7)
    return { level: 'YELLOW',  color: C.sky,     bg: C.skyD,     label: 'Selective Mode',     msg: 'Conditions are acceptable. Be patient and wait for obvious setups to come to you. Skip anything that requires convincing.', icon: Eye };
  return   { level: 'GO',      color: C.emerald, bg: C.emeraldD, label: 'Ready to Trade',     msg: 'You are in a strong state. Trust your edge, follow your plan, and let the market come to you. Execute with precision.', icon: Zap };
};

// ── Main component ─────────────────────────────────────────────────────────────
const PreMarketChecklist = () => {
  const [viewDate,       setViewDate]       = useState(getTodayKey());
  const [showHistory,    setShowHistory]    = useState(false);
  const [newSymbol,      setNewSymbol]      = useState('');
  const [newRule,        setNewRule]        = useState('');
  const [newTag,         setNewTag]         = useState('');
  const [collapsed,      setCollapsed]      = useState({});
  const [activeTab,      setActiveTab]      = useState('checklist'); // 'checklist' | 'post' | 'stats'
  const [showPostSession,setShowPostSession]= useState(false);

  const isToday = viewDate === getTodayKey();

  const {
    data, loading, saving, saved, dirty, error,
    update, toggleCheck,
    addWatchItem, updateWatchItem, removeWatchItem,
    addCustomRule, removeCustomRule,
    addTag, removeTag,
    save, saveNow, savePostSession, deleteChecklist,
  } = usePreMarketChecklist(viewDate);

  const { history, loading: histLoading } = useChecklistHistory(30);
  const { stats } = useChecklistStats();

  // ── Risk calculations ──────────────────────────────────────────────────────
  const acc           = parseFloat(data.accountSize)     || 0;
  const riskPct       = parseFloat(data.riskPerTrade)    || 0;
  const maxLoss       = parseFloat(data.maxDailyLoss)    || 0;
  const maxProfit     = parseFloat(data.maxDailyProfit)  || 0;
  const balance       = parseFloat(data.currentBalance)  || acc;
  const riskPerTrade  = acc && riskPct ? (acc * riskPct) / 100 : 0;
  const liveRiskPT    = balance && riskPct ? (balance * riskPct) / 100 : riskPerTrade;
  const worstCase     = riskPerTrade && maxLoss ? Math.floor(maxLoss / riskPerTrade) : 0;
  const dailyLossPct  = acc && maxLoss ? ((maxLoss / acc) * 100).toFixed(1) : 0;
  const rRTargetProfit = riskPerTrade * 2;  // 1:2 R:R target

  // ── Completion score ───────────────────────────────────────────────────────
  const checks = [
    data.emotion         !== '',
    data.sleepQuality     > 0,
    data.mentalReadiness  > 0,
    data.readyToTrade    !== '' && data.readyToTrade != null,
    data.sessionMode     !== '',
    data.marketBias      !== '',
    data.marketCondition !== '',
    data.volatility      !== '',
    acc > 0,
    riskPct > 0,
    maxLoss > 0,
    (data.stopTradingIf || '').trim() !== '',
    (data.watchlist || []).length > 0,
    (data.sessionGoals  || '').trim() !== '',
    (data.avoidToday    || '').trim() !== '',
  ];
  const done  = checks.filter(Boolean).length;
  const total = checks.length;
  const pct   = Math.round((done / total) * 100);
  const pctColor = pct >= 90 ? C.emerald : pct >= 60 ? C.amber : pct >= 30 ? C.indigo : C.rose;

  const gate = getReadinessGate(data);
  const GateIcon = gate.icon;

  const today = new Date(viewDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddSymbol = () => {
    if (!newSymbol.trim()) return;
    addWatchItem({
      symbol: newSymbol.trim().toUpperCase(),
      direction: 'Watching', keyLevels: '', notes: '',
      bias: '', rrTarget: '', entryZone: '', stopZone: '',
      timeframe: '', grade: '', result: 'Pending',
    });
    setNewSymbol('');
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    addCustomRule(newRule.trim());
    setNewRule('');
  };

  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative', width: 40, height: 40 }}>
        <svg viewBox="0 0 40 40" width={40} height={40}>
          <circle cx={20} cy={20} r={15} fill="none" stroke={C.border2} strokeWidth={2} />
          <circle cx={20} cy={20} r={15} fill="none" stroke={C.indigo} strokeWidth={2}
            strokeDasharray="30 66" strokeLinecap="round"
            style={{ animation: 'spin 1s linear infinite', transformOrigin: 'center' }} />
        </svg>
      </div>
      <span style={{ fontSize: 12, color: C.text3 }}>Loading session…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Post-session mini panel ────────────────────────────────────────────────
  const PostSessionPanel = () => (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden', marginBottom: 10,
    }}>
      <SectionHeader icon={Award} color={C.gold} title="Post-Session Review" badge="Reflection"
        sectionKey="post" collapsed={collapsed} onToggle={toggleSection} />
      {!collapsed['post'] && (
        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Session rating */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <Label>Session Rating</Label>
              <div style={{ display: 'flex', gap: 5 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => isToday && update('sessionRating', s)}
                    style={{ background: 'none', border: 'none', cursor: isToday ? 'pointer' : 'default', padding: 2 }}>
                    <Star size={18} style={{
                      color: s <= data.sessionRating ? C.gold : C.border2,
                      fill:  s <= data.sessionRating ? C.gold : 'none',
                    }} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Rules Adherence (0-10)</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="range" min={0} max={10} step={1} value={data.rulesFollowed}
                  onChange={e => isToday && update('rulesFollowed', +e.target.value)} disabled={!isToday}
                  style={{ flex: 1, accentColor: C.violet, cursor: isToday ? 'pointer' : 'default' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: data.rulesFollowed >= 8 ? C.emerald : data.rulesFollowed >= 5 ? C.amber : C.rose, minWidth: 24 }}>
                  {data.rulesFollowed}
                </span>
              </div>
            </div>
            <div>
              <Label>Trades Taken</Label>
              <input type="number" min={0} value={data.tradesCount || ''}
                onChange={e => isToday && update('tradesCount', +e.target.value)} disabled={!isToday}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <Label>Actual P&L ($)</Label>
            <input type="text" placeholder="e.g. +420 or -120"
              value={data.actualPnl || ''} onChange={e => isToday && update('actualPnl', e.target.value)} disabled={!isToday}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', color: (data.actualPnl || '').startsWith('-') ? C.rose : (data.actualPnl || '').startsWith('+') ? C.emerald : C.text }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Label>Session Review</Label>
              <textarea rows={3} placeholder="What happened? Did you follow the plan? Were your reads correct?"
                value={data.sessionReview || ''} onChange={e => isToday && update('sessionReview', e.target.value)} readOnly={!isToday}
                style={textareaStyle} />
            </div>
            <div>
              <Label>Key Lesson</Label>
              <textarea rows={3} placeholder="One thing this session taught you…"
                value={data.lessonLearned || ''} onChange={e => isToday && update('lessonLearned', e.target.value)} readOnly={!isToday}
                style={textareaStyle} />
            </div>
          </div>

          <div>
            <Label>Focus for Tomorrow</Label>
            <textarea rows={2} placeholder="What to carry forward — this appears at the top of tomorrow's checklist…"
              value={data.tomorrowFocus || ''} onChange={e => isToday && update('tomorrowFocus', e.target.value)} readOnly={!isToday}
              style={textareaStyle} />
          </div>

          {isToday && (
            <button onClick={async () => {
              await savePostSession({
                sessionRating: data.sessionRating,
                rulesFollowed: data.rulesFollowed,
                actualPnl: data.actualPnl,
                tradesCount: data.tradesCount,
                sessionReview: data.sessionReview,
                lessonLearned: data.lessonLearned,
                tomorrowFocus: data.tomorrowFocus,
              });
            }} style={{
              ...primaryBtn, alignSelf: 'flex-start',
              background: C.gold + '20', borderColor: C.gold + '60', color: C.gold,
            }}>
              <Award size={13} /> Save Session Review
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.bg, ...font }}>

      {/* ── History sidebar ──────────────────────────────────────────────── */}
      {showHistory && (
        <div style={{
          width: 230, background: C.surface, borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Session History</p>
            {stats?.streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.amber + '15', border: `1px solid ${C.amber}30`, borderRadius: 20, padding: '2px 8px' }}>
                <Flame size={10} color={C.amber} />
                <span style={{ fontSize: 10, color: C.amber, fontWeight: 700 }}>{stats.streak}d</span>
              </div>
            )}
          </div>

          {/* Stats mini panel */}
          {stats && (
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <MiniStat label="Sessions" value={stats.totalSessions} color={C.indigo} />
              <MiniStat label="Avg Ready" value={`${stats.avgReadiness ?? '—'}%`} color={C.emerald} />
              <MiniStat label="Avg Sleep" value={`${stats.avgSleepQuality ?? '—'}/5`} color={C.sky} />
              <MiniStat label="Avg Mental" value={`${stats.avgMentalReadiness ?? '—'}/10`} color={C.violet} />
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <HistoryItem label="Today" active={viewDate === getTodayKey()} onClick={() => setViewDate(getTodayKey())} pct={pct} />
            {histLoading
              ? <p style={{ padding: '12px 16px', fontSize: 12, color: C.text3 }}>Loading…</p>
              : history.filter(h => h.date !== getTodayKey()).map(h => (
                <HistoryItem key={h.date} label={fmtDate(h.date)} active={viewDate === h.date}
                  onClick={() => setViewDate(h.date)} pct={h.completionPct}
                  emotion={h.emotion} readyToTrade={h.readyToTrade}
                  sessionRating={h.sessionRating} mode={h.sessionMode} />
              ))
            }
          </div>
        </div>
      )}

      {/* ── Main scroll area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', color: C.text }}>

        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: C.surface + 'f0',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.border}`,
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowHistory(p => !p)} style={{ ...iconBtn, background: showHistory ? C.muted : 'transparent' }}>
              <History size={14} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                <Clock size={9} color={C.text3} />
                <span style={{ fontSize: 10, color: C.text3 }}>{today}</span>
                {!isToday && <Badge color={C.amber}>Past Entry</Badge>}
                {dirty && isToday && <span style={{ fontSize: 10, color: C.text3 }}>● Unsaved</span>}
              </div>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Pre-Market Checklist</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {error && (
              <span style={{ fontSize: 11, color: C.rose, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={11} />{error}
              </span>
            )}
            {saving && (
              <span style={{ fontSize: 11, color: C.text3, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />Saving…
              </span>
            )}

            {/* Circular progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'default' }} title={`${done}/${total} complete`}>
              <svg width={32} height={32} viewBox="0 0 40 40">
                <circle cx={20} cy={20} r={14} fill="none" stroke={C.border2} strokeWidth={3} />
                <circle cx={20} cy={20} r={14} fill="none" stroke={pctColor} strokeWidth={3}
                  strokeDasharray={`${(pct / 100) * 87.96} 87.96`} strokeDashoffset={21.99}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
                <text x={20} y={24} textAnchor="middle" fontSize={9} fontWeight={700} fill={pctColor}>{pct}%</text>
              </svg>
            </div>

            {isToday && (
              <>
                <button onClick={async () => { if (!window.confirm('Reset today\'s checklist?')) return; await deleteChecklist(); }} style={iconBtn}>
                  <RotateCcw size={12} />
                </button>
                <button onClick={save} disabled={saving} style={saved && !dirty ? savedBtn : primaryBtn}>
                  {saved && !dirty ? <><CheckCircle2 size={12} /> Saved</> : <><Save size={12} /> Save</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 24px', maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* ── Yesterday carry-forward ──────────────────────────────────── */}
          {data.lastSessionNote && isToday && (
            <div style={{
              padding: '12px 16px',
              background: C.violet + '0a', border: `1px solid ${C.violet}25`,
              borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: C.violet + '18', border: `1px solid ${C.violet}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <ArrowUpRight size={12} color={C.violet} />
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Yesterday's Focus</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{data.lastSessionNote}</p>
              </div>
            </div>
          )}

          {/* ── Readiness gate ─────────────────────────────────────────────── */}
          {data.emotion && data.readyToTrade && (
            <div style={{
              padding: '14px 18px',
              background: gate.color + '0b',
              border: `1px solid ${gate.color}2a`,
              borderRadius: 12,
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: gate.color + '1a', border: `1px solid ${gate.color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}>
                <GateIcon size={17} color={gate.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: gate.color }}>{gate.label}</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>·</span>
                  <span style={{ fontSize: 11, color: C.text2 }}>{data.emotion}</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>·</span>
                  <span style={{ fontSize: 11, color: C.text2 }}>Mental {data.mentalReadiness}/10</span>
                  {data.sleepQuality > 0 && <>
                    <span style={{ fontSize: 10, color: C.text3 }}>·</span>
                    <span style={{ fontSize: 11, color: C.text2 }}>Sleep {'★'.repeat(data.sleepQuality)}{'☆'.repeat(5-data.sleepQuality)}</span>
                  </>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{gate.msg}</p>
              </div>
              {liveRiskPT > 0 && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: '0 0 1px', fontSize: 20, fontWeight: 700, color: C.emerald, lineHeight: 1 }}>${liveRiskPT.toFixed(0)}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>per trade risk</p>
                  {rRTargetProfit > 0 && <p style={{ margin: '3px 0 0', fontSize: 10, color: C.sky }}>1:2 target = ${(liveRiskPT*2).toFixed(0)}</p>}
                </div>
              )}
            </div>
          )}

          {/* ── Session Tags ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {(data.tags || []).map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: C.indigo + '14', color: C.indigo, border: `1px solid ${C.indigo}28`, fontWeight: 500,
              }}>
                <Hash size={9} />{tag}
                {isToday && (
                  <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, padding: 0, display: 'flex' }}>
                    <X size={9} />
                  </button>
                )}
              </span>
            ))}
            {isToday && PRESET_TAGS.filter(t => !(data.tags||[]).includes(t)).slice(0, 5).map(tag => (
              <button key={tag} onClick={() => addTag(tag)} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: 'transparent', color: C.text3, border: `1px dashed ${C.border2}`,
                cursor: 'pointer', ...font,
              }}>+ {tag}</button>
            ))}
          </div>

          {/* ── 1. Trader State ───────────────────────────────────────────── */}
          <SectionCard icon={Brain} color={C.indigo} title="Trader State" badge="Psychology"
            sectionKey="mental" collapsed={collapsed} onToggle={toggleSection}>

            {/* Yesterday's rating reference */}
            {data.yesterdayRating > 0 && (
              <div style={{ marginBottom: 14, padding: '8px 12px', background: C.border + '40', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: C.text3 }}>Yesterday:</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= data.yesterdayRating ? C.gold : C.text3, fill: s <= data.yesterdayRating ? C.gold : 'none' }} />)}
                </div>
              </div>
            )}

            {/* Emotion grid with groups */}
            <Label>Emotional state right now</Label>
            {['positive','neutral','caution','danger'].map(group => {
              const emotions = EMOTIONS.filter(e => e.group === group);
              const g = EMOTION_GROUPS[group];
              return (
                <div key={group} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ height: 1, flex: 1, background: g.color + '20' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: g.color + '80', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{g.label}</span>
                    <div style={{ height: 1, flex: 1, background: g.color + '20' }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {emotions.map(e => (
                      <Pill key={e.label} label={e.label} color={e.color}
                        active={data.emotion === e.label}
                        onClick={() => isToday && update('emotion', e.label)} disabled={!isToday} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Emotion intensity — only when emotion is selected */}
            {data.emotion && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Label noMargin>Intensity</Label>
                  <span style={{ fontSize: 11, color: C.text3 }}>
                    {['','Barely','Mild','Moderate','Strong','Overwhelming'][data.emotionIntensity] || ''}
                  </span>
                </div>
                <input type="range" min={1} max={5} step={1} value={data.emotionIntensity}
                  onChange={e => isToday && update('emotionIntensity', +e.target.value)} disabled={!isToday}
                  style={{ width: '100%', accentColor: EMOTIONS.find(em => em.label === data.emotion)?.color || C.indigo, cursor: isToday ? 'pointer' : 'default' }} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
              {/* Sleep quality */}
              <div>
                <Label>Sleep quality</Label>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => isToday && update('sleepQuality', s)}
                      style={{ background: 'none', border: 'none', cursor: isToday ? 'pointer' : 'default', padding: 1 }}>
                      <Star size={17} style={{ color: s <= data.sleepQuality ? C.amber : C.border2, fill: s <= data.sleepQuality ? C.amber : 'none' }} />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 10, color: C.text3, marginTop: 4, display: 'block' }}>
                  {['','Poor','Below avg','Average','Good','Excellent'][data.sleepQuality] || '—'}
                </span>
              </div>

              {/* Sleep hours */}
              <div>
                <Label>Hours slept</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min={0} max={12} step={0.5} value={data.sleepHours}
                    onChange={e => isToday && update('sleepHours', +e.target.value)} disabled={!isToday}
                    style={{ flex: 1, accentColor: C.sky, cursor: isToday ? 'pointer' : 'default' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: data.sleepHours >= 7 ? C.emerald : data.sleepHours >= 5 ? C.amber : C.rose, minWidth: 28 }}>
                    {data.sleepHours}h
                  </span>
                </div>
              </div>

              {/* Mental readiness */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Label noMargin>Mental readiness</Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: data.mentalReadiness >= 8 ? C.emerald : data.mentalReadiness >= 5 ? C.amber : C.rose }}>
                    {data.mentalReadiness}/10
                  </span>
                </div>
                <input type="range" min={1} max={10} step={1} value={data.mentalReadiness}
                  onChange={e => isToday && update('mentalReadiness', +e.target.value)} disabled={!isToday}
                  style={{ width: '100%', accentColor: C.indigo, cursor: isToday ? 'pointer' : 'default' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.text3, marginTop: 3 }}>
                  <span>Not ready</span><span>Peak</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              {/* Physical state */}
              <div>
                <Label>Physical state</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {PHYSICAL_STATES.map(({ label, color }) => (
                    <Pill key={label} label={label} color={color}
                      active={data.physicalState === label}
                      onClick={() => isToday && update('physicalState', label)} disabled={!isToday}
                      small />
                  ))}
                </div>
              </div>

              {/* Ready to trade */}
              <div>
                <Label>Ready to trade?</Label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ l: 'Yes', c: C.emerald }, { l: 'Maybe', c: C.amber }, { l: 'No', c: C.rose }].map(({ l, c }) => (
                    <button key={l} onClick={() => isToday && update('readyToTrade', l)} style={{
                      flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 600,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.readyToTrade === l ? c + '60' : C.border}`,
                      background: data.readyToTrade === l ? c + '18' : C.surface,
                      color: data.readyToTrade === l ? c : C.text2, ...font,
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Caffeine */}
              <div>
                <Label>Caffeine</Label>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {CAFFEINE.map(({ label, icon }) => (
                    <button key={label} onClick={() => isToday && update('caffeineStatus', label)} style={{
                      padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.caffeineStatus === label ? C.amber + '60' : C.border}`,
                      background: data.caffeineStatus === label ? C.amber + '18' : C.surface,
                      color: data.caffeineStatus === label ? C.amber : C.text3, ...font,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>{icon} <span>{label}</span></button>
                  ))}
                </div>
              </div>
            </div>

            {/* Session mode */}
            <Label>Session mode</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {SESSION_MODES.map(({ label, sub, color, icon: ModeIcon }) => {
                const active = data.sessionMode === label;
                return (
                  <button key={label} onClick={() => isToday && update('sessionMode', label)} style={{
                    padding: '10px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    cursor: isToday ? 'pointer' : 'default',
                    border: `1px solid ${active ? color + '55' : C.border}`,
                    background: active ? color + '12' : C.surface,
                    color: active ? color : C.text3,
                    textAlign: 'center', lineHeight: 1.4, ...font,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: active ? color + '20' : C.border + '40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ModeIcon size={12} color={active ? color : C.text3} />
                    </div>
                    <div>{label}</div>
                    <div style={{ fontSize: 9, fontWeight: 400, color: active ? color + 'aa' : C.text3 }}>{sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Morning routine + mindset notes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button onClick={() => isToday && update('morningRoutine', !data.morningRoutine)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: isToday ? 'pointer' : 'default',
                border: `1px solid ${data.morningRoutine ? C.emerald + '50' : C.border}`,
                background: data.morningRoutine ? C.emerald + '10' : C.surface,
                color: data.morningRoutine ? C.emerald : C.text3, ...font,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${data.morningRoutine ? C.emerald : C.border2}`,
                  background: data.morningRoutine ? C.emerald : 'transparent',
                }}>
                  {data.morningRoutine && <CheckCircle2 size={10} color={C.bg} />}
                </div>
                Completed morning routine
              </button>
            </div>

            <Label>Mindset notes</Label>
            <textarea rows={2} placeholder="How are you really feeling? Any distractions outside trading? Carry anything from yesterday?"
              value={data.mindsetNotes || ''} onChange={e => update('mindsetNotes', e.target.value)} readOnly={!isToday}
              style={textareaStyle} />
          </SectionCard>

          {/* ── 2. Session Risk Budget ────────────────────────────────────── */}
          <SectionCard icon={Shield} color={C.emerald} title="Session Risk Budget" badge="Risk"
            sectionKey="risk" collapsed={collapsed} onToggle={toggleSection}>

            <div style={{
              marginBottom: 14, padding: '12px 14px',
              background: C.indigo + '08', border: `1px solid ${C.indigo}1a`,
              borderRadius: 8,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                <span style={{ color: C.indigo, fontWeight: 600 }}>The only two numbers that matter:</span>{' '}
                How much you risk per trade, and when you stop for the day. Everything else is noise.
                Set these before you open a single chart.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              <InputBox label="Account Size ($)" placeholder="10000"
                value={data.accountSize || ''} onChange={v => update('accountSize', v)} disabled={!isToday} />
              <InputBox label="Current Balance ($)" placeholder="10420"
                value={data.currentBalance || ''} onChange={v => update('currentBalance', v)} disabled={!isToday} />
              <InputBox label="Risk per Trade (%)" placeholder="1"
                value={data.riskPerTrade || ''} onChange={v => update('riskPerTrade', v)} disabled={!isToday} />
              <InputBox label="Max Daily Loss ($)" placeholder="300"
                value={data.maxDailyLoss || ''} onChange={v => update('maxDailyLoss', v)} disabled={!isToday} />
            </div>

            {acc > 0 && riskPct > 0 && maxLoss > 0 && (
              <>
                {/* Risk dashboard */}
                <div style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '14px 18px',
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 10,
                }}>
                  <RiskStat label="Per-Trade Risk" value={`$${riskPerTrade.toFixed(0)}`} sub={`${riskPct}% of account`} color={C.emerald} />
                  {balance !== acc && <RiskStat label="Live Risk (Balance)" value={`$${liveRiskPT.toFixed(0)}`} sub={`${riskPct}% of ${balance > acc ? 'profit+capital' : 'drawdown balance'}`} color={balance > acc ? C.sky : C.amber} />}
                  <RiskStat label="Losing Streak Before Stop" value={`${worstCase} losses`} sub="before daily limit" color={C.amber} />
                  <RiskStat label="1:2 R:R Target" value={`$${(liveRiskPT * 2).toFixed(0)}`} sub="per winning trade" color={C.sky} />
                  <RiskStat label="Daily Loss Limit" value={`$${maxLoss.toFixed(0)}`} sub={`${dailyLossPct}% drawdown`} color={C.rose} />
                  {maxProfit > 0 && <RiskStat label="Profit Target" value={`$${maxProfit}`} sub="review on hit" color={C.violet} />}
                </div>

                {/* Dynamic guidance */}
                <div style={{
                  padding: '11px 14px', marginBottom: 12,
                  background: C.emerald + '06', border: `1px solid ${C.emerald}18`,
                  borderRadius: 8,
                }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                    <span style={{ color: C.emerald, fontWeight: 600 }}>Dynamic kill switch:</span>{' '}
                    If down <span style={{ color: C.amber, fontWeight: 600 }}>${(maxLoss / 2).toFixed(0)}</span> (50%), tighten your filter — A+ only, no marginal setups.
                    At <span style={{ color: C.rose, fontWeight: 600 }}>${maxLoss.toFixed(0)}</span> loss, the session ends. No re-entries, no "one last trade."
                    {maxProfit > 0 && <> If up <span style={{ color: C.violet, fontWeight: 600 }}>${maxProfit}</span>, step back and review before continuing.</>}
                  </p>
                </div>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <InputBox label="Profit Target ($)" placeholder="600 (optional)"
                value={data.maxDailyProfit || ''} onChange={v => update('maxDailyProfit', v)} disabled={!isToday} />
              <InputBox label="Max Trades/Session" placeholder="5 (optional)"
                value={data.maxTradesPerSession || ''} onChange={v => update('maxTradesPerSession', v)} disabled={!isToday} />
            </div>

            <Label>Hard stop condition</Label>
            <textarea rows={2}
              placeholder="e.g. Stop trading if I'm down $300, take 2 losing trades in a row, or feel any frustration or revenge-seeking"
              value={data.stopTradingIf || ''} onChange={e => update('stopTradingIf', e.target.value)} readOnly={!isToday}
              style={textareaStyle} />

            <div style={{ marginTop: 10 }}>
              <Label>Trailing profit rules (optional)</Label>
              <textarea rows={2}
                placeholder="e.g. If up $200, tighten to breakeven risk. If up $400, go to observe mode for 30 min…"
                value={data.trailRulesIf || ''} onChange={e => update('trailRulesIf', e.target.value)} readOnly={!isToday}
                style={textareaStyle} />
            </div>
          </SectionCard>

          {/* ── 3. Market Overview ────────────────────────────────────────── */}
          <SectionCard icon={BarChart2} color={C.sky} title="Market Overview" badge="Context"
            sectionKey="market" collapsed={collapsed} onToggle={toggleSection}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
              {/* Bias */}
              <div>
                <Label>Overall bias</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { l: 'Bullish', c: C.emerald, I: TrendingUp   },
                    { l: 'Bearish', c: C.rose,    I: TrendingDown  },
                    { l: 'Neutral', c: C.amber,   I: Minus         },
                  ].map(({ l, c, I }) => (
                    <button key={l} onClick={() => isToday && update('marketBias', l)} style={{
                      padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.marketBias === l ? c + '55' : C.border}`,
                      background: data.marketBias === l ? c + '15' : C.surface,
                      color: data.marketBias === l ? c : C.text2,
                      display: 'flex', alignItems: 'center', gap: 6, ...font,
                    }}>
                      <I size={12} color={data.marketBias === l ? c : C.text3} />{l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <Label>Market condition</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {MARKET_CONDITIONS.map(({ label, color }) => (
                    <button key={label} onClick={() => isToday && update('marketCondition', label)} style={{
                      padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.marketCondition === label ? color + '55' : C.border}`,
                      background: data.marketCondition === label ? color + '15' : C.surface,
                      color: data.marketCondition === label ? color : C.text2, ...font, textAlign: 'left',
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Volatility + VIX */}
              <div>
                <Label>Volatility</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                  {[{ l: 'Low', c: C.emerald }, { l: 'Medium', c: C.amber }, { l: 'High', c: C.rose }].map(({ l, c }) => (
                    <button key={l} onClick={() => isToday && update('volatility', l)} style={{
                      padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.volatility === l ? c + '55' : C.border}`,
                      background: data.volatility === l ? c + '15' : C.surface,
                      color: data.volatility === l ? c : C.text2, ...font, textAlign: 'left',
                    }}>{l}</button>
                  ))}
                </div>
                <Label>VIX / Vol Index</Label>
                <input type="text" placeholder="e.g. 18.5" value={data.vixLevel || ''}
                  onChange={e => update('vixLevel', e.target.value)} disabled={!isToday}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>

              {/* DXY + Session */}
              <div>
                <Label>Dollar (DXY) bias</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                  {DXY_BIAS.map(({ label, color }) => (
                    <button key={label} onClick={() => isToday && update('dxyBias', label)} style={{
                      padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.dxyBias === label ? color + '55' : C.border}`,
                      background: data.dxyBias === label ? color + '15' : C.surface,
                      color: data.dxyBias === label ? color : C.text2, ...font, textAlign: 'left',
                    }}>{label}</button>
                  ))}
                </div>
                <Label>Session</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {['London','New York','Asian','All Day'].map(s => (
                    <button key={s} onClick={() => isToday && update('session', s)} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11,
                      cursor: isToday ? 'pointer' : 'default',
                      border: `1px solid ${data.session === s ? C.sky + '55' : C.border}`,
                      background: data.session === s ? C.sky + '12' : C.surface,
                      color: data.session === s ? C.sky : C.text3, ...font, textAlign: 'left',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Market checklist */}
            <Label>Market preparation checklist</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
              {(data.marketChecks || []).map((item, i) => (
                <CheckRow key={i} item={item} onToggle={() => isToday && toggleCheck('marketChecks', i)} disabled={!isToday} />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <Label>Key news & events</Label>
                <textarea rows={3} placeholder="CPI 8:30am, FOMC, earnings: AAPL 4pm…"
                  value={data.keyNews || ''} onChange={e => update('keyNews', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
              <div>
                <Label>Market notes & levels</Label>
                <textarea rows={3} placeholder="Key S/R, overnight move, gaps, sentiment…"
                  value={data.marketNotes || ''} onChange={e => update('marketNotes', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
              <div>
                <Label>Dominant pairs / instruments</Label>
                <textarea rows={3} placeholder="e.g. EUR/USD trending cleanly, Gold above 2340, NAS100 compression…"
                  value={data.dominantPairs || ''} onChange={e => update('dominantPairs', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
            </div>
          </SectionCard>

          {/* ── 4. Watchlist & Setups ─────────────────────────────────────── */}
          <SectionCard icon={Eye} color={C.amber} title="Watchlist & Setups" badge="Setups"
            sectionKey="watchlist" collapsed={collapsed} onToggle={toggleSection}>

            <p style={{ margin: '0 0 12px', fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
              Your radar for today — not a commitment. Add instruments, mark your bias, grade the setup quality, and define your zones. Let setups come to you.
            </p>

            {isToday && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={newSymbol} onChange={e => setNewSymbol(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSymbol()}
                  placeholder="Add symbol… BTC, EUR/USD, AAPL, NAS100, Gold, GBP/JPY…"
                  style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' }} />
                <button onClick={handleAddSymbol} style={addBtn}><Plus size={12} /> Add</button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.watchlist || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: C.text3, fontSize: 12 }}>
                  No instruments yet. Type a symbol above to start your watchlist.
                </div>
              )}
              {(data.watchlist || []).map((item, i) => (
                <WatchItem key={i} item={item} disabled={!isToday}
                  onChange={(field, val) => updateWatchItem(i, field, val)}
                  onRemove={() => removeWatchItem(i)} />
              ))}
            </div>
          </SectionCard>

          {/* ── 5. Pre-Trade Rules ────────────────────────────────────────── */}
          <SectionCard icon={Target} color={C.violet} title="Pre-Trade Rules" badge="Rules"
            sectionKey="rules" collapsed={collapsed} onToggle={toggleSection}>

            <p style={{ margin: '0 0 12px', fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
              Internalize these before every single trade. Not a form to fill — the filter your instincts should run through automatically.
            </p>

            {/* Core rules (interactive checkboxes) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
              {(data.strategyRules || CORE_TRADE_RULES).map((item, i) => (
                <CheckRow
                  key={i}
                  item={typeof item === 'string' ? { label: item, checked: false } : item}
                  onToggle={() => isToday && toggleCheck('strategyRules', i)}
                  disabled={!isToday}
                  emoji={CORE_TRADE_RULES[i]?.emoji}
                  color={C.violet}
                />
              ))}
            </div>

            {/* Custom rules */}
            {(data.customRules || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                <div style={{ height: 1, background: C.violet + '15', marginBottom: 4 }} />
                {(data.customRules || []).map((rule, i) => (
                  <div key={`custom-${i}`} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '9px 12px', borderRadius: 7,
                    background: C.violet + '07', border: `1px solid ${C.violet}20`,
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1, background: C.violet + '20', border: `1px solid ${C.violet}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pencil size={8} color={C.violet} />
                    </div>
                    <span style={{ fontSize: 12, color: C.text2, flex: 1, lineHeight: 1.5 }}>{rule}</span>
                    {isToday && (
                      <button onClick={() => removeCustomRule(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, padding: 2, display: 'flex', flexShrink: 0 }}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isToday && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newRule} onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddRule()}
                  placeholder="Add your own rule — e.g. No trades during first 15 min of open"
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleAddRule} style={addBtn}><Plus size={12} /> Add</button>
              </div>
            )}
          </SectionCard>

          {/* ── 6. Session Plan ───────────────────────────────────────────── */}
          <SectionCard icon={BookOpen} color={C.sky} title="Session Plan" badge="Intentions"
            sectionKey="plan" collapsed={collapsed} onToggle={toggleSection}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <Label>Process goals (not P&L goals)</Label>
                <textarea rows={4}
                  placeholder="What does a good session look like regardless of profit or loss?&#10;e.g. Only A+ setups, wait for confirmation, no FOMO entries…"
                  value={data.sessionGoals || ''} onChange={e => update('sessionGoals', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
              <div>
                <Label>What to avoid today</Label>
                <textarea rows={4}
                  placeholder="Traps, patterns, habits to watch out for…&#10;e.g. No news trades, no overtrading after a win streak…"
                  value={data.avoidToday || ''} onChange={e => update('avoidToday', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <Label>Exit strategy</Label>
                <textarea rows={2}
                  placeholder="When to wrap up the session — time or conditions…"
                  value={data.exitStrategy || ''} onChange={e => update('exitStrategy', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
              <div>
                <Label>Affirmation / anchor</Label>
                <textarea rows={2}
                  placeholder="One thing to remind yourself… e.g. 'Trade the plan, not the noise.'"
                  value={data.affirmation || ''} onChange={e => update('affirmation', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
              <div>
                <Label>Daily mantra (carries forward)</Label>
                <textarea rows={2}
                  placeholder="Your persistent reminder — shown every day…"
                  value={data.dailyMantra || ''} onChange={e => update('dailyMantra', e.target.value)} readOnly={!isToday}
                  style={textareaStyle} />
              </div>
            </div>
          </SectionCard>

          {/* ── 7. Post-Session Review ───────────────────────────────────── */}
          <PostSessionPanel />

          {/* ── Summary footer ────────────────────────────────────────────── */}
          {saved && !dirty && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: C.emerald + '15', border: `1px solid ${C.emerald}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={13} color={C.emerald} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.text }}>Saved</p>
                  {data.updatedAt && (
                    <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>
                      {new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {data.emotion && <SmallPill label={data.emotion} color={EMOTIONS.find(e => e.label === data.emotion)?.color || C.text2} />}
                {data.sessionMode && <SmallPill label={data.sessionMode} color={SESSION_MODES.find(s => s.label === data.sessionMode)?.color || C.text2} />}
                {data.marketBias && <SmallPill label={data.marketBias} color={data.marketBias === 'Bullish' ? C.emerald : data.marketBias === 'Bearish' ? C.rose : C.amber} />}
                {liveRiskPT > 0 && <SmallPill label={`$${liveRiskPT.toFixed(0)}/trade`} color={C.emerald} />}
                {(data.watchlist || []).length > 0 && <SmallPill label={`${data.watchlist.length} watching`} color={C.amber} />}
                {pct > 0 && <SmallPill label={`${pct}% complete`} color={pctColor} />}
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
        ::-webkit-scrollbar-thumb{background:#1e2230;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#262b3a}
        ::placeholder{color:#3d4259}
        textarea,input{font-family:'Geist','DM Sans','Segoe UI',sans-serif}
        button{transition:background 0.12s,border-color 0.12s,color 0.12s}
        input[type="range"]{height:4px;border-radius:4px}
        input[type="range"]::-webkit-slider-thumb{width:14px;height:14px}
      `}</style>
    </div>
  );
};

// ── WatchItem — expanded setup card ───────────────────────────────────────────
const WatchItem = ({ item, onChange, onRemove, disabled }) => {
  const [expanded, setExpanded] = useState(false);
  const gradeColor = SETUP_GRADES.find(g => g.label === item.grade)?.color || C.text3;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        {/* Symbol badge */}
        <div style={{
          minWidth: 76, padding: '5px 10px', background: C.card, border: `1px solid ${C.border2}`,
          borderRadius: 7, fontSize: 12, fontWeight: 700, color: C.text,
          textAlign: 'center', letterSpacing: '0.05em', flexShrink: 0,
        }}>
          {item.symbol}
        </div>

        {/* Direction buttons */}
        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {DIRECTIONS.map(({ label, color, icon: DirIcon }) => {
            const active = item.direction === label;
            return (
              <button key={label} onClick={() => !disabled && onChange('direction', label)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: disabled ? 'default' : 'pointer',
                border: `1px solid ${active ? color + '55' : C.border}`,
                background: active ? color + '15' : 'transparent',
                color: active ? color : C.text3,
                display: 'flex', alignItems: 'center', gap: 4, ...font,
              }}>
                <DirIcon size={10} />{label}
              </button>
            );
          })}
        </div>

        {/* Setup grade */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {SETUP_GRADES.slice(0, 3).map(({ label, color }) => (
            <button key={label} onClick={() => !disabled && onChange('grade', item.grade === label ? '' : label)} style={{
              padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
              cursor: disabled ? 'default' : 'pointer',
              border: `1px solid ${item.grade === label ? color + '60' : C.border}`,
              background: item.grade === label ? color + '18' : 'transparent',
              color: item.grade === label ? color : C.text3, ...font,
            }}>{label}</button>
          ))}
        </div>

        {/* Expand + remove */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => setExpanded(p => !p)} style={{ ...iconBtn, padding: '4px 7px' }}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {!disabled && (
            <button onClick={onRemove} style={{ ...iconBtn, padding: '4px 7px', color: C.rose }}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail row */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <Label>Entry zone</Label>
              <input value={item.entryZone || ''} onChange={e => onChange('entryZone', e.target.value)}
                placeholder="e.g. 1.0840-1.0855" disabled={disabled}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <Label>Stop zone</Label>
              <input value={item.stopZone || ''} onChange={e => onChange('stopZone', e.target.value)}
                placeholder="e.g. Below 1.0820" disabled={disabled}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <Label>R:R Target</Label>
              <input value={item.rrTarget || ''} onChange={e => onChange('rrTarget', e.target.value)}
                placeholder="e.g. 1:3" disabled={disabled}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <Label>Timeframe</Label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {TIMEFRAMES.map(tf => (
                  <button key={tf} onClick={() => !disabled && onChange('timeframe', item.timeframe === tf ? '' : tf)} style={{
                    padding: '3px 7px', borderRadius: 5, fontSize: 10,
                    cursor: disabled ? 'default' : 'pointer',
                    border: `1px solid ${item.timeframe === tf ? C.sky + '55' : C.border}`,
                    background: item.timeframe === tf ? C.sky + '15' : 'transparent',
                    color: item.timeframe === tf ? C.sky : C.text3, ...font, fontWeight: 600,
                  }}>{tf}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>Key levels</Label>
              <input value={item.keyLevels || ''} onChange={e => onChange('keyLevels', e.target.value)}
                placeholder="Support / resistance / key zones…" disabled={disabled}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <Label>Setup idea & notes</Label>
              <input value={item.notes || ''} onChange={e => onChange('notes', e.target.value)}
                placeholder="e.g. Break & retest of 1.0850 after H1 close…" disabled={disabled}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── CheckRow — interactive checklist item ─────────────────────────────────────
const CheckRow = ({ item, onToggle, disabled, emoji, color = C.indigo }) => (
  <div
    onClick={!disabled ? onToggle : undefined}
    style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '9px 12px', borderRadius: 7,
      background: item.checked ? color + '08' : C.surface,
      border: `1px solid ${item.checked ? color + '30' : C.border}`,
      cursor: disabled ? 'default' : 'pointer',
      transition: 'background 0.12s, border-color 0.12s',
    }}>
    <div style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
      border: `1.5px solid ${item.checked ? color : C.border2}`,
      background: item.checked ? color : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.12s, border-color 0.12s',
    }}>
      {item.checked && <CheckCircle2 size={9} color={C.bg} strokeWidth={3} />}
    </div>
    {emoji && <span style={{ fontSize: 13, flexShrink: 0, marginTop: -1 }}>{emoji}</span>}
    <span style={{
      fontSize: 12, lineHeight: 1.5,
      color: item.checked ? C.text : C.text2,
      textDecoration: item.checked ? 'none' : 'none',
    }}>{item.label}</span>
  </div>
);

// ── SectionCard — collapsible section wrapper ─────────────────────────────────
const SectionCard = ({ icon: Icon, color, title, badge, sectionKey, collapsed, onToggle, children }) => {
  const isCollapsed = collapsed[sectionKey];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <SectionHeader icon={Icon} color={color} title={title} badge={badge}
        sectionKey={sectionKey} collapsed={collapsed} onToggle={onToggle} />
      {!isCollapsed && <div style={{ padding: '16px 16px' }}>{children}</div>}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, color, title, badge, sectionKey, collapsed, onToggle }) => {
  const isCollapsed = collapsed[sectionKey];
  return (
    <button onClick={() => onToggle(sectionKey)} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderBottom: isCollapsed ? 'none' : `1px solid ${C.border}`,
      background: C.surface, border: 'none', cursor: 'pointer', ...font,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: color + '14', border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={12} color={color} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color, background: color + '10', border: `1px solid ${color}25` }}>{badge}</span>
        {isCollapsed ? <ChevronDown size={13} color={C.text3} /> : <ChevronUp size={13} color={C.text3} />}
      </div>
    </button>
  );
};

// ── Micro components ──────────────────────────────────────────────────────────
const Label = ({ children, noMargin }) => (
  <p style={{ margin: 0, marginBottom: noMargin ? 0 : 7, fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{children}</p>
);

const Pill = ({ label, color, active, onClick, disabled, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? '4px 10px' : '5px 12px', borderRadius: 6, fontSize: small ? 11 : 12, fontWeight: 500,
    cursor: disabled ? 'default' : 'pointer',
    border: `1px solid ${active ? color + '55' : C.border}`,
    background: active ? color + '15' : C.surface,
    color: active ? color : C.text2, ...font,
  }}>{label}</button>
);

const SmallPill = ({ label, color }) => (
  <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, background: color + '12', color, border: `1px solid ${color}25`, fontWeight: 500 }}>{label}</span>
);

const Badge = ({ color, children }) => (
  <span style={{ fontSize: 10, color, background: color + '14', border: `1px solid ${color}28`, borderRadius: 4, padding: '1px 7px' }}>{children}</span>
);

const InputBox = ({ label, placeholder, value, onChange, disabled }) => (
  <div>
    <Label>{label}</Label>
    <input type="text" placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)} disabled={disabled}
      style={inputStyle} />
  </div>
);

const RiskStat = ({ label, value, sub, color }) => (
  <div>
    <p style={{ margin: '0 0 4px', fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 700, color, ...font, lineHeight: 1 }}>{value}</p>
    <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>{sub}</p>
  </div>
);

const MiniStat = ({ label, value, color }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 8px' }}>
    <p style={{ margin: '0 0 2px', fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color }}>{value}</p>
  </div>
);

const HistoryItem = ({ label, active, onClick, pct, emotion, readyToTrade, sessionRating, mode }) => {
  const pc = pct >= 90 ? C.emerald : pct >= 60 ? C.amber : pct > 0 ? C.indigo : C.text3;
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '10px 14px',
      borderBottom: `1px solid ${C.border}`,
      background: active ? C.card : 'transparent',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', border: 'none',
      borderBottom: `1px solid ${C.border}`, ...font,
    }}>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: active ? C.text : C.text2 }}>{label}</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {emotion && <span style={{ fontSize: 10, color: EMOTIONS.find(e => e.label === emotion)?.color || C.text3 }}>{emotion}</span>}
          {mode    && <span style={{ fontSize: 10, color: C.text3 }}>{mode}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {readyToTrade && (
          <span style={{ fontSize: 10, color: readyToTrade === 'Yes' ? C.emerald : readyToTrade === 'No' ? C.rose : C.amber }}>
            {readyToTrade === 'Yes' ? '✓' : readyToTrade === 'No' ? '✗' : '~'}
          </span>
        )}
        {sessionRating > 0 && (
          <Star size={10} style={{ color: C.gold, fill: C.gold }} />
        )}
        {pct > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: pc }}>{pct}%</span>}
        <ChevronRight size={10} color={C.muted} />
      </div>
    </button>
  );
};

const fmtDate = (s) => {
  const d    = new Date(s + 'T00:00:00');
  const diff = Math.round((new Date() - d) / 86400000);
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 7, padding: '7px 10px', fontSize: 12, color: C.text,
  outline: 'none', fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif",
};

const textareaStyle = {
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 7, padding: '8px 11px', fontSize: 12, color: C.text,
  outline: 'none', resize: 'vertical', lineHeight: 1.7,
  fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif",
};

const iconBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  padding: '6px 10px', borderRadius: 7, fontSize: 12,
  background: 'transparent', border: `1px solid ${C.border}`,
  color: C.text2, cursor: 'pointer',
  fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif",
};

const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 15px',
  borderRadius: 7, fontSize: 12, fontWeight: 600,
  background: C.indigo, border: `1px solid ${C.indigo}`,
  color: '#fff', cursor: 'pointer', fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif",
};

const savedBtn = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 15px',
  borderRadius: 7, fontSize: 12, fontWeight: 600,
  background: C.emerald + '14', border: `1px solid ${C.emerald}35`,
  color: C.emerald, cursor: 'pointer', fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif",
};

const addBtn = {
  padding: '7px 14px', background: C.amber + '12', border: `1px solid ${C.amber}35`,
  borderRadius: 7, color: C.amber, fontSize: 12, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 5,
  fontFamily: "'Geist','DM Sans','Segoe UI',sans-serif", fontWeight: 600,
};

export default PreMarketChecklist;