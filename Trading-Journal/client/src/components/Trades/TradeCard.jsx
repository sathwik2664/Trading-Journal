import { useState, useEffect, useCallback } from 'react';
import { Trash2, ChevronDown, ChevronUp, Camera, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { getTradeScreenshot } from '../../services/tradeService';

const TYPE_COLORS = {
  crypto:'#f59e0b', forex:'#60a5fa', stocks:'#34d399',
  futures:'#a78bfa', indices:'#fb923c', commodities:'#fbbf24',
};
const TYPE_ICONS = {
  crypto:'₿', forex:'💱', stocks:'📈',
  futures:'📊', indices:'🏦', commodities:'🥇',
};

/* ── Full Screen Image Viewer ── */
const ImageViewer = ({ src, symbol, date, onClose }) => {
  const [scale,  setScale]  = useState(1);
  const [pos,    setPos]    = useState({ x: 0, y: 0 });
  const [drag,   setDrag]   = useState(false);
  const [start,  setStart]  = useState({ x: 0, y: 0 });

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const zoomIn  = () => setScale(s => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const reset   = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  const onMouseDown = (e) => {
    if (scale === 1) return;
    setDrag(true);
    setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  const onMouseMove = (e) => {
    if (!drag) return;
    setPos({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const onMouseUp = () => setDrag(false);

  const onWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn(); else zoomOut();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 8, padding: '4px 10px',
          }}>
            <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>{symbol}</span>
          </div>
          <span style={{ color: '#6b7280', fontSize: 12 }}>{date}</span>
          <span style={{
            color: '#9ca3af', fontSize: 11,
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 8px', borderRadius: 6,
          }}>
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { icon: <ZoomOut size={16} />, action: zoomOut, tip: 'Zoom Out' },
            { icon: <ZoomIn  size={16} />, action: zoomIn,  tip: 'Zoom In'  },
            { icon: <RotateCcw size={16} />, action: reset, tip: 'Reset'   },
          ].map(({ icon, action, tip }) => (
            <button
              key={tip}
              onClick={action}
              title={tip}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, padding: '6px 10px',
                color: '#9ca3af', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              {icon}
            </button>
          ))}

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          <button
            onClick={onClose}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '6px 10px',
              color: '#f87171', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          >
            <X size={16} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Close</span>
          </button>
        </div>
      </div>

      {/* Image Area */}
      <div
        style={{
          flex: 1, overflow: 'hidden', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: scale > 1 ? (drag ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
        }}
        onClick={(e) => { if (e.target === e.currentTarget && scale === 1) onClose(); }}
      >
        <img
          src={src}
          alt="Trade screenshot"
          onMouseDown={onMouseDown}
          draggable={false}
          style={{
            maxWidth:  scale === 1 ? '90%' : 'none',
            maxHeight: scale === 1 ? '90%' : 'none',
            transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
            transformOrigin: 'center center',
            transition: drag ? 'none' : 'transform 0.2s ease',
            borderRadius: 12,
            boxShadow: '0 0 80px rgba(0,0,0,0.8)',
          }}
        />
      </div>

      {/* Bottom hint */}
      <div style={{
        padding: '10px 20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.2)',
        fontSize: 11,
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        Scroll to zoom · Drag to pan · Press Esc to close
      </div>
    </div>
  );
};

/* ── Trade Card ── */
const TradeCard = ({ trade, onDelete }) => {
  const [expanded,   setExpanded]   = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [imgError,   setImgError]   = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const isWin  = trade.outcome === 'Win'  || (trade.pnl !== null && trade.pnl > 0);
  const isLoss = trade.outcome === 'Loss' || (trade.pnl !== null && trade.pnl < 0);

  const borderColor = isWin
    ? 'rgba(34,197,94,0.25)'
    : isLoss ? 'rgba(239,68,68,0.25)' : '#1e1e1e';

  const outcomeStyle = {
    Win:       'bg-green-500/10 text-green-400 border-green-500/30',
    Loss:      'bg-red-500/10 text-red-400 border-red-500/30',
    Breakeven: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };

  const rrColor = !trade.rr ? '#6b7280'
    : trade.rr >= 2 ? '#22c55e'
    : trade.rr >= 1 ? '#fbbf24'
    : '#ef4444';

  const loadScreenshot = useCallback(async () => {
    if (screenshot || loadingImg) return;
    setLoadingImg(true);
    setImgError(false);
    try {
      // ✅ FIX: extract .data.screenshot from axios response
      const res = await getTradeScreenshot(trade._id);
      const imgData = res?.data?.screenshot;
      if (imgData) {
        setScreenshot(imgData);
      } else {
        setImgError(true);
      }
    } catch (err) {
      console.error('Screenshot load error:', err);
      setImgError(true);
    } finally {
      setLoadingImg(false);
    }
  }, [trade._id, screenshot, loadingImg]);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadScreenshot();
  };

  return (
    <>
      {viewerOpen && screenshot && (
        <ImageViewer
          src={screenshot}
          symbol={trade.symbol}
          date={formatDate(trade.date)}
          onClose={() => setViewerOpen(false)}
        />
      )}

      <div
        className="bg-[#141414] rounded-xl border overflow-hidden transition-all hover:border-purple-500/20"
        style={{ borderColor }}
      >
        {/* Main Row */}
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
          onClick={handleExpand}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#1e1e1e] rounded-lg px-3 py-1.5">
              <span className="text-base">{TYPE_ICONS[trade.tradeType] || '📊'}</span>
              <span className="text-white font-bold text-sm">{trade.symbol}</span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              trade.side === 'Long'
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              {trade.side === 'Long' ? '▲' : '▼'} {trade.side}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase hidden md:inline"
              style={{
                color: TYPE_COLORS[trade.tradeType] || '#6b7280',
                backgroundColor: (TYPE_COLORS[trade.tradeType] || '#6b7280') + '15',
                borderColor: (TYPE_COLORS[trade.tradeType] || '#6b7280') + '30',
              }}
            >
              {trade.tradeType}
            </span>
            <span className="text-gray-500 text-xs hidden md:block">{formatDate(trade.date)}</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            {trade.outcome && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${outcomeStyle[trade.outcome]}`}>
                {trade.outcome === 'Win' ? '✓ ' : trade.outcome === 'Loss' ? '✗ ' : '→ '}{trade.outcome}
              </span>
            )}
            {trade.rr && (
              <div className="text-center hidden md:block">
                <p className="text-gray-500 text-[10px]">R:R</p>
                <p className="text-sm font-bold" style={{ color: rrColor }}>1:{trade.rr}</p>
              </div>
            )}
            {trade.pnl !== null && trade.pnl !== undefined && (
              <span className="text-lg font-black" style={{ color: trade.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
              </span>
            )}
            <div className="flex items-center gap-2">
              <Camera size={13} className="text-gray-600" />
              <button
                onClick={e => { e.stopPropagation(); onDelete(trade._id); }}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              {expanded
                ? <ChevronUp size={14} className="text-gray-500" />
                : <ChevronDown size={14} className="text-gray-500" />
              }
            </div>
          </div>
        </div>

        {/* Expanded Section */}
        {expanded && (
          <div className="border-t border-[#1e1e1e] px-5 py-5">

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {[
                { label:'Entry',       value: trade.entryPrice ? `$${trade.entryPrice}` : '—' },
                { label:'Stop Loss',   value: trade.sl  ? `$${trade.sl}`  : '—' },
                { label:'Take Profit', value: trade.tp  ? `$${trade.tp}`  : '—' },
                { label:'R:R',         value: trade.rr  ? `1:${trade.rr}` : '—' },
                { label:'Risk $',      value: trade.riskAmount ? `$${trade.riskAmount}` : '—' },
                { label:'Timeframe',   value: trade.timeframe  || '—' },
                { label:'Strategy',    value: trade.strategy   || '—' },
                { label:'Date',        value: formatDate(trade.date) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0f0f0f] rounded-lg p-2.5">
                  <p className="text-gray-600 text-[10px] uppercase tracking-wider">{label}</p>
                  <p className="text-white text-sm font-medium mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            {trade.tags?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-4">
                {trade.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-purple-600/10 text-purple-400 border border-purple-600/20 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Notes */}
            {trade.notes && (
              <div className="bg-[#0f0f0f] rounded-lg p-3 mb-4">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Notes</p>
                <p className="text-gray-300 text-sm leading-relaxed">{trade.notes}</p>
              </div>
            )}

            {/* Screenshot Section */}
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Camera size={11} />
                Screenshot
              </p>

              {loadingImg && (
                <div className="flex flex-col items-center justify-center h-36 bg-[#0f0f0f] rounded-xl border border-[#1e1e1e] gap-3">
                  <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-600 text-xs">Loading screenshot…</p>
                </div>
              )}

              {!loadingImg && imgError && (
                <div className="flex flex-col items-center justify-center h-24 bg-[#0f0f0f] rounded-xl border border-dashed border-[#2a2a2a] gap-2">
                  <p className="text-gray-600 text-xs">No screenshot saved for this trade</p>
                </div>
              )}

              {!loadingImg && !imgError && screenshot && (
                <div
                  className="relative group cursor-zoom-in rounded-xl overflow-hidden border border-[#2a2a2a]"
                  onClick={() => setViewerOpen(true)}
                >
                  <img
                    src={screenshot}
                    alt="Trade screenshot"
                    className="w-full object-cover bg-[#0a0a0a]"
                    style={{ maxHeight: 280 }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 bg-black/70 text-white px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                      <ZoomIn size={16} />
                      <span className="text-sm font-semibold">View Full Size</span>
                    </div>
                  </div>
                  {/* Corner badge */}
                  <div className="absolute top-2 right-2 bg-black/60 text-gray-300 text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                    Click to expand
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TradeCard;