import { useState } from 'react';
import { useTrades } from '../hooks/useTrades';
import TradeList from '../components/Trades/TradeList';
import AddTradeModal from '../components/Trades/AddTradeModal';
import Loader from '../components/shared/Loader';
import { formatCurrency } from '../utils/helpers';
import { Plus, TrendingUp, TrendingDown, Target } from 'lucide-react';

const Trades = () => {
  const { trades, loading, addTrade, removeTrade } = useTrades();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  if (loading) return <Loader />;

  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winners = trades.filter(t => t.pnl > 0);
  const winRate = trades.length ? ((winners.length / trades.length) * 100).toFixed(1) : 0;
  const totalTrades = trades.length;

  const filtered = trades.filter(t => {
    const matchFilter = filter === 'All' || t.side === filter ||
      (filter === 'Winners' && t.pnl > 0) ||
      (filter === 'Losers' && t.pnl < 0);
    const matchSearch = t.symbol.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="p-6 min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Trades</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Trade
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${netPnl >= 0 ? 'bg-green-600/10' : 'bg-red-600/10'}`}>
            {netPnl >= 0
              ? <TrendingUp className="text-green-400" size={22} />
              : <TrendingDown className="text-red-400" size={22} />
            }
          </div>
          <div>
            <p className="text-gray-400 text-xs">Net P&L</p>
            <p className={`text-xl font-bold ${netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(netPnl)}
            </p>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-600/10">
            <Target className="text-purple-400" size={22} />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Win Rate</p>
            <p className="text-xl font-bold text-white">{winRate}%</p>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-600/10">
            <TrendingUp className="text-blue-400" size={22} />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Total Trades</p>
            <p className="text-xl font-bold text-white">{totalTrades}</p>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['All', 'Long', 'Short', 'Winners', 'Losers'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search symbol..."
          className="bg-[#141414] border border-[#1e1e1e] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500 w-44"
        />
      </div>

      {/* Trade List */}
      <TradeList trades={filtered} onDelete={removeTrade} />

      {/* Modal */}
      <AddTradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addTrade}
      />
    </div>
  );
};

export default Trades;