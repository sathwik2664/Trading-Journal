import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, getPnlColor, getPnlBg, getDaysInMonth, getFirstDayOfMonth } from '../../utils/helpers';
import dayjs from 'dayjs';

const CalendarView = ({ trades }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const prevMonth = () => setCurrentDate(d => d.subtract(1, 'month'));
  const nextMonth = () => setCurrentDate(d => d.add(1, 'month'));

  const year = currentDate.year();
  const month = currentDate.month();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group trades by date
  const tradesByDate = {};
  trades.forEach(trade => {
    const dateKey = dayjs(trade.date).format('YYYY-MM-DD');
    if (!tradesByDate[dateKey]) {
      tradesByDate[dateKey] = { pnl: 0, count: 0 };
    }
    tradesByDate[dateKey].pnl += trade.pnl;
    tradesByDate[dateKey].count += 1;
  });

  // Weekly stats
  const weeks = [];
  let week = { days: [], pnl: 0, trades: 0 };
  const totalDays = firstDay + daysInMonth;

  for (let i = 0; i < Math.ceil(totalDays / 7) * 7; i++) {
    const dayNum = i - firstDay + 1;
    if (dayNum > 0 && dayNum <= daysInMonth) {
      const dateKey = dayjs(`${year}-${month + 1}-${dayNum}`).format('YYYY-MM-DD');
      const dayData = tradesByDate[dateKey];
      if (dayData) {
        week.pnl += dayData.pnl;
        week.trades += dayData.count;
      }
    }
    week.days.push(dayNum);
    if ((i + 1) % 7 === 0) {
      weeks.push({ ...week });
      week = { days: [], pnl: 0, trades: 0 };
    }
  }

  // Monthly stats
  const monthlyPnl = Object.values(tradesByDate).reduce((s, d) => s + d.pnl, 0);
  const tradingDays = Object.keys(tradesByDate).length;

  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-white font-semibold text-sm">
            {currentDate.format('MMMM YYYY')}
          </h2>
          <button onClick={nextMonth} className="text-gray-400 hover:text-white transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="text-gray-400 text-xs">
          Monthly stats:&nbsp;
          <span className={monthlyPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
            {formatCurrency(monthlyPnl)}
          </span>
          &nbsp;{tradingDays} days
        </div>
      </div>

      <div className="flex gap-4">
        {/* Calendar Grid */}
        <div className="flex-1">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-gray-500 text-xs py-1">{d}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((weekData, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
              {weekData.days.map((day, di) => {
                if (day < 1 || day > daysInMonth) {
                  return <div key={di} className="h-16" />;
                }
                const dateKey = dayjs(`${year}-${month + 1}-${day}`).format('YYYY-MM-DD');
                const dayData = tradesByDate[dateKey];
                const isToday = dayjs().format('YYYY-MM-DD') === dateKey;

                return (
                  <div
                    key={di}
                    className="h-16 rounded-lg p-1 border transition-all cursor-pointer hover:border-purple-500/50"
                    style={{
                      backgroundColor: dayData ? getPnlBg(dayData.pnl) : 'transparent',
                      borderColor: isToday ? '#7c3aed' : dayData ? (dayData.pnl >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : '#1e1e1e',
                    }}
                  >
                    <div className={`text-xs ${isToday ? 'text-purple-400 font-bold' : 'text-gray-400'}`}>
                      {day}
                    </div>
                    {dayData && (
                      <div className="mt-0.5">
                        <div
                          className="text-xs font-semibold"
                          style={{ color: getPnlColor(dayData.pnl) }}
                        >
                          {formatCurrency(dayData.pnl)}
                        </div>
                        <div className="text-gray-500 text-[10px]">
                          {dayData.count} trade{dayData.count > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Weekly Stats */}
        <div className="w-36 space-y-0.5">
          <div className="text-gray-500 text-xs mb-2 text-center">Weekly</div>
          {weeks.map((weekData, wi) => (
            <div
              key={wi}
              className="rounded-lg p-2 border"
              style={{
                backgroundColor: weekData.pnl >= 0 ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                borderColor: weekData.pnl >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              }}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: getPnlColor(weekData.pnl) }}
              >
                {formatCurrency(weekData.pnl)}
              </div>
              <div className="text-gray-500 text-[10px]">{weekData.trades} trades</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;