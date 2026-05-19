import { formatCurrency, formatDate } from '../../utils/helpers';
import { Plus } from 'lucide-react';

const folderColors = {
  'Trade Notes': '#7c3aed',
  'Daily Journal': '#2563eb',
  'Sessions Recap': '#16a34a',
  'Quarterly Goals': '#d97706',
  'Trading Plan': '#dc2626',
  'Plan of Action': '#0891b2',
  'Templates': '#6b7280',
};

const NoteList = ({ notes, selectedNote, onSelect, onNew, activeFolder, activeTag }) => {
  const filtered = notes.filter(n => {
    if (activeTag) return n.tags?.includes(activeTag);
    if (!activeFolder || activeFolder === 'All notes') return true;
    return n.folder === activeFolder;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          {activeTag ? `#${activeTag}` : activeFolder || 'All Notes'}
        </span>
        <button
          onClick={onNew}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Notes */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-gray-500 text-sm">No notes yet</p>
            <button
              onClick={onNew}
              className="mt-2 text-purple-400 text-xs hover:text-purple-300"
            >
              + New note
            </button>
          </div>
        ) : (
          filtered.map(note => (
            <div
              key={note._id}
              onClick={() => onSelect(note)}
              className={`px-4 py-3 border-b border-[#1a1a1a] cursor-pointer hover:bg-[#1a1a1a] transition-colors ${
                selectedNote?._id === note._id ? 'bg-[#1e1e1e] border-l-2 border-l-purple-500' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: folderColors[note.folder] || '#6b7280' }}
                />
                <span className="text-white text-sm font-medium truncate">{note.title}</span>
              </div>
              {note.netPnl !== 0 && (
                <p className={`text-xs font-semibold ml-3.5 ${note.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  NET P&L: {formatCurrency(note.netPnl)}
                </p>
              )}
              <p className="text-gray-600 text-[10px] ml-3.5 mt-0.5">
                {formatDate(note.updatedAt || note.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoteList;