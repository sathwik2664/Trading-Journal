import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, BookMarked } from 'lucide-react';
import Modal from '../components/shared/Modal';
import Button from '../components/shared/Button';

const defaultSetups = [
  {
    id: 1,
    name: 'Opening Range Breakout',
    description: 'Trade breakouts from the first 30-minute range after market open.',
    rules: [
      'Wait for the first 30 minutes to form the range',
      'Enter on a breakout with volume confirmation',
      'Stop below/above the range',
      'Target 2:1 or next major level',
    ],
    tags: ['Futures', 'ORB'],
    winRate: 62,
    trades: 18,
  },
  {
    id: 2,
    name: 'VWAP Reclaim',
    description: 'Enter when price reclaims VWAP after a failed breakdown.',
    rules: [
      'Price must be below VWAP and then reclaim it',
      'Look for rejection candle then long entry',
      'Stop below the recent low',
      'Target previous high or +0.5R minimum',
    ],
    tags: ['ES', 'MES', 'VWAP'],
    winRate: 58,
    trades: 24,
  },
  {
    id: 3,
    name: 'News Fade',
    description: 'Fade the initial spike after high-impact news events like FOMC.',
    rules: [
      'Only trade FOMC, CPI, NFP events',
      'Wait for the initial spike to complete (1-2 min)',
      'Enter in the opposite direction of spike',
      'Tight stop above/below spike high/low',
    ],
    tags: ['FOMC', 'Fade', 'News'],
    winRate: 55,
    trades: 11,
  },
];

const SetupCard = ({ setup, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden hover:border-purple-500/30 transition-all">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookMarked size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{setup.name}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{setup.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-green-400 text-sm font-bold">{setup.winRate}%</p>
            <p className="text-gray-600 text-xs">{setup.trades} trades</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(setup.id); }}
            className="text-gray-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          {expanded
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />
          }
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#1e1e1e]">
          {/* Tags */}
          <div className="flex gap-2 mt-4 mb-4 flex-wrap">
            {setup.tags.map(tag => (
              <span
                key={tag}
                className="text-xs bg-purple-600/10 text-purple-400 border border-purple-600/20 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Rules */}
          <div>
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
              Rules
            </h4>
            <div className="space-y-2">
              {setup.rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-gray-300 text-sm">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 pt-4 border-t border-[#1e1e1e]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-xs">Win Rate</span>
              <span className="text-green-400 text-xs font-medium">{setup.winRate}%</span>
            </div>
            <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${setup.winRate}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Playbook = () => {
  const [setups, setSetups] = useState(defaultSetups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', rules: '', tags: '', winRate: '', trades: '',
  });

  const handleAdd = () => {
    if (!form.name) return;
    const newSetup = {
      id: Date.now(),
      name: form.name,
      description: form.description,
      rules: form.rules.split('\n').filter(r => r.trim()),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      winRate: parseFloat(form.winRate) || 0,
      trades: parseInt(form.trades) || 0,
    };
    setSetups(prev => [newSetup, ...prev]);
    setForm({ name: '', description: '', rules: '', tags: '', winRate: '', trades: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    setSetups(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="p-6 min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Playbook</h1>
          <p className="text-gray-500 text-sm mt-1">Your trading setups and strategies</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Setup
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Setups</p>
          <p className="text-white text-2xl font-bold">{setups.length}</p>
        </div>
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Avg Win Rate</p>
          <p className="text-green-400 text-2xl font-bold">
            {setups.length
              ? (setups.reduce((s, p) => s + p.winRate, 0) / setups.length).toFixed(1)
              : 0}%
          </p>
        </div>
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Trades Logged</p>
          <p className="text-white text-2xl font-bold">
            {setups.reduce((s, p) => s + p.trades, 0)}
          </p>
        </div>
      </div>

      {/* Setups */}
      {setups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">📘</div>
          <p className="text-gray-400 text-lg font-medium">No setups yet</p>
          <p className="text-gray-600 text-sm mt-1">
            Click "Add Setup" to document your trading strategy
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {setups.map(setup => (
            <SetupCard key={setup.id} setup={setup} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add Setup Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Setup"
      >
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Setup Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Opening Range Breakout"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Description</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Short description of this setup"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">
              Rules (one per line)
            </label>
            <textarea
              value={form.rules}
              onChange={e => setForm(p => ({ ...p, rules: e.target.value }))}
              rows={4}
              placeholder={`Rule 1\nRule 2\nRule 3`}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">
              Tags (comma separated)
            </label>
            <input
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="ES, Breakout, FOMC"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Win Rate %</label>
              <input
                type="number"
                value={form.winRate}
                onChange={e => setForm(p => ({ ...p, winRate: e.target.value }))}
                placeholder="0"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Trades Taken</label>
              <input
                type="number"
                value={form.trades}
                onChange={e => setForm(p => ({ ...p, trades: e.target.value }))}
                placeholder="0"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAdd} className="flex-1">
              Add Setup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Playbook;