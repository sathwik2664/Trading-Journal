import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSetups } from '../../hooks/useSetups';
import { compressImage } from '../../utils/compressImage';
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

/* ── Trading sessions (hours shown in UTC, tooltip only) ── */
const SESSIONS = [
  { name: 'New York', icon: '🗽', color: '#4f8ef7', hours: '12:00 – 21:00 UTC' },
  { name: 'London',   icon: '🎡', color: '#f5c842', hours: '07:00 – 16:00 UTC' },
  { name: 'Tokyo',    icon: '🗼', color: '#b57bee', hours: '00:00 – 09:00 UTC' },
  { name: 'Sydney',   icon: '🌉', color: '#00d4ff', hours: '21:00 – 06:00 UTC' },
  { name: 'Indian',   icon: '🪔', color: '#ffa53d', hours: '03:45 – 10:00 UTC (NSE/BSE)' },
];

/* Built-in fallback strategies (constant, identical on every device).
   Anything you add yourself lives in the Playbook (server) and syncs everywhere. */
const DEFAULT_STRATEGIES = [
  'Breakout','Reversal','Trend Following','Scalp','Swing Trade',
  'News / FOMC','Supply & Demand','Order Block','VWAP Bounce',
  'Gap Fill','Liquidity Grab','ICT / SMC','Mean Reversion',
];

/* ── Discipline: mistake tags (shown when "Did you follow all your rules?" = No) ── */
const MISTAKE_OPTIONS = [
  { key: 'FOMO',                icon: '😰' },
  { key: 'Revenge Trade',       icon: '😡' },
  { key: 'Loss Recovery',       icon: '🩹' },
  { key: 'Overtrading',         icon: '🔁' },
  { key: 'Oversized Position',  icon: '⚖️' },
  { key: 'Moved / Removed SL',  icon: '🛑' },
  { key: 'No Stop Loss',        icon: '🚫' },
  { key: 'Chased Entry',        icon: '🏃' },
  { key: 'Averaged Down',       icon: '📉' },
  { key: 'Early Exit',          icon: '⏱️' },
  { key: 'Held Too Long',       icon: '⏳' },
  { key: 'Ignored Setup',       icon: '🙈' },
];

/* ── Options (Indian index options) ──
   Only these symbols switch the form into Call / Put mode.
   Lot sizes are defaults and stay editable in the form (NSE/BSE revise them from time to time). */
const OPTION_SYMBOLS = {
  NIFTY:     { exchange: 'NSE', lotSize: 65 },
  BANKNIFTY: { exchange: 'NSE', lotSize: 30 },
  SENSEX:    { exchange: 'BSE', lotSize: 20 },
};

