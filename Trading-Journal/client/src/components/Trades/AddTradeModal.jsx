import { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

const initialState = {
  symbol: '',
  date: '',
  side: 'Long',
  entryPrice: '',
  exitPrice: '',
  contracts: '',
  commissions: 0,
  initialRisk: '',
  notes: '',
  tags: '',
};

const AddTradeModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calcPnl = () => {
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const contracts = parseFloat(form.contracts);
    const commissions = parseFloat(form.commissions) || 0;
    if (!entry || !exit || !contracts) return 0;
    const gross = form.side === 'Long'
      ? (exit - entry) * contracts
      : (entry - exit) * contracts;
    return gross - commissions;
  };

  const handleSubmit = async () => {
    if (!form.symbol || !form.date || !form.entryPrice || !form.exitPrice || !form.contracts) {
      alert('Please fill all required fields');
      return;
    }
    setLoading(true);
    const pnl = calcPnl();
    const grossPnl = form.side === 'Long'
      ? (parseFloat(form.exitPrice) - parseFloat(form.entryPrice)) * parseFloat(form.contracts)
      : (parseFloat(form.entryPrice) - parseFloat(form.exitPrice)) * parseFloat(form.contracts);

    await onAdd({
      ...form,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: parseFloat(form.exitPrice),
      contracts: parseFloat(form.contracts),
      commissions: parseFloat(form.commissions) || 0,
      initialRisk: parseFloat(form.initialRisk) || 0,
      pnl,
      grossPnl,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
    });
    setForm(initialState);
    setLoading(false);
    onClose();
  };

  const pnlPreview = calcPnl();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Trade">
      <div className="space-y-4">

        {/* Symbol + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Symbol *</label>
            <input
              name="symbol"
              value={form.symbol}
              onChange={handleChange}
              placeholder="e.g. MES, ES, NQ"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Date *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Side */}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Side *</label>
          <div className="flex gap-2">
            {['Long', 'Short'].map(s => (
              <button
                key={s}
                onClick={() => setForm(prev => ({ ...prev, side: s }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  form.side === s
                    ? s === 'Long'
                      ? 'bg-green-600/20 text-green-400 border-green-600/40'
                      : 'bg-red-600/20 text-red-400 border-red-600/40'
                    : 'bg-transparent text-gray-400 border-[#2a2a2a] hover:border-gray-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Entry + Exit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Entry Price *</label>
            <input
              type="number"
              name="entryPrice"
              value={form.entryPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Exit Price *</label>
            <input
              type="number"
              name="exitPrice"
              value={form.exitPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Contracts + Commissions */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Contracts *</label>
            <input
              type="number"
              name="contracts"
              value={form.contracts}
              onChange={handleChange}
              placeholder="0"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Commissions</label>
            <input
              type="number"
              name="commissions"
              value={form.commissions}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Initial Risk */}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Initial Risk ($)</label>
          <input
            type="number"
            name="initialRisk"
            value={form.initialRisk}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Tags (comma separated)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="FOMC, Futures, Equities"
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Trade notes..."
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* PnL Preview */}
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Estimated Net P&L</span>
            <span
              className="text-lg font-bold"
              style={{ color: pnlPreview >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {pnlPreview >= 0 ? '+' : ''}${pnlPreview.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
            {loading ? 'Adding...' : 'Add Trade'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTradeModal;