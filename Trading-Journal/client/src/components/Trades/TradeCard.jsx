import { formatCurrency, formatDate } from '../../utils/helpers';
import { Trash2 } from 'lucide-react';

const TradeCard = ({ trade, onDelete }) => {
  const isWin = trade.pnl >= 0;

  return (
    <div
      className="bg-[#141414] border rounded-xl p-4 hover:border-purple-500/30 transition-all"
      style={{
        borderColor: isWin ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#1e1e1e] rounded-lg px-3 py-1">
            <span className="text-white font-bold text-sm">{trade.symbol}</span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              trade.side === 'Long'
                ? 'bg-green-600/20 text-green-400'
                : 'bg-red-600/20 text-red-400'
            }`}
          >
            {trade.side}
          </span>
          <span className="text-gray-500 text-xs">{formatDate(trade.date)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-lg font-bold"
            style={{ color: isWin ? '#22c55e' : '#ef4444' }}
          >
            {isWin ? '+' : ''}{formatCurrency(trade.pnl)}
          </span>
          <button
            onClick={() => onDelete(trade._id)}
            className="text-gray-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Entry', value: `$${trade.entryPrice}` },
          { label: 'Exit', value: `$${trade.exitPrice}` },
          { label: 'Contracts', value: trade.contracts },
          { label: 'Commission', value: `$${trade.commissions}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0f0f0f] rounded-lg p-2">
            <div className="text-gray-500 text-[10px]">{label}</div>
            <div className="text-white text-xs font-medium mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {trade.tags?.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap">
          {trade.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] bg-purple-600/10 text-purple-400 border border-purple-600/20 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {trade.notes && (
        <p className="text-gray-500 text-xs mt-3 border-t border-[#1e1e1e] pt-2">
          {trade.notes}
        </p>
      )}
    </div>
  );
};

export default TradeCard;