/* Charge rates — change them here if your broker / exchange revises anything */
const CHARGE_CONFIG = {
  brokeragePerOrder: 10,                    // ₹ per executed order (buy = 1 order, sell = 1 order)
  sttSellPct:        0.15,                  // % on SELL premium
  stampBuyPct:       0.003,                 // % on BUY premium
  sebiPerCrore:      10,                    // ₹ per crore of turnover
  gstPct:            18,                    // % on brokerage + exchange + SEBI
  exchangePct:       { NSE: 0.03553, BSE: 0.0325 }, // % of premium turnover (buy + sell). Verify BSE on your contract note.
};

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/* Indian grouping for ₹, US grouping for $ */
const fmtNum = (n, inr = true) =>
  Number(n).toLocaleString(inr ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (n) => fmtNum(n, true);

/* Option bought at `entry`, sold at `exit`, for `qty` units. Same maths for Call and Put. */
const calcOptionCharges = (entry, exit, qty, exchange) => {
  if (!(entry > 0) || !(exit > 0) || !(qty > 0)) return null;
  const C = CHARGE_CONFIG;
  const buyTurnover  = entry * qty;
  const sellTurnover = exit  * qty;
  const turnover     = buyTurnover + sellTurnover;

  const brokerage = r2(C.brokeragePerOrder * 2);
  const stt       = r2(sellTurnover * C.sttSellPct / 100);
  const exch      = r2(turnover * (C.exchangePct[exchange] ?? C.exchangePct.NSE) / 100);
  const sebi      = r2(turnover * C.sebiPerCrore / 10000000);
  const stamp     = r2(buyTurnover * C.stampBuyPct / 100);
  const gst       = r2((brokerage + exch + sebi) * C.gstPct / 100);
  const total     = r2(brokerage + stt + exch + sebi + stamp + gst);

  return { buyTurnover, sellTurnover, brokerage, stt, exch, sebi, stamp, gst, total };
};

/* For options, SL / TP / entry are premium prices, and you always BUY first (Call or Put),
   so risk:reward is always calculated as a "Long" on the premium. */
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

/* ── Exit price comes from the levels you already entered — never typed twice ──
   Win → Take Profit · Loss → Stop Loss · Breakeven → Entry */
const exitFromOutcome = (outcome, entry, sl, tp) => {
  if (outcome === 'Win')       return tp    > 0 ? tp    : null;
  if (outcome === 'Loss')      return sl    > 0 ? sl    : null;
  if (outcome === 'Breakeven') return entry > 0 ? entry : null;
  return null;
};

/* ── Single source of truth for every number on the form ──
   Takes form-shaped values (strings) and returns risk, reward, exit, charges and P&L.
   Used by the live UI, by the submit payload, and by edit-mode loading. */
const computeTrade = (f) => {
  const opt = OPTION_SYMBOLS[f.symbol] || null;
  const e = parseFloat(f.entryPrice);
  const s = parseFloat(f.sl);
  const t = parseFloat(f.tp);

  const rr    = calcRR(e, s, t, opt ? 'Long' : f.side);
  const rrNum = rr !== null ? parseFloat(rr) : null;

  const out = {
    isOption: !!opt, rr, rrNum,
    exit: null, exitSource: null,
    qty: null, risk: null, reward: null,
    gross: null, charges: null, pnl: null,
  };

  if (opt) {
    const qty = parseFloat(f.lots) * parseFloat(f.lotSize);
    const hasQty = qty > 0;
    if (hasQty) {
      out.qty = qty;
      if (e > 0 && s > 0 && e > s) out.risk   = r2((e - s) * qty);
      if (e > 0 && t > 0 && t > e) out.reward = r2((t - e) * qty);
    }

    // `f.exitPrice` is only ever filled when editing an older trade whose saved exit
    // differs from TP / SL / Entry. It is cleared as soon as outcome or levels change.
    const saved = parseFloat(f.exitPrice);
    if (saved > 0) {
      out.exit = saved; out.exitSource = 'Saved exit';
    } else if (f.outcome === 'Win'       && t > 0) { out.exit = t; out.exitSource = 'Take Profit'; }
    else if (f.outcome === 'Loss'        && s > 0) { out.exit = s; out.exitSource = 'Stop Loss'; }
    else if (f.outcome === 'Breakeven'   && e > 0) { out.exit = e; out.exitSource = 'Entry'; }

    if (out.exit && hasQty && e > 0) {
      const ch = calcOptionCharges(e, out.exit, qty, opt.exchange);
      if (ch) {
        out.charges = ch;
        out.gross   = r2((out.exit - e) * qty);
        out.pnl     = r2(out.gross - ch.total);
      }
    }
  } else {
    const risk = parseFloat(f.riskAmount);
    if (risk > 0) {
      out.risk = risk;
      if (rrNum > 0) out.reward = r2(risk * rrNum);
      if      (f.outcome === 'Win' && rrNum > 0) out.pnl = r2(risk * rrNum);
      else if (f.outcome === 'Loss')             out.pnl = -risk;
      else if (f.outcome === 'Breakeven')        out.pnl = 0;
    }
  }
  return out;
};

/* What is still missing for the chosen outcome (shown when P&L can't be calculated yet) */
const getMissing = (f, calc) => {
  const e = parseFloat(f.entryPrice), s = parseFloat(f.sl), t = parseFloat(f.tp);
  const m = [];
  if (calc.isOption) {
    if (!(e > 0)) m.push('Entry');
    if (f.outcome === 'Win'  && !(t > 0)) m.push('Take Profit');
    if (f.outcome === 'Loss' && !(s > 0)) m.push('Stop Loss');
    if (!(calc.qty > 0)) m.push('Lots & Lot Size');
  } else {
    if (!(parseFloat(f.riskAmount) > 0)) m.push('Risk Amount');
    if (f.outcome === 'Win' && !(calc.rrNum > 0)) m.push('valid Entry / SL / TP');
  }
  return m;
};

/* Manual total: the sign follows the outcome (Win → +, Loss → −), unless you type a minus yourself */
const applyManualSign = (raw, outcome) => {
  const v = parseFloat(raw);
  if (isNaN(v)) return null;
  if (v < 0) return v;
  if (outcome === 'Loss') return v === 0 ? 0 : -v;
  return v;
};

const TONES = {
  pos:  { box: 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-emerald-500/[0.02]', text: 'text-emerald-400', sub: 'text-emerald-500/60' },
  neg:  { box: 'border-red-500/30 bg-gradient-to-br from-red-500/15 to-red-500/[0.02]',             text: 'text-red-400',     sub: 'text-red-500/60' },
  flat: { box: 'border-gray-500/30 bg-gradient-to-br from-gray-500/15 to-gray-500/[0.02]',           text: 'text-gray-300',    sub: 'text-gray-500' },
};
const toneOf = (n) => (n > 0 ? TONES.pos : n < 0 ? TONES.neg : TONES.flat);

const TIMEFRAMES = ['1m','5m','15m','30m','1h','4h','1D','1W','1M'];

const todayStr = () => new Date().toISOString().split('T')[0];

const initialForm = {
  symbol:'', tradeType:'', side:'Long',
  tp:'', entryPrice:'', sl:'',
  exitPrice:'',              // hidden: only used to keep an older trade's saved exit while editing
  lots:'1', lotSize:'',
  timeframe:'', session:'', strategy:'', outcome:'',
  followedRules:'', mistakes:[],
  riskAmount:'', manualPnl:'',
  tags:'', notes:'', screenshot:null,
  date: todayStr(),
};
const freshForm = () => ({ ...initialForm, mistakes: [], date: todayStr() });

/* ── Edit mode helpers ── */
const numStr = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? '' : String(v));

// If the saved P&L is exactly what auto-calc would give, leave the override field blank
// so the total keeps following outcome / levels / size when the user edits them.
const deriveManualPnl = (trade, f) => {
  if (trade.pnl === null || trade.pnl === undefined || isNaN(Number(trade.pnl))) return '';
  const pnl  = Number(trade.pnl);
  const auto = computeTrade(f).pnl;
  if (auto !== null && Math.abs(auto - pnl) < 0.005) return '';
  const keepAbs = (f.outcome === 'Win' && pnl > 0) || (f.outcome === 'Loss' && pnl < 0);
  return String(keepAbs ? Math.abs(pnl) : pnl);
};

const tradeToForm = (trade) => {
  const d = trade.date ? new Date(trade.date) : null;
  const opt = OPTION_SYMBOLS[trade.symbol];
  const base = {
    symbol:     trade.symbol || '',
    tradeType:  trade.tradeType || SYMBOL_DB.find(r => r.s === trade.symbol)?.type || '',
    side:       trade.optionType || trade.side || 'Long',
    tp:         numStr(trade.tp),
    entryPrice: numStr(trade.entryPrice),
    sl:         numStr(trade.sl),
    exitPrice:  '',
    lots:       numStr(trade.lots),
    lotSize:    numStr(trade.lotSize) || (opt ? String(opt.lotSize) : ''),
    timeframe:  trade.timeframe || '',
    session:    trade.session   || '',
    strategy:   trade.strategy  || '',
    outcome:    trade.outcome   || '',
    followedRules: trade.followedRules === true ? 'Yes' : trade.followedRules === false ? 'No' : '',
    mistakes:   Array.isArray(trade.mistakes) ? trade.mistakes : [],
    riskAmount: numStr(trade.riskAmount),
    manualPnl:  '',
    tags:       Array.isArray(trade.tags) ? trade.tags.join(', ') : (trade.tags || ''),
    notes:      trade.notes || '',
    screenshot: trade.screenshot ? { existing: true, previewUrl: trade.screenshot } : null,
    date:       d && !isNaN(d) ? d.toISOString().split('T')[0] : todayStr(),
  };

  // Older option trades may have an exit that isn't TP / SL / Entry — keep it so editing never changes it silently
  if (opt && Number(trade.exitPrice) > 0) {
    const derived = exitFromOutcome(
      base.outcome, parseFloat(base.entryPrice), parseFloat(base.sl), parseFloat(base.tp)
    );
    if (derived === null || Math.abs(derived - Number(trade.exitPrice)) > 0.00001) {
      base.exitPrice = numStr(trade.exitPrice);
    }
  }

  base.manualPnl = deriveManualPnl(trade, base);
  return base;
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

/* ── Price Ladder ── */
const PriceLadder = ({ tp, entryPrice, sl, onChange }) => {
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

const LEVEL_KEYS = ['entryPrice', 'sl', 'tp'];

/* ── Main Component ──
   Props:
   - onAdd(tradePayload)           → create mode
   - editingTrade + onUpdate(id, tradePayload) → edit mode (pass the trade object to edit)
*/
const AddTradeModal = ({ isOpen, onClose, onAdd, onUpdate, editingTrade = null }) => {
  const isEdit = !!editingTrade;

  const [form,        setForm]        = useState(freshForm);
  const [loading,     setLoading]     = useState(false);
  const [imgDrag,     setImgDrag]     = useState(false);
  const [symQuery,    setSymQuery]    = useState('');
  const [symOpen,     setSymOpen]     = useState(false);
  const [stratPicker, setStratPicker] = useState(false);
  const [showCharges, setShowCharges] = useState(false);
  const symRef      = useRef(null);
  const fileRef     = useRef(null);
  const wasEditing  = useRef(false);

  // ── Playbook setups: shared, server-backed store (same data as the Playbook page) ──
  const { groupedSetups, setups, loading: setupsLoading, error: setupsError, refresh } = useSetups();

  // Pull the latest setups from the server every time the modal opens
  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  // Names that exist in Playbook → used to deduplicate the built-in list
  const playbookNameSet = useMemo(
    () => new Set(setups.map(s => (s.name || '').toLowerCase())),
    [setups]
  );

  // Built-in strategies that are NOT already covered by a Playbook setup
  const localOnly = useMemo(
    () => DEFAULT_STRATEGIES.filter(s => !playbookNameSet.has(s.toLowerCase())),
    [playbookNameSet]
  );

  const hasPlaybookSetups = setups.length > 0;
  const hasLocalOnly      = localOnly.length > 0;

  // Changing Entry / SL / TP drops any carried-over saved exit so everything follows the levels
  const set = useCallback((key, val) => {
    setForm(prev =>
      LEVEL_KEYS.includes(key) && prev.exitPrice
        ? { ...prev, [key]: val, exitPrice: '' }
        : { ...prev, [key]: val }
    );
  }, []);

  // Clicking an outcome (or clearing it) re-derives the exit from the levels
  const pickOutcome = (label) => {
    setForm(prev => ({ ...prev, outcome: prev.outcome === label ? '' : label, exitPrice: '' }));
  };

  // ── Options mode (NIFTY / BANKNIFTY / SENSEX) ──
  const optionCfg = OPTION_SYMBOLS[form.symbol] || null;
  const isOption  = !!optionCfg;
  const effSide   = isOption ? 'Long' : form.side;   // premium is always bought first
  const cur       = isOption ? '₹' : '$';
  const inr       = isOption;

  // Switching symbol: flip Long/Short ⇄ Call/Put and load the default lot size
  const applySymbol = (prev, symbol, type) => {
    const opt = OPTION_SYMBOLS[symbol];
    let side = prev.side;
    if (opt) {
      if (side === 'Long')  side = 'Call';
      if (side === 'Short') side = 'Put';
    } else {
      if (side === 'Call') side = 'Long';
      if (side === 'Put')  side = 'Short';
    }
    return {
      ...prev,
      symbol,
      tradeType: type ?? prev.tradeType,
      side,
      lotSize: opt ? (prev.symbol === symbol && prev.lotSize ? prev.lotSize : String(opt.lotSize)) : '',
      exitPrice: prev.symbol === symbol ? prev.exitPrice : '',
    };
  };

  // ── Load the trade into the form when opened in edit mode; reset when going back to add mode ──
  useEffect(() => {
    if (!isOpen) return;
    if (editingTrade) {
      setForm(tradeToForm(editingTrade));
      setSymQuery(editingTrade.symbol || '');
      setSymOpen(false);
      setStratPicker(false);
      wasEditing.current = true;
    } else if (wasEditing.current) {
      setForm(freshForm());
      setSymQuery('');
      wasEditing.current = false;
    }
  }, [isOpen, editingTrade]);

  // ── Everything numeric comes from one calculation ──
  const calc = useMemo(() => computeTrade(form), [form]);
  const { rr, rrNum } = calc;

  // "If Win" / "If Loss" previews, shown until an outcome is picked
  const scenarios = useMemo(() => ({
    win:  computeTrade({ ...form, outcome: 'Win',  exitPrice: '' }).pnl,
    loss: computeTrade({ ...form, outcome: 'Loss', exitPrice: '' }).pnl,
  }), [form]);

  const manualSigned = form.manualPnl !== '' ? applyManualSign(form.manualPnl, form.outcome) : null;
  const overridden   = manualSigned !== null;
  const finalPnl     = overridden ? manualSigned : calc.pnl;

  const missing = form.outcome && calc.pnl === null ? getMissing(form, calc) : [];

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
    setForm(prev => applySymbol(prev, row.s, row.type));
    setSymQuery(row.s);
    setSymOpen(false);
  };

  const handleSymbolInput = (e) => {
    const val = e.target.value.toUpperCase();
    const match = SYMBOL_DB.find(r => r.s === val);
    setSymQuery(val);
    setForm(prev => applySymbol(prev, val, match?.type));
    setSymOpen(true);
  };

  // ── Discipline handlers ──
  const setFollowedRules = (val) => {
    setForm(prev => {
      const next = prev.followedRules === val ? '' : val;
      return { ...prev, followedRules: next, mistakes: next === 'No' ? prev.mistakes : [] };
    });
  };

  const toggleMistake = (key) => {
    setForm(prev => ({
      ...prev,
      mistakes: prev.mistakes.includes(key)
        ? prev.mistakes.filter(m => m !== key)
        : [...prev.mistakes, key],
    }));
  };

  const handleScreenshot = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const base64 = await compressImage(file);
      set('screenshot', { file, previewUrl: base64, base64, sizeKB: Math.round(base64.length * 0.75 / 1024) });
    } catch (err) {
      console.error('Image compress failed', err);
      alert('Could not process that image. Try another file.');
    }
  }, [set]);

  const handleFileChange  = (e) => { if (e.target.files?.[0]) handleScreenshot(e.target.files[0]); };
  const handleDrop        = (e) => { e.preventDefault(); setImgDrag(false); if (e.dataTransfer.files?.[0]) handleScreenshot(e.dataTransfer.files[0]); };
  const pasteHandler      = useCallback((e) => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) handleScreenshot(item.getAsFile());
  }, [handleScreenshot]);

  const handleSubmit = async () => {
    // Edit mode only needs a symbol (older / imported trades may not have entry price or type)
    if (!form.symbol || (!isEdit && (!form.tradeType || !form.entryPrice))) {
      alert(isEdit ? 'Symbol is required.' : 'Please fill: Symbol, Trade Type, and Entry Price.');
      return;
    }
    setLoading(true);
    try {
      const now = form.date ? new Date(form.date).toISOString() : new Date().toISOString();
      const payload = {
        symbol:     form.symbol,
        tradeType:  form.tradeType || undefined,
        // Options are always bought first, so side stays 'Long' (keeps old stats/enums working);
        // Call / Put is stored separately in optionType.
        side:       isOption ? 'Long' : form.side,
        optionType: isOption ? form.side : null,
        entryPrice: parseFloat(form.entryPrice) || null,
        sl:         parseFloat(form.sl)         || null,
        tp:         parseFloat(form.tp)         || null,
        rr:         rrNum,
        // Exit is derived from the outcome: Win → TP · Loss → SL · Breakeven → Entry
        exitPrice:  isOption ? (calc.exit ?? null)                   : null,
        lots:       isOption ? (parseFloat(form.lots)    || null)    : null,
        lotSize:    isOption ? (parseFloat(form.lotSize) || null)    : null,
        quantity:   isOption ? (calc.qty ?? null)                    : null,
        grossPnl:   isOption ? (calc.gross ?? null)                  : null,
        charges:    isOption ? (calc.charges?.total ?? null)         : null,
        timeframe:  form.timeframe  || null,
        session:    form.session    || null,
        strategy:   form.strategy   || null,
        outcome:    form.outcome    || null,
        followedRules: form.followedRules === 'Yes' ? true : form.followedRules === 'No' ? false : null,
        mistakes:   form.followedRules === 'No' ? form.mistakes : [],
        // Options: risk is auto (lots × lot size × Entry→SL). Other markets: the amount you typed.
        riskAmount: isOption
          ? (calc.risk ?? (parseFloat(form.riskAmount) || null))
          : (parseFloat(form.riskAmount) || null),
        pnl:        finalPnl,
        tags:       form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        notes:      form.notes || null,
        date:       now,
      };

      if (isEdit) {
        // new image → send it · removed image → send null · untouched → don't send the field
        if (form.screenshot?.base64)                          payload.screenshot = form.screenshot.base64;
        else if (!form.screenshot && editingTrade.screenshot) payload.screenshot = null;
        await onUpdate(editingTrade._id ?? editingTrade.id, payload);
      } else {
        await onAdd({ ...payload, screenshot: form.screenshot?.base64 || null });
        setForm(freshForm());
        setSymQuery('');
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isEdit) { setForm(freshForm()); setSymQuery(''); }
    onClose();
  };

  const typeMeta = form.tradeType ? TYPE_META[form.tradeType] : null;
  const rrColor  = rrNum === null ? '#6b7280' : rrNum <= 0 ? '#f87171' : rrNum < 1 ? '#fb923c' : rrNum < 2 ? '#fbbf24' : '#34d399';

  const signed = (n) => `${n >= 0 ? '+' : '-'}${cur}${fmtNum(Math.abs(n), inr)}`;

  const chargeRows = calc.charges ? [
    [`Brokerage (2 × ₹${CHARGE_CONFIG.brokeragePerOrder})`, calc.charges.brokerage],
    [`STT (${CHARGE_CONFIG.sttSellPct}% on sell)`,          calc.charges.stt],
    [`Exchange txn (${CHARGE_CONFIG.exchangePct[optionCfg.exchange]}%)`, calc.charges.exch],
    ['SEBI fee (₹10 / crore)',                              calc.charges.sebi],
    [`Stamp duty (${CHARGE_CONFIG.stampBuyPct}% on buy)`,   calc.charges.stamp],
    [`GST (${CHARGE_CONFIG.gstPct}%)`,                      calc.charges.gst],
  ] : [];

  const resultTone = calc.pnl !== null ? toneOf(calc.pnl) : TONES.flat;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Trade' : 'New Trade'}>
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
                  {isOption ? 'OPTIONS' : form.tradeType.toUpperCase()}
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

        {/* Direction  /  Option type (Call / Put) */}
        <Field label={isOption ? 'Option Type *' : 'Direction *'}>
          <div className="flex gap-2">
            {(isOption ? ['Call', 'Put'] : ['Long', 'Short']).map(s => {
              const bullish = s === 'Long' || s === 'Call';
              const label =
                s === 'Long' ? '▲ Long' : s === 'Short' ? '▼ Short' :
                s === 'Call' ? '▲ Call (CE)' : '▼ Put (PE)';
              return (
                <button key={s} type="button" onClick={() => set('side', s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border
                    ${form.side === s
                      ? bullish
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_18px_rgba(52,211,153,.12)]'
                        : 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_18px_rgba(248,113,113,.12)]'
                      : 'bg-transparent text-gray-500 border-[#27272a] hover:border-gray-500 hover:text-gray-300'}`}>
                  {label}
                </button>
              );
            })}
          </div>
          {isOption && (
            <p className="text-gray-600 text-[10px] mt-1.5">
              Call and Put are both bought first — enter your buy premium as Entry. The exit premium is taken from your Take Profit / Stop Loss / Entry based on the outcome you pick.
            </p>
          )}
        </Field>

        {/* Price Ladder */}
        <Field label={isOption ? 'Premium Levels' : 'Price Levels'}>
          <PriceLadder tp={form.tp} entryPrice={form.entryPrice} sl={form.sl} onChange={set} />
        </Field>

        {/* Options: quantity (the only extra inputs — no exit price) */}
        {isOption && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Lots">
              <input type="number" min="1" value={form.lots} onChange={e => set('lots', e.target.value)} onWheel={e => e.target.blur()} placeholder="1" className={inputCls} />
            </Field>
            <Field label="Lot Size">
              <input type="number" min="1" value={form.lotSize} onChange={e => set('lotSize', e.target.value)} onWheel={e => e.target.blur()} placeholder={String(optionCfg.lotSize)} className={inputCls} />
            </Field>
          </div>
        )}

        {/* RR Card */}
        {(form.entryPrice || form.sl || form.tp) && (
          <div className="rounded-xl px-4 py-3 border flex items-center justify-between transition-all"
            style={{ background: rrColor + '0d', borderColor: rrColor + '30' }}>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Risk : Reward</div>
              {rrNum === null || rrNum <= 0 ? (
                <div className="text-red-400 text-xs flex items-center gap-1.5">
                  ⚠ Invalid — {isOption ? 'premium must satisfy SL < Entry < TP' : `check SL/TP for ${form.side}`}
                </div>
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

        {/* Outcome — drives the exit price and the money below */}
        <Field label="Outcome">
          <div className="flex gap-2">
            {[
              { label:'Win',       style:'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
              { label:'Loss',      style:'bg-red-500/20 text-red-400 border-red-500/50' },
              { label:'Breakeven', style:'bg-gray-500/20 text-gray-400 border-gray-500/40' },
            ].map(o => (
              <button key={o.label} type="button"
                onClick={() => pickOutcome(o.label)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all
                  ${form.outcome === o.label ? o.style : 'bg-transparent text-gray-500 border-[#27272a] hover:border-gray-500'}`}>
                {o.label === 'Win' ? '✓ ' : o.label === 'Loss' ? '✗ ' : '→ '}{o.label}
              </button>
            ))}
          </div>

          {isOption && form.exitPrice !== '' && (
            <div className="mt-2 flex items-center justify-between gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2">
              <span className="text-amber-300/80 text-[11px] leading-snug">
                Using this trade's saved exit ({cur}{form.exitPrice}). Pick an outcome or edit the levels to recalculate from Entry / TP / SL.
              </span>
              <button type="button" onClick={() => set('exitPrice', '')}
                className="shrink-0 text-[10px] text-amber-200 hover:text-white font-semibold">
                Use levels
              </button>
            </div>
          )}

          {isOption && form.exitPrice === '' && (
            <p className="text-gray-600 text-[10px] mt-1.5">
              {calc.exit
                ? <>Exit auto-set to <span className="text-violet-400 font-semibold">{cur}{calc.exit}</span> ({calc.exitSource}).</>
                : 'Exit comes from your levels: Win → Take Profit · Loss → Stop Loss · Breakeven → Entry.'}
            </p>
          )}
        </Field>

        {/* ── Risk & P&L — all automatic, with an optional override at the bottom ── */}
        <div className="bg-[#0b0b0d] border border-[#27272a] rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Risk & P&L</span>
            {isOption && <span className="text-[10px] text-gray-600">{optionCfg.exchange} options · auto</span>}
          </div>

          {/* Risk amount: auto for options, one input for other markets (needed for position sizing) */}
          {isOption ? (
            <div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-red-500/60 mb-0.5">Risk Amount · auto</p>
                  <p className="text-red-400 font-black text-lg tabular-nums">
                    {calc.risk !== null ? `₹${fmt(calc.risk)}` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-500/60 mb-0.5">Reward · auto</p>
                  <p className="text-emerald-400 font-black text-lg tabular-nums">
                    {calc.reward !== null ? `₹${fmt(calc.reward)}` : '—'}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-[10px] mt-1.5">
                {calc.qty ? <>Qty {form.lots} × {form.lotSize} = <span className="text-gray-400 font-semibold">{calc.qty}</span> · </> : null}
                From Entry → SL / TP, before charges.
              </p>
            </div>
          ) : (
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Risk Amount ({cur})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">{cur}</span>
                <input type="number" value={form.riskAmount} onChange={e => set('riskAmount', e.target.value)} onWheel={e => e.target.blur()} placeholder="How much are you risking?" className={inputCls + ' pl-7'} />
              </div>
              <p className="text-gray-600 text-[10px] mt-1">
                Position size for this market — profit and loss are calculated from this and your Entry / SL / TP.
              </p>
            </div>
          )}

          {/* Calculated result */}
          {form.outcome && calc.pnl !== null ? (
            <div className={`rounded-2xl border p-4 flex items-center justify-between ${resultTone.box}`}>
              <div>
                <p className={`text-[10px] uppercase tracking-widest mb-1 ${resultTone.sub}`}>
                  Calculated P&L{isOption ? ' · net of charges' : ''}
                </p>
                <p className={`font-black text-3xl tabular-nums ${resultTone.text}`}>{signed(calc.pnl)}</p>
              </div>
              <div className={`text-right text-[11px] ${resultTone.sub}`}>
                {isOption
                  ? <>
                      <div>Exit {cur}{calc.exit}</div>
                      <div className="opacity-70">{calc.exitSource}</div>
                      {calc.gross !== null && <div className="opacity-70 mt-1">Gross {signed(calc.gross)}</div>}
                    </>
                  : form.outcome === 'Win' && rr
                    ? <span className="text-3xl font-black opacity-40">1:{rr}</span>
                    : <span className="text-3xl font-black opacity-40">{form.outcome === 'Loss' ? '✗' : '→'}</span>}
              </div>
            </div>
          ) : form.outcome ? (
            <div className="rounded-xl border border-dashed border-[#2a2a2e] px-3 py-3 text-center">
              <p className="text-gray-500 text-xs">
                {missing.length
                  ? <>Add <span className="text-violet-400 font-semibold">{missing.join(', ')}</span> to calculate the P&L.</>
                  : 'P&L will be calculated once the levels are valid.'}
              </p>
            </div>
          ) : (scenarios.win !== null || scenarios.loss !== null) ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                <p className="text-emerald-500/50 text-[10px] uppercase tracking-wider mb-1">If Win</p>
                <p className="text-emerald-400 font-black text-base tabular-nums">{scenarios.win !== null ? signed(scenarios.win) : '—'}</p>
              </div>
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-2.5 text-center">
                <p className="text-red-500/50 text-[10px] uppercase tracking-wider mb-1">If Loss</p>
                <p className="text-red-400 font-black text-base tabular-nums">{scenarios.loss !== null ? signed(scenarios.loss) : '—'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-xs text-center py-1">
              Fill your levels{isOption ? ' and lots' : ' and risk amount'}, then pick an outcome — the P&L is calculated automatically.
            </p>
          )}

          {/* Options: charges breakdown */}
          {isOption && calc.charges && (
            <div className="rounded-xl border border-[#1f1f23] overflow-hidden">
              <button type="button" onClick={() => setShowCharges(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#111114] transition-colors">
                <span className="text-gray-400 font-semibold">
                  Total charges <span className="text-orange-400 font-bold tabular-nums ml-1">₹{fmt(calc.charges.total)}</span>
                </span>
                <span className="text-gray-500 text-[10px]">{showCharges ? 'Hide ▲' : 'Breakdown ▼'}</span>
              </button>
              {showCharges && (
                <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-[#1f1f23]">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pb-1">
                    <span>Turnover</span>
                    <span className="text-gray-300 font-semibold tabular-nums">₹{fmt(calc.charges.buyTurnover + calc.charges.sellTurnover)}</span>
                  </div>
                  {chargeRows.map(([label, amt]) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-300 tabular-nums">₹{fmt(amt)}</span>
                    </div>
                  ))}
                  <p className="text-gray-700 text-[10px] pt-1">
                    Assumes you sold before expiry. An in-the-money option left to be exercised attracts STT on intrinsic value instead.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Overall total — editable override */}
          <div className="border-t border-[#1f1f23] pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">
                Overall Total P&L ({cur})
                <span className="ml-2 normal-case text-gray-600">edit to override</span>
              </label>
              {form.manualPnl !== '' && (
                <button type="button" onClick={() => set('manualPnl', '')}
                  className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold">
                  ↺ Reset to auto
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">{cur}</span>
              <input
                type="number"
                value={form.manualPnl}
                onChange={e => set('manualPnl', e.target.value)}
                onWheel={e => e.target.blur()}
                placeholder={calc.pnl !== null ? `${fmtNum(Math.abs(calc.pnl), inr)} (auto)` : 'Enter total — sign applied automatically'}
                className={inputCls + ' pl-7 text-lg font-bold'}
              />
            </div>
            <p className="text-gray-600 text-[10px] mt-1">
              {overridden && finalPnl !== null
                ? <>Will be saved as <span className={`font-semibold ${finalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{signed(finalPnl)}</span>
                    {calc.pnl !== null && <> · calculated was {signed(calc.pnl)}</>}</>
                : 'Leave blank to use the calculated total · for Win / Loss the sign follows your outcome (type a minus to force a negative).'}
            </p>
          </div>
        </div>

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

        {/* Session */}
        <Field label="Session">
          <div className="flex flex-wrap gap-1.5">
            {SESSIONS.map(s => {
              const active = form.session === s.name;
              return (
                <button key={s.name} type="button"
                  title={s.hours}
                  onClick={() => set('session', active ? '' : s.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5
                    ${active ? '' : 'bg-transparent text-gray-500 border-[#27272a] hover:border-gray-500 hover:text-gray-200'}`}
                  style={active ? {
                    color: s.color,
                    background: s.color + '22',
                    borderColor: s.color + '80',
                    boxShadow: `0 0 14px ${s.color}22`,
                  } : undefined}>
                  <span>{s.icon}</span>{s.name}
                </button>
              );
            })}
          </div>
          <p className="text-gray-600 text-[10px] mt-1.5">
            {form.session
              ? `${form.session} session · ${SESSIONS.find(s => s.name === form.session)?.hours}`
              : 'Which market session did you take this trade in? (optional)'}
          </p>
        </Field>

        {/* ── Strategy Picker ── */}
        <Field label="Strategy">
          <div className="space-y-2">
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setStratPicker(p => !p)}
                className={`flex-1 ${inputCls} text-left flex items-center justify-between`}>
                <span className={form.strategy ? 'text-white' : 'text-gray-600'}>
                  {form.strategy || 'Select strategy…'}
                </span>
                <span className="text-gray-500 text-xs ml-2">{stratPicker ? '▲' : '▼'}</span>
              </button>
              {form.strategy && (
                <button type="button"
                  onClick={() => set('strategy', '')}
                  title="Clear strategy"
                  className="px-3 py-2 bg-[#0b0b0d] border border-[#27272a] rounded-xl text-gray-500 hover:text-red-400 hover:border-red-500/40 text-sm transition-all">
                  ✕
                </button>
              )}
              <button type="button"
                onClick={() => refresh()}
                title="Sync setups from Playbook"
                className="px-3 py-2 bg-[#0b0b0d] border border-[#27272a] rounded-xl text-gray-500 hover:text-violet-400 hover:border-violet-500/40 text-sm transition-all">
                ⟳
              </button>
            </div>

            {stratPicker && (
              <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-3 space-y-3">

                {/* ── Sync status / error ── */}
                {setupsError && (
                  <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">
                    <span className="text-red-400 text-[11px] flex-1 leading-snug">Couldn't sync Playbook: {setupsError}</span>
                    <button type="button" onClick={() => refresh()} className="text-[10px] text-red-300 hover:text-white font-semibold">Retry</button>
                  </div>
                )}
                {setupsLoading && (
                  <p className="text-gray-500 text-[11px] px-1">Loading Playbook setups…</p>
                )}

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

                {/* ── Built-in strategies not in Playbook ── */}
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
                {!setupsLoading && !hasPlaybookSetups && !hasLocalOnly && (
                  <div className="text-center py-4 space-y-1">
                    <p className="text-gray-500 text-xs">No strategies yet.</p>
                    <p className="text-gray-600 text-[10px]">
                      Add setups in the <span className="text-violet-400">Playbook</span> page — they appear here automatically.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Field>

        {/* ── Discipline: rules + mistakes ── */}
        <Field label="Did you follow all your rules?">
          <div className="flex gap-2">
            {[
              { label: 'Yes', icon: '✓', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
              { label: 'No',  icon: '✗', style: 'bg-red-500/20 text-red-400 border-red-500/50' },
            ].map(o => (
              <button key={o.label} type="button" onClick={() => setFollowedRules(o.label)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all
                  ${form.followedRules === o.label ? o.style : 'bg-transparent text-gray-500 border-[#27272a] hover:border-gray-500'}`}>
                {o.icon} {o.label}
              </button>
            ))}
          </div>

          {form.followedRules === 'No' && (
            <div className="mt-2.5 bg-red-500/5 border border-red-500/15 rounded-2xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-red-400/70 font-medium mb-2">
                What went wrong? <span className="normal-case text-gray-600">(select all that apply)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MISTAKE_OPTIONS.map(m => {
                  const active = form.mistakes.includes(m.key);
                  return (
                    <button key={m.key} type="button" onClick={() => toggleMistake(m.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5
                        ${active
                          ? 'bg-red-500/20 text-red-300 border-red-500/50'
                          : 'bg-[#18181b] text-gray-400 border-[#27272a] hover:border-red-500/40 hover:text-gray-200'}`}>
                      <span>{m.icon}</span>{m.key}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Field>

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
                {form.screenshot.sizeKB ? `${form.screenshot.sizeKB} KB` : 'Saved'}
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
          <Button variant="secondary" className="flex-1" onClick={handleCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </span>
              : isEdit ? 'Update Trade' : 'Save Trade'
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