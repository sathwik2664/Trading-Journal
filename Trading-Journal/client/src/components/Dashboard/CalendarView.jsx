import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import dayjs from 'dayjs';

// ── colour helpers ─────────────────────────────────────────────────────────────
const GREEN    = '#00d48a';
const RED      = '#ff4560';
const PURPLE   = '#8b5cf6';
const pColor   = v => (v >= 0 ? GREEN : RED);
const pBg      = v => (v >= 0 ? 'rgba(0,212,138,0.08)' : 'rgba(255,69,96,0.08)');
const pBorder  = v => (v >= 0 ? 'rgba(0,212,138,0.25)' : 'rgba(255,69,96,0.25)');
const wkBg     = v => (v >= 0 ? 'rgba(0,212,138,0.05)' : 'rgba(255,69,96,0.05)');
const wkBorder = v => (v >= 0 ? 'rgba(0,212,138,0.16)' : 'rgba(255,69,96,0.16)');

// ── DayCell ────────────────────────────────────────────────────────────────────
const DayCell = ({ slot, isToday, onDayClick }) => {
  const [hovered, setHovered] = useState(false);
  const { day, isCurrentMonth, dateKey, data } = slot;

  // ghost cell (prev / next month)
  if (!isCurrentMonth) {
    return (
      <div style={{
        minHeight: 80, borderRadius: 10, padding: '6px 8px',
        background: 'rgba(255,255,255,0.005)',
        border:     '1px solid rgba(255,255,255,0.025)',
        boxSizing:  'border-box',
      }}>
        <span style={{ fontSize: 10, color: '#1e1e2e', fontWeight: 500 }}>{day}</span>
      </div>
    );
  }

  const canClick = !!data;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => canClick && onDayClick?.(dateKey)}
      style={{
        minHeight:  80,
        borderRadius: 10,
        padding:    '6px 8px',
        boxSizing:  'border-box',
        position:   'relative',
        zIndex:     hovered ? 20 : 1,
        cursor:     canClick ? 'pointer' : 'default',

        background: data
          ? pBg(data.pnl)
          : hovered ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.018)',

        border: `1px solid ${
          isToday
            ? PURPLE
            : data
            ? pBorder(data.pnl)
            : hovered
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(255,255,255,0.05)'
        }`,

        // today pulse ring
        boxShadow: hovered && canClick
          ? `0 12px 32px rgba(0,0,0,0.55), 0 0 0 1px ${data ? pBorder(data.pnl) : 'rgba(255,255,255,0.1)'}`
          : isToday
          ? '0 0 0 1px rgba(139,92,246,0.35), 0 0 12px rgba(139,92,246,0.12)'
          : 'none',

        transform: hovered && canClick
          ? 'scale(1.06) translateY(-4px)'
          : 'scale(1) translateY(0)',

        transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease, background 0.12s, border-color 0.12s',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* day number */}
      <span style={{
        fontSize:   10,
        fontWeight: isToday ? 700 : 500,
        color:      isToday ? '#a78bfa' : '#3d3d58',
        lineHeight: 1,
      }}>
        {day}
      </span>

      {data && (
        <>
          {/* P&L */}
          <span style={{
            fontSize:           11,
            fontWeight:         800,
            color:              pColor(data.pnl),
            lineHeight:         1.2,
            marginTop:          4,
            letterSpacing:      '-0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
          </span>

          {/* trade count */}
          <span style={{ fontSize: 9.5, color: '#3a3a58', marginTop: 2 }}>
            {data.count} trade{data.count > 1 ? 's' : ''}
          </span>

          {/* R-multiple + win rate */}
          <span style={{
            fontSize:           9,
            color:              '#32324c',
            marginTop:          'auto',
            whiteSpace:         'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {data.r != null
              ? `${data.r >= 0 ? '+' : ''}${data.r.toFixed(2)}R`
              : '0.00R'}
            {'  '}
            {data.winRate != null
              ? `${data.winRate.toFixed(0)}%`
              : '—'}
          </span>
        </>
      )}

      {/* hover tooltip */}
      {hovered && canClick && (
        <div style={{
          position:     'absolute',
          bottom:       -22,
          left:         '50%',
          transform:    'translateX(-50%)',
          background:   'rgba(139,92,246,0.9)',
          color:        '#fff',
          fontSize:     8.5,
          fontWeight:   700,
          letterSpacing:'0.04em',
          padding:      '2px 7px',
          borderRadius: 5,
          whiteSpace:   'nowrap',
          pointerEvents:'none',
          zIndex:       30,
        }}>
          VIEW TRADES
        </div>
      )}
    </div>
  );
};

// ── WeekSummary ───────────────────────────────────────────────────────────────
const WeekSummary = ({ weekIndex, pnl, activeDays }) => (
  <div style={{
    width:        108,
    minHeight:    80,
    flexShrink:   0,
    borderRadius: 10,
    padding:      '10px 11px',
    boxSizing:    'border-box',
    background:   activeDays > 0 ? wkBg(pnl) : 'rgba(255,255,255,0.01)',
    border:       `1px solid ${activeDays > 0 ? wkBorder(pnl) : 'rgba(255,255,255,0.04)'}`,
    display:      'flex',
    flexDirection:'column',
    justifyContent:'center',
  }}>
    <span style={{
      fontSize:      9,
      color:         '#2e2e46',
      fontWeight:    700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom:  4,
    }}>
      Week {weekIndex + 1}
    </span>
    <span style={{
      fontSize:           12,
      fontWeight:         800,
      color:              activeDays > 0 ? pColor(pnl) : '#1e1e30',
      letterSpacing:      '-0.03em',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {activeDays > 0 ? (pnl >= 0 ? '+' : '') + formatCurrency(pnl) : '$0.00'}
    </span>
    <span style={{
      fontSize:   9.5,
      color:      activeDays > 0
        ? (pnl >= 0 ? 'rgba(0,212,138,0.65)' : 'rgba(255,69,96,0.65)')
        : '#1e1e30',
      fontWeight: 600,
      marginTop:  4,
    }}>
      {activeDays > 0
        ? `${pnl >= 0 ? '▲' : '▼'} ${activeDays} ${activeDays === 1 ? 'day' : 'days'}`
        : '—'}
    </span>
  </div>
);

// ── BottomStat ────────────────────────────────────────────────────────────────
const BottomStat = ({ label, value, color }) => (
  <div>
    <p style={{
      fontSize:      9,
      color:         '#2e2e46',
      fontWeight:    700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      margin:        '0 0 3px',
    }}>
      {label}
    </p>
    <p style={{
      fontSize:           14,
      fontWeight:         800,
      color,
      margin:             0,
      letterSpacing:      '-0.04em',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {value}
    </p>
  </div>
);

// ── CalendarView ──────────────────────────────────────────────────────────────
const CalendarView = ({ trades, onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const prevMonth = () => setCurrentDate(d => d.subtract(1, 'month'));
  const nextMonth = () => setCurrentDate(d => d.add(1, 'month'));
  const goToday   = () => setCurrentDate(dayjs());

  const year        = currentDate.year();
  const month       = currentDate.month();       // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const todayKey    = dayjs().format('YYYY-MM-DD');

  // ── aggregate trades by date ──────────────────────────────────────────
  const tradesByDate = {};
  trades.forEach(trade => {
    const key = dayjs(trade.date).format('YYYY-MM-DD');
    if (!tradesByDate[key]) {
      tradesByDate[key] = { pnl: 0, count: 0, r: null, winRate: null, wins: 0 };
    }
    tradesByDate[key].pnl   += trade.pnl ?? 0;
    tradesByDate[key].count += 1;
    if (trade.pnl > 0)       tradesByDate[key].wins    += 1;
    if (trade.r       != null) tradesByDate[key].r       = trade.r;
    if (trade.winRate != null) tradesByDate[key].winRate = trade.winRate;
  });
  Object.values(tradesByDate).forEach(d => {
    if (d.winRate == null)
      d.winRate = d.count > 0 ? (d.wins / d.count) * 100 : 0;
  });

  // ── build slot array ──────────────────────────────────────────────────
  const prevMonthDim = new Date(year, month, 0).getDate();
  const totalSlots   = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const slots        = [];

  for (let i = 0; i < totalSlots; i++) {
    const offset = i - firstDay;
    if (offset < 0) {
      slots.push({ day: prevMonthDim + offset + 1, isCurrentMonth: false, dateKey: null, data: null });
    } else if (offset < daysInMonth) {
      const day     = offset + 1;
      const dateKey = dayjs(
        `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      ).format('YYYY-MM-DD');
      slots.push({ day, isCurrentMonth: true, dateKey, data: tradesByDate[dateKey] || null });
    } else {
      slots.push({ day: offset - daysInMonth + 1, isCurrentMonth: false, dateKey: null, data: null });
    }
  }

  // ── split into weeks ──────────────────────────────────────────────────
  const numWeeks = totalSlots / 7;
  const weeks    = [];
  for (let w = 0; w < numWeeks; w++) {
    const wSlots      = slots.slice(w * 7, (w + 1) * 7);
    const activeSlots = wSlots.filter(s => s.isCurrentMonth && s.data);
    weeks.push({
      slots:      wSlots,
      pnl:        activeSlots.reduce((s, sl) => s + sl.data.pnl, 0),
      activeDays: activeSlots.length,
    });
  }

  // ── monthly summary ───────────────────────────────────────────────────
  const monthPrefix  = dayjs(`${year}-${String(month + 1).padStart(2,'0')}-01`).format('YYYY-MM');
  const monthEntries = Object.entries(tradesByDate).filter(([k]) => k.startsWith(monthPrefix));

  const monthlyPnl  = monthEntries.reduce((s, [, d]) => s + d.pnl, 0);
  const tradingDays = monthEntries.length;
  const totalTrades = monthEntries.reduce((s, [, d]) => s + d.count, 0);

  // ── bottom bar extras ─────────────────────────────────────────────────
  const winDays    = monthEntries.filter(([, d]) => d.pnl >= 0).length;
  const lossDays   = monthEntries.filter(([, d]) => d.pnl < 0).length;
  const dayWinRate = tradingDays ? (winDays / tradingDays) * 100 : 0;
  const bestDay    = monthEntries.length
    ? Math.max(...monthEntries.map(([, d]) => d.pnl))
    : 0;
  const worstDay   = monthEntries.length
    ? Math.min(...monthEntries.map(([, d]) => d.pnl))
    : 0;

  return (
    <div
      className="flex-1 rounded-2xl"
      style={{
        background: 'linear-gradient(145deg,#12121e,#0e0e18)',
        border:     '1px solid rgba(255,255,255,0.07)',
        padding:    20,
        minWidth:   0,
      }}
    >
      {/* ── header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* prev */}
          <button
            onClick={prevMonth}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border:     '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#555',
            }}
          >
            <ChevronLeft size={14} />
          </button>

          <span style={{
            fontSize:      15,
            fontWeight:    800,
            color:         '#dde0ff',
            minWidth:      132,
            textAlign:     'center',
            letterSpacing: '-0.04em',
          }}>
            {currentDate.format('MMMM YYYY')}
          </span>

          {/* next */}
          <button
            onClick={nextMonth}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border:     '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#555',
            }}
          >
            <ChevronRight size={14} />
          </button>

          <button
            onClick={goToday}
            style={{
              background:    'rgba(139,92,246,0.1)',
              border:        '1px solid rgba(139,92,246,0.22)',
              borderRadius:  6,
              padding:       '3px 10px',
              cursor:        'pointer',
              color:         '#a78bfa',
              fontSize:      10,
              fontWeight:    700,
              letterSpacing: '0.05em',
            }}
          >
            TODAY
          </button>
        </div>

        {/* monthly stats strip */}
        <div className="flex items-center gap-3">
          {[
            {
              label: 'Monthly P&L',
              value: (monthlyPnl >= 0 ? '+' : '') + formatCurrency(monthlyPnl),
              valueColor: pColor(monthlyPnl),
            },
            { label: 'Days',   value: tradingDays, valueColor: '#8888aa' },
            { label: 'Trades', value: totalTrades, valueColor: '#8888aa' },
          ].map(({ label, value, valueColor }, i, arr) => (
            <div key={label} className="flex items-center gap-3">
              <div className="text-center">
                <p style={{
                  fontSize:      9.5,
                  color:         '#2e2e48',
                  fontWeight:    700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  margin:        '0 0 2px',
                }}>
                  {label}
                </p>
                <p style={{
                  fontSize:           15,
                  fontWeight:         800,
                  color:              valueColor,
                  margin:             0,
                  letterSpacing:      '-0.04em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {value}
                </p>
              </div>
              {i < arr.length - 1 && (
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── day labels ───────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-1">
        <div className="grid grid-cols-7 gap-1 flex-1">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{
              textAlign:     'center',
              fontSize:      9.5,
              color:         '#2e2e46',
              fontWeight:    700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              paddingBottom: 4,
            }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{
          width:         108,
          textAlign:     'center',
          fontSize:      9.5,
          color:         '#2e2e46',
          fontWeight:    700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          paddingBottom: 4,
          flexShrink:    0,
        }}>
          Weekly
        </div>
      </div>

      {/* ── week rows ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        {weeks.map((wk, wi) => (
          <div key={wi} className="flex gap-1">
            <div className="grid grid-cols-7 gap-1 flex-1" style={{ overflow: 'visible' }}>
              {wk.slots.map((slot, di) => (
                <DayCell
                  key={di}
                  slot={slot}
                  isToday={slot.dateKey === todayKey}
                  onDayClick={onDayClick}
                />
              ))}
            </div>
            <WeekSummary
              weekIndex={wi}
              pnl={wk.pnl}
              activeDays={wk.activeDays}
            />
          </div>
        ))}
      </div>

      {/* ── bottom summary bar ────────────────────────────────────────── */}
      {tradingDays > 0 && (
        <div style={{
          marginTop:  14,
          paddingTop: 13,
          borderTop:  '1px solid rgba(255,255,255,0.05)',
          display:    'flex',
          alignItems: 'center',
          gap:        0,
        }}>
          {[
            { label: 'Trading Days', value: tradingDays,                                         color: '#7878a0' },
            { label: 'Win Days',     value: winDays,                                             color: GREEN },
            { label: 'Loss Days',    value: lossDays,                                            color: RED },
            { label: 'Best Day',     value: `+${formatCurrency(bestDay)}`,                       color: GREEN },
            { label: 'Worst Day',    value: formatCurrency(worstDay),                            color: RED },
            { label: 'Day Win %',    value: `${dayWinRate.toFixed(0)}%`,                         color: dayWinRate >= 50 ? GREEN : RED },
          ].map(({ label, value, color }, i, arr) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <BottomStat label={label} value={value} color={color} />
              {i < arr.length - 1 && (
                <div style={{
                  width:      1,
                  height:     28,
                  background: 'rgba(255,255,255,0.05)',
                  margin:     '0 16px',
                  flexShrink: 0,
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarView;