/**
 * Playbook.jsx — Trading Strategy Playbook
 * Select a strategy → see all trades + live win rate & P&L
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, Edit3, Check, X, BookMarked, ChevronDown, AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTrades } from '../hooks/useTrades';
import * as setupService from '../services/setupService';
import dayjs from 'dayjs';

/* ── Tokens ── */
const C = {
  bg: '#050710', surface: '#07091a', card: '#0a0d24', border: '#151a38',
  accent: '#4f8ef7', accentL: 'rgba(79,142,247,0.12)',
  green: '#00e5a0', greenL: 'rgba(0,229,160,0.10)',
  red: '#ff4466', redL: 'rgba(255,68,102,0.10)',
  yellow: '#ffa53d',
  text: '#dde4ff', soft: '#9aa5cc', sub: '#5a6690', muted: '#1e2548',
  mono: "'JetBrains Mono',monospace",
  sans: "'Outfit',system-ui,sans-serif",
};

/* ── Inject styles once ── */
if (typeof document !== 'undefined' && !document.getElementById('__pb__')) {
  const s = document.createElement('style');
  s.id = '__pb__';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
    @keyframes pb-spin { to { transform: rotate(360deg); } }
    @keyframes pb-up   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
    .pb-up  { animation: pb-up .35s cubic-bezier(.16,1,.3,1) both; }
    .pb-in  { animation: pb-up .25s cubic-bezier(.16,1,.3,1) both; }
    .pb-inp {
      width:100%; background:#07091a; border:1px solid #151a38; border-radius:10px;
      color:#dde4ff; font-family:'JetBrains Mono',monospace; font-size:12px;
      padding:9px 12px; outline:none; box-sizing:border-box;
      transition:border-color .15s, box-shadow .15s;
    }
    .pb-inp:focus { border-color:#4f8ef7; box-shadow:0 0 0 3px rgba(79,142,247,.1); }
    .pb-inp::placeholder { color:#1e2548; }
    .pb-ta  { resize:vertical; min-height:72px; }
    .pb-btn {
      display:inline-flex; align-items:center; gap:6px; padding:8px 16px;
      border-radius:10px; font-size:11px; font-weight:700; font-family:'Outfit',sans-serif;
      cursor:pointer; border:none; transition:all .15s; letter-spacing:.04em;
    }
    .pb-btn:hover { transform:translateY(-1px); filter:brightness(1.1); }
    .pb-row:hover { background:rgba(79,142,247,.04); }
    .pb-scroll::-webkit-scrollbar { width:3px; }
    .pb-scroll::-webkit-scrollbar-thumb { background:#1e2548; border-radius:99px; }
  `;
  document.head.appendChild(s);
}

/* ── Utils ── */
const fmt = n => {
  if (n == null) return '—';
  const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n >= 0 ? '+' : '-'}$${s}`;
};

const TIMEFRAMES = ['1m','5m','15m','30m','1h','4h','1D','1W'];
const CONDITIONS = ['Any','Trending','Ranging','Volatile'];
const CATEGORIES = ['Momentum','Breakout','Reversal','Scalp','Swing','Mean Reversion','Supply & Demand','ICT / SMC','News','Other'];
const EMPTY = { name:'', description:'', rules:'', tags:'', timeframes:[], marketCondition:'Any', notes:'', category:'' };

/* ── Setup Modal ── */
const Modal = ({ init, title, onSave, onClose }) => {
  const [f, setF] = useState(init || EMPTY);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = useCallback((k, v) => setF(p => ({ ...p, [k]: v })), []);

  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const save = async () => {
    if (!f.name.trim()) { setErr('Name required'); return; }
    setLoading(true); setErr('');
    try {
      await onSave({
        name: f.name.trim(), description: f.description.trim(),
        rules: f.rules.split('\n').map(r => r.trim()).filter(Boolean),
        tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
        timeframes: f.timeframes, marketCondition: f.marketCondition,
        notes: f.notes.trim(), category: f.category,
      });
      onClose();
    } catch { setErr('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const toggleTf = tf => set('timeframes', f.timeframes.includes(tf) ? f.timeframes.filter(t => t !== tf) : [...f.timeframes, tf]);

  const chip = (val, active, onClick) => (
    <button key={val} onClick={onClick} style={{
      padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700,
      fontFamily:C.mono, cursor:'pointer', border:`1px solid ${active ? 'rgba(79,142,247,.45)' : C.border}`,
      background: active ? C.accentL : 'transparent',
      color: active ? C.accent : C.sub, transition:'all .12s',
    }}>{val}</button>
  );

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center',
      justifyContent:'center', background:'rgba(5,7,16,.85)', backdropFilter:'blur(8px)', padding:16,
    }}>
      <div className="pb-in pb-scroll" style={{
        background:'#0e1128', border:`1px solid ${C.muted}`, borderRadius:18,
        width:'100%', maxWidth:500, maxHeight:'90vh', display:'flex', flexDirection:'column',
        boxShadow:'0 32px 96px rgba(0,0,0,.7)', overflowY:'auto',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${C.border}` }}>
          <span style={{ fontFamily:C.sans, fontSize:14, fontWeight:700, color:C.text }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.sub, cursor:'pointer' }}><X size={15}/></button>
        </div>

        {/* Body */}
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.sub, fontWeight:700, display:'block', marginBottom:5 }}>
              Setup Name *
            </label>
            <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. VWAP Bounce" className="pb-inp" autoFocus />
            <p style={{ fontSize:10, color:C.sub, marginTop:4 }}>Must match strategy name used in trade logs to auto-link stats.</p>
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>Category</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {CATEGORIES.map(c => chip(c, f.category === c, () => set('category', c === f.category ? '' : c)))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.sub, fontWeight:700, display:'block', marginBottom:5 }}>Description</label>
            <input value={f.description} onChange={e => set('description', e.target.value)} placeholder="When and why you take this trade" className="pb-inp" />
          </div>

          {/* Rules */}
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.sub, fontWeight:700, display:'block', marginBottom:5 }}>Entry Rules (one per line)</label>
            <textarea value={f.rules} onChange={e => set('rules', e.target.value)} rows={4} placeholder="Rule 1&#10;Rule 2&#10;Rule 3" className="pb-inp pb-ta" />
          </div>

          {/* Timeframes */}
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>Timeframes</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {TIMEFRAMES.map(tf => chip(tf, f.timeframes.includes(tf), () => toggleTf(tf)))}
            </div>
          </div>

          {/* Market Condition */}
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>Market Condition</label>
            <div style={{ display:'flex', gap:5 }}>
              {CONDITIONS.map(c => chip(c, f.marketCondition === c, () => set('marketCondition', c)))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.sub, fontWeight:700, display:'block', marginBottom:5 }}>Tags (comma-separated)</label>
            <input value={f.tags} onChange={e => set('tags', e.target.value)} placeholder="ES, Futures, VWAP…" className="pb-inp" />
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:C.sub, fontWeight:700, display:'block', marginBottom:5 }}>Notes</label>
            <textarea value={f.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Psychology tips, lessons learned…" className="pb-inp pb-ta" style={{ minHeight:50 }} />
          </div>

          {err && (
            <div style={{ display:'flex', gap:8, padding:'9px 12px', background:C.redL, border:`1px solid rgba(255,68,102,.25)`, borderRadius:9 }}>
              <AlertCircle size={13} color={C.red} /><span style={{ fontSize:12, color:C.red, fontFamily:C.sans }}>{err}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', gap:8, padding:'14px 20px', borderTop:`1px solid ${C.border}` }}>
          <button onClick={onClose} className="pb-btn" style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, color:C.sub }}>Cancel</button>
          <button onClick={save} disabled={loading} className="pb-btn" style={{ flex:1, background:C.accent, color:'#fff', opacity:loading?.6:1 }}>
            {loading ? <span style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'pb-spin .7s linear infinite', display:'inline-block' }} /> : <><Check size={13}/>Save</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── AI Coach Panel ── */
const AICoach = ({ setup, stats }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    setLoading(true); setText(''); setErr('');
    const prompt = `You are an elite trading coach. Give 3 short numbered coaching points for this setup.
Setup: ${setup.name} | WR: ${stats.winRate.toFixed(1)}% | Trades: ${stats.count} (${stats.winners}W/${stats.losers}L) | P&L: ${fmt(stats.pnl)} | PF: ${stats.pf}
Rules: ${(setup.rules||[]).join('; ')||'None'}
Be direct, reference numbers, under 150 words. Format: **[Label]**: insight`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{role:'user',content:prompt}] }),
      });
      const d = await res.json();
      setText(d.content?.map(b=>b.text||'').join('')||'No response.');
    } catch { setErr('Network error.'); }
    setLoading(false);
  };

  return (
    <div style={{ background:C.accentL, border:`1px solid rgba(79,142,247,.2)`, borderRadius:12, padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: text||loading||err ? 12 : 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Sparkles size={12} color={C.accent}/><span style={{ fontFamily:C.sans, fontSize:11, fontWeight:700, color:C.accent, textTransform:'uppercase', letterSpacing:'.08em' }}>AI Coach</span>
        </div>
        <button onClick={run} disabled={loading} className="pb-btn" style={{ padding:'4px 12px', fontSize:10, background:C.accentL, border:`1px solid rgba(79,142,247,.3)`, color:loading?C.sub:C.accent }}>
          {loading ? <><span style={{ width:9,height:9,borderRadius:'50%',border:`1.5px solid ${C.sub}`,borderTopColor:C.accent,animation:'pb-spin .7s linear infinite',display:'inline-block' }}/>Analyzing…</> : '✦ Analyze'}
        </button>
      </div>
      {err && <p style={{ fontFamily:C.sans, fontSize:12, color:C.red }}>{err}</p>}
      {text && (
        <div style={{ fontFamily:C.sans, fontSize:12, color:C.soft, lineHeight:1.8, whiteSpace:'pre-wrap' }}>
          {text.split(/\*\*(.+?)\*\*/g).map((p,i) => i%2===1 ? <strong key={i} style={{color:C.accent,fontWeight:700}}>{p}</strong> : p)}
        </div>
      )}
    </div>
  );
};

/* ── Main ── */
export default function Playbook() {
  const { trades } = useTrades();
  const [setups, setSetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // setup._id
  const [modal, setModal] = useState(null);        // null | 'add' | setup obj (edit)
  const [delId, setDelId] = useState(null);

  useEffect(() => {
    setupService.getSetups()
      .then(r => { setSetups(r.data); if (r.data.length) setSelected(r.data[0]._id); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Stats per setup */
  const statsMap = useMemo(() => {
    const m = {};
    setups.forEach(s => {
      const linked = trades.filter(t => t.strategy?.toLowerCase() === s.name.toLowerCase() && t.pnl != null);
      if (!linked.length) { m[s._id] = null; return; }
      const sorted = [...linked].sort((a,b) => new Date(a.date)-new Date(b.date));
      const winners = linked.filter(t => t.pnl > 0);
      const losers  = linked.filter(t => t.pnl < 0);
      const pnl     = linked.reduce((s,t) => s+t.pnl, 0);
      const gw = winners.reduce((s,t)=>s+t.pnl,0);
      const gl = Math.abs(losers.reduce((s,t)=>s+t.pnl,0));
      m[s._id] = {
        count: linked.length, winners: winners.length, losers: losers.length,
        winRate: (winners.length/linked.length)*100, pnl,
        avgPnl: pnl/linked.length,
        avgWin: winners.length ? gw/winners.length : 0,
        avgLoss: losers.length ? gl/losers.length : 0,
        best: Math.max(...linked.map(t=>t.pnl)),
        worst: Math.min(...linked.map(t=>t.pnl)),
        pf: gl ? +(gw/gl).toFixed(2) : (winners.length?99:0),
        trades: sorted,
      };
    });
    return m;
  }, [setups, trades]);

  /* Summary across all setups */
  const summary = useMemo(() => {
    const active = setups.filter(s => statsMap[s._id]);
    const totalPnl = active.reduce((s,x)=>s+(statsMap[x._id]?.pnl??0),0);
    const avgWR = active.length ? active.reduce((s,x)=>s+(statsMap[x._id]?.winRate??0),0)/active.length : null;
    const totalTrades = active.reduce((s,x)=>s+(statsMap[x._id]?.count??0),0);
    return { totalPnl, avgWR, totalTrades };
  }, [setups, statsMap]);

  /* CRUD */
  const add    = async data => { const r = await setupService.createSetup(data); setSetups(p=>[r.data,...p]); setSelected(r.data._id); };
  const update = async (id,data) => { const r = await setupService.updateSetup(id,data); setSetups(p=>p.map(s=>s._id===id?r.data:s)); };
  const del = async id => {
    await setupService.deleteSetup(id);
    setSetups(p => p.filter(s => s._id !== id));
    const fallback = setups.find(s => s._id !== id);
    setSelected(p => (p === id ? (fallback ? fallback._id : null) : p));
    setDelId(null);
  };

  const activeSetup = setups.find(s => s._id === selected);
  const activeStats = selected ? statsMap[selected] : null;

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:24,height:24,borderRadius:'50%',border:`2px solid ${C.border}`,borderTopColor:C.accent,animation:'pb-spin .8s linear infinite' }}/>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:C.sans, color:C.text, display:'flex', flexDirection:'column' }}>

      {/* ── Header ── */}
      <div className="pb-up" style={{ borderBottom:`1px solid ${C.border}`, padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <BookMarked size={18} color={C.accent}/>
          <span style={{ fontFamily:C.sans, fontSize:18, fontWeight:800, color:C.text }}>Playbook</span>
        </div>
        <button onClick={() => setModal('add')} className="pb-btn" style={{ background:C.accent, color:'#fff' }}>
          <Plus size={14}/> New Setup
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div className="pb-up" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, padding:'16px 24px 0', animationDelay:'40ms' }}>
        {[
          { label:'Avg Win Rate', value: summary.avgWR!=null ? `${summary.avgWR.toFixed(1)}%` : '—', color: summary.avgWR!=null ? (summary.avgWR>=50?C.green:C.red) : C.sub },
          { label:'Total P&L',    value: setups.some(s=>statsMap[s._id]) ? fmt(summary.totalPnl) : '—', color: summary.totalPnl>=0?C.green:C.red },
          { label:'Total Trades', value: summary.totalTrades||'—', color: C.text },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 16px' }}>
            <div style={{ fontFamily:C.sans, fontSize:9, color:C.sub, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:5 }}>{label}</div>
            <div style={{ fontFamily:C.mono, fontSize:20, fontWeight:800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', padding:'16px 24px', gap:16 }}>

        {/* Sidebar — strategy list */}
        <div className="pb-scroll" style={{ width:200, flexShrink:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
          {setups.length === 0 ? (
            <div style={{ fontSize:12, color:C.sub, padding:'20px 0', textAlign:'center' }}>No setups yet</div>
          ) : setups.map(s => {
            const st = statsMap[s._id];
            const isActive = s._id === selected;
            return (
              <button key={s._id} onClick={() => setSelected(s._id)} style={{
                width:'100%', textAlign:'left', background: isActive ? C.accentL : 'transparent',
                border: `1px solid ${isActive ? 'rgba(79,142,247,.4)' : 'transparent'}`,
                borderRadius:10, padding:'10px 12px', cursor:'pointer', transition:'all .15s',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(79,142,247,.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}
              >
                <div style={{ fontFamily:C.sans, fontSize:12, fontWeight:600, color: isActive?C.accent:C.text, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                {st ? (
                  <div style={{ display:'flex', gap:6 }}>
                    <span style={{ fontFamily:C.mono, fontSize:10, color:st.winRate>=50?C.green:C.red, fontWeight:700 }}>{st.winRate.toFixed(0)}%</span>
                    <span style={{ fontFamily:C.mono, fontSize:10, color:st.pnl>=0?C.green:C.red }}>{fmt(st.pnl)}</span>
                  </div>
                ) : (
                  <span style={{ fontFamily:C.mono, fontSize:10, color:C.sub }}>No trades</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="pb-scroll" style={{ flex:1, overflowY:'auto' }}>
          {!activeSetup ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:C.sub, fontSize:13 }}>Select a setup to view details</div>
          ) : (
            <div className="pb-up">

              {/* Setup header */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:C.sans, fontSize:18, fontWeight:800, color:C.text }}>{activeSetup.name}</div>
                  {activeSetup.description && <div style={{ fontFamily:C.sans, fontSize:12, color:C.sub, marginTop:3 }}>{activeSetup.description}</div>}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
                    {activeSetup.category && <span style={{ padding:'3px 9px', borderRadius:20, fontFamily:C.mono, fontSize:10, fontWeight:700, background:C.accentL, color:C.accent, border:`1px solid rgba(79,142,247,.25)` }}>{activeSetup.category}</span>}
                    {activeSetup.marketCondition && activeSetup.marketCondition !== 'Any' && <span style={{ padding:'3px 9px', borderRadius:20, fontFamily:C.mono, fontSize:10, fontWeight:700, background:'rgba(0,212,255,.1)', color:'#00d4ff', border:'1px solid rgba(0,212,255,.2)' }}>{activeSetup.marketCondition}</span>}
                    {activeSetup.timeframes?.map(tf => <span key={tf} style={{ padding:'3px 9px', borderRadius:20, fontFamily:C.mono, fontSize:10, fontWeight:700, background:C.accentL, color:C.accent, border:`1px solid rgba(79,142,247,.25)` }}>{tf}</span>)}
                    {activeSetup.tags?.map(t => <span key={t} style={{ padding:'3px 9px', borderRadius:20, fontFamily:C.mono, fontSize:10, color:C.sub, border:`1px solid ${C.border}` }}>{t}</span>)}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => setModal({ _id:activeSetup._id, name:activeSetup.name, description:activeSetup.description||'', rules:(activeSetup.rules||[]).join('\n'), tags:(activeSetup.tags||[]).join(', '), timeframes:activeSetup.timeframes||[], marketCondition:activeSetup.marketCondition||'Any', notes:activeSetup.notes||'', category:activeSetup.category||'' })}
                    style={{ width:30,height:30,borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.sub,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.accentL;e.currentTarget.style.color=C.accent;}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=C.sub;}}>
                    <Edit3 size={13}/>
                  </button>
                  <button onClick={() => setDelId(activeSetup._id)}
                    style={{ width:30,height:30,borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.sub,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.redL;e.currentTarget.style.color=C.red;}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=C.sub;}}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>

              {/* Stats row */}
              {activeStats ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
                    {[
                      { label:'Win Rate', value:`${activeStats.winRate.toFixed(1)}%`, color: activeStats.winRate>=50?C.green:C.red },
                      { label:'Total P&L', value:fmt(activeStats.pnl), color:activeStats.pnl>=0?C.green:C.red },
                      { label:'Avg P&L', value:fmt(activeStats.avgPnl), color:activeStats.avgPnl>=0?C.green:C.red },
                      { label:'Profit Factor', value:activeStats.pf>=99?'∞':activeStats.pf, color:activeStats.pf>=1.5?C.green:activeStats.pf>=1?C.yellow:C.red },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                        <div style={{ fontFamily:C.sans, fontSize:9, color:C.sub, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{label}</div>
                        <div style={{ fontFamily:C.mono, fontSize:14, fontWeight:800, color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
                    {[
                      { label:'Trades', value:`${activeStats.count} (${activeStats.winners}W / ${activeStats.losers}L)`, color:C.text },
                      { label:'Best Trade', value:`+$${activeStats.best.toFixed(2)}`, color:C.green },
                      { label:'Worst Trade', value:`$${activeStats.worst.toFixed(2)}`, color:C.red },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                        <div style={{ fontFamily:C.sans, fontSize:9, color:C.sub, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{label}</div>
                        <div style={{ fontFamily:C.mono, fontSize:12, fontWeight:800, color }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* AI Coach */}
                  <div style={{ marginBottom:16 }}>
                    <AICoach setup={activeSetup} stats={activeStats}/>
                  </div>

                  {/* Trades table */}
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                    <div style={{ padding:'11px 14px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontFamily:C.sans, fontSize:11, fontWeight:700, color:C.soft, textTransform:'uppercase', letterSpacing:'.08em' }}>Trades ({activeStats.count})</span>
                    </div>
                    {/* Table header */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 90px 90px 80px', gap:4, padding:'8px 14px', borderBottom:`1px solid ${C.border}` }}>
                      {['Date','Symbol','Side','Entry','Exit','P&L'].map(h => (
                        <span key={h} style={{ fontFamily:C.mono, fontSize:9, color:C.sub, textTransform:'uppercase', letterSpacing:'.08em' }}>{h}</span>
                      ))}
                    </div>
                    {/* Rows */}
                    <div className="pb-scroll" style={{ maxHeight:320, overflowY:'auto' }}>
                      {activeStats.trades.map((t, i) => (
                        <div key={i} className="pb-row" style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 90px 90px 80px', gap:4, padding:'9px 14px', borderBottom:`1px solid ${C.border}`, alignItems:'center' }}>
                          <span style={{ fontFamily:C.mono, fontSize:11, color:C.soft }}>{dayjs(t.date).format('MMM D, YY')}</span>
                          <span style={{ fontFamily:C.mono, fontSize:11, color:C.text, fontWeight:700 }}>{t.symbol||'—'}</span>
                          <span style={{ fontFamily:C.mono, fontSize:11, color: t.side?.toLowerCase()==='long'?C.green:C.red }}>{t.side||'—'}</span>
                          <span style={{ fontFamily:C.mono, fontSize:11, color:C.soft }}>{t.entryPrice!=null?`$${t.entryPrice}`:'—'}</span>
                          <span style={{ fontFamily:C.mono, fontSize:11, color:C.soft }}>{t.exitPrice!=null?`$${t.exitPrice}`:'—'}</span>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            {t.pnl > 0 ? <ArrowUpRight size={11} color={C.green}/> : t.pnl < 0 ? <ArrowDownRight size={11} color={C.red}/> : null}
                            <span style={{ fontFamily:C.mono, fontSize:11, fontWeight:700, color:t.pnl>0?C.green:t.pnl<0?C.red:C.sub }}>{fmt(t.pnl)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display:'flex', gap:10, padding:'14px 16px', background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:16 }}>
                  <AlertCircle size={15} color={C.sub} style={{ flexShrink:0 }}/>
                  <div>
                    <div style={{ fontFamily:C.sans, fontSize:13, fontWeight:700, color:C.soft, marginBottom:3 }}>No trades linked yet</div>
                    <div style={{ fontFamily:C.sans, fontSize:11, color:C.sub, lineHeight:1.5 }}>
                      Log trades in the <span style={{ color:C.accent }}>Trades</span> page with strategy name <span style={{ color:C.accent, fontWeight:700 }}>"{activeSetup.name}"</span> to see live stats here.
                    </div>
                  </div>
                </div>
              )}

              {/* Rules */}
              {activeSetup.rules?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontFamily:C.sans, fontSize:10, fontWeight:700, color:C.sub, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8 }}>Entry Rules</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {activeSetup.rules.map((rule, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                        <div style={{ width:20,height:20,borderRadius:'50%',background:C.accentL,color:C.accent,fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:C.mono }}>{i+1}</div>
                        <span style={{ fontFamily:C.sans, fontSize:12, color:C.soft, lineHeight:1.6 }}>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {activeSetup.notes && (
                <div style={{ background:'rgba(245,200,66,.08)', border:'1px solid rgba(245,200,66,.2)', borderRadius:10, padding:'11px 14px' }}>
                  <div style={{ fontFamily:C.sans, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(245,200,66,.6)', marginBottom:4 }}>📌 Notes</div>
                  <div style={{ fontFamily:C.sans, fontSize:12, color:C.soft, lineHeight:1.7 }}>{activeSetup.notes}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === 'add' && (
        <Modal title="New Setup" onClose={() => setModal(null)} onSave={add}/>
      )}
      {modal && modal !== 'add' && (
        <Modal title="Edit Setup" init={modal} onClose={() => setModal(null)} onSave={d => update(modal._id, d)}/>
      )}
      {delId && (
        <div onClick={e => e.target===e.currentTarget && setDelId(null)} style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(5,7,16,.85)',backdropFilter:'blur(8px)',padding:16 }}>
          <div className="pb-in" style={{ background:'#0e1128',border:`1px solid ${C.muted}`,borderRadius:16,padding:24,width:'100%',maxWidth:340,boxShadow:'0 24px 80px rgba(0,0,0,.7)' }}>
            <div style={{ width:38,height:38,borderRadius:10,background:C.redL,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12 }}>
              <Trash2 size={16} color={C.red}/>
            </div>
            <p style={{ fontFamily:C.sans,fontSize:14,fontWeight:700,color:C.text,marginBottom:6 }}>Delete Setup?</p>
            <p style={{ fontFamily:C.sans,fontSize:12,color:C.sub,marginBottom:18,lineHeight:1.6 }}>
              <span style={{ color:C.text,fontWeight:600 }}>"{setups.find(s=>s._id===delId)?.name}"</span> will be permanently removed. Trade history is unaffected.
            </p>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={() => setDelId(null)} className="pb-btn" style={{ flex:1,background:C.card,border:`1px solid ${C.border}`,color:C.sub }}>Cancel</button>
              <button onClick={() => del(delId)} className="pb-btn" style={{ flex:1,background:'#7f1d1d',border:'1px solid rgba(255,68,102,.3)',color:C.red }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}