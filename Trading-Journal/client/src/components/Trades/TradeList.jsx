import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft, ChevronDown, ChevronUp,
  Search, SlidersHorizontal, X,
  ArrowUpDown, Calendar, TrendingUp,
} from 'lucide-react';
import TradeCard from './TradeCard';
import { formatCurrency } from '../../utils/helpers';
import dayjs from 'dayjs';

// ─── palette (mirrors CalendarView) ─────────────────────────────────────────
const GREEN  = '#00d48a';
const RED    = '#ff4560';
const PURPLE = '#8b5cf6';
const pColor = v => (v >= 0 ? GREEN : RED);
const pBg    = v => (v >= 0 ? 'rgba(0,212,138,0.10)' : 'rgba(255,69,96,0.10)');
const pBdr   = v => (v >= 0 ? 'rgba(0,212,138,0.28)' : 'rgba(255,69,96,0.28)');

// ─── constants ───────────────────────────────────────────────────────────────
const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SORT_OPTIONS = [
  { key: 'date_desc', label: 'Newest First'  },
  { key: 'date_asc',  label: 'Oldest First'  },
  { key: 'pnl_desc',  label: 'Best P&L'      },
  { key: 'pnl_asc',   label: 'Worst P&L'     },
  { key: 'rr_desc',   label: 'Best R:R'       },
];

const RESULT_FILTERS = [
  { key: 'ALL',  label: 'All',        color: PURPLE },
  { key: 'WIN',  label: '▲  Win',     color: GREEN  },
  { key: 'LOSS', label: '▼  Loss',    color: RED    },
  { key: 'BE',   label: '≈  Even',    color: '#fbbf24' },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
const parseRR = val => {
  if (!val) return NaN;
  const s = String(val).trim();
  if (s.includes(':')) {
    const [risk, reward] = s.split(':').map(Number);
    return risk !== 0 ? reward / risk : NaN;
  }
  return parseFloat(s.replace(/R$/i, ''));
};

const isWinTrade  = t => t.pnl > 0  || t.outcome === 'Win';
const isLossTrade = t => t.pnl < 0  || t.outcome === 'Loss';
const isBETrade   = t => t.pnl === 0 || t.outcome === 'Breakeven';

const buildAvailableMonths = trades => {
  if (!trades.length) {
    const now = dayjs();
    return [{ month: now.month(), year: now.year() }];
  }
  const set = new Set();
  trades.forEach(t => {
    const d = dayjs(t.date);
    set.add(`${d.year()}-${String(d.month()).padStart(2,'0')}`);
  });
  return Array.from(set)
    .map(k => { const [y, m] = k.split('-').map(Number); return { year: y, month: m }; })
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
};

// ─── DaySectionHeader ────────────────────────────────────────────────────────
const DaySectionHeader = ({ dateKey, dayTrades }) => {
  const wins   = dayTrades.filter(isWinTrade).length;
  const losses = dayTrades.filter(isLossTrade).length;
  const total  = wins + losses;
  const wr     = total > 0 ? Math.round((wins / total) * 100) : null;
  const dayPnl = dayTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  const todayKey     = dayjs().format('YYYY-MM-DD');
  const yesterdayKey = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const d            = dayjs(dateKey);

  const dayLabel  = dateKey === todayKey     ? 'Today'
                  : dateKey === yesterdayKey ? 'Yesterday'
                  : d.format('dddd');
  const dateFull  = d.format('D MMMM YYYY');
  const isToday   = dateKey === todayKey;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 16px 10px 14px',
      background: 'linear-gradient(90deg, #0d0d1a 0%, #10101c 100%)',
      borderTop:    '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {/* ── left: day label + date + P&L pill ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {isToday && (
            <span style={{
              width: 6, height: 6, borderRadius: 3,
              background: GREEN, display: 'inline-block',
              boxShadow: `0 0 6px ${GREEN}`,
            }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 800, color: '#dde0ff', letterSpacing: '-0.02em' }}>
            {dayLabel}
          </span>
          <span style={{ fontSize: 10, color: '#333350', fontWeight: 600 }}>{dateFull}</span>
        </div>

        {/* P&L pill */}
        {dayPnl !== 0 && (
          <span style={{
            alignSelf: 'flex-start',
            fontSize: 11, fontWeight: 800,
            color: pColor(dayPnl),
            background: pBg(dayPnl),
            border: `1px solid ${pBdr(dayPnl)}`,
            padding: '2px 9px', borderRadius: 6,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}>
            {dayPnl >= 0 ? '+' : ''}{formatCurrency(dayPnl)}
          </span>
        )}
      </div>

      {/* ── right: win rate + count ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        {wr !== null && (
          <div>
            {/* bar */}
            <div style={{
              width: 52, height: 3,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 2, overflow: 'hidden',
              marginLeft: 'auto', marginBottom: 4,
            }}>
              <div style={{
                width: `${wr}%`, height: '100%',
                background: wr >= 50 ? GREEN : RED,
                borderRadius: 2,
                transition: 'width 0.6s ease',
              }} />
            </div>
            {/* numbers */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: wr >= 50 ? GREEN : RED }}>
                {wr}%
              </span>
              <span style={{ fontSize: 9.5, color: '#3a3a56', fontWeight: 600 }}>
                {wins}W · {losses}L
              </span>
            </div>
          </div>
        )}

        {/* trade count badge */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 7, padding: '3px 8px',
          fontSize: 10, fontWeight: 700, color: '#3a3a58',
        }}>
          {dayTrades.length} trade{dayTrades.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

// ─── MonthSummaryStrip ────────────────────────────────────────────────────────
const MonthSummaryStrip = ({ monthTrades }) => {
  const wins   = monthTrades.filter(isWinTrade).length;
  const losses = monthTrades.filter(isLossTrade).length;
  const total  = wins + losses;
  const wr     = total > 0 ? Math.round((wins / total) * 100) : 0;
  const pnl    = monthTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const avgRR  = (() => {
    const v = monthTrades.filter(t => !isNaN(parseRR(t.rr)));
    if (!v.length) return null;
    return (v.reduce((s, t) => s + parseRR(t.rr), 0) / v.length).toFixed(1);
  })();

  const cells = [
    { label: 'Monthly P&L', value: (pnl >= 0 ? '+' : '') + formatCurrency(pnl), color: pColor(pnl) },
    { label: 'Win Rate',    value: `${wr}%`,         color: wr >= 50 ? GREEN : RED       },
    { label: 'Trades',      value: total,             color: '#8888aa'                    },
    { label: 'W / L',       value: `${wins} / ${losses}`, color: '#666688'               },
    avgRR && { label: 'Avg R:R', value: `${avgRR}R`, color: '#a78bfa' },
  ].filter(Boolean);

  return (
    <div style={{
      display: 'flex',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, overflow: 'hidden',
      marginBottom: 14,
    }}>
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          style={{
            flex: 1, padding: '11px 8px', textAlign: 'center',
            borderRight: i < cells.length - 1
              ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          <div style={{
            fontSize: 8.5, color: '#333352', fontWeight: 700,
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5,
          }}>
            {cell.label}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 800, color: cell.color,
            letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          }}>
            {cell.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── MonthPicker ─────────────────────────────────────────────────────────────
const MonthPicker = ({ selected, onSelect, trades, onClose }) => {
  const pickerRef = useRef(null);
  const available = useMemo(() => buildAvailableMonths(trades), [trades]);

  const monthsWithData = useMemo(() => {
    const set = new Set();
    trades.forEach(t => {
      const d = dayjs(t.date);
      set.add(`${d.year()}-${d.month()}`);
    });
    return set;
  }, [trades]);

  // group by year
  const byYear = useMemo(() => {
    const map = {};
    available.forEach(m => {
      if (!map[m.year]) map[m.year] = [];
      map[m.year].push(m);
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({ year: Number(year), items }));
  }, [available]);

  // close on outside click
  useEffect(() => {
    const handler = e => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 60,
        background: '#16162a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: '10px 8px',
        minWidth: 210, maxHeight: 340, overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      }}
    >
      <div style={{
        fontSize: 9.5, fontWeight: 700, color: '#333352',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '0 6px 8px',
      }}>
        Select Month
      </div>

      {byYear.map(({ year, items }) => (
        <div key={year}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#28284a',
            letterSpacing: '0.06em', padding: '6px 8px 4px',
          }}>
            {year}
          </div>
          {items.map(m => {
            const isSel  = m.month === selected.month && m.year === selected.year;
            const hasData = monthsWithData.has(`${m.year}-${m.month}`);
            return (
              <button
                key={m.month}
                onClick={() => { if (hasData) { onSelect(m); onClose(); } }}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '8px 10px', borderRadius: 10, border: 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: hasData ? 'pointer' : 'default',
                  opacity: hasData ? 1 : 0.3,
                  background: isSel && hasData ? 'rgba(139,92,246,0.18)' : 'transparent',
                  color: isSel && hasData ? '#a78bfa' : '#aab',
                  fontWeight: isSel && hasData ? 700 : 500,
                  fontSize: 13,
                  marginBottom: 2,
                }}
              >
                <span>{MONTH_NAMES[m.month]}</span>
                {isSel && hasData && (
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: PURPLE, display: 'inline-block' }} />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ─── FilterPanel ─────────────────────────────────────────────────────────────
const FilterPanel = ({ resultFilter, setResultFilter, onClear, activeCount }) => (
  <div style={{
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '14px 14px 12px',
    marginBottom: 10, animation: 'slideDown 0.18s ease',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: '#333352', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Filters
      </span>
      {activeCount > 0 && (
        <button
          onClick={onClear}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#555568', fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <X size={10} />Clear all
        </button>
      )}
    </div>

    <div style={{ fontSize: 9.5, fontWeight: 700, color: '#2e2e4a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
      Result
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {RESULT_FILTERS.map(f => {
        const isOn = resultFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => setResultFilter(isOn && f.key !== 'ALL' ? 'ALL' : f.key)}
            style={{
              padding: '6px 13px', borderRadius: 20, border: '1px solid',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              transition: 'all 0.15s',
              background: isOn ? `${f.color}18` : 'rgba(255,255,255,0.03)',
              borderColor: isOn ? `${f.color}45` : 'rgba(255,255,255,0.07)',
              color: isOn ? f.color : '#4a4a68',
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── SortMenu ────────────────────────────────────────────────────────────────
const SortMenu = ({ sortKey, setSortKey, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', left: 0, top: 'calc(100% + 6px)', zIndex: 60,
        background: '#16162a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: 8, minWidth: 170,
        boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
      }}
    >
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => { setSortKey(opt.key); onClose(); }}
          style={{
            width: '100%', textAlign: 'left', padding: '9px 11px',
            borderRadius: 9, border: 'none', cursor: 'pointer',
            background: sortKey === opt.key ? 'rgba(139,92,246,0.18)' : 'transparent',
            color: sortKey === opt.key ? '#a78bfa' : '#aab',
            fontWeight: sortKey === opt.key ? 700 : 500,
            fontSize: 13, marginBottom: 2,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// ─── EmptyState ──────────────────────────────────────────────────────────────
const EmptyState = ({ isDayMode, selectedMonth, hasFilters, onClearFilters }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '64px 24px', textAlign: 'center',
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24, marginBottom: 14,
    }}>
      📊
    </div>
    <p style={{ color: '#9ca3af', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>
      {isDayMode ? 'No trades on this day' : `No trades in ${MONTH_NAMES[selectedMonth.month]}`}
    </p>
    <p style={{ color: '#4a4a68', fontSize: 12, margin: 0 }}>
      {hasFilters ? 'Try adjusting your filters or search' : 'Log a trade to see it here'}
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        style={{
          marginTop: 16, padding: '8px 18px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, cursor: 'pointer',
          color: '#aab', fontSize: 12, fontWeight: 600,
        }}
      >
        Clear All Filters
      </button>
    )}
  </div>
);

// ─── TradeList ────────────────────────────────────────────────────────────────
/**
 * Props
 *  trades       – array of trade objects
 *  onDelete     – fn(id)
 *  filterDate   – 'YYYY-MM-DD' string when navigated from CalendarView day-click
 *                 undefined/null → full monthly list mode (sidebar)
 *  onBack       – fn() to return to CalendarView (only used in day mode)
 */
const TradeList = ({ trades, onDelete, filterDate = null, onBack = null }) => {
  const now = dayjs();
  const isDayMode = !!filterDate;

  // ── state ─────────────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState({ month: now.month(), year: now.year() });
  const [resultFilter,  setResultFilter]  = useState('ALL');
  const [sortKey,       setSortKey]       = useState('date_desc');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [sortOpen,      setSortOpen]      = useState(false);
  const [monthOpen,     setMonthOpen]     = useState(false);

  const sortBtnRef  = useRef(null);
  const monthBtnRef = useRef(null);

  // ── active filter count ───────────────────────────────────────────────────
  const activeFilters = [
    resultFilter !== 'ALL',
    searchQuery.trim() !== '',
  ].filter(Boolean).length;

  const clearFilters = () => { setResultFilter('ALL'); setSearchQuery(''); setSearchOpen(false); };

  // ── data pipeline ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let arr = trades;

    // Day mode: only the clicked date
    if (isDayMode) {
      arr = arr.filter(t => dayjs(t.date).format('YYYY-MM-DD') === filterDate);
    } else {
      // Month filter
      arr = arr.filter(t => {
        const d = dayjs(t.date);
        return d.month() === selectedMonth.month && d.year() === selectedMonth.year;
      });
    }

    // Result filter
    if (resultFilter === 'WIN')  arr = arr.filter(isWinTrade);
    if (resultFilter === 'LOSS') arr = arr.filter(isLossTrade);
    if (resultFilter === 'BE')   arr = arr.filter(isBETrade);

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      arr = arr.filter(t =>
        (t.symbol   || '').toLowerCase().includes(q) ||
        (t.strategy || '').toLowerCase().includes(q) ||
        (t.notes    || '').toLowerCase().includes(q) ||
        (t.tradeType|| '').toLowerCase().includes(q)
      );
    }

    return arr;
  }, [trades, isDayMode, filterDate, selectedMonth, resultFilter, searchQuery]);

  // Group by date → sections
  const sections = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const key = dayjs(t.date).format('YYYY-MM-DD');
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });

    const sortedEntries = Object.entries(map).sort(([a], [b]) =>
      sortKey === 'date_asc' ? a.localeCompare(b) : b.localeCompare(a)
    );

    // Within each day, apply sub-sort (for pnl/rr sorts)
    return sortedEntries.map(([dateKey, dayTrades]) => {
      let sorted = [...dayTrades];
      if (sortKey === 'pnl_desc') sorted.sort((a, b) => (b.pnl ?? -Infinity) - (a.pnl ?? -Infinity));
      if (sortKey === 'pnl_asc')  sorted.sort((a, b) => (a.pnl ?? Infinity)  - (b.pnl ?? Infinity));
      if (sortKey === 'rr_desc')  sorted.sort((a, b) => (parseRR(b.rr) || -Infinity) - (parseRR(a.rr) || -Infinity));
      return [dateKey, sorted];
    });
  }, [filtered, sortKey]);

  // Monthly trades (for summary strip in full mode)
  const currentMonthTrades = useMemo(() => {
    if (isDayMode) return [];
    return trades.filter(t => {
      const d = dayjs(t.date);
      return d.month() === selectedMonth.month && d.year() === selectedMonth.year;
    });
  }, [trades, isDayMode, selectedMonth]);

  // ── no trades at all ──────────────────────────────────────────────────────
  if (!trades.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-gray-400 text-lg font-medium">No trades yet</p>
        <p className="text-gray-600 text-sm mt-1">Click "Add Trade" to log your first trade</p>
      </div>
    );
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label || 'Sort';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── header ─────────────────────────────────────────────────────────── */}
      {isDayMode ? (
        /* ── day mode: back button + date title ── */
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          marginBottom: 14,
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, padding: '7px 12px',
              cursor: 'pointer', color: '#888',
              fontSize: 12, fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <ChevronLeft size={13} />
            Calendar
          </button>

          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#dde0ff', letterSpacing: '-0.02em' }}>
              {dayjs(filterDate).format('dddd, D MMMM YYYY')}
            </div>
            <div style={{ fontSize: 11, color: '#444462', marginTop: 1 }}>
              {filtered.length} trade{filtered.length !== 1 ? 's' : ''} logged
            </div>
          </div>
        </div>
      ) : (
        /* ── full list mode: month picker + monthly summary ── */
        <div style={{ paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 14 }}>
          {/* title + month button */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div>
              <div style={{
                fontSize: 9.5, fontWeight: 700, color: '#2a2a48',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3,
              }}>
                Trade Journal
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dde0ff', letterSpacing: '-0.04em' }}>
                {MONTH_NAMES[selectedMonth.month]}&nbsp;
                <span style={{ color: '#2e2e52' }}>{selectedMonth.year}</span>
              </div>
            </div>

            {/* Month picker */}
            <div style={{ position: 'relative' }} ref={monthBtnRef}>
              <button
                onClick={() => setMonthOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: monthOpen ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${monthOpen ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.09)'}`,
                  borderRadius: 10, padding: '7px 12px',
                  cursor: 'pointer',
                  color: monthOpen ? '#a78bfa' : '#888',
                  fontSize: 12, fontWeight: 700,
                  transition: 'all 0.15s',
                }}
              >
                <Calendar size={12} />
                {SHORT_MONTHS[selectedMonth.month]} {selectedMonth.year}
                <ChevronDown
                  size={11}
                  style={{ transform: monthOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                />
              </button>

              {monthOpen && (
                <MonthPicker
                  selected={selectedMonth}
                  onSelect={setSelectedMonth}
                  trades={trades}
                  onClose={() => setMonthOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Monthly summary strip */}
          {currentMonthTrades.length > 0 && (
            <MonthSummaryStrip monthTrades={currentMonthTrades} />
          )}
        </div>
      )}

      {/* ── toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 10, alignItems: 'center' }}>
        {/* Search toggle */}
        <button
          onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearchQuery(''); }}
          title="Search trades"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, flexShrink: 0,
            background: searchOpen ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${searchOpen ? 'rgba(139,92,246,0.38)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, cursor: 'pointer',
            color: searchOpen ? '#a78bfa' : '#555',
            transition: 'all 0.15s',
          }}
        >
          <Search size={14} />
        </button>

        {/* Sort button */}
        <div style={{ position: 'relative', flex: 1 }} ref={sortBtnRef}>
          <button
            onClick={() => setSortOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 12px',
              background: sortKey !== 'date_desc' ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${sortKey !== 'date_desc' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, cursor: 'pointer',
              color: sortKey !== 'date_desc' ? '#a78bfa' : '#666',
              fontSize: 12, fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            <ArrowUpDown size={12} />
            {currentSortLabel}
          </button>
          {sortOpen && (
            <SortMenu sortKey={sortKey} setSortKey={setSortKey} onClose={() => setSortOpen(false)} />
          )}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setFiltersOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flex: 1,
            height: 36, padding: '0 12px',
            background: activeFilters > 0 || filtersOpen ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${activeFilters > 0 || filtersOpen ? 'rgba(139,92,246,0.32)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, cursor: 'pointer',
            color: activeFilters > 0 || filtersOpen ? '#a78bfa' : '#666',
            fontSize: 12, fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          <SlidersHorizontal size={12} />
          Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
          {filtersOpen
            ? <ChevronUp size={11} style={{ marginLeft: 'auto' }} />
            : <ChevronDown size={11} style={{ marginLeft: 'auto' }} />
          }
        </button>
      </div>

      {/* ── search bar ─────────────────────────────────────────────────────── */}
      {searchOpen && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 10, padding: '0 12px', height: 40,
        }}>
          <Search size={13} style={{ color: '#444', flexShrink: 0 }} />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search symbol, strategy, notes…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#dde0ff', fontSize: 13,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 0, display: 'flex' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── filter panel ───────────────────────────────────────────────────── */}
      {filtersOpen && (
        <FilterPanel
          resultFilter={resultFilter}
          setResultFilter={setResultFilter}
          onClear={clearFilters}
          activeCount={activeFilters}
        />
      )}

      {/* ── trade sections ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', marginRight: -4, paddingRight: 4 }}>
        {sections.length === 0 ? (
          <EmptyState
            isDayMode={isDayMode}
            selectedMonth={selectedMonth}
            hasFilters={activeFilters > 0}
            onClearFilters={clearFilters}
          />
        ) : (
          sections.map(([dateKey, dayTrades]) => (
            <div key={dateKey} style={{ marginBottom: 4 }}>
              {/* Day header — always shown (single day in day mode still shows context) */}
              <DaySectionHeader dateKey={dateKey} dayTrades={dayTrades} />

              {/* Trade cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0' }}>
                {dayTrades.map(trade => (
                  <TradeCard key={trade._id} trade={trade} onDelete={onDelete} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CSS */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TradeList;