import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNotes } from '../hooks/useNotes';
import { useTrades } from '../hooks/useTrades';
import PreMarketChecklist from '../components/Notebook/PreMarketChecklist';
import Loader from '../components/shared/Loader';
import { formatCurrency } from '../utils/helpers';
import dayjs from 'dayjs';
import {
  BookOpen, FileText, ClipboardList, CheckSquare,
  Plus, Search, X, ChevronDown,
  Calendar, Tag, Trash2, Save, AlertCircle, BarChart2,
  Link2, TrendingUp, TrendingDown,
} from 'lucide-react';

/* ═══════════════════════════ DESIGN TOKENS ════════════════════════════ */
const C = {
  bg:         '#08080f',
  surface:    '#0b0b16',
  card:       '#0e0e1c',
  cardHi:     '#121228',
  border:     'rgba(255,255,255,0.06)',
  borderHi:   'rgba(255,255,255,0.11)',
  accent:     '#7c6af7',
  accentSoft: 'rgba(124,106,247,0.14)',
  accentGlow: 'rgba(124,106,247,0.08)',
  green:      '#34d399',
  greenSoft:  'rgba(52,211,153,0.12)',
  red:        '#f87171',
  redSoft:    'rgba(248,113,113,0.12)',
  gold:       '#fbbf24',
  text:       '#e8eaff',
  textSoft:   '#9a9dc8',
  muted:      '#3a3d5c',
  mono:       "'JetBrains Mono','Fira Code',monospace",
  sans:       "'DM Sans','Outfit',system-ui,sans-serif",
};

/* ── inject fonts + global styles once ── */
if (typeof document !== 'undefined' && !document.getElementById('__nb_styles__')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap';
  document.head.appendChild(link);
  const s = document.createElement('style');
  s.id = '__nb_styles__';
  s.textContent = `
    @keyframes nb-fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes nb-scale  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
    .nb-fade  { animation: nb-fadeUp .3s cubic-bezier(.16,1,.3,1) both }
    .nb-scale { animation: nb-scale .25s cubic-bezier(.16,1,.3,1) both }
    .nb-folder-btn  { transition: background .15s; }
    .nb-folder-btn:hover { background: rgba(255,255,255,0.03) !important; }
    .nb-note-row    { transition: background .15s; cursor: pointer; }
    .nb-note-row:hover { background: rgba(124,106,247,0.06) !important; }
    .nb-trade-row   { cursor: pointer; transition: background .15s; }
    .nb-trade-row:hover { background: rgba(124,106,247,0.08) !important; }
    textarea.nb-editor { resize: none; outline: none; }
    textarea.nb-editor:focus {
      border-color: rgba(124,106,247,0.4) !important;
      box-shadow: 0 0 0 3px rgba(124,106,247,0.08);
    }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(124,106,247,0.25); border-radius:3px; }
  `;
  document.head.appendChild(s);
}

/* ═══════════════════════════ CONSTANTS ════════════════════════════ */
const FOLDERS = [
  { id: 'trade_notes',   label: 'Trade Notes',  Icon: FileText,      color: '#7c6af7' },
  { id: 'session_recap', label: 'Session Recap', Icon: ClipboardList, color: '#34d399' },
];
const PRE_MARKET_ID = 'pre_market';

/* ═══════════════════════════ HELPERS ════════════════════════════ */
const isWin    = t => (t.pnl ?? 0) > 0;
const isLoss   = t => (t.pnl ?? 0) < 0;
const getNoteId = n => n?._id || n?.id || null;

function getTodayPremarketPct() {
  try {
    const key = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(`premarket_${key}`);
    if (!raw) return null;
    const { state } = JSON.parse(raw);
    const items = [
      state.emotion !== '', state.sleepQuality > 0, state.readyToTrade !== null,
      state.marketBias !== '', state.volatility !== '',
      ...(state.marketChecks  || []),
      state.maxDailyLoss !== '', state.maxTrades !== '', state.riskPerTrade !== '',
      ...(state.strategyRules || []),
      state.sessionGoals !== '',
    ];
    return Math.round((items.filter(Boolean).length / items.length) * 100);
  } catch { return null; }
}

/* ── tiny progress ring ── */
const Ring = ({ pct }) => {
  const SZ = 26, SW = 2.6, R = (SZ - SW * 2) / 2;
  const circ = 2 * Math.PI * R;
  const fill = circ * Math.min(pct, 100) / 100;
  const done = pct >= 100;
  return (
    <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={SZ/2} cy={SZ/2} r={R} fill="none" stroke={done ? 'rgba(52,211,153,0.15)' : 'rgba(124,106,247,0.12)'} strokeWidth={SW} />
      <circle cx={SZ/2} cy={SZ/2} r={R} fill="none" stroke={done ? '#34d399' : '#7c6af7'} strokeWidth={SW}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
};

/* ═══════════════════════════ TRADE PICKER MODAL ════════════════════════════ */
const TradePicker = ({ trades, linkedIds, onToggle, onClose }) => {
  const [q, setQ] = useState('');

  const visible = useMemo(() => {
    const arr = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!q.trim()) return arr;
    const lq = q.toLowerCase();
    return arr.filter(t =>
      (t.symbol || '').toLowerCase().includes(lq) ||
      (t.side   || '').toLowerCase().includes(lq)
    );
  }, [trades, q]);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(8,8,15,0.88)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}
    >
      <div className="nb-scale" onClick={e => e.stopPropagation()}
        style={{ background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:20, width:540, maxHeight:'76vh', display:'flex', flexDirection:'column', boxShadow:'0 40px 100px rgba(0,0,0,0.75)', overflow:'hidden' }}>

        {/* header */}
        <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:C.accentSoft, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Link2 size={13} color={C.accent} />
              </div>
              <span style={{ fontFamily:C.sans, fontSize:14, fontWeight:700, color:C.text }}>Link Trades to this Note</span>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, display:'flex', padding:4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:'7px 12px' }}>
            <Search size={13} color={C.muted} />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search symbol or side…"
              style={{ background:'transparent', border:'none', outline:'none', color:C.text, fontSize:12, fontFamily:C.mono, width:'100%' }} />
            {q && <button onClick={() => setQ('')} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, padding:0, display:'flex' }}><X size={11} /></button>}
          </div>
        </div>

        {/* list */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 12px 12px' }}>
          {visible.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:C.muted, fontSize:12, fontFamily:C.sans }}>
              {trades.length === 0 ? 'No trades yet — add trades in the Trades page first' : 'No matches'}
            </div>
          ) : visible.map(t => {
            const tid    = t._id || t.id;
            const linked = linkedIds.includes(tid);
            const win    = isWin(t);
            return (
              <div key={tid} className="nb-trade-row" onClick={() => onToggle(tid)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px', borderRadius:10, marginBottom:4, background:linked ? C.accentSoft : 'transparent', border:`1px solid ${linked ? 'rgba(124,106,247,0.35)' : 'transparent'}`, transition:'all .15s' }}>
                {/* checkbox */}
                <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, background:linked ? C.accent : 'transparent', border:`1.5px solid ${linked ? C.accent : C.muted}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                  {linked && <span style={{ color:'#fff', fontSize:10, fontWeight:800, lineHeight:1 }}>✓</span>}
                </div>
                {/* dot */}
                <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background:win ? C.green : C.red, boxShadow:`0 0 6px ${win ? C.green : C.red}60` }} />
                {/* info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ fontFamily:C.mono, fontSize:13, fontWeight:700, color:C.text }}>{t.symbol}</span>
                    {t.side && (
                      <span style={{ fontFamily:C.mono, fontSize:9, fontWeight:700, padding:'1px 7px', borderRadius:4, background:t.side.toLowerCase()==='long' ? C.greenSoft : C.redSoft, color:t.side.toLowerCase()==='long' ? C.green : C.red }}>
                        {t.side.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginTop:2 }}>
                    {dayjs(t.date).format('ddd, MMM D YYYY')}
                    {t.strategy ? ` · ${t.strategy}` : ''}
                  </div>
                </div>
                {/* pnl */}
                <span style={{ fontFamily:C.mono, fontSize:13, fontWeight:700, color:win ? C.green : C.red, flexShrink:0 }}>
                  {win ? '+' : ''}{formatCurrency(t.pnl)}
                </span>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div style={{ padding:'12px 20px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:C.mono, fontSize:11, color:C.muted }}>
            {linkedIds.length} trade{linkedIds.length !== 1 ? 's' : ''} linked
          </span>
          <button onClick={onClose}
            style={{ background:C.accentSoft, border:`1px solid rgba(124,106,247,0.35)`, borderRadius:9, padding:'7px 20px', cursor:'pointer', color:C.accent, fontFamily:C.sans, fontSize:12, fontWeight:700 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════ SESSION DATE PICKER ════════════════════════════ */
const SessionDatePicker = ({ value, onChange, recapDates = [] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display:'flex', alignItems:'center', gap:7, background:open ? C.accentSoft : C.surface, border:`1px solid ${open ? 'rgba(124,106,247,0.4)' : C.border}`, borderRadius:10, padding:'7px 13px', cursor:'pointer', color:open ? C.accent : C.textSoft, fontFamily:C.mono, fontSize:12, fontWeight:600, transition:'all .15s' }}>
        <Calendar size={12} />
        {value ? dayjs(value).format('MMM D, YYYY') : 'Pick date'}
        <ChevronDown size={11} style={{ transform:open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }} />
      </button>
      {open && (
        <div className="nb-scale"
          style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:100, background:C.cardHi, border:`1px solid ${C.borderHi}`, borderRadius:14, padding:'10px 8px', minWidth:220, maxHeight:300, overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.muted, letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 6px 8px', fontFamily:C.sans }}>Select Session Date</div>
          {Array.from({ length: 60 }, (_, i) => {
            const d   = dayjs().subtract(i, 'day');
            const key = d.format('YYYY-MM-DD');
            const isSel = value === key;
            return (
              <button key={key} onClick={() => { onChange(key); setOpen(false); }}
                style={{ width:'100%', textAlign:'left', padding:'8px 10px', borderRadius:9, border:'none', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', marginBottom:2, background:isSel ? C.accentSoft : 'transparent', color:isSel ? C.accent : C.textSoft, fontWeight:isSel ? 700 : 500, fontSize:12, fontFamily:C.mono }}>
                <span>{i===0 ? 'Today — ' : i===1 ? 'Yesterday — ' : ''}{d.format('ddd, MMM D')}</span>
                {recapDates.includes(key) && <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, display:'inline-block', flexShrink:0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════ DAY TRADE SUMMARY ════════════════════════════ */
const DayTradeSummary = ({ dayTrades }) => {
  if (!dayTrades.length) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, marginBottom:16 }}>
        <BarChart2 size={14} color={C.muted} />
        <span style={{ fontFamily:C.sans, fontSize:12, color:C.muted }}>No trades logged for this day</span>
      </div>
    );
  }
  const wins  = dayTrades.filter(isWin);
  const losses= dayTrades.filter(isLoss);
  const net   = dayTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const wr    = Math.round((wins.length / dayTrades.length) * 100);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', borderRadius:12, overflow:'hidden', border:`1px solid ${C.border}`, background:C.surface, marginBottom:10 }}>
        {[
          { label:'Net P&L',  value:`${net >= 0 ? '+' : ''}${formatCurrency(net)}`, color:net >= 0 ? C.green : C.red },
          { label:'Win Rate', value:`${wr}%`,                                        color:wr  >= 50 ? C.green : C.gold },
          { label:'Trades',   value:dayTrades.length,                                color:C.textSoft },
          { label:'W / L',    value:`${wins.length} / ${losses.length}`,             color:C.muted },
        ].map((cell, i, arr) => (
          <div key={cell.label} style={{ flex:1, padding:'11px 10px', textAlign:'center', borderRight:i < arr.length-1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontSize:8, fontWeight:700, color:C.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4, fontFamily:C.sans }}>{cell.label}</div>
            <div style={{ fontFamily:C.mono, fontSize:14, fontWeight:800, color:cell.color, letterSpacing:'-0.5px' }}>{cell.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {dayTrades.map(t => {
          const win = isWin(t);
          return (
            <div key={t._id || t.id} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:8, background:win ? C.greenSoft : C.redSoft, border:`1px solid ${win ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:win ? C.green : C.red, flexShrink:0 }} />
              <span style={{ fontFamily:C.mono, fontSize:11, fontWeight:700, color:win ? C.green : C.red }}>{t.symbol}</span>
              {t.side && <span style={{ fontFamily:C.mono, fontSize:9, color:win ? 'rgba(52,211,153,0.55)' : 'rgba(248,113,113,0.55)' }}>{t.side.toUpperCase()}</span>}
              <span style={{ fontFamily:C.mono, fontSize:10, color:win ? 'rgba(52,211,153,0.65)' : 'rgba(248,113,113,0.65)' }}>
                {win ? '+' : ''}{formatCurrency(t.pnl)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════ TRADE NOTE EDITOR ════════════════════════════ */
const TradeNoteEditor = ({ note, trades, onSave, onDelete }) => {
  const noteId = getNoteId(note);
  const [title,      setTitle]      = useState(note?.title      || '');
  const [content,    setContent]    = useState(note?.content    || '');
  const [linkedIds,  setLinkedIds]  = useState(note?.linkedTradeIds || []);
  const [showPicker, setShowPicker] = useState(false);
  const [dirty,      setDirty]      = useState(false);
  const [saving,     setSaving]     = useState(false);

  /* reset when note changes */
  useEffect(() => {
    setTitle(note?.title           || '');
    setContent(note?.content       || '');
    setLinkedIds(note?.linkedTradeIds || []);
    setDirty(false);
  }, [noteId]); // eslint-disable-line

  const handleSave = useCallback(async () => {
    if (!noteId || saving) return;
    setSaving(true);
    try {
      await onSave(noteId, { title, content, linkedTradeIds: linkedIds });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [noteId, title, content, linkedIds, onSave, saving]);

  const toggleLink = useCallback(tid => {
    setLinkedIds(prev => prev.includes(tid) ? prev.filter(x => x !== tid) : [...prev, tid]);
    setDirty(true);
  }, []);

  const handleBlur = () => { if (dirty) handleSave(); };

  const linkedTrades = useMemo(() => trades.filter(t => linkedIds.includes(t._id || t.id)), [trades, linkedIds]);

  const linkedStats = useMemo(() => {
    if (!linkedTrades.length) return null;
    const wins   = linkedTrades.filter(isWin);
    const losses = linkedTrades.filter(isLoss);
    const net    = linkedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
    return { net, wr: Math.round((wins.length / linkedTrades.length) * 100), wins, losses };
  }, [linkedTrades]);

  if (!note) {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, padding:40 }}>
        <div style={{ width:52, height:52, borderRadius:16, background:C.surface, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <FileText size={22} color={C.muted} />
        </div>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontFamily:C.sans, fontSize:14, fontWeight:600, color:C.textSoft, margin:'0 0 6px' }}>No note selected</p>
          <p style={{ fontFamily:C.sans, fontSize:12, color:C.muted, margin:0 }}>Create a new note or pick one from the list</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', padding:'24px 28px' }}>

      {/* top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.accent, boxShadow:`0 0 8px ${C.accent}80` }} />
          <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>Trade Note</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {dirty && (
            <button onClick={handleSave} disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:6, background:C.accentSoft, border:`1px solid rgba(124,106,247,0.4)`, borderRadius:9, padding:'6px 14px', cursor:'pointer', color:C.accent, fontFamily:C.sans, fontSize:11, fontWeight:700, opacity:saving ? 0.6 : 1 }}>
              <Save size={12} /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button onClick={() => onDelete(noteId)}
            style={{ display:'flex', alignItems:'center', gap:5, background:'transparent', border:`1px solid ${C.border}`, borderRadius:9, padding:'6px 12px', cursor:'pointer', color:C.muted, fontFamily:C.sans, fontSize:11, fontWeight:600, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(248,113,113,0.4)'; e.currentTarget.style.color=C.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* title */}
      <input value={title} onChange={e => { setTitle(e.target.value); setDirty(true); }} onBlur={handleBlur}
        placeholder="Note title…"
        style={{ background:'transparent', border:'none', outline:'none', fontFamily:C.sans, fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-0.5px', marginBottom:6, flexShrink:0, width:'100%' }} />

      <div style={{ fontSize:10, color:C.muted, fontFamily:C.mono, marginBottom:20, flexShrink:0 }}>
        {dayjs(note.createdAt || Date.now()).format('ddd, MMM D YYYY · HH:mm')}
        {dirty && <span style={{ color:C.gold, marginLeft:10 }}>● Unsaved</span>}
      </div>

      {/* ── LINKED TRADES ── */}
      <div style={{ marginBottom:20, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <Link2 size={12} color={C.muted} />
          <span style={{ fontFamily:C.sans, fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Linked Trades
            {linkedTrades.length > 0 && (
              <span style={{ marginLeft:6, padding:'1px 7px', borderRadius:20, background:C.accentSoft, color:C.accent, fontSize:9 }}>
                {linkedTrades.length}
              </span>
            )}
          </span>
          <div style={{ flex:1, height:1, background:C.border }} />
          <button onClick={() => setShowPicker(true)}
            style={{ display:'flex', alignItems:'center', gap:5, background:C.accentGlow, border:`1px solid rgba(124,106,247,0.3)`, borderRadius:7, padding:'5px 11px', cursor:'pointer', color:C.accent, fontFamily:C.sans, fontSize:10, fontWeight:700 }}>
            <Plus size={10} /> Link Trades
          </button>
        </div>

        {linkedTrades.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, border:`1px dashed ${C.border}` }}>
            <AlertCircle size={13} color={C.muted} />
            <span style={{ fontFamily:C.sans, fontSize:12, color:C.muted }}>Click "Link Trades" to connect trades from your journal to this note</span>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {linkedTrades.map(t => {
                const win = isWin(t);
                const tid = t._id || t.id;
                return (
                  <div key={tid} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:9, background:win ? C.greenSoft : C.redSoft, border:`1px solid ${win ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:win ? C.green : C.red, flexShrink:0 }} />
                    <span style={{ fontFamily:C.mono, fontSize:12, fontWeight:700, color:win ? C.green : C.red }}>{t.symbol}</span>
                    {t.side && <span style={{ fontFamily:C.mono, fontSize:9, color:win ? 'rgba(52,211,153,0.6)':'rgba(248,113,113,0.6)' }}>{t.side.toUpperCase()}</span>}
                    <span style={{ fontFamily:C.mono, fontSize:11, color:win ? C.green : C.red }}>{win?'+':''}{formatCurrency(t.pnl)}</span>
                    <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>{dayjs(t.date).format('MMM D')}</span>
                    <button onClick={() => toggleLink(tid)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, display:'flex', padding:0 }}
                      onMouseEnter={e => e.currentTarget.style.color=C.red}
                      onMouseLeave={e => e.currentTarget.style.color=C.muted}>
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
            {linkedStats && (
              <div style={{ display:'flex', gap:12, marginTop:10, padding:'10px 14px', borderRadius:10, background:C.surface, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {linkedStats.net >= 0 ? <TrendingUp size={12} color={C.green}/> : <TrendingDown size={12} color={C.red}/>}
                  <span style={{ fontFamily:C.mono, fontSize:11, fontWeight:700, color:linkedStats.net >= 0 ? C.green : C.red }}>
                    {linkedStats.net >= 0 ? '+' : ''}{formatCurrency(linkedStats.net)}
                  </span>
                </div>
                <div style={{ width:1, background:C.border }} />
                <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>
                  <span style={{ color:linkedStats.wr >= 50 ? C.green : C.gold, fontWeight:700 }}>{linkedStats.wr}%</span> win rate
                </span>
                <div style={{ width:1, background:C.border }} />
                <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>
                  <span style={{ color:C.green }}>{linkedStats.wins.length}W</span>{' / '}<span style={{ color:C.red }}>{linkedStats.losses.length}L</span>
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* divider */}
      <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.border} 30%,${C.border} 70%,transparent)`, marginBottom:20, flexShrink:0 }} />

      {/* content */}
      <textarea className="nb-editor" value={content}
        onChange={e => { setContent(e.target.value); setDirty(true); }}
        onBlur={handleBlur}
        placeholder={`Write your trade experience here…\n\nWhat was the setup? What was your reasoning? How did you manage the trade? What emotions did you feel? What would you do differently?`}
        style={{ flex:1, background:'transparent', border:`1px solid transparent`, borderRadius:12, color:C.text, fontFamily:C.sans, fontSize:14, lineHeight:1.8, padding:'14px 0', transition:'border-color .2s, box-shadow .2s' }} />

      {showPicker && (
        <TradePicker trades={trades} linkedIds={linkedIds} onToggle={toggleLink}
          onClose={() => { setShowPicker(false); if (dirty) handleSave(); }} />
      )}
    </div>
  );
};

/* ═══════════════════════════ SESSION RECAP EDITOR ════════════════════════════ */
const SessionRecapEditor = ({ note, trades, onSave, onDelete, allRecapDates }) => {
  const noteId = getNoteId(note);
  const [title,   setTitle]   = useState(note?.title       || '');
  const [content, setContent] = useState(note?.content     || '');
  const [date,    setDate]    = useState(note?.sessionDate || dayjs().format('YYYY-MM-DD'));
  const [dirty,   setDirty]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    setTitle(note?.title        || '');
    setContent(note?.content    || '');
    setDate(note?.sessionDate   || dayjs().format('YYYY-MM-DD'));
    setDirty(false);
  }, [noteId]); // eslint-disable-line

  const handleSave = useCallback(async () => {
    if (!noteId || saving) return;
    setSaving(true);
    try {
      await onSave(noteId, { title, content, sessionDate: date });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [noteId, title, content, date, onSave, saving]);

  const handleBlur = () => { if (dirty) handleSave(); };

  const dayTrades = useMemo(
    () => trades.filter(t => dayjs(t.date).format('YYYY-MM-DD') === date),
    [trades, date]
  );

  if (!note) {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, padding:40 }}>
        <div style={{ width:52, height:52, borderRadius:16, background:C.surface, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ClipboardList size={22} color={C.muted} />
        </div>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontFamily:C.sans, fontSize:14, fontWeight:600, color:C.textSoft, margin:'0 0 6px' }}>No recap selected</p>
          <p style={{ fontFamily:C.sans, fontSize:12, color:C.muted, margin:0 }}>Create a new recap or pick one from the list</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', padding:'24px 28px' }}>

      {/* top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 8px rgba(52,211,153,0.8)' }} />
          <span style={{ fontFamily:C.mono, fontSize:10, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>Session Recap</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {dirty && (
            <button onClick={handleSave} disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:6, background:C.greenSoft, border:`1px solid rgba(52,211,153,0.4)`, borderRadius:9, padding:'6px 14px', cursor:'pointer', color:C.green, fontFamily:C.sans, fontSize:11, fontWeight:700, opacity:saving ? 0.6 : 1 }}>
              <Save size={12} /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button onClick={() => onDelete(noteId)}
            style={{ display:'flex', alignItems:'center', gap:5, background:'transparent', border:`1px solid ${C.border}`, borderRadius:9, padding:'6px 12px', cursor:'pointer', color:C.muted, fontFamily:C.sans, fontSize:11, fontWeight:600, transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(248,113,113,0.4)'; e.currentTarget.style.color=C.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* title */}
      <input value={title} onChange={e => { setTitle(e.target.value); setDirty(true); }} onBlur={handleBlur}
        placeholder="Session recap title…"
        style={{ background:'transparent', border:'none', outline:'none', fontFamily:C.sans, fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-0.5px', marginBottom:14, flexShrink:0, width:'100%' }} />

      {/* date picker */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexShrink:0 }}>
        <span style={{ fontFamily:C.sans, fontSize:11, color:C.muted, fontWeight:600 }}>Session date:</span>
        <SessionDatePicker value={date} onChange={d => { setDate(d); setDirty(true); }} recapDates={allRecapDates} />
        {dirty && <span style={{ fontFamily:C.mono, fontSize:10, color:C.gold }}>● Unsaved</span>}
      </div>

      {/* trades summary */}
      <DayTradeSummary dayTrades={dayTrades} />

      {/* divider */}
      <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.border} 30%,${C.border} 70%,transparent)`, marginBottom:20, flexShrink:0 }} />

      {/* content */}
      <textarea className="nb-editor" value={content}
        onChange={e => { setContent(e.target.value); setDirty(true); }}
        onBlur={handleBlur}
        placeholder={`Write your session recap here…\n\nHow did the session go overall? What was the market environment like? What went well? Key takeaways for tomorrow?`}
        style={{ flex:1, background:'transparent', border:`1px solid transparent`, borderRadius:12, color:C.text, fontFamily:C.sans, fontSize:14, lineHeight:1.8, padding:'14px 0', transition:'border-color .2s, box-shadow .2s' }} />
    </div>
  );
};

/* ═══════════════════════════ NOTE LIST PANEL ════════════════════════════ */
const NoteListPanel = ({ notes, selectedId, onSelect, onNew, folderType, searchQuery, trades }) => {
  const isRecap = folderType === 'session_recap';

  const tradesByDate = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      const d = dayjs(t.date).format('YYYY-MM-DD');
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return map;
  }, [trades]);

  const filtered = useMemo(() => {
    let arr = notes.filter(n => n.folder === folderType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter(n => (n.title||'').toLowerCase().includes(q) || (n.content||'').toLowerCase().includes(q));
    }
    return arr.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [notes, folderType, searchQuery]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* header */}
      <div style={{ padding:'14px 14px 12px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:C.sans, fontSize:11, color:C.muted, fontWeight:600 }}>
            {filtered.length} {isRecap ? 'recap' : 'note'}{filtered.length !== 1 ? 's' : ''}
          </span>
          <button onClick={onNew}
            style={{ display:'flex', alignItems:'center', gap:5, background:C.accentGlow, border:`1px solid rgba(124,106,247,0.3)`, borderRadius:8, padding:'5px 12px', cursor:'pointer', color:C.accent, fontFamily:C.sans, fontSize:11, fontWeight:700 }}>
            <Plus size={11} /> New
          </button>
        </div>
      </div>

      {/* list */}
      <div style={{ flex:1, overflowY:'auto', padding:'6px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 16px' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>{isRecap ? '📋' : '📝'}</div>
            <p style={{ fontFamily:C.sans, fontSize:12, color:C.muted, margin:0 }}>
              {searchQuery ? 'No matches found' : `No ${isRecap ? 'recaps' : 'notes'} yet — click New`}
            </p>
          </div>
        ) : filtered.map(note => {
          const id    = getNoteId(note);
          const isSel = selectedId === id;
          const preview = (note.content || '').replace(/\n/g,' ').slice(0,80) || 'No content yet…';
          const dateStr = isRecap && note.sessionDate
            ? dayjs(note.sessionDate).format('MMM D, YYYY')
            : dayjs(note.updatedAt || note.createdAt).format('MMM D');

          const dayTs  = isRecap && note.sessionDate ? (tradesByDate[note.sessionDate] || []) : [];
          const dayNet = dayTs.reduce((s, t) => s + (t.pnl || 0), 0);

          return (
            <div key={id} className="nb-note-row" onClick={() => onSelect(note)}
              style={{ padding:'11px 10px', borderRadius:10, marginBottom:2, background:isSel ? C.accentSoft : 'transparent', border:`1px solid ${isSel ? 'rgba(124,106,247,0.3)' : 'transparent'}`, position:'relative' }}>
              {isSel && <div style={{ position:'absolute', left:0, top:'20%', height:'60%', width:2.5, borderRadius:4, background:C.accent, boxShadow:`0 0 8px ${C.accent}80` }} />}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, paddingLeft:isSel ? 4 : 0 }}>
                <span style={{ fontFamily:C.sans, fontSize:12, fontWeight:isSel ? 700 : 500, color:isSel ? C.text : C.textSoft, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:6 }}>
                  {note.title || 'Untitled'}
                </span>
                <span style={{ fontFamily:C.mono, fontSize:9, color:C.muted, flexShrink:0 }}>{dateStr}</span>
              </div>
              <p style={{ fontFamily:C.sans, fontSize:11, color:C.muted, margin:0, paddingLeft:isSel ? 4 : 0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {preview}
              </p>
              {!isRecap && note.linkedTradeIds?.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5, paddingLeft:isSel ? 4 : 0 }}>
                  <Link2 size={9} color={C.accent} />
                  <span style={{ fontFamily:C.mono, fontSize:9, color:C.accent }}>{note.linkedTradeIds.length} trade{note.linkedTradeIds.length !== 1 ? 's' : ''} linked</span>
                </div>
              )}
              {isRecap && note.sessionDate && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, paddingLeft:isSel ? 4 : 0 }}>
                  <Calendar size={9} color={C.green} />
                  <span style={{ fontFamily:C.mono, fontSize:9, color:C.green }}>{dayjs(note.sessionDate).format('ddd, MMM D')}</span>
                  {dayTs.length > 0 && (
                    <>
                      <span style={{ fontSize:9, color:C.muted }}>·</span>
                      <span style={{ fontFamily:C.mono, fontSize:9, fontWeight:700, color:dayNet >= 0 ? C.green : C.red }}>
                        {dayNet >= 0 ? '+' : ''}{formatCurrency(dayNet)}
                      </span>
                      <span style={{ fontFamily:C.mono, fontSize:9, color:C.muted }}>({dayTs.length}T)</span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════ SIDEBAR ════════════════════════════ */
const Sidebar = ({ activeFolder, onSelectFolder, notes, searching, setSearching, searchQuery, setSearchQuery, todayPct }) => {
  const isPremarket = activeFolder === PRE_MARKET_ID;
  const countFor = id => notes.filter(n => n.folder === id).length;

  return (
    <aside style={{ width:196, flexShrink:0, display:'flex', flexDirection:'column', background:C.bg, borderRight:`1px solid ${C.border}`, overflow:'hidden' }}>
      <div style={{ padding:'16px 13px 12px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:searching ? 10 : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#4c1d95,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(124,106,247,0.4)', flexShrink:0 }}>
              <BookOpen size={12} color="#e9d5ff" />
            </div>
            <span style={{ fontSize:13, fontWeight:800, color:'#d4d6ff', letterSpacing:'-0.03em', fontFamily:C.sans }}>Journal</span>
          </div>
          <button onClick={() => { setSearching(!searching); if (searching) setSearchQuery(''); }}
            style={{ background:searching ? C.accentSoft : 'rgba(255,255,255,0.04)', border:`1px solid ${searching ? 'rgba(124,106,247,0.35)' : C.border}`, borderRadius:7, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:searching ? C.accent : C.muted, transition:'all .18s', flexShrink:0 }}>
            {searching ? <X size={12} /> : <Search size={12} />}
          </button>
        </div>
        {searching && (
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.04)', border:`1px solid rgba(124,106,247,0.25)`, borderRadius:8, padding:'5px 9px' }}>
            <Search size={11} color={C.muted} />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notes…"
              style={{ background:'transparent', border:'none', outline:'none', color:C.text, fontSize:11, width:'100%', fontFamily:C.mono }} />
          </div>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'10px 8px 16px' }}>
        {/* Pre-Market */}
        <div style={{ marginBottom:12 }}>
          <button onClick={() => onSelectFolder(PRE_MARKET_ID)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:`1px solid ${isPremarket ? 'rgba(124,106,247,0.35)' : C.border}`, background:isPremarket ? 'linear-gradient(135deg,rgba(109,40,217,0.18),rgba(124,106,247,0.08))' : 'rgba(255,255,255,0.025)', cursor:'pointer', textAlign:'left', transition:'all .2s', boxShadow:isPremarket ? '0 0 20px rgba(109,40,217,0.12)' : 'none' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:isPremarket ? 'linear-gradient(135deg,#6d28d9,#8b5cf6)' : 'rgba(109,40,217,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background .2s' }}>
              <CheckSquare size={13} color={isPremarket ? '#fff' : '#7c3aed'} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, fontWeight:700, color:isPremarket ? '#ddd6fe' : '#5a5a7a', margin:'0 0 1px', fontFamily:C.sans }}>Pre-Market</p>
              <p style={{ fontSize:9.5, color:isPremarket ? '#8b5cf6' : C.muted, margin:0, fontWeight:600, fontFamily:C.mono }}>
                {todayPct !== null ? (todayPct === 100 ? '✓ Complete' : `${todayPct}% done`) : 'Not started'}
              </p>
            </div>
            {todayPct !== null && <Ring pct={todayPct} />}
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, margin:'0 4px 8px' }}>
          <span style={{ fontSize:9, fontWeight:700, color:C.muted, letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap', fontFamily:C.sans }}>Sections</span>
          <div style={{ flex:1, height:1, background:C.border }} />
        </div>

        {FOLDERS.map(f => {
          const isActive = activeFolder === f.id && !isPremarket;
          const FolderIcon = f.Icon;
          const count = countFor(f.id);
          return (
            <button key={f.id} className="nb-folder-btn" onClick={() => onSelectFolder(f.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'7px 12px', borderRadius:8, border:'none', background:isActive ? `linear-gradient(90deg,${f.color}12 0%,transparent 100%)` : 'transparent', cursor:'pointer', position:'relative', marginBottom:1, textAlign:'left' }}>
              {isActive && <div style={{ position:'absolute', left:0, top:'20%', height:'60%', width:2.5, borderRadius:4, background:f.color, boxShadow:`0 0 8px ${f.color}90` }} />}
              <FolderIcon size={13} style={{ color:isActive ? f.color : C.muted, flexShrink:0, transition:'color .18s' }} />
              <span style={{ flex:1, fontSize:12, fontWeight:isActive ? 600 : 400, color:isActive ? '#e2e4ff' : '#4a4a68', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:C.sans, transition:'color .18s' }}>
                {f.label}
              </span>
              {count > 0 && (
                <span style={{ fontSize:9.5, fontWeight:700, color:isActive ? f.color : C.muted, background:isActive ? `${f.color}18` : 'rgba(255,255,255,0.04)', padding:'1px 5px', borderRadius:4, fontFamily:C.mono }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

/* ═══════════════════════════ MAIN NOTEBOOK ════════════════════════════ */
const Notebook = () => {
  const { notes, loading: notesLoading, addNote, editNote, removeNote } = useNotes();
  const { trades, loading: tradesLoading }                              = useTrades();

  const [activeFolder, setActiveFolder] = useState('trade_notes');
  const [selectedNote, setSelectedNote] = useState(null);
  const [searching,    setSearching]    = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');

  const loading     = notesLoading || tradesLoading;
  const isPremarket = activeFolder === PRE_MARKET_ID;
  const todayPct    = getTodayPremarketPct();

  const recapDates = useMemo(
    () => notes.filter(n => n.folder === 'session_recap' && n.sessionDate).map(n => n.sessionDate),
    [notes]
  );

  const currentFolder = useMemo(() => FOLDERS.find(f => f.id === activeFolder) || null, [activeFolder]);

  const handleSelectFolder = useCallback(id => {
    setActiveFolder(id);
    setSelectedNote(null);
    setSearching(false);
    setSearchQuery('');
  }, []);

  /* ── NEW NOTE — this now works because the model accepts these fields ── */
  const handleNewNote = useCallback(async () => {
    const isRecap = activeFolder === 'session_recap';
    const payload = {
      title:          '',
      content:        '',
      folder:         activeFolder,           // 'trade_notes' | 'session_recap'
      tags:           [],
      linkedTradeIds: [],
      sessionDate:    isRecap ? dayjs().format('YYYY-MM-DD') : '',
    };
    try {
      const created = await addNote(payload);  // addNote returns res.data which is the saved Mongoose doc
      setSelectedNote(created);               // created._id is guaranteed now
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  }, [activeFolder, addNote]);

  const handleSave = useCallback(async (id, data) => {
    await editNote(id, data);
    setSelectedNote(prev =>
      prev && (prev._id === id || prev.id === id) ? { ...prev, ...data } : prev
    );
  }, [editNote]);

  const handleDelete = useCallback(async id => {
    await removeNote(id);
    setSelectedNote(null);
  }, [removeNote]);

  if (loading) return <Loader />;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.bg }}>
      <Sidebar
        activeFolder={activeFolder}
        onSelectFolder={handleSelectFolder}
        notes={notes}
        searching={searching}
        setSearching={setSearching}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        todayPct={todayPct}
      />

      {isPremarket ? (
        <div style={{ flex:1, overflow:'auto' }}>
          <PreMarketChecklist />
        </div>
      ) : (
        <>
          {/* middle column */}
          <div style={{ width:264, flexShrink:0, display:'flex', flexDirection:'column', background:C.surface, borderRight:`1px solid ${C.border}`, overflow:'hidden' }}>
            <div style={{ padding:'13px 14px 11px', borderBottom:`1px solid ${C.border}`, flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
              {currentFolder && (() => {
                const LabelIcon = currentFolder.Icon;
                return (
                  <>
                    <LabelIcon size={13} color={currentFolder.color} />
                    <span style={{ fontFamily:C.sans, fontSize:12, fontWeight:700, color:C.textSoft }}>{currentFolder.label}</span>
                  </>
                );
              })()}
            </div>
            <NoteListPanel
              notes={notes}
              selectedId={getNoteId(selectedNote)}
              onSelect={setSelectedNote}
              onNew={handleNewNote}
              folderType={activeFolder}
              searchQuery={searching ? searchQuery : ''}
              trades={trades}
            />
          </div>

          {/* right: editor */}
          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', background:C.bg }}>
            {activeFolder === 'trade_notes' ? (
              <TradeNoteEditor
                key={getNoteId(selectedNote) || 'empty-trade'}
                note={selectedNote}
                trades={trades}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ) : (
              <SessionRecapEditor
                key={getNoteId(selectedNote) || 'empty-recap'}
                note={selectedNote}
                trades={trades}
                onSave={handleSave}
                onDelete={handleDelete}
                allRecapDates={recapDates}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notebook;