import { X, Star, Search } from 'lucide-react';
import { useState } from 'react';

const defaultTemplates = [
  {
    id: 1,
    name: 'Pre-Market & Post-Session',
    isFavourite: true,
    content: `<h2>Pre-Market Plan</h2>
<table>
  <thead><tr><th>Symbol</th><th>Game Plan</th><th>Entry</th><th>Target</th><th>Stop</th></tr></thead>
  <tbody>
    <tr><td>ES</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>MES</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>CL</td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>
<h2>Post-Session Review</h2>
<p>What went well:</p>
<p>What to improve:</p>
<p>Emotions:</p>`
  },
  {
    id: 2,
    name: 'Intra-day Check-in',
    isFavourite: true,
    content: `<h2>Intra-day Check-in</h2>
<p><strong>Current P&L:</strong></p>
<p><strong>Bias:</strong></p>
<p><strong>Key levels:</strong></p>
<p><strong>Notes:</strong></p>`
  },
  {
    id: 3,
    name: 'All-In-One Daily Journal',
    isFavourite: true,
    content: `<h2>Daily Journal</h2>
<p><strong>Date:</strong></p>
<p><strong>Market Conditions:</strong></p>
<p><strong>Trades Taken:</strong></p>
<p><strong>Mistakes:</strong></p>
<p><strong>Lessons Learned:</strong></p>`
  },
  {
    id: 4,
    name: 'Morning Game-Plan',
    isFavourite: false,
    content: `<h2>Morning Game Plan</h2>
<p><strong>Overnight news:</strong></p>
<p><strong>Key levels to watch:</strong></p>
<p><strong>Bias (Bull/Bear/Neutral):</strong></p>
<p><strong>Setups I am looking for:</strong></p>`
  },
  {
    id: 5,
    name: 'Mindset Assessment',
    isFavourite: false,
    content: `<h2>Mindset Assessment</h2>
<p><strong>Energy level (1-10):</strong></p>
<p><strong>Focus level (1-10):</strong></p>
<p><strong>Emotional state:</strong></p>
<p><strong>Am I ready to trade?</strong></p>`
  },
  {
    id: 6,
    name: 'Quarterly Roadmap',
    isFavourite: false,
    content: `<h2>Quarterly Roadmap</h2>
<p><strong>Quarter:</strong></p>
<p><strong>Goals:</strong></p>
<p><strong>P&L Target:</strong></p>
<p><strong>Skills to improve:</strong></p>
<p><strong>Review date:</strong></p>`
  },
];

const TemplateSelector = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = defaultTemplates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const favourites = filtered.filter(t => t.isFavourite);
  const recommended = filtered.filter(t => !t.isFavourite);

  return (
    <div className="absolute right-0 top-0 w-80 h-full bg-[#141414] border-l border-[#1e1e1e] z-20 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
        <span className="text-white text-sm font-medium">Select a template</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2">
          <Search size={13} className="text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates"
            className="bg-transparent text-white text-xs flex-1 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Favourites */}
        {favourites.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1 px-1 py-2">
              <Star size={11} className="text-yellow-400" />
              <span className="text-gray-400 text-xs font-medium">Favourites</span>
            </div>
            {favourites.map(t => (
              <button
                key={t.id}
                onClick={() => { onSelect(t); onClose(); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#1e1e1e] hover:text-white transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <div>
            <div className="px-1 py-2">
              <span className="text-gray-400 text-xs font-medium">Recommended</span>
            </div>
            {recommended.map(t => (
              <button
                key={t.id}
                onClick={() => { onSelect(t); onClose(); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#1e1e1e] hover:text-white transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;