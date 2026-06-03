import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSetups } from '../../hooks/useSetups';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

const SYMBOL_DB = [
  { s:'BTC', label:'Bitcoin', type:'crypto' },
  { s:'ETH', label:'Ethereum', type:'crypto' },
  { s:'BNB', label:'BNB', type:'crypto' },
  { s:'SOL', label:'Solana', type:'crypto' },
  { s:'XRP', label:'XRP', type:'crypto' },
  { s:'ADA', label:'Cardano', type:'crypto' },
  { s:'DOGE', label:'Dogecoin', type:'crypto' },
  { s:'AVAX', label:'Avalanche', type:'crypto' },
  { s:'MATIC', label:'Polygon', type:'crypto' },
  { s:'DOT', label:'Polkadot', type:'crypto' },
  { s:'LINK', label:'Chainlink', type:'crypto' },
  { s:'LTC', label:'Litecoin', type:'crypto' },
  { s:'UNI', label:'Uniswap', type:'crypto' },
  { s:'ATOM', label:'Cosmos', type:'crypto' },
  { s:'NEAR', label:'NEAR Protocol', type:'crypto' },
  { s:'ARB', label:'Arbitrum', type:'crypto' },
  { s:'OP', label:'Optimism', type:'crypto' },
  { s:'SUI', label:'Sui', type:'crypto' },
  { s:'APT', label:'Aptos', type:'crypto' },
  { s:'INJ', label:'Injective', type:'crypto' },
  { s:'TON', label:'Toncoin', type:'crypto' },
  { s:'PEPE', label:'Pepe', type:'crypto' },
  { s:'WIF', label:'dogwifhat', type:'crypto' },
  { s:'EURUSD', label:'Euro / USD', type:'forex' },
  { s:'GBPUSD', label:'Pound / USD', type:'forex' },
  { s:'USDJPY', label:'USD / Yen', type:'forex' },
  { s:'AUDUSD', label:'AUD / USD', type:'forex' },
  { s:'USDCAD', label:'USD / CAD', type:'forex' },
  { s:'NZDUSD', label:'NZD / USD', type:'forex' },
  { s:'USDCHF', label:'USD / CHF', type:'forex' },
  { s:'GBPJPY', label:'Pound / Yen', type:'forex' },
  { s:'EURJPY', label:'Euro / Yen', type:'forex' },
  { s:'EURGBP', label:'Euro / Pound', type:'forex' },
  { s:'AUDJPY', label:'AUD / Yen', type:'forex' },
  { s:'CADJPY', label:'CAD / Yen', type:'forex' },
  { s:'XAUUSD', label:'Gold (Spot)', type:'commodities' },
  { s:'XAGUSD', label:'Silver (Spot)', type:'commodities' },
  { s:'USDINR', label:'USD / INR', type:'forex' },
  { s:'AAPL', label:'Apple', type:'stocks' },
  { s:'TSLA', label:'Tesla', type:'stocks' },
  { s:'MSFT', label:'Microsoft', type:'stocks' },
  { s:'AMZN', label:'Amazon', type:'stocks' },
  { s:'GOOGL', label:'Alphabet', type:'stocks' },
  { s:'META', label:'Meta', type:'stocks' },
  { s:'NVDA', label:'NVIDIA', type:'stocks' },
  { s:'AMD', label:'AMD', type:'stocks' },
  { s:'NFLX', label:'Netflix', type:'stocks' },
  { s:'DIS', label:'Disney', type:'stocks' },
  { s:'BABA', label:'Alibaba', type:'stocks' },
  { s:'COIN', label:'Coinbase', type:'stocks' },
  { s:'MSTR', label:'MicroStrategy', type:'stocks' },
  { s:'ES', label:'S&P 500 Futures', type:'futures' },
  { s:'NQ', label:'Nasdaq Futures', type:'futures' },
  { s:'MES', label:'Micro S&P 500', type:'futures' },
  { s:'MNQ', label:'Micro Nasdaq', type:'futures' },
  { s:'YM', label:'Dow Futures', type:'futures' },
  { s:'RTY', label:'Russell Futures', type:'futures' },
  { s:'CL', label:'Crude Oil', type:'futures' },
  { s:'GC', label:'Gold Futures', type:'futures' },
  { s:'SI', label:'Silver Futures', type:'futures' },
  { s:'SPX', label:'S&P 500', type:'indices' },
  { s:'NDX', label:'Nasdaq 100', type:'indices' },
  { s:'DJI', label:'Dow Jones', type:'indices' },
  { s:'VIX', label:'Volatility Idx', type:'indices' },
  { s:'NIFTY', label:'Nifty 50', type:'indices' },
  { s:'BANKNIFTY', label:'Bank Nifty', type:'indices' },
  { s:'SENSEX', label:'BSE Sensex', type:'indices' },
];

