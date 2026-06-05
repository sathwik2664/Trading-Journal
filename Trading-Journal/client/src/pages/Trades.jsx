/**
 * Trades.jsx — Ultra-Premium Trading Journal with Recycle Bin
 * Features: Delete → Recycle Bin → 30-day expiry → Restore
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTrades } from '../hooks/useTrades';
import { useAccount } from '../context/AccountContext';
import AddTradeModal from '../components/Trades/AddTradeModal';
import Loader from '../components/shared/Loader';
import { formatCurrency } from '../utils/helpers';
import {
  Plus, TrendingUp, TrendingDown, Search,
  Download, Upload, Tag, SlidersHorizontal,
  X, ChevronRight, BarChart2, FileText,
  Zap, Activity, Target, Calendar, Image, ZoomIn, Trash2,
  RotateCcw, Clock, AlertTriangle, Eraser
} from 'lucide-react';
import dayjs from 'dayjs';

/* ═══════════════════════════ DESIGN TOKENS ═══════════════════════════ */
const T = {
  bg:       '#050710',
  surface:  '#070920',
  card:     '#0a0d24',
  cardHigh: '#0e1230',
  border:   '#151a38',
  borderHi: '#1e2548',
  hover:    '#111530',
  accent:   '#4f8ef7',
  accentL:  'rgba(79,142,247,0.12)',
  accentG:  'rgba(79,142,247,0.06)',
  gold:     '#f5c842',
  goldL:    'rgba(245,200,66,0.10)',
  green:    '#00e5a0',
  greenL:   'rgba(0,229,160,0.10)',
  greenG:   'rgba(0,229,160,0.05)',
  red:      '#ff4466',
  redL:     'rgba(255,68,102,0.10)',
  redG:     'rgba(255,68,102,0.05)',
  yellow:   '#ffa53d',
  cyan:     '#00d4ff',
  purple:   '#b57bee',
  text:     '#dde4ff',
  textSoft: '#9aa5cc',
  sub:      '#5a6690',
  muted:    '#2a3060',
  mono:     "'JetBrains Mono','Fira Code',monospace",
  sans:     "'Outfit','DM Sans',system-ui,sans-serif",
  head:     "'Space Grotesk','Outfit',system-ui,sans-serif",
};

const BIN_EXPIRY_DAYS = 30;

/* ═════════════════════════ INJECT FONTS + KEYFRAMES ═════════════════════════ */
if (typeof document !== 'undefined') {
  if (!document.getElementById('__tj2_fonts__')) {
    const l = document.createElement('link');
    l.id = '__tj2_fonts__'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(l);
  }
  if (!document.getElementById('__tj2_styles__')) {
    const s = document.createElement('style');
    s.id = '__tj2_styles__';
    s.textContent = `
      * { box-sizing: border-box; }
      @keyframes tj-fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes tj-fadeIn   { from{opacity:0} to{opacity:1} }
      @keyframes tj-scaleIn  { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
      @keyframes tj-slideDown{ from{opacity:0;max-height:0} to{opacity:1;max-height:600px} }
      @keyframes tj-confetti { 0%{opacity:1;transform:translate(0,0) rotate(0deg) scale(1)} 100%{opacity:0;transform:translate(var(--cx),var(--cy)) rotate(720deg) scale(0)} }
      @keyframes tj-streak   { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      @keyframes tj-pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
      @keyframes tj-glow     { 0%,100%{box-shadow:0 0 12px rgba(79,142,247,0.2)} 50%{box-shadow:0 0 28px rgba(79,142,247,0.45)} }
      @keyframes tj-shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      @keyframes tj-pop      { 0%{transform:scale(.92)} 60%{transform:scale(1.04)} 100%{transform:scale(1)} }
      @keyframes tj-ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes tj-imgIn    { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
      @keyframes tj-slideRight { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
      @keyframes tj-deleteRow { 0%{opacity:1;transform:translateX(0) scaleY(1);max-height:80px} 100%{opacity:0;transform:translateX(20px) scaleY(0);max-height:0} }
      @keyframes tj-restoreRow { 0%{opacity:0;transform:translateX(-12px)} 100%{opacity:1;transform:translateX(0)} }
      @keyframes tj-urgentPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,68,102,0.4)} 50%{box-shadow:0 0 0 4px rgba(255,68,102,0)} }

      .tj-fade     { animation: tj-fadeUp .45s cubic-bezier(.16,1,.3,1) both }
      .tj-scalein  { animation: tj-scaleIn .3s cubic-bezier(.16,1,.3,1) both }
      .tj-pop      { animation: tj-pop .4s cubic-bezier(.34,1.56,.64,1) both }
      .tj-imgIn    { animation: tj-imgIn .35s cubic-bezier(.16,1,.3,1) both }
      .tj-slideRight { animation: tj-slideRight .3s cubic-bezier(.16,1,.3,1) both }

      .tj-row { transition: background .15s; cursor: pointer; }
      .tj-row:hover td { background: rgba(79,142,247,.04) !important; }
      .tj-row.selected td { background: rgba(79,142,247,.08) !important; }
      .tj-row.expanded td { background: rgba(79,142,247,.06) !important; }
      .tj-row.deleting td { animation: tj-deleteRow .35s cubic-bezier(.4,0,.2,1) both; overflow: hidden; }

      /* Delete button in row — hidden by default, shown on hover */
      .tj-row .tj-delete-btn { opacity: 0; transition: opacity .15s; }
      .tj-row:hover .tj-delete-btn { opacity: 1; }

      .tj-sort { cursor:pointer; user-select:none; transition: color .15s; }
      .tj-sort:hover { color: #dde4ff !important; }

      .tj-btn {
        display:inline-flex;align-items:center;gap:6px;
        padding:8px 16px;border-radius:10px;
        font-size:11px;font-weight:700;
        font-family:'Outfit',sans-serif;
        cursor:pointer;border:none;
        transition:all .18s;letter-spacing:.04em;
        white-space:nowrap;
      }
      .tj-btn:hover { transform:translateY(-1px); filter:brightness(1.12); }
      .tj-btn:active { transform:translateY(0); }

      .tj-input {
        background: rgba(10,13,36,.8);
        border: 1px solid #151a38;
        border-radius: 10px;
        color: #dde4ff;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        padding: 8px 12px;
        outline: none;
        width: 100%;
        transition: border-color .18s, box-shadow .18s;
        backdrop-filter: blur(8px);
      }
      .tj-input:focus {
        border-color: #4f8ef7;
        box-shadow: 0 0 0 3px rgba(79,142,247,.12);
      }
      .tj-input::placeholder { color: #2a3060; }

      .tj-check {
        appearance: none;
        width: 16px; height: 16px;
        border: 1.5px solid #2a3060;
        border-radius: 5px;
        cursor: pointer;
        transition: all .15s;
        flex-shrink: 0;
        margin: 0;
        position: relative;
        display: grid;
        place-items: center;
      }
      .tj-check:hover { border-color: #4f8ef7; }
      .tj-check:checked { background: #4f8ef7; border-color: #4f8ef7; }
      .tj-check:checked::after {
        content: '';
        display: block;
        width: 5px; height: 8px;
        border: 2px solid #fff;
        border-top: none;
        border-left: none;
        transform: rotate(45deg) translateY(-1px);
      }

      .tj-tag {
        display:inline-flex;align-items:center;gap:4px;
        padding:2px 9px;border-radius:6px;
        font-size:10px;font-weight:700;
        font-family:'JetBrains Mono',monospace;
        cursor:pointer;transition:all .15s;
        letter-spacing:.03em;
      }
      .tj-tag:hover { opacity:.8; transform:scale(.97); }

      .tj-stat-card {
        position:relative;overflow:hidden;
        border-radius:16px;
        border: 1px solid #151a38;
        padding: 18px 20px;
        transition: border-color .2s, transform .2s;
        cursor:default;
      }
      .tj-stat-card:hover { transform:translateY(-2px); border-color:#1e2548; }
      .tj-stat-card::before {
        content:'';position:absolute;inset:0;
        background:linear-gradient(135deg,rgba(255,255,255,.02) 0%,transparent 60%);
        pointer-events:none;
      }

      .tj-noise {
        position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.025;
        background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        background-size:200px;
      }

      /* ── Image upload drop zone ── */
      .tj-img-drop {
        border: 2px dashed #1e2548;
        border-radius: 12px;
        background: rgba(10,13,36,.6);
        transition: all .2s;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 28px 16px;
        text-align: center;
        min-height: 120px;
      }
      .tj-img-drop:hover, .tj-img-drop.drag-over {
        border-color: #4f8ef7;
        background: rgba(79,142,247,.06);
      }
      .tj-img-drop.drag-over { border-color: #00e5a0; background: rgba(0,229,160,.05); }

      /* ── Image lightbox overlay ── */
      .tj-lightbox {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(5,7,16,.92);
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(12px);
        animation: tj-fadeIn .2s ease both;
        cursor: zoom-out;
      }
      .tj-lightbox img {
        max-width: 90vw; max-height: 88vh;
        border-radius: 16px;
        box-shadow: 0 40px 120px rgba(0,0,0,.9), 0 0 0 1px rgba(79,142,247,.2);
        animation: tj-imgIn .3s cubic-bezier(.16,1,.3,1) both;
        object-fit: contain;
        cursor: default;
      }
      .tj-lightbox-close {
        position: fixed; top: 24px; right: 24px;
        width: 40px; height: 40px; border-radius: 12px;
        background: rgba(14,18,48,.9); border: 1px solid #1e2548;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: #9aa5cc;
        transition: all .15s;
        backdrop-filter: blur(8px);
      }
      .tj-lightbox-close:hover { background: rgba(255,68,102,.15); border-color: #ff4466; color: #ff4466; }

      /* ── Trade image thumbnail ── */
      .tj-img-thumb {
        position: relative;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #151a38;
        cursor: zoom-in;
        transition: all .2s;
        background: #070920;
      }
      .tj-img-thumb:hover { border-color: #4f8ef7; transform: scale(1.02); }
      .tj-img-thumb:hover .tj-img-overlay { opacity: 1; }
      .tj-img-overlay {
        position: absolute; inset: 0;
        background: rgba(5,7,16,.55);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity .2s;
        gap: 10px;
      }

      /* ── Image indicator dot in table row ── */
      .tj-img-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #4f8ef7;
        box-shadow: 0 0 6px rgba(79,142,247,.7);
        display: inline-block;
        margin-left: 5px;
        vertical-align: middle;
        animation: tj-pulse 2s ease infinite;
      }

      /* ── Recycle Bin panel ── */
      .tj-bin-panel {
        background: rgba(10,13,36,.7);
        border: 1px solid rgba(90,102,144,0.2);
        border-radius: 16px;
        overflow: hidden;
        margin-top: 8px;
        backdrop-filter: blur(12px);
        transition: all .3s cubic-bezier(.16,1,.3,1);
      }

      .tj-bin-row {
        transition: background .15s;
        border-bottom: 1px solid rgba(21,26,56,0.6);
      }
      .tj-bin-row:hover td { background: rgba(255,68,102,.03) !important; }
      .tj-bin-row:last-child { border-bottom: none; }

      /* ── Urgency timer ── */
      .tj-timer-urgent {
        animation: tj-urgentPulse 2s ease infinite;
        border-radius: 6px;
      }

      /* ── Tooltip ── */
      .tj-tooltip-wrap { position: relative; }
      .tj-tooltip-wrap:hover .tj-tooltip { opacity: 1; pointer-events: none; transform: translateY(-4px); }
      .tj-tooltip {
        position: absolute; bottom: calc(100% + 8px); left: 50%;
        transform: translateX(-50%) translateY(0);
        background: #0e1230; border: 1px solid #1e2548;
        border-radius: 8px; padding: 5px 10px;
        font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #9aa5cc;
        white-space: nowrap; opacity: 0;
        transition: all .18s;
        pointer-events: none; z-index: 100;
      }

      ::-webkit-scrollbar { width:4px; height:4px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:#1e2548; border-radius:4px; }
      ::-webkit-scrollbar-thumb:hover { background:#2a3060; }
    `;
    document.head.appendChild(s);
  }
}

/* ═════════════════════════ HELPERS ═════════════════════════ */
const fix2  = n => +n.toFixed(2);
const pct   = (a, b) => b ? +((a / b) * 100).toFixed(1) : 0;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const OUTCOME_TAGS = ['A+ Setup','FOMO','Revenge','Planned','Overtraded','News Play','Breakout','Reversal','Scalp','Swing'];
const TAG_COLORS = {
  'A+ Setup':   [T.green,  T.greenL],
  'FOMO':       [T.red,    T.redL],
  'Revenge':    ['#ff7eb3','rgba(255,126,179,.12)'],
  'Planned':    [T.cyan,   'rgba(0,212,255,.10)'],
  'Overtraded': [T.yellow, 'rgba(255,165,61,.10)'],
  'News Play':  [T.gold,   T.goldL],
  'Breakout':   [T.accent, T.accentL],
  'Reversal':   [T.purple, 'rgba(181,123,238,.12)'],
  'Scalp':      [T.cyan,   'rgba(0,212,255,.10)'],
  'Swing':      ['#7cb9f7','rgba(124,185,247,.10)'],
};

/* ══ Days remaining in bin ══ */
function daysRemaining(deletedAt) {
  const deleted = dayjs(deletedAt);
  const expires = deleted.add(BIN_EXPIRY_DAYS, 'day');
  const diff = expires.diff(dayjs(), 'day');
  return Math.max(0, diff);
}

/* ══ Timer color based on urgency ══ */
function timerColor(days) {
  if (days <= 3)  return T.red;
  if (days <= 7)  return T.yellow;
  if (days <= 14) return T.gold;
  return T.sub;
}

/* ══ Animated counter ══ */
function AnimNum({ value, fmt = v => v, dur = 800 }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value), raf = useRef();
  useEffect(() => {
    const from = prev.current, to = value, t0 = performance.now();
    const tick = now => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setDisp(from + (to - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else { setDisp(to); prev.current = to; }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, dur]);
  return <>{fmt(disp)}</>;
}

/* ══ Confetti ══ */
function spawnConfetti() {
  if (typeof document === 'undefined') return;
  const colors = [T.green, T.accent, T.cyan, T.gold, '#fff', T.purple];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('div');
    const cx = (Math.random() - .5) * 340, cy = -(Math.random() * 260 + 80);
    el.style.cssText = `
      position:fixed;pointer-events:none;z-index:9999;
      width:${Math.random()*9+3}px;height:${Math.random()*9+3}px;
      border-radius:${Math.random()>.4?'50%':'3px'};
      background:${colors[Math.floor(Math.random()*colors.length)]};
      left:${window.innerWidth/2}px;top:${window.innerHeight/3}px;
      --cx:${cx}px;--cy:${cy}px;
      animation:tj-confetti ${.7+Math.random()*.9}s cubic-bezier(.25,.46,.45,.94) ${Math.random()*.2}s both;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}

/* ══ Sparkline ══ */
function Sparkline({ data, color, width = 80, height = 28 }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * width);
  const ys = data.map(v => height - ((v - min) / range) * height);
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const fill = `${xs[0]},${height} ${pts} ${xs[xs.length-1]},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══ Mini P&L bar ══ */
const MiniBar = ({ value, max, color }) => (
  <div style={{ height: 2, background: `${T.muted}50`, borderRadius: 2, overflow: 'hidden', marginTop: 5, width: '100%' }}>
    <div style={{
      height: '100%',
      width: `${max ? clamp((Math.abs(value) / max) * 100, 0, 100) : 0}%`,
      background: color, borderRadius: 2,
      transition: 'width .6s cubic-bezier(.16,1,.3,1)',
    }} />
  </div>
);

/* ══ Tag pill ══ */
const TagPill = ({ tag, onRemove }) => {
  const [fg, bg] = TAG_COLORS[tag] || [T.sub, `${T.muted}22`];
  return (
    <span className="tj-tag" style={{ background: bg, color: fg, border: `1px solid ${fg}35` }}>
      {tag}
      {onRemove && (
        <X size={8} onClick={e => { e.stopPropagation(); onRemove(tag); }}
          style={{ cursor: 'pointer', opacity: .7 }} />
      )}
    </span>
  );
};

/* ══ Streak badge ══ */
const StreakBadge = ({ streak, type }) => {
  if (!streak || streak < 2) return null;
  const isWin = type === 'win';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20,
      fontFamily: T.mono, fontSize: 11, fontWeight: 700,
      background: isWin
        ? 'linear-gradient(90deg,#00e5a0,#00d4ff,#4f8ef7)'
        : 'linear-gradient(90deg,#ff4466,#ff7e4f)',
      backgroundSize: '200%',
      animation: 'tj-streak 2.5s linear infinite',
      color: '#fff',
      boxShadow: isWin ? '0 0 20px rgba(0,229,160,.3)' : '0 0 20px rgba(255,68,102,.3)',
      letterSpacing: '.02em',
    }}>
      {isWin ? '🔥' : '❄️'} {streak}-{isWin ? 'win' : 'loss'} streak
    </div>
  );
};

