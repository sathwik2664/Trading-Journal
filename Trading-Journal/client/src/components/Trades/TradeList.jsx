import TradeCard from './TradeCard';

const TradeList = ({ trades, onDelete }) => {
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-gray-400 text-lg font-medium">No trades yet</p>
        <p className="text-gray-600 text-sm mt-1">Click "Add Trade" to log your first trade</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map(trade => (
        <TradeCard key={trade._id} trade={trade} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default TradeList;