const TYPE_META = {
  forex:       { icon: '💱', color: '#60a5fa' },
  crypto:      { icon: '₿',  color: '#f59e0b' },
  stocks:      { icon: '📈', color: '#34d399' },
  futures:     { icon: '📊', color: '#a78bfa' },
  indices:     { icon: '🏦', color: '#fb923c' },
  commodities: { icon: '🥇', color: '#fbbf24' },
};

const DEFAULT_STRATEGIES = [
  'Breakout','Reversal','Trend Following','Scalp','Swing Trade',
  'News / FOMC','Supply & Demand','Order Block','VWAP Bounce',
  'Gap Fill','Liquidity Grab','ICT / SMC','Mean Reversion',
];

const STRAT_KEY = 'tradebook_strategies_v1';
const loadStrategies = () => {
  try { const r = localStorage.getItem(STRAT_KEY); return r ? JSON.parse(r) : DEFAULT_STRATEGIES; }
  catch { return DEFAULT_STRATEGIES; }
};
const saveStrategies = (arr) => {
  try { localStorage.setItem(STRAT_KEY, JSON.stringify(arr)); } catch {}
};

const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload  = () => res(r.result);
  r.onerror = () => rej(new Error('Read failed'));
  r.readAsDataURL(file);
});

const calcRR = (entry, sl, tp, side) => {
  const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(tp);
  if (!e || !s || !t) return null;
  if (side === 'Long') {
    const risk = e - s, reward = t - e;
    if (risk <= 0) return null;
    return (reward / risk).toFixed(2);
  } else {
    const risk = s - e, reward = e - t;
    if (risk <= 0) return null;
    return (reward / risk).toFixed(2);
  }
};

const TIMEFRAMES = ['1m','5m','15m','30m','1h','4h','1D','1W','1M'];

const initialForm = {
  symbol:'', tradeType:'', side:'Long',
  tp:'', entryPrice:'', sl:'',
  timeframe:'', strategy:'', outcome:'',
  riskAmount:'', manualPnl:'',
  tags:'', notes:'', screenshot:null,
  date: new Date().toISOString().split('T')[0],
};

const inputCls =
  'w-full bg-[#0b0b0d] border border-[#27272a] rounded-xl px-3 py-2.5 text-white text-sm ' +
  'focus:outline-none focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/20 ' +
  'placeholder-gray-600 transition-all no-spinner';

const Field = ({ label, children, className='' }) => (
  <div className={className}>
    {label && (
      <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 block font-medium">
        {label}
      </label>
    )}
    {children}
  </div>
);