/* ══ CSV parser ══ */
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(row => {
    const vals = row.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i] || '');
    return {
      date:   obj.date   || dayjs().format('YYYY-MM-DD'),
      symbol: (obj.symbol || 'UNKNOWN').toUpperCase(),
      side:   obj.side   || obj.type || 'Long',
      pnl:    parseFloat(obj.pnl || obj['p&l'] || obj.profit || '0') || 0,
      notes:  obj.notes  || '',
    };
  }).filter(t => t.symbol && !isNaN(t.pnl));
}

/* ══ Lightbox ══ */
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="tj-lightbox" onClick={onClose}>
      <button className="tj-lightbox-close" onClick={onClose}>
        <X size={18} />
      </button>
      <img src={src} alt="Trade screenshot" onClick={e => e.stopPropagation()} draggable={false} />
    </div>
  );
}

/* ══ Trade Image Panel ══ */
function TradeImagePanel({ tradeId, images, onImagesChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();
  const handleFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        onImagesChange(prev => ({
          ...prev,
          [tradeId]: [...(prev[tradeId] || []), {
            id: `img_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            src: e.target.result,
            name: file.name,
            size: file.size,
            addedAt: new Date().toISOString(),
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  }, [tradeId, onImagesChange]);

  const removeImage = useCallback((imgId, e) => {
    e.stopPropagation();
    onImagesChange(prev => ({
      ...prev,
      [tradeId]: (prev[tradeId] || []).filter(img => img.id !== imgId)
    }));
  }, [tradeId, onImagesChange]);

  const tradeImages = images[tradeId] || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: T.accentL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image size={12} color={T.accent} />
        </div>
        <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          Trade Screenshots
        </span>
        {tradeImages.length > 0 && (
          <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: T.accentL, color: T.accent, border: `1px solid ${T.accent}35` }}>
            {tradeImages.length}
          </span>
        )}
      </div>
      {tradeImages.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: tradeImages.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
          {tradeImages.map(img => (
            <div key={img.id} className="tj-img-thumb tj-imgIn" onClick={() => setLightbox(img.src)} style={{ aspectRatio: tradeImages.length === 1 ? '16/9' : '4/3' }}>
              <img src={img.src} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div className="tj-img-overlay">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,142,247,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ZoomIn size={15} color="#fff" />
                </div>
                <div onClick={e => removeImage(img.id, e)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,68,102,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={14} color="#fff" />
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(5,7,16,.85))', padding: '16px 8px 6px', fontSize: 9, fontFamily: T.mono, color: 'rgba(221,228,255,.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        className={`tj-img-drop${dragOver ? ' drag-over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        style={{ minHeight: tradeImages.length > 0 ? 60 : 120, padding: tradeImages.length > 0 ? '12px 16px' : '28px 16px' }}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        <div style={{ width: 32, height: 32, borderRadius: 10, background: dragOver ? 'rgba(0,229,160,.15)' : T.accentG, border: `1px solid ${dragOver ? T.green : T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
          <Upload size={14} color={dragOver ? T.green : T.accent} />
        </div>
        <p style={{ fontFamily: T.sans, fontSize: 11, color: T.textSoft, margin: 0 }}>
          {tradeImages.length > 0 ? 'Add more screenshots' : 'Drop chart screenshots here'}
        </p>
        {tradeImages.length === 0 && (
          <p style={{ fontFamily: T.mono, fontSize: 9, color: T.muted, margin: 0 }}>PNG, JPG, WEBP · Multiple files supported</p>
        )}
      </div>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/* ═════════════════════════ RECYCLE BIN PANEL ═════════════════════════ */
function RecycleBinPanel({ deletedTrades, onRestore, onPermanentDelete, onEmptyBin }) {
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // Sort by most recently deleted first
  const sorted = useMemo(() =>
    [...deletedTrades].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)),
    [deletedTrades]
  );

  if (deletedTrades.length === 0) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Eraser size={20} color={T.muted} />
        </div>
        <p style={{ fontFamily: T.sans, color: T.sub, fontSize: 13, fontWeight: 600 }}>Recycle bin is empty</p>
        <p style={{ fontFamily: T.mono, color: T.muted, fontSize: 10, marginTop: 4 }}>Deleted trades appear here for {BIN_EXPIRY_DAYS} days</p>
      </div>
    );
  }

  return (
    <div>
      {/* Bin header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 10px', borderBottom: `1px solid ${T.border}30` }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>
          {deletedTrades.length} item{deletedTrades.length > 1 ? 's' : ''} · auto-deleted after {BIN_EXPIRY_DAYS} days
        </span>
        {confirmEmpty ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.red }}>Delete all permanently?</span>
            <button className="tj-btn" onClick={() => { onEmptyBin(); setConfirmEmpty(false); }}
              style={{ background: T.redL, border: `1px solid ${T.red}30`, color: T.red, padding: '4px 12px', fontSize: 10 }}>
              Yes, empty bin
            </button>
            <button className="tj-btn" onClick={() => setConfirmEmpty(false)}
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub, padding: '4px 10px', fontSize: 10 }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="tj-btn" onClick={() => setConfirmEmpty(true)}
            style={{ background: 'transparent', border: `1px solid ${T.border}30`, color: T.muted, padding: '4px 10px', fontSize: 9 }}>
            <Eraser size={9} /> Empty bin
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Symbol','Side','P&L','Deleted','Expires in',''].map(h => (
                <th key={h} style={{
                  padding: '9px 16px', textAlign: 'left',
                  fontFamily: T.sans, fontSize: 9, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.1em',
                  color: T.muted,
                  borderBottom: `1px solid ${T.border}20`,
                  background: 'transparent',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(trade => {
              const days = daysRemaining(trade.deletedAt);
              const tc = timerColor(days);
              const isUrgent = days <= 3;
              const isWin = trade.pnl > 0;
              const isConfirm = confirmId === trade.tid;

              return (
                <tr key={trade.tid} className="tj-bin-row">
                  {/* Symbol */}
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isWin ? T.green : T.red, opacity: 0.5, flexShrink: 0 }} />
                      <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: `${T.text}70`, letterSpacing: '-0.2px' }}>
                        {trade.symbol}
                      </span>
                    </div>
                  </td>

                  {/* Side */}
                  <td style={{ padding: '10px 16px' }}>
                    {trade.side ? (
                      <span style={{
                        fontFamily: T.mono, fontSize: 9, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 5,
                        background: trade.side?.toLowerCase() === 'long' ? 'rgba(0,229,160,0.06)' : 'rgba(255,68,102,0.06)',
                        color: trade.side?.toLowerCase() === 'long' ? `${T.green}80` : `${T.red}80`,
                        border: `1px solid ${trade.side?.toLowerCase() === 'long' ? `${T.green}18` : `${T.red}18`}`,
                        opacity: 0.8,
                      }}>
                        {trade.side.toUpperCase()}
                      </span>
                    ) : '—'}
                  </td>

                  {/* P&L */}
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: `${isWin ? T.green : T.red}70`, letterSpacing: '-0.3px' }}>
                      {isWin ? '+' : ''}{formatCurrency(trade.pnl)}
                    </span>
                  </td>

                  {/* Deleted date */}
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>
                      {dayjs(trade.deletedAt).format('MMM D, YYYY')}
                    </span>
                  </td>

                  {/* Timer */}
                  <td style={{ padding: '10px 16px' }}>
                    <div className={`tj-tooltip-wrap`}>
                      <div
                        className={isUrgent ? 'tj-timer-urgent' : ''}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 6,
                          fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                          background: `${tc}12`,
                          color: tc,
                          border: `1px solid ${tc}25`,
                        }}
                      >
                        <Clock size={9} />
                        {days === 0 ? 'Expiring today' : `${days}d left`}
                      </div>
                      <div className="tj-tooltip" style={{ bottom: 'calc(100% + 6px)' }}>
                        Expires {dayjs(trade.deletedAt).add(BIN_EXPIRY_DAYS, 'day').format('MMM D, YYYY')}
                      </div>
                    </div>
                  </td>
{/* Actions */}
<td style={{ padding: '10px 16px', textAlign: 'right', verticalAlign: 'bottom' }}>
  {isConfirm ? (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'flex-end' }}>
      <span style={{ fontFamily: T.mono, fontSize: 9, color: T.red }}>Permanently delete?</span>
      <button className="tj-btn" onClick={() => { onPermanentDelete(trade.tid); setConfirmId(null); }}
        style={{ background: T.redL, border: `1px solid ${T.red}30`, color: T.red, padding: '3px 10px', fontSize: 9 }}>
        Delete
      </button>
      <button className="tj-btn" onClick={() => setConfirmId(null)}
        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub, padding: '3px 8px', fontSize: 9 }}>
        No
      </button>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
      <button
        className="tj-btn"
        onClick={() => setConfirmId(trade.tid)}
        style={{ background: 'transparent', border: `1px solid ${T.border}30`, color: T.muted, padding: '4px 8px', fontSize: 10 }}
        title="Delete permanently"
      >
        <X size={10} />
      </button>
      <button
        className="tj-btn"
        onClick={() => onRestore(trade.tid)}
        style={{ background: T.greenL, border: `1px solid ${T.green}30`, color: T.green, padding: '4px 12px', fontSize: 10 }}
        title="Restore this trade"
      >
        <RotateCcw size={10} /> Restore
      </button>
    </div>
  )}
</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═════════════════════════ STAT CARD ═════════════════════════ */
function StatCard({ label, value, color, sub, icon: Icon, spark, delay = 0, animVal }) {
  return (
    <div className="tj-stat-card tj-fade" style={{ background: T.card, animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 600, color: T.sub, textTransform: 'uppercase', letterSpacing: '.12em' }}>{label}</span>
        {Icon && (
          <span style={{ width: 26, height: 26, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={12} color={color} />
          </span>
        )}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 6 }}>
        {animVal !== undefined
          ? <AnimNum value={animVal} fmt={v => typeof value === 'string' && value.includes('%') ? `${v.toFixed(1)}%` : Math.abs(v) > 100 ? formatCurrency(v) : v.toFixed(2)} />
          : value}
      </div>
      {sub && <p style={{ fontFamily: T.sans, fontSize: 10, color: T.sub, marginBottom: spark ? 8 : 0 }}>{sub}</p>}
      {spark && <div style={{ marginTop: 6 }}><Sparkline data={spark} color={color} width={110} height={24} /></div>}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════════════════════════ */
const Trades = () => {
const { trades, loading, addTrade, editTrade, removeTrade: deleteTrade, fetchTradeImages } = useTrades();
const { applyTradePnl, removeTradePnl } = useAccount();
  const [modalOpen,    setModalOpen]    = useState(false);
  const [filter,       setFilter]       = useState('All');
  const [search,       setSearch]       = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [tagFilter,    setTagFilter]    = useState([]);
  const [sort,         setSort]         = useState({ key: 'date', dir: -1 });
  const [selected,     setSelected]     = useState(new Set());
  const [expanded,     setExpanded]     = useState(null);
  const [tradeNotes,   setTradeNotes]   = useState({});
  const [tradeTags,    setTradeTags]    = useState({});
  const [tradeImages,  setTradeImages]  = useState({});
  const [showCols,     setShowCols]     = useState(false);
  const [showImport,   setShowImport]   = useState(false);
  const [importErr,    setImportErr]    = useState('');
  const [importOk,     setImportOk]     = useState('');
  const [dragOver,     setDragOver]     = useState(false);
  const [deletingId,   setDeletingId]   = useState(null);

  // ── Recycle Bin state ──────────────────────────────────────
  const [deletedTrades, setDeletedTrades] = useState(() => {
    try {
      const stored = localStorage.getItem('tj_recycle_bin');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Purge expired items on load
      const now = dayjs();
      return parsed.filter(t => dayjs(t.deletedAt).add(BIN_EXPIRY_DAYS, 'day').isAfter(now));
    } catch { return []; }
  });
  const [showBin,      setShowBin]      = useState(false);

  const [cols, setCols] = useState({
    date: true, symbol: true, side: true, pnl: true,
    rMultiple: true, tags: true, notes: false,
  });

  const fileRef    = useRef();
  const searchRef  = useRef();

  // ── Persist recycle bin to localStorage ──
  useEffect(() => {
    try {
      localStorage.setItem('tj_recycle_bin', JSON.stringify(deletedTrades));
    } catch { /* quota exceeded */ }
  }, [deletedTrades]);

  // ── Auto-purge expired bin items every minute ──
  useEffect(() => {
    const purge = () => {
      const now = dayjs();
      setDeletedTrades(prev => prev.filter(t => dayjs(t.deletedAt).add(BIN_EXPIRY_DAYS, 'day').isAfter(now)));
    };
    purge();
    const id = setInterval(purge, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const fn = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') setModalOpen(true);
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setModalOpen(false); setExpanded(null); setShowBin(false); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // ── Hydrate tradeImages from DB ──
useEffect(() => {
  if (!trades.length) return;
  setTradeImages(prev => {
    const next = { ...prev };
    trades.forEach((t) => {
      if (t.images?.length && !next[t._id]?.some(img => img.src)) {
        next[t._id] = t.images;
      }
    });
    return next;
  });
}, [trades]);
  /* ── Delete trade → Recycle Bin ── */
  const handleDelete = useCallback((e, trade, idx) => {
    e.stopPropagation();
const tid = trade._id ?? trade.id ?? `${trade.symbol}_${trade.date}_${trade.pnl}_${idx}`;
    // Animate out
    setDeletingId(tid);
    setTimeout(() => {
      setDeletingId(null);
      // Move to recycle bin
      setDeletedTrades(prev => {
        const already = prev.find(t => t.tid === tid);
        if (already) return prev;
        return [...prev, {
          ...trade,
          tid,
          deletedAt: new Date().toISOString(),
          notes:  tradeNotes[tid] || '',
          tags:   tradeTags[tid]  || [],
          imgs:   tradeImages[tid] || [],
        }];
      });
      // Remove from selected
      setSelected(s => { const n = new Set(s); n.delete(tid); return n; });
      // Remove from main list via hook (if deleteTrade is available)
      if (typeof deleteTrade === 'function') {
        deleteTrade(trade._id || trade.id);
      }
      if (trade._id || trade.id) removeTradePnl(trade._id || trade.id); // ← ADD THIS LINE
      // Collapse if expanded
      // Collapse if expanded
      setExpanded(cur => cur === tid ? null : cur);
    }, 320);
  }, [tradeNotes, tradeTags, tradeImages, deleteTrade, removeTradePnl]);

  /* ── Restore from bin ── */
  const handleRestore = useCallback((tid) => {
    const trade = deletedTrades.find(t => t.tid === tid);
    if (!trade) return;
    // Add back to trades
    const { deletedAt, tid: _tid, notes, tags, imgs, ...tradeData } = trade;
    addTrade(tradeData);
    // Restore notes/tags/images
    if (notes) setTradeNotes(prev => ({ ...prev, [tid]: notes }));
    if (tags?.length) setTradeTags(prev => ({ ...prev, [tid]: tags }));
    if (imgs?.length) setTradeImages(prev => ({ ...prev, [tid]: imgs }));
    // Remove from bin
    setDeletedTrades(prev => prev.filter(t => t.tid !== tid));
    spawnConfetti();
  }, [deletedTrades, addTrade]);

  /* ── Permanent delete from bin ── */
  const handlePermanentDelete = useCallback((tid) => {
    setDeletedTrades(prev => prev.filter(t => t.tid !== tid));
  }, []);

  /* ── Empty bin ── */
  const handleEmptyBin = useCallback(() => {
    setDeletedTrades([]);
    setShowBin(false);
  }, []);

  
  /* ── Filtered + sorted trades ── */
  const filteredTrades = useMemo(() => {
    // Exclude trades that are in the recycle bin
    const binIds = new Set(deletedTrades.map(t => t.tid));
    return trades
      .filter(t => {
        const tid = t.id ?? t._id ?? `${t.symbol}_${t.date}_${t.pnl}`;
        if (binIds.has(tid)) return false;
        const outcome = t.pnl > 0 ? 'Winners' : t.pnl < 0 ? 'Losers' : 'Breakeven';
        if (filter !== 'All' && filter !== outcome && t.side !== filter) return false;
        if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
        if (dateFrom && dayjs(t.date).isBefore(dayjs(dateFrom))) return false;
        if (dateTo   && dayjs(t.date).isAfter(dayjs(dateTo).endOf('day'))) return false;
        const stableId = t.id ?? t._id ?? `${t.symbol}_${t.date}_${t.pnl}`;
        const tTags = tradeTags[stableId] || [];
        if (tagFilter.length && !tagFilter.every(tf => tTags.includes(tf))) return false;
        return true;
      })
      .sort((a, b) => {
        let va = a[sort.key], vb = b[sort.key];
        if (sort.key === 'date') { va = new Date(va); vb = new Date(vb); }
        if (sort.key === 'rMultiple') {
          const avgL = trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0) /
            Math.max(trades.filter(t => t.pnl < 0).length, 1);
          va = avgL ? a.pnl / Math.abs(avgL) : 0;
          vb = avgL ? b.pnl / Math.abs(avgL) : 0;
        }
        return sort.dir * (va > vb ? 1 : va < vb ? -1 : 0);
      });
  }, [trades, filter, search, dateFrom, dateTo, tagFilter, tradeTags, sort, deletedTrades]);



/* ── Bulk delete selected ── */
const handleBulkDelete = useCallback(() => {
  const toDelete = filteredTrades.filter((t, i) => {
    const tid = t.id ?? t._id ?? `${t.symbol}_${t.date}_${t.pnl}_${i}`;
    return selected.has(tid);
  });
  toDelete.forEach((t, i) => {
    const tid = t.id ?? t._id ?? `${t.symbol}_${t.date}_${t.pnl}_${i}`;
    setDeletedTrades(prev => {
      if (prev.find(x => x.tid === tid)) return prev;
      return [...prev, { ...t, tid, deletedAt: new Date().toISOString(), notes: tradeNotes[tid] || '', tags: tradeTags[tid] || [], imgs: tradeImages[tid] || [] }];
    });
    if (typeof deleteTrade === 'function') deleteTrade(t._id || t.id);
    if (t._id || t.id) removeTradePnl(t._id || t.id); // ← ADD THIS LINE
  });
  setSelected(new Set());
}, [selected, filteredTrades, tradeNotes, tradeTags, tradeImages, deleteTrade, removeTradePnl]);


  /* ── Stats ── */
  const stats = useMemo(() => {
    const wnrs  = filteredTrades.filter(t => t.pnl > 0);
    const losrs = filteredTrades.filter(t => t.pnl < 0);
    const net   = filteredTrades.reduce((s, t) => s + t.pnl, 0);
    const wr    = pct(wnrs.length, filteredTrades.length);
    const avgW  = wnrs.length  ? wnrs.reduce((s, t)  => s + t.pnl, 0) / wnrs.length  : 0;
    const avgL  = losrs.length ? Math.abs(losrs.reduce((s, t) => s + t.pnl, 0) / losrs.length) : 0;
    const pf    = avgL && losrs.length ? fix2(avgW * wnrs.length / (avgL * losrs.length)) : 0;
    const avgPnl = filteredTrades.length ? fix2(net / filteredTrades.length) : 0;

    const equity = [];
    let running = 0;
    [...filteredTrades].reverse().forEach(t => { running += t.pnl; equity.push(running); });

    const chrono = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cur = 0, streakType = 'win';
    chrono.forEach(t => {
      if (t.pnl > 0)      { cur = (cur > 0 ? cur : 0) + 1; streakType = 'win'; }
      else if (t.pnl < 0) { cur = (cur < 0 ? cur : 0) - 1; streakType = 'loss'; }
    });

    const maxAbsPnl = Math.max(...filteredTrades.map(t => Math.abs(t.pnl)), 1);
    return { net, wr, avgW, avgL, pf, avgPnl, streak: Math.abs(cur), streakType, wnrs, losrs, maxAbsPnl, equity };
  }, [filteredTrades, trades]);

  /* ── R-Multiple ── */
  const avgLossAbs = useMemo(() => {
    const l = trades.filter(t => t.pnl < 0);
    return l.length ? Math.abs(l.reduce((s, t) => s + t.pnl, 0) / l.length) : 1;
  }, [trades]);
  const rMultiple = pnl => fix2(pnl / avgLossAbs);

  const highlightSym = useCallback((symbol) => {
    if (!search) return symbol;
    const idx = symbol.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return symbol;
    return (
      <>
        {symbol.slice(0, idx)}
        <span style={{ color: T.accent, background: T.accentL, borderRadius: 3, padding: '0 2px' }}>
          {symbol.slice(idx, idx + search.length)}
        </span>
        {symbol.slice(idx + search.length)}
      </>
    );
  }, [search]);

  const toggleTag = useCallback((tid, tag) => {
    setTradeTags(prev => {
      const current = prev[tid] || [];
      const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
      return { ...prev, [tid]: updated };
    });
  }, []);

  /* ── Sort helper ── */
  const sortBy = key => setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }));

  const SortArrow = ({ col }) => {
    if (sort.key !== col) return <span style={{ color: T.muted, fontSize: 9, marginLeft: 4 }}>↕</span>;
    return <span style={{ color: T.accent, fontSize: 10, marginLeft: 4 }}>{sort.dir === -1 ? '↓' : '↑'}</span>;
  };

  /* ── Selection ── */
  const toggleSelect = useCallback((e, id) => {
    e.stopPropagation();
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const selectAll   = useCallback(() => setSelected(new Set(
    filteredTrades.map((t, i) => t.id ?? t._id ?? `${t.symbol}_${t.date}_${t.pnl}_${i}`)
  )), [filteredTrades]);
  const clearSel    = useCallback(() => setSelected(new Set()), []);
  const allSelected = filteredTrades.length > 0 && filteredTrades.every((t, i) => {
    const tid = t.id ?? t._id ?? `${t.symbol}_${t.date}_${t.pnl}_${i}`;
    return selected.has(tid);
  });

  /* ── Expand toggle ── */
  const toggleExpand = useCallback(async (id) => {
  setExpanded(cur => cur === id ? null : id);
  if (expanded === id) return;
  const existing = tradeImages[id] || [];
  const hasFullImages = existing.some(img => img.src);
  if (!hasFullImages) {
    try {
      const imgs = await fetchTradeImages(id);
      if (imgs?.length) {
        setTradeImages(prev => ({ ...prev, [id]: imgs }));
      } else {
        const { getTradeById } = await import('../services/tradeService');
        const res = await getTradeById(id);
        if (res.data?.screenshot) {
          setTradeImages(prev => ({
            ...prev,
            [id]: [{
              id: `img_${id}`,
              src: res.data.screenshot,
              name: `${res.data.symbol}_chart.png`,
              addedAt: res.data.createdAt,
            }]
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load images', e);
    }
  }
}, [expanded, tradeImages, fetchTradeImages]);

  /* ── Export ── */
  const exportCSV = (subset = null) => {
    const rows = (subset || filteredTrades).map(t =>
      `${t.date},${t.symbol},${t.side || ''},${t.pnl},${rMultiple(t.pnl)},"${(tradeNotes[t.id] || '').replace(/"/g, "'")}","${(tradeTags[t.id] || []).join(';')}"`
    );
    const blob = new Blob([['Date,Symbol,Side,PnL,R-Multiple,Notes,Tags', ...rows].join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `trades_${dayjs().format('YYYY-MM-DD')}.csv`,
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  /* ── Import ── */
  const handleImport = async file => {
    setImportErr(''); setImportOk('');
    if (!file || !file.name.endsWith('.csv')) { setImportErr('Please select a .csv file'); return; }
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) { setImportErr('No valid rows found. Check CSV format.'); return; }
      rows.forEach(r => addTrade(r));
      setImportOk(`✓ Imported ${rows.length} trade${rows.length > 1 ? 's' : ''}`);
      setTimeout(() => { setShowImport(false); setImportOk(''); }, 2000);
    } catch (e) { setImportErr('Parse error: ' + e.message); }
  };

  /* ── Add trade ── */
const handleAdd = useCallback(async (trade) => {
  const saved = await addTrade(trade);
  if (saved?.pnl > 0) setTimeout(spawnConfetti, 100);
  if (saved?._id) await applyTradePnl(saved.pnl, saved._id, saved.symbol); // ← ADD THIS LINE
  const src = saved?.screenshot;
  if (src && saved?._id) {
    const image = {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      src,
      name: `${saved.symbol}_chart.png`,
      addedAt: new Date().toISOString()
    };
    setTradeImages(prev => ({
      ...prev,
      [saved._id]: [image],
    }));
  }
}, [addTrade, applyTradePnl]);

  if (loading) return <Loader />;

  /* ── Urgency badge for bin button ── */
  const urgentBinCount = deletedTrades.filter(t => daysRemaining(t.deletedAt) <= 3).length;
  const binHasItems = deletedTrades.length > 0;

  /* ── Table header cell ── */
  const TH = ({ col, label, sortable = true, align = 'left' }) => (
    <th
      className={sortable ? 'tj-sort' : ''}
      onClick={sortable ? () => sortBy(col) : undefined}
      style={{
        padding: '13px 16px', textAlign: align,
        fontFamily: T.sans, fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '.1em',
        color: sort.key === col ? T.accent : T.sub,
        background: T.surface, whiteSpace: 'nowrap',
        borderBottom: `1px solid ${T.border}`,
      }}>
      {label}{sortable && <SortArrow col={col} />}
    </th>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text, position: 'relative' }}>
      <div className="tj-noise" />

      {/* Ambient glow orbs */}
      <div style={{ position: 'fixed', top: -120, left: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,142,247,.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -100, right: -60, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,229,160,.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '28px 28px 60px' }}>

        {/* ══ HEADER ══ */}
        <div className="tj-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${T.accent},${T.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px rgba(79,142,247,.35)` }}>
                <Activity size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontFamily: T.head, fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.5px', lineHeight: 1, margin: 0 }}>
                  Trade Journal
                </h1>
                <p style={{ fontFamily: T.sans, color: T.sub, fontSize: 11, marginTop: 3 }}>
                  {filteredTrades.length} of {trades.length} trades
                  <span style={{ color: T.muted, marginLeft: 10 }}>· N · / · Esc</span>
                </p>
              </div>
              <StreakBadge streak={stats.streak} type={stats.streakType} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* ── Recycle Bin button — subtle, tucked in ── */}
            <div className="tj-tooltip-wrap" style={{ position: 'relative' }}>
              <button
                className="tj-btn"
                onClick={() => setShowBin(v => !v)}
                style={{
                  background: showBin ? 'rgba(255,68,102,.08)' : 'transparent',
                  border: `1px solid ${showBin ? `${T.red}25` : `${T.border}60`}`,
                  color: showBin ? `${T.red}90` : T.muted,
                  padding: '8px 10px',
                  fontSize: 10,
                  position: 'relative',
                }}
                title="Recycle Bin"
              >
                <Trash2 size={12} />
                {/* {binHasItems && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: urgentBinCount > 0 ? T.red : T.muted,
                    color: '#fff',
                    fontFamily: T.mono, fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: urgentBinCount > 0 ? `0 0 8px ${T.red}60` : 'none',
                    border: `1.5px solid ${T.bg}`,
                  }}>
                    {deletedTrades.length}
                  </span>
                )} */}
              </button>
              <div className="tj-tooltip">
                Recycle Bin{binHasItems ? ` · ${deletedTrades.length} item${deletedTrades.length > 1 ? 's' : ''}` : ' · Empty'}
              </div>
            </div>

            <div style={{ width: 1, height: 28, background: `${T.border}60` }} />

            <button className="tj-btn" onClick={() => setShowImport(v => !v)}
              style={{ background: showImport ? T.accentL : T.card, border: `1px solid ${showImport ? T.accent : T.border}`, color: showImport ? T.accent : T.sub }}>
              <Upload size={13} /> Import
            </button>
            <button className="tj-btn" onClick={() => exportCSV()}
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub }}>
              <Download size={13} /> Export
            </button>
            <button className="tj-btn" onClick={() => setShowCols(v => !v)}
              style={{ background: showCols ? T.accentL : T.card, border: `1px solid ${showCols ? T.accent : T.border}`, color: showCols ? T.accent : T.sub }}>
              <SlidersHorizontal size={13} />
            </button>
            <button className="tj-btn tj-pop" onClick={() => setModalOpen(true)}
              style={{ background: `linear-gradient(135deg,${T.accent},${T.cyan})`, color: '#fff', boxShadow: `0 4px 20px rgba(79,142,247,.4)`, padding: '9px 20px' }}>
              <Plus size={14} /> New Trade
            </button>
          </div>
        </div>

        {/* ══ RECYCLE BIN PANEL — renders here if open ══ */}
        {showBin && (
          <div className="tj-scalein tj-bin-panel" style={{ marginBottom: 16 }}>
            {/* Bin header */}
            <div style={{
              padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: `1px solid ${T.border}20`,
            }}>
              <Trash2 size={12} color={T.muted} />
              <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.sub, letterSpacing: '.06em' }}>
                Recycle Bin
              </span>
              {urgentBinCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontFamily: T.mono, fontSize: 9, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 6,
                  background: T.redL, color: T.red, border: `1px solid ${T.red}25`,
                }}>
                  <AlertTriangle size={8} />
                  {urgentBinCount} expiring soon
                </span>
              )}
              <button
                onClick={() => setShowBin(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={13} />
              </button>
            </div>
            <RecycleBinPanel
              deletedTrades={deletedTrades}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              onEmptyBin={handleEmptyBin}
            />
          </div>
        )}

        {/* ══ STATS GRID ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* Net P&L */}
          <div className="tj-stat-card tj-fade" style={{
            background: stats.net >= 0
              ? `linear-gradient(135deg,rgba(0,229,160,.08),${T.card} 60%)`
              : `linear-gradient(135deg,rgba(255,68,102,.08),${T.card} 60%)`,
            border: `1px solid ${stats.net >= 0 ? `${T.green}30` : `${T.red}30`}`,
            animationDelay: '0ms',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '.12em' }}>Net P&L</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: T.mono, fontSize: 10, color: stats.net >= 0 ? T.green : T.red }}>
                {stats.net >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stats.wr}% WR
              </span>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 36, fontWeight: 900, color: stats.net >= 0 ? T.green : T.red, letterSpacing: '-2px', lineHeight: 1, marginBottom: 10 }}>
              <AnimNum value={stats.net} fmt={v => formatCurrency(v)} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <Sparkline data={stats.equity} color={stats.net >= 0 ? T.green : T.red} width={200} height={32} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontFamily: T.sans, fontSize: 10, color: T.green }}>▲ {formatCurrency(stats.avgW)} avg win</span>
              <span style={{ fontFamily: T.sans, fontSize: 10, color: T.red }}>▼ {formatCurrency(stats.avgL)} avg loss</span>
            </div>
          </div>

          <StatCard delay={40}  label="Win Rate"      icon={Target}     color={stats.wr >= 50 ? T.green : T.yellow}
            value={`${stats.wr}%`} animVal={stats.wr}
            sub={`${stats.wnrs.length}W · ${stats.losrs.length}L`} />

          <StatCard delay={80}  label="Profit Factor" icon={BarChart2}  color={T.accent}
            value={stats.pf}       animVal={stats.pf}
            sub="Gross W ÷ Gross L" />

          <StatCard delay={120} label="Avg Win"        icon={TrendingUp}  color={T.green}
            value={formatCurrency(stats.avgW)}
            sub={`vs ${formatCurrency(stats.avgL)} avg loss`} />

          <StatCard delay={160} label="Avg P&L/Trade"  icon={Zap}         color={stats.avgPnl >= 0 ? T.green : T.red}
            value={formatCurrency(stats.avgPnl)}
            sub={`${filteredTrades.length} trades in view`} />
        </div>

        {/* ══ IMPORT PANEL ══ */}
        {showImport && (
          <div className="tj-scalein" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontFamily: T.head, fontSize: 14, fontWeight: 700, color: T.text }}>Import from CSV</p>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleImport(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? T.accent : T.borderHi}`, borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? T.accentG : 'transparent', transition: 'all .2s' }}>
              <Upload size={30} style={{ color: dragOver ? T.accent : T.sub, marginBottom: 12 }} />
              <p style={{ fontFamily: T.sans, color: T.textSoft, fontSize: 13, marginBottom: 6 }}>Drag & drop a CSV, or click to browse</p>
              <p style={{ fontFamily: T.mono, color: T.muted, fontSize: 10 }}>Columns: Date, Symbol, Side, PnL — Notes & Tags optional</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleImport(e.target.files[0])} />
            {importErr && <p style={{ color: T.red, fontFamily: T.mono, fontSize: 11, marginTop: 12 }}>⚠ {importErr}</p>}
            {importOk  && <p style={{ color: T.green, fontFamily: T.mono, fontSize: 11, marginTop: 12 }}>{importOk}</p>}
          </div>
        )}

        {/* ══ COLUMN TOGGLE ══ */}
        {showCols && (
          <div className="tj-scalein" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 20px', marginBottom: 14, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '.1em' }}>
              Visible Columns
            </span>
            {Object.entries(cols).map(([k, v]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <input type="checkbox" className="tj-check" checked={v} onChange={() => setCols(c => ({ ...c, [k]: !c[k] }))} />
                <span style={{ fontFamily: T.mono, fontSize: 11, color: v ? T.text : T.sub, textTransform: 'capitalize', userSelect: 'none' }}>{k}</span>
              </label>
            ))}
          </div>
        )}

        {/* ══ FILTER BAR ══ */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 3 }}>
            {['All','Long','Short','Winners','Losers'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', fontSize: 10, fontFamily: T.mono, fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: 8, letterSpacing: '.04em', background: filter === f ? T.accent : 'transparent', color: filter === f ? '#fff' : T.sub, transition: 'all .15s', boxShadow: filter === f ? `0 2px 12px rgba(79,142,247,.35)` : 'none' }}>{f}</button>
            ))}
          </div>

          <div style={{ width: 1, height: 28, background: T.border }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={12} style={{ position: 'absolute', left: 10, color: T.sub, pointerEvents: 'none' }} />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Symbol  (/)" className="tj-input" style={{ paddingLeft: 30, width: 150, height: 34 }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 0 }}>
                <X size={11} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} color={T.sub} />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="tj-input" style={{ width: 145, height: 34, colorScheme: 'dark' }} />
            <span style={{ color: T.muted, fontSize: 12 }}>—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="tj-input" style={{ width: 145, height: 34, colorScheme: 'dark' }} />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 10, fontFamily: T.mono }}>Clear</button>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <Tag size={11} color={T.sub} />
            {tagFilter.map(t => (
              <span key={t} className="tj-tag" style={{ background: T.accentL, color: T.accent, border: `1px solid ${T.accent}35` }} onClick={() => setTagFilter(f => f.filter(x => x !== t))}>
                {t} <X size={8} />
              </span>
            ))}
            {OUTCOME_TAGS.filter(t => !tagFilter.includes(t)).slice(0, 6).map(t => {
              const [fg] = TAG_COLORS[t] || [T.sub];
              return (
                <button key={t} onClick={() => setTagFilter(f => [...f, t])}
                  style={{ padding: '2px 9px', fontSize: 9, fontFamily: T.mono, fontWeight: 700, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.muted, cursor: 'pointer', transition: 'all .15s', letterSpacing: '.03em' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${fg}60`; e.currentTarget.style.color = fg; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
                  +{t}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ BULK ACTION BAR ══ */}
        {selected.size > 0 && (
          <div className="tj-pop" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: T.accentL, border: `1px solid ${T.accent}35`, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, animation: 'tj-pulse 1.5s ease infinite' }} />
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.accent, fontWeight: 700 }}>
              {selected.size} trade{selected.size > 1 ? 's' : ''} selected
            </span>
            <button className="tj-btn"
              onClick={() => exportCSV(filteredTrades.filter((t, i) => selected.has(t.id ?? t._id ?? `${t.symbol}_${t.date}_${t.pnl}_${i}`)))}
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textSoft, padding: '5px 12px', fontSize: 10 }}>
              <Download size={11} /> Export Selected
            </button>
            <button className="tj-btn"
              onClick={handleBulkDelete}
              style={{ background: T.redL, border: `1px solid ${T.red}30`, color: T.red, padding: '5px 12px', fontSize: 10 }}>
              <Trash2 size={11} /> Move to Bin
            </button>
            <button onClick={clearSel} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.sub, cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ══ TRADE TABLE ══ */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '13px 16px', background: T.surface, width: 44, borderBottom: `1px solid ${T.border}` }}>
                    <input type="checkbox" className="tj-check" checked={allSelected}
                      onChange={e => { e.stopPropagation(); allSelected ? clearSel() : selectAll(); }} />
                  </th>
                  {cols.date      && <TH col="date"      label="Date" />}
                  {cols.symbol    && <TH col="symbol"    label="Symbol" />}
                  {cols.side      && <TH col="side"      label="Side" sortable={false} />}
                  {cols.pnl       && <TH col="pnl"       label="P&L" />}
                  {cols.rMultiple && <TH col="rMultiple" label="R×" />}
                  {cols.tags      && <TH col="tags"      label="Tags" sortable={false} />}
                  {cols.notes     && <TH col="notes"     label="Notes" sortable={false} />}
                  <TH col="img"  label="📷" sortable={false} align="center" />
                  {/* Delete column header — minimal */}
                  <th style={{ padding: '13px 16px', background: T.surface, width: 80, borderBottom: `1px solid ${T.border}` }} />
                </tr>
              </thead>

              <tbody>
                {filteredTrades.map((trade, idx) => {
                  const tid   = trade.id ?? trade._id ?? `${trade.symbol}_${trade.date}_${trade.pnl}_${idx}`;
                  const isWin = trade.pnl > 0;
                  const r     = rMultiple(trade.pnl);
                  const isExp = expanded === tid;
                  const isSel = selected.has(tid);
                  const tags  = tradeTags[tid] || [];
                  const note  = tradeNotes[tid] || '';
                  const imgs  = tradeImages[tid] || [];
                  const hasImages = imgs.length > 0;
                  const isDeleting = deletingId === tid;

                  return (
                    <React.Fragment key={tid}>
                      {/* ── MAIN ROW ── */}
                      <tr
                        className={`tj-row${isSel ? ' selected' : ''}${isExp ? ' expanded' : ''}${isDeleting ? ' deleting' : ''}`}
                        onClick={() => toggleExpand(tid)}
                        style={{ borderBottom: `1px solid ${T.border}` }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="tj-check" checked={isSel}
                            onChange={e => toggleSelect(e, tid)} />
                        </td>

                        {/* Date */}
                        {cols.date && (
                          <td style={{ padding: '12px 16px', fontFamily: T.mono, fontSize: 12, color: T.sub, whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'block', fontSize: 13, color: T.textSoft, fontWeight: 600 }}>
                              {dayjs(trade.date).format('MMM DD')}
                            </span>
                            <span style={{ fontSize: 10, color: T.sub }}>
                              {dayjs(trade.date).format('YYYY')}
                            </span>
                          </td>
                        )}

                        {/* Symbol */}
                        {cols.symbol && (
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isWin ? T.green : T.red, boxShadow: `0 0 8px ${isWin ? T.green : T.red}80` }} />
                              <span style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
                                {highlightSym(trade.symbol)}
                              </span>
                              {hasImages && <span className="tj-img-dot" title={`${imgs.length} screenshot${imgs.length > 1 ? 's' : ''}`} />}
                            </div>
                          </td>
                        )}

                        {/* Side */}
                        {cols.side && (
                          <td style={{ padding: '12px 16px' }}>
                            {trade.side ? (
                              <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6, letterSpacing: '.06em', background: trade.side?.toLowerCase() === 'long' ? T.greenL : T.redL, color: trade.side?.toLowerCase() === 'long' ? T.green : T.red, border: `1px solid ${trade.side?.toLowerCase() === 'long' ? `${T.green}30` : `${T.red}30`}` }}>
                                {trade.side.toUpperCase()}
                              </span>
                            ) : <span style={{ color: T.muted }}>—</span>}
                          </td>
                        )}

                        {/* P&L */}
                        {cols.pnl && (
                          <td style={{ padding: '12px 16px', minWidth: 110 }}>
                            <span style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 800, color: isWin ? T.green : T.red, letterSpacing: '-0.5px' }}>
                              {isWin ? '+' : ''}{formatCurrency(trade.pnl)}
                            </span>
                            <MiniBar value={trade.pnl} max={stats.maxAbsPnl} color={isWin ? T.green : T.red} />
                          </td>
                        )}

                        {/* R-Multiple */}
                        {cols.rMultiple && (
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: r >= 2 ? T.greenL : r >= 0 ? T.accentL : T.redL, color: r >= 2 ? T.green : r >= 0 ? T.accent : T.red, border: `1px solid ${r >= 2 ? `${T.green}30` : r >= 0 ? `${T.accent}30` : `${T.red}30`}` }}>
                              {r >= 0 ? '+' : ''}{r}R
                            </span>
                          </td>
                        )}

                        {/* Tags */}
                        {cols.tags && (
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {tags.length
                                ? tags.map(tag => <TagPill key={tag} tag={tag} />)
                                : <span style={{ color: T.muted, fontFamily: T.mono, fontSize: 10 }}>—</span>}
                            </div>
                          </td>
                        )}

                        {/* Notes preview */}
                        {cols.notes && (
                          <td style={{ padding: '12px 16px', maxWidth: 180 }}>
                            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.sub, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {note || <span style={{ color: T.muted }}>—</span>}
                            </span>
                          </td>
                        )}

                        {/* Image count */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {hasImages ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: T.accentL, color: T.accent, border: `1px solid ${T.accent}35` }}>
                              <Image size={9} />{imgs.length}
                            </span>
                          ) : (
                            <span style={{ color: T.muted, fontFamily: T.mono, fontSize: 10 }}>—</span>
                          )}
                        </td>

                        {/* Actions: expand + delete */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                            {/* Delete button — hidden until row hover */}
                            <div className="tj-delete-btn tj-tooltip-wrap">
                              <button
                                onClick={e => handleDelete(e, trade, idx)}
                                style={{
                                  width: 28, height: 28, borderRadius: 7,
                                  background: 'transparent',
                                  border: `1px solid ${T.border}40`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', color: T.muted,
                                  transition: 'all .15s',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = T.redL;
                                  e.currentTarget.style.borderColor = `${T.red}40`;
                                  e.currentTarget.style.color = T.red;
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderColor = `${T.border}40`;
                                  e.currentTarget.style.color = T.muted;
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                              <div className="tj-tooltip">Move to Recycle Bin</div>
                            </div>

                            {/* Expand arrow */}
                            <div
                              onClick={() => toggleExpand(tid)}
                              style={{ width: 26, height: 26, borderRadius: 7, background: isExp ? T.accentL : 'transparent', border: `1px solid ${isExp ? `${T.accent}40` : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', cursor: 'pointer' }}>
                              <ChevronRight size={14} color={isExp ? T.accent : T.sub}
                                style={{ transition: 'transform .22s', transform: isExp ? 'rotate(90deg)' : 'none' }} />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* ── EXPANDED DETAIL ROW ── */}
                      {isExp && (
                        <tr key={`${tid}_exp`}>
                          <td colSpan={Object.values(cols).filter(Boolean).length + 4}
                            style={{ padding: 0, background: T.cardHigh }}>
                            <div className="tj-scalein" style={{ padding: '24px 24px 28px', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}22` }}>

                              {/* Notes + Tags */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                                {/* Left — Notes */}
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 6, background: T.accentL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <FileText size={12} color={T.accent} />
                                    </div>
                                    <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '.1em' }}>Trade Notes</span>
                                  </div>
                                  <textarea
                                    value={note}
                                    onChange={e => setTradeNotes(n => ({ ...n, [tid]: e.target.value }))}
                                    onClick={e => e.stopPropagation()}
                                    placeholder="What went well? What would you do differently? Key lessons..."
                                    rows={5}
                                    className="tj-input"
                                    style={{ resize: 'vertical', lineHeight: 1.7, fontSize: 12, fontFamily: T.sans }}
                                  />
                                </div>

                                {/* Right — Tags + metrics */}
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 6, background: T.accentL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Tag size={12} color={T.accent} />
                                    </div>
                                    <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '.1em' }}>Playbook Tags</span>
                                  </div>

                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                                    {OUTCOME_TAGS.map(tag => {
                                      const active = tags.includes(tag);
                                      const [fg, bg] = TAG_COLORS[tag] || [T.sub, `${T.muted}22`];
                                      return (
                                        <button key={tag}
                                          onClick={e => { e.stopPropagation(); toggleTag(tid, tag); }}
                                          className="tj-tag"
                                          style={{ background: active ? bg : 'transparent', color: active ? fg : T.sub, border: `1px solid ${active ? `${fg}50` : `${T.muted}30`}`, cursor: 'pointer', transition: 'all .15s' }}>
                                          {tag}
                                          {active && <X size={8} style={{ opacity: .7 }} />}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Quick metrics */}
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                                    {[
                                      { l: 'P&L',  v: `${isWin ? '+' : ''}${formatCurrency(trade.pnl)}`, c: isWin ? T.green : T.red },
                                      { l: 'R×',   v: `${r >= 0 ? '+' : ''}${r}R`, c: r >= 1 ? T.green : r >= 0 ? T.accent : T.red },
                                      { l: 'Date', v: dayjs(trade.date).format('MMM D'), c: T.textSoft },
                                      { l: 'Side', v: (trade.side || '—').toUpperCase(), c: trade.side?.toLowerCase() === 'long' ? T.green : T.red },
                                    ].map(({ l, v, c }) => (
                                      <div key={l} style={{ background: T.card, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
                                        <p style={{ fontFamily: T.sans, fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{l}</p>
                                        <p style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color: c }}>{v}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Divider */}
                              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.border}, transparent)`, marginBottom: 24 }} />

                              {/* Image section */}
                              <div onClick={e => e.stopPropagation()}>
                                <TradeImagePanel
                                  tradeId={tid}
                                  images={tradeImages}
                                  onImagesChange={(updaterFn) => {
                                    setTradeImages(prev => {
                                      const next = typeof updaterFn === 'function' ? updaterFn(prev) : updaterFn;
                                      editTrade(tid, { images: next[tid] || [] });
                                      return next;
                                    });
                                  }}
                                />
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Empty state */}
                {!filteredTrades.length && (
                  <tr>
                    <td colSpan={10} style={{ padding: '72px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BarChart2 size={24} color={T.muted} />
                        </div>
                        <p style={{ fontFamily: T.head, color: T.textSoft, fontSize: 15, fontWeight: 700 }}>No trades match your filters</p>
                        <p style={{ fontFamily: T.sans, color: T.sub, fontSize: 12 }}>
                          Adjust filters, or press{' '}
                          <kbd style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 7px', fontFamily: T.mono, fontSize: 11, color: T.textSoft }}>N</kbd>
                          {' '}to log a new trade
                        </p>
                        {deletedTrades.length > 0 && (
                          <button className="tj-btn" onClick={() => setShowBin(true)}
                            style={{ background: 'transparent', border: `1px solid ${T.border}40`, color: T.muted, marginTop: 4, fontSize: 10 }}>
                            <Trash2 size={10} /> {deletedTrades.length} trade{deletedTrades.length > 1 ? 's' : ''} in Recycle Bin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filteredTrades.length > 0 && (
            <div style={{ padding: '10px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
              <span style={{ fontFamily: T.mono, color: T.muted, fontSize: 10 }}>
                {filteredTrades.length} rows
                {selected.size > 0 && ` · ${selected.size} selected`}
                {' · '}Avg R:{' '}
                <span style={{ color: T.textSoft }}>
                  {fix2(filteredTrades.reduce((s, t) => s + rMultiple(t.pnl), 0) / filteredTrades.length)}
                </span>
                {deletedTrades.length > 0 && (
                  <span style={{ marginLeft: 12, color: T.muted }}>
                    ·{' '}
                    <button onClick={() => setShowBin(v => !v)}
                      style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontFamily: T.mono, fontSize: 10, padding: 0, textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                      {deletedTrades.length} in bin
                    </button>
                  </span>
                )}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted }}>
                Net:{' '}
                <span style={{ color: stats.net >= 0 ? T.green : T.red, fontWeight: 700 }}>
                  {formatCurrency(stats.net)}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* ══ KEYBOARD HINTS ══ */}
        <div style={{ marginTop: 20, display: 'flex', gap: 18, justifyContent: 'center' }}>
          {[['N', 'New trade'], ['/', 'Search'], ['Esc', 'Close']].map(([k, l]) => (
            <span key={k} style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, display: 'flex', gap: 6, alignItems: 'center' }}>
              <kbd style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 7px', color: T.sub, fontSize: 10 }}>{k}</kbd>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* ══ MODAL ══ */}
      <AddTradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  );
};

export default Trades;