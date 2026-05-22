import { useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import NoteList from '../components/Notebook/NoteList';
import NoteEditor from '../components/Notebook/NoteEditor';
import PreMarketChecklist from '../components/Notebook/PreMarketChecklist';
import Loader from '../components/shared/Loader';
import {
  BookOpen, FileText, Calendar, Target,
  Map, ClipboardList, Layout, ChevronDown,
  ChevronUp, Tag, Plus, CheckSquare
} from 'lucide-react';

// ── Regular note folders ──────────────────────────────────────────────────────
const folders = [
  { name: 'All notes',       icon: BookOpen,      color: '#6b7280' },
  { name: 'Trade Notes',     icon: FileText,       color: '#7c3aed' },
  { name: 'Daily Journal',   icon: Calendar,       color: '#2563eb' },
  { name: 'Sessions Recap',  icon: ClipboardList,  color: '#16a34a' },
  { name: 'Quarterly Goals', icon: Target,         color: '#d97706' },
  { name: 'Trading Plan',    icon: Map,            color: '#dc2626' },
  { name: 'Plan of Action',  icon: ClipboardList,  color: '#0891b2' },
  { name: 'Templates',       icon: Layout,         color: '#6b7280' },
];

const PRE_MARKET_FOLDER = 'Pre-Market Checklist';

const Notebook = () => {
  const { notes, loading, addNote, editNote, removeNote } = useNotes();
  const [activeFolder, setActiveFolder]   = useState('All notes');
  const [activeTag, setActiveTag]         = useState(null);
  const [selectedNote, setSelectedNote]   = useState(null);
  const [showFolders, setShowFolders]     = useState(true);
  const [showTags, setShowTags]           = useState(true);

  if (loading) return <Loader />;

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];

  const isChecklist = activeFolder === PRE_MARKET_FOLDER;

  const handleNewNote = async () => {
    const newNote = await addNote({
      title:   'New Note',
      content: '',
      folder:  activeFolder === 'All notes' ? 'Trade Notes' : activeFolder,
      tags:    [],
      netPnl:  0,
    });
    setSelectedNote(newNote);
    setActiveTag(null);
  };

  const handleSave   = async (id, data) => { await editNote(id, data); setSelectedNote(p => ({ ...p, ...data })); };
  const handleDelete = async (id)       => { await removeNote(id); setSelectedNote(null); };

  const selectFolder = (name) => { setActiveFolder(name); setActiveTag(null); setSelectedNote(null); };

  // today's completion badge — reads from localStorage
  const getTodayPct = () => {
    try {
      const key = new Date().toISOString().split('T')[0];
      const raw = localStorage.getItem(`premarket_${key}`);
      if (!raw) return null;
      const { state } = JSON.parse(raw);
      const items = [
        state.emotion !== '', state.sleepQuality > 0, state.readyToTrade !== null,
        state.marketBias !== '', state.volatility !== '',
        ...(state.marketChecks || []),
        state.maxDailyLoss !== '', state.maxTrades !== '', state.riskPerTrade !== '',
        ...(state.strategyRules || []),
        state.sessionGoals !== '',
      ];
      return Math.round((items.filter(Boolean).length / items.length) * 100);
    } catch (_) { return null; }
  };
  const todayPct = getTodayPct();

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">

      {/* ── Left Sidebar ────────────────────────────────────────────────────── */}
      <div className="w-52 bg-[#111111] border-r border-[#1e1e1e] flex flex-col overflow-y-auto flex-shrink-0">

        {/* New Note */}
        {!isChecklist && (
          <div className="p-3 border-b border-[#1e1e1e]">
            <button
              onClick={handleNewNote}
              className="w-full flex items-center gap-2 text-gray-400 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-[#1e1e1e] transition-colors border border-dashed border-[#2a2a2a]"
            >
              <Plus size={13} /> New note
            </button>
          </div>
        )}

        {/* ── Pre-Market Checklist (pinned) ── */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => selectFolder(PRE_MARKET_FOLDER)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all mb-1 border ${
              isChecklist
                ? 'bg-purple-600/20 border-purple-600/30 text-purple-300'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CheckSquare size={13} style={{ color: isChecklist ? '#a78bfa' : '#7c3aed' }} />
              Pre-Market
            </span>
            {/* completion badge */}
            {todayPct !== null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                todayPct === 100
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-purple-600/20 text-purple-400'
              }`}>
                {todayPct}%
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-[#1e1e1e] my-1" />

        {/* ── Folders ── */}
        <div className="px-3 py-2">
          <button
            onClick={() => setShowFolders(!showFolders)}
            className="flex items-center justify-between w-full text-gray-500 text-xs font-medium uppercase tracking-wider mb-2 px-1"
          >
            <span>Folders</span>
            {showFolders ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showFolders && folders.map(({ name, icon: Icon, color }) => (
            <button
              key={name}
              onClick={() => selectFolder(name)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                activeFolder === name && !activeTag && !isChecklist
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate text-xs">{name}</span>
            </button>
          ))}
        </div>

        {/* ── Tags ── */}
        {allTags.length > 0 && (
          <div className="px-3 py-2 border-t border-[#1e1e1e]">
            <button
              onClick={() => setShowTags(!showTags)}
              className="flex items-center justify-between w-full text-gray-500 text-xs font-medium uppercase tracking-wider mb-2 px-1"
            >
              <span>Tags</span>
              {showTags ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showTags && allTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setActiveTag(tag); setActiveFolder(null); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors mb-0.5 ${
                  activeTag === tag
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <Tag size={11} />
                <span>{tag}</span>
                <span className="ml-auto text-gray-600 text-[10px]">
                  {notes.filter(n => n.tags?.includes(tag)).length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Panel ──────────────────────────────────────────────────────── */}
      {isChecklist ? (
        /* Full-width checklist — no note list panel */
        <PreMarketChecklist />
      ) : (
        <>
          {/* Middle — Note List */}
          <div className="w-64 bg-[#111111] border-r border-[#1e1e1e] flex-shrink-0 overflow-hidden flex flex-col">
            <NoteList
              notes={notes}
              selectedNote={selectedNote}
              onSelect={setSelectedNote}
              onNew={handleNewNote}
              activeFolder={activeFolder}
              activeTag={activeTag}
            />
          </div>

          {/* Right — Note Editor */}
          <NoteEditor note={selectedNote} onSave={handleSave} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
};

export default Notebook;