const StrategyManager = ({ strategies, onUpdate, onClose }) => {
  const [list, setList]       = useState([...strategies]);
  const [newVal, setNewVal]   = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');

  const add      = () => { const v = newVal.trim(); if (!v || list.includes(v)) return; setList(l => [...l, v]); setNewVal(''); };
  const remove   = (i) => setList(l => l.filter((_, idx) => idx !== i));
  const startEdit = (i) => { setEditIdx(i); setEditVal(list[i]); };
  const saveEdit  = () => { const v = editVal.trim(); if (!v) return; setList(l => l.map((x, i) => i === editIdx ? v : x)); setEditIdx(null); };

  return (
    <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Manage Strategies</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#1e1e22] transition-colors text-lg">×</button>
      </div>
      <div className="flex gap-2">
        <input value={newVal} onChange={e => setNewVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Add strategy…" className={inputCls + ' flex-1'} />
        <button onClick={add} className="px-3 py-2 bg-violet-600/25 hover:bg-violet-600/45 text-violet-300 rounded-xl text-sm border border-violet-500/30 transition-all">+ Add</button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {list.map((s, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#18181b] rounded-xl px-3 py-2 group">
            {editIdx === i ? (
              <>
                <input value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key==='Enter') saveEdit(); if (e.key==='Escape') setEditIdx(null); }} autoFocus className="flex-1 bg-transparent text-white text-sm outline-none border-b border-violet-500/50" />
                <button onClick={saveEdit} className="text-emerald-400 text-xs hover:text-emerald-300 font-medium">Save</button>
                <button onClick={() => setEditIdx(null)} className="text-gray-500 text-xs hover:text-gray-300">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-200">{s}</span>
                <button onClick={() => startEdit(i)} className="text-gray-600 hover:text-violet-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                <button onClick={() => remove(i)}    className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-1">✕</button>
              </>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => onUpdate(list)} className="w-full py-2 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 rounded-xl text-sm border border-violet-500/30 transition-all font-semibold">Save Strategies</button>
    </div>
  );
};

/* ── Price Ladder ── */
const PriceLadder = ({ tp, entryPrice, sl, side, onChange }) => {
  const e = parseFloat(entryPrice) || 0;
  const s = parseFloat(sl) || 0;
  const t = parseFloat(tp) || 0;

  const risk      = e && s ? Math.abs(e - s) : 0;
  const reward    = e && t ? Math.abs(t - e) : 0;
  const total     = risk + reward;
  const rewardPct = total ? Math.max((reward / total) * 100, 15) : 50;
  const riskPct   = total ? Math.max((risk   / total) * 100, 15) : 50;

  const numInput = (colorCls, placeholderCls) =>
    `w-full bg-transparent ${colorCls} text-2xl font-black focus:outline-none ${placeholderCls} no-spinner`;

  return (
    <div className="flex gap-3 items-stretch">
      <div className="flex flex-col w-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ minHeight: 168 }}>
        <div style={{ height: `${rewardPct}%`, backgroundColor: '#22c55e', opacity: 0.7, borderRadius: '4px 4px 0 0' }} />
        <div style={{ height: `${riskPct}%`,   backgroundColor: '#ef4444', opacity: 0.7, borderRadius: '0 0 4px 4px' }} />
      </div>
      <div className="flex-1 flex flex-col gap-px">
        {/* TP */}
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-t-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-widest text-emerald-500/60 font-medium">Take Profit</span>
            {e && t ? <span className="text-emerald-500/50 text-[10px] font-semibold">+{Math.abs(t - e).toFixed(2)} pts</span> : null}
          </div>
          <input type="number" value={tp} onChange={ev => onChange('tp', ev.target.value)} onWheel={ev => ev.target.blur()} placeholder="0.00" className={numInput('text-emerald-400','placeholder-emerald-900/40')} />
        </div>
        {/* Entry */}
        <div className="bg-[#111116] border border-[#2a2a2e] px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Entry Price *</span>
            <span className="text-[10px] text-gray-600">required</span>
          </div>
          <input type="number" value={entryPrice} onChange={ev => onChange('entryPrice', ev.target.value)} onWheel={ev => ev.target.blur()} placeholder="0.00" className={numInput('text-white','placeholder-gray-700')} />
        </div>
        {/* SL */}
        <div className="bg-red-500/8 border border-red-500/20 rounded-b-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-widest text-red-500/60 font-medium">Stop Loss</span>
            {e && s ? <span className="text-red-500/50 text-[10px] font-semibold">-{Math.abs(e - s).toFixed(2)} pts</span> : null}
          </div>
          <input type="number" value={sl} onChange={ev => onChange('sl', ev.target.value)} onWheel={ev => ev.target.blur()} placeholder="0.00" className={numInput('text-red-400','placeholder-red-900/40')} />
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AddTradeModal = ({ isOpen, onClose, onAdd }) => {
  const [form,        setForm]        = useState(initialForm);
  const [loading,     setLoading]     = useState(false);
  const [imgDrag,     setImgDrag]     = useState(false);
  const [symQuery,    setSymQuery]    = useState('');
  const [symOpen,     setSymOpen]     = useState(false);
  const [strategies,  setStrategies]  = useState(loadStrategies);
  const [showStrat,   setShowStrat]   = useState(false);
  const [stratPicker, setStratPicker] = useState(false);
  const symRef  = useRef(null);
  const fileRef = useRef(null);

  // ── Pull Playbook setups (your existing hook, unchanged) ──────────────────
  const { groupedSetups } = useSetups();

  // Names that exist in Playbook → used to deduplicate local strategies list
  const playbookNameSet = useMemo(() => {
    const allSetups = Object.values(groupedSetups).flat();
    return new Set(allSetups.map(s => s.name.toLowerCase()));
  }, [groupedSetups]);

  // Local strategies that are NOT already covered by a Playbook setup
  const localOnly = useMemo(
    () => strategies.filter(s => !playbookNameSet.has(s.toLowerCase())),
    [strategies, playbookNameSet]
  );

  const hasPlaybookSetups = Object.keys(groupedSetups).length > 0;
  const hasLocalOnly      = localOnly.length > 0;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const rr    = useMemo(() => calcRR(form.entryPrice, form.sl, form.tp, form.side), [form.entryPrice, form.sl, form.tp, form.side]);
  const rrNum = rr !== null ? parseFloat(rr) : null;

  const symResults = useMemo(() => {
    const q = symQuery.toUpperCase().trim();
    if (!q) return [];
    return SYMBOL_DB.filter(r => r.s.startsWith(q) || r.s.includes(q) || r.label.toUpperCase().includes(q)).slice(0, 8);
  }, [symQuery]);

  useEffect(() => {
    const h = (e) => { if (symRef.current && !symRef.current.contains(e.target)) setSymOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectSymbol = (row) => {
    setForm(prev => ({ ...prev, symbol: row.s, tradeType: row.type }));
    setSymQuery(row.s);
    setSymOpen(false);
  };

  const handleSymbolInput = (e) => {
    const val = e.target.value.toUpperCase();
    setSymQuery(val);
    set('symbol', val);
    setSymOpen(true);
  };

  const handleScreenshot = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const previewUrl = URL.createObjectURL(file);
    const base64     = await toBase64(file);
    set('screenshot', { file, previewUrl, base64 });
  }, []);

  const handleFileChange  = (e) => { if (e.target.files?.[0]) handleScreenshot(e.target.files[0]); };
  const handleDrop        = (e) => { e.preventDefault(); setImgDrag(false); if (e.dataTransfer.files?.[0]) handleScreenshot(e.dataTransfer.files[0]); };
  const pasteHandler      = useCallback((e) => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) handleScreenshot(item.getAsFile());
  }, [handleScreenshot]);

  const handleStrategyUpdate = (newList) => { setStrategies(newList); saveStrategies(newList); setShowStrat(false); };

  /* ── PnL calculation ── */
  const calcPnl = () => {
    if (form.manualPnl !== '') {
      const val = parseFloat(form.manualPnl) || 0;
      if (form.outcome === 'Loss')      return -Math.abs(val);
      if (form.outcome === 'Win')       return  Math.abs(val);
      if (form.outcome === 'Breakeven') return val;
      return val;
    }
    const risk = parseFloat(form.riskAmount);
    if (!risk) return null;
    if (form.outcome === 'Win'  && rrNum) return +(risk * rrNum).toFixed(2);
    if (form.outcome === 'Loss')          return -risk;
    if (form.outcome === 'Breakeven')     return 0;
    return null;
  };

  const estimatedPnl = useMemo(() => {
    const risk = parseFloat(form.riskAmount);
    if (!risk || !rrNum) return null;
    return { win: +(risk * rrNum).toFixed(2), loss: -risk };
  }, [form.riskAmount, rrNum]);

  const autoPnlHint = useMemo(() => {
    if (!form.outcome || !form.riskAmount) return null;
    const risk = parseFloat(form.riskAmount);
    if (!risk) return null;
    if (form.outcome === 'Win'  && rrNum) return `+$${(risk * rrNum).toFixed(2)}`;
    if (form.outcome === 'Loss')          return `-$${risk}`;
    if (form.outcome === 'Breakeven')     return '$0.00';
    return null;
  }, [form.outcome, form.riskAmount, rrNum]);

  const handleSubmit = async () => {
    if (!form.symbol || !form.tradeType || !form.entryPrice) {
      alert('Please fill: Symbol, Trade Type, and Entry Price.');
      return;
    }
    setLoading(true);
    try {
      const now = form.date ? new Date(form.date).toISOString() : new Date().toISOString();
      const pnl = calcPnl();
      await onAdd({
        symbol:     form.symbol,
        tradeType:  form.tradeType,
        side:       form.side,
        entryPrice: parseFloat(form.entryPrice) || null,
        sl:         parseFloat(form.sl)         || null,
        tp:         parseFloat(form.tp)         || null,
        rr:         rrNum,
        timeframe:  form.timeframe  || null,
        strategy:   form.strategy   || null,
        outcome:    form.outcome    || null,
        riskAmount: parseFloat(form.riskAmount) || null,
        pnl,
        tags:       form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        notes:      form.notes || null,
        screenshot: form.screenshot?.base64 || null,
        date:       now,
      });
      setForm(initialForm);
      setSymQuery('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const typeMeta = form.tradeType ? TYPE_META[form.tradeType] : null;
  const rrColor  = rrNum === null ? '#6b7280' : rrNum <= 0 ? '#f87171' : rrNum < 1 ? '#fb923c' : rrNum < 2 ? '#fbbf24' : '#34d399';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Trade">
      <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-0.5 custom-scroll" onPaste={pasteHandler}>

        {/* Date */}
        <Field label="Trade Date">
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
        </Field>

        {/* Symbol */}
        <Field label="Symbol *">
          <div className="relative" ref={symRef}>
            <div className="relative">
              {typeMeta && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">{typeMeta.icon}</span>}
              <input
                value={symQuery}
                onChange={handleSymbolInput}
                onFocus={() => symQuery.length > 0 && setSymOpen(true)}
                placeholder="Type symbol or name…"
                autoComplete="off"
                className={inputCls + (typeMeta ? ' pl-9' : '') + ' uppercase'}
              />
              {typeMeta && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: typeMeta.color, background: typeMeta.color + '1a', border: `1px solid ${typeMeta.color}33` }}>
                  {form.tradeType.toUpperCase()}
                </span>
              )}
            </div>
            {symOpen && symResults.length > 0 && (
              <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-[#111114] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden">
                {symResults.map(r => {
                  const m = TYPE_META[r.type];
                  return (
                    <button key={r.s} type="button" onMouseDown={() => selectSymbol(r)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1e1e22] transition-colors text-left">
                      <span className="text-lg">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-bold">{r.s}</span>
                        <span className="text-gray-500 text-xs ml-2 truncate">{r.label}</span>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                        style={{ color: m.color, background: m.color + '1a' }}>{r.type}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Field>

        {/* Direction */}
        <Field label="Direction *">
          <div className="flex gap-2">
            {['Long','Short'].map(s => (
              <button key={s} type="button" onClick={() => set('side', s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border
                  ${form.side === s
                    ? s === 'Long'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_18px_rgba(52,211,153,.12)]'
                      : 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_18px_rgba(248,113,113,.12)]'
                    : 'bg-transparent text-gray-500 border-[#27272a] hover:border-gray-500 hover:text-gray-300'}`}>
                {s === 'Long' ? '▲ Long' : '▼ Short'}
              </button>
            ))}
          </div>
        </Field>

        {/* Price Ladder */}
        <Field label="Price Levels">
          <PriceLadder tp={form.tp} entryPrice={form.entryPrice} sl={form.sl} side={form.side} onChange={(key, val) => set(key, val)} />
        </Field>

        {/* RR Card */}
        {(form.entryPrice || form.sl || form.tp) && (
          <div className="rounded-xl px-4 py-3 border flex items-center justify-between transition-all"
            style={{ background: rrColor + '0d', borderColor: rrColor + '30' }}>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Risk : Reward</div>
              {rrNum === null || rrNum <= 0 ? (
                <div className="text-red-400 text-xs flex items-center gap-1.5">⚠ Invalid — check SL/TP for {form.side}</div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-gray-400 text-sm">1 :</span>
                  <span className="text-2xl font-black tabular-nums" style={{ color: rrColor }}>{rr}</span>
                  <span className="text-xs ml-1" style={{ color: rrColor }}>{rrNum >= 2 ? '✓ Great' : rrNum >= 1 ? 'Okay' : 'Poor'}</span>
                </div>
              )}
            </div>
            {rrNum !== null && rrNum > 0 && (
              <div className="flex gap-1 items-end h-8">
                <div className="w-3 rounded-sm bg-red-500/40" style={{ height: '40%' }} />
                <div className="w-3 rounded-sm" style={{ height: `${Math.min(rrNum * 40, 100)}%`, background: rrColor + 'aa' }} />
              </div>
            )}
          </div>
        )}

        {/* Timeframe */}
        <Field label="Timeframe">
          <div className="flex flex-wrap gap-1.5">
            {TIMEFRAMES.map(tf => (
              <button key={tf} type="button" onClick={() => set('timeframe', form.timeframe === tf ? '' : tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${form.timeframe === tf
                    ? 'bg-violet-600/30 text-violet-300 border-violet-500/50'
                    : 'bg-transparent text-gray-500 border-[#27272a] hover:border-gray-500 hover:text-gray-200'}`}>
                {tf}
              </button>
            ))}
          </div>
        </Field>

        {/* Outcome */}
        <Field label="Outcome">
          <div className="flex gap-2">
            {[
              { label:'Win',       style:'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
              { label:'Loss',      style:'bg-red-500/20 text-red-400 border-red-500/50' },
              { label:'Breakeven', style:'bg-gray-500/20 text-gray-400 border-gray-500/40' },
            ].map(o => (
              <button key={o.label} type="button"
                onClick={() => set('outcome', form.outcome === o.label ? '' : o.label)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all
                  ${form.outcome === o.label ? o.style : 'bg-transparent text-gray-500 border-[#27272a] hover:border-gray-500'}`}>
                {o.label === 'Win' ? '✓ ' : o.label === 'Loss' ? '✗ ' : '→ '}{o.label}
              </button>
            ))}
          </div>
        </Field>

        {/* ── Strategy Picker ── */}
        <Field label="Strategy">
          <div className="space-y-2">
            <div className="flex gap-2">
              <button type="button"
                onClick={() => { setStratPicker(p => !p); setShowStrat(false); }}
                className={`flex-1 ${inputCls} text-left flex items-center justify-between`}>
                <span className={form.strategy ? 'text-white' : 'text-gray-600'}>
                  {form.strategy || 'Select strategy…'}
                </span>
                <span className="text-gray-500 text-xs ml-2">{stratPicker ? '▲' : '▼'}</span>
              </button>
              <button type="button"
                onClick={() => { setShowStrat(p => !p); setStratPicker(false); }}
                title="Manage local strategies"
                className="px-3 py-2 bg-[#0b0b0d] border border-[#27272a] rounded-xl text-gray-500 hover:text-violet-400 hover:border-violet-500/40 text-sm transition-all">
                ✎
              </button>
            </div>

            {stratPicker && (
              <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-3 space-y-3">

                {/* ── Playbook setups grouped by category ── */}
                {hasPlaybookSetups && (
                  <>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] uppercase tracking-widest text-violet-400/80 font-semibold">📖 Playbook</span>
                      <div className="flex-1 h-px bg-violet-500/15" />
                    </div>

                    {Object.entries(groupedSetups).map(([cat, items]) => (
                      <div key={cat}>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 px-1">
                          {cat}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {items.map(s => (
                            <button key={s._id} type="button"
                              onClick={() => { set('strategy', s.name); setStratPicker(false); }}
                              title={s.description || s.name}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                ${form.strategy === s.name
                                  ? 'bg-violet-600/30 text-violet-300 border-violet-500/50'
                                  : 'bg-[#18181b] text-gray-400 border-[#27272a] hover:border-violet-500/40 hover:text-gray-200'}`}>
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── Local-only strategies not in Playbook ── */}
                {hasLocalOnly && (
                  <div>
                    {hasPlaybookSetups && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500/60 font-semibold">Other</span>
                        <div className="flex-1 h-px bg-[#27272a]" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {localOnly.map(s => (
                        <button key={s} type="button"
                          onClick={() => { set('strategy', s); setStratPicker(false); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${form.strategy === s
                              ? 'bg-violet-600/30 text-violet-300 border-violet-500/50'
                              : 'bg-[#18181b] text-gray-400 border-[#27272a] hover:border-gray-500 hover:text-gray-200'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Empty state ── */}
                {!hasPlaybookSetups && !hasLocalOnly && (
                  <div className="text-center py-4 space-y-1">
                    <p className="text-gray-500 text-xs">No strategies yet.</p>
                    <p className="text-gray-600 text-[10px]">
                      Add setups in the <span className="text-violet-400">Playbook</span> page — they appear here automatically.
                    </p>
                  </div>
                )}
              </div>
            )}

            {showStrat && (
              <StrategyManager strategies={strategies} onUpdate={handleStrategyUpdate} onClose={() => setShowStrat(false)} />
            )}
          </div>
        </Field>

        {/* Risk & PnL */}
        <div className="bg-[#0b0b0d] border border-[#27272a] rounded-2xl p-4 space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Risk & P&L</span>

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Risk Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">$</span>
              <input type="number" value={form.riskAmount} onChange={e => set('riskAmount', e.target.value)} onWheel={e => e.target.blur()} placeholder="How much are you risking?" className={inputCls + ' pl-7'} />
            </div>
          </div>

          {estimatedPnl && form.outcome && (
            <div>
              {form.outcome === 'Win' && (
                <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-emerald-500/60 text-[10px] uppercase tracking-widest mb-0.5">Estimated Profit</p>
                    <p className="text-emerald-400 font-black text-xl">+${estimatedPnl.win.toFixed(2)}</p>
                  </div>
                  <span className="text-emerald-500/30 text-3xl font-black">1:{rr}</span>
                </div>
              )}
              {form.outcome === 'Loss' && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-red-500/60 text-[10px] uppercase tracking-widest mb-0.5">Estimated Loss</p>
                    <p className="text-red-400 font-black text-xl">-${Math.abs(estimatedPnl.loss).toFixed(2)}</p>
                  </div>
                  <span className="text-red-500/30 text-3xl">✗</span>
                </div>
              )}
              {form.outcome === 'Breakeven' && (
                <div className="bg-gray-500/8 border border-gray-500/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500/60 text-[10px] uppercase tracking-widest mb-0.5">Breakeven</p>
                    <p className="text-gray-400 font-black text-xl">$0.00</p>
                  </div>
                  <span className="text-gray-500/30 text-3xl">→</span>
                </div>
              )}
            </div>
          )}

          {estimatedPnl && !form.outcome && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                <p className="text-emerald-500/50 text-[10px] uppercase tracking-wider mb-1">If Win</p>
                <p className="text-emerald-400 font-black text-base">+${estimatedPnl.win.toFixed(2)}</p>
              </div>
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-2.5 text-center">
                <p className="text-red-500/50 text-[10px] uppercase tracking-wider mb-1">If Loss</p>
                <p className="text-red-400 font-black text-base">-${Math.abs(estimatedPnl.loss).toFixed(2)}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">
              Actual P&L from Broker
              {autoPnlHint && !form.manualPnl && (
                <span className="ml-2 text-violet-400 normal-case">(auto: {autoPnlHint})</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">$</span>
              <input type="number" value={form.manualPnl} onChange={e => set('manualPnl', e.target.value)} onWheel={e => e.target.blur()} placeholder="Enter amount — sign applied automatically" className={inputCls + ' pl-7 text-lg font-bold'} />
            </div>
            <p className="text-gray-600 text-[10px] mt-1">Leave blank to auto-calculate · sign (±) is applied from selected outcome</p>
          </div>
        </div>

        {/* Screenshot */}
        <Field label="Trade Screenshot">
          {form.screenshot ? (
            <div className="relative rounded-xl overflow-hidden border border-[#27272a] group">
              <img src={form.screenshot.previewUrl} alt="Trade screenshot" className="w-full max-h-52 object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm">Replace</button>
                <button type="button" onClick={() => set('screenshot', null)} className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-lg backdrop-blur-sm">Remove</button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-gray-300 text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                {(form.screenshot.file.size / 1024).toFixed(0)} KB
              </div>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setImgDrag(true); }}
              onDragLeave={() => setImgDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                ${imgDrag ? 'border-violet-500/70 bg-violet-500/5' : 'border-[#27272a] hover:border-violet-500/40 hover:bg-violet-500/5'}`}>
              <div className="text-3xl mb-2">📸</div>
              <p className="text-gray-300 text-sm font-medium">Drop image here</p>
              <p className="text-gray-500 text-xs mt-1">or click to browse · or paste <span className="text-violet-400">Ctrl+V</span></p>
              <p className="text-gray-700 text-[10px] mt-2">Stored securely in MongoDB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </Field>

        {/* Tags */}
        <Field label="Tags">
          <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="FOMC, confluence, revenge-trade…" className={inputCls} />
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Setup rationale, emotions, lessons learned…" className={inputCls + ' resize-none'} />
        </Field>

        {/* Actions */}
        <div className="flex gap-3 pt-1 pb-1">
          <Button variant="secondary" className="flex-1" onClick={() => { setForm(initialForm); setSymQuery(''); onClose(); }}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </span>
              : 'Save Trade'
            }
          </Button>
        </div>
      </div>

      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #2a2a2e; border-radius: 99px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </Modal>
  );
};

export default AddTradeModal;