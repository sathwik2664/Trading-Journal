import { useState, useEffect, useRef } from 'react';
import { Save, Trash2, LayoutTemplate, Tag, X } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import { formatCurrency } from '../../utils/helpers';

const NoteEditor = ({ note, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [netPnl, setNetPnl] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setNetPnl(note.netPnl || 0);
      setTags(note.tags || []);
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content || '';
      }
    }
  }, [note?._id]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(note._id, {
      title,
      content: editorRef.current?.innerHTML || content,
      netPnl: parseFloat(netPnl) || 0,
      tags,
    });
    setSaving(false);
  };

  const handleTemplate = (template) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = template.content;
      setContent(template.content);
    }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!tags.includes(tagInput.trim())) {
        setTags(prev => [...prev, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));

  const execCommand = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-400">Select a note or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f0f] relative overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <input
            value={netPnl}
            onChange={e => setNetPnl(e.target.value)}
            type="number"
            placeholder="Net P&L"
            className="bg-transparent text-green-400 font-semibold text-sm w-28 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#1e1e1e] transition-colors border border-[#2a2a2a]"
          >
            <LayoutTemplate size={13} />
            Add Template
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <Save size={13} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => onDelete(note._id)}
            className="text-gray-600 hover:text-red-400 transition-colors p-1.5"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-5 pb-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full bg-transparent text-white text-2xl font-bold focus:outline-none placeholder-gray-700"
        />
        <p className="text-gray-600 text-xs mt-1">
          {note.createdAt ? `Created: ${new Date(note.createdAt).toLocaleString()}` : ''}
        </p>
      </div>

      {/* Tags */}
      <div className="px-6 py-2 flex items-center gap-2 flex-wrap">
        <Tag size={13} className="text-gray-500" />
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs bg-purple-600/10 text-purple-400 border border-purple-600/20 px-2 py-0.5 rounded-full"
          >
            {tag}
            <button onClick={() => removeTag(tag)}>
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag..."
          className="bg-transparent text-gray-400 text-xs focus:outline-none w-20"
        />
      </div>

      {/* Toolbar */}
      <div className="px-6 py-2 border-y border-[#1e1e1e] flex items-center gap-1 flex-wrap">
        {[
          { label: 'B', cmd: 'bold', style: 'font-bold' },
          { label: 'I', cmd: 'italic', style: 'italic' },
          { label: 'U', cmd: 'underline', style: 'underline' },
        ].map(({ label, cmd, style }) => (
          <button
            key={cmd}
            onClick={() => execCommand(cmd)}
            className={`w-7 h-7 rounded text-gray-400 hover:text-white hover:bg-[#2a2a2a] text-xs transition-colors ${style}`}
          >
            {label}
          </button>
        ))}
        <div className="w-px h-4 bg-[#2a2a2a] mx-1" />
        {[
          { label: 'H1', cmd: 'formatBlock', val: 'h1' },
          { label: 'H2', cmd: 'formatBlock', val: 'h2' },
          { label: 'P', cmd: 'formatBlock', val: 'p' },
        ].map(({ label, cmd, val }) => (
          <button
            key={label}
            onClick={() => execCommand(cmd, val)}
            className="px-2 h-7 rounded text-gray-400 hover:text-white hover:bg-[#2a2a2a] text-xs transition-colors"
          >
            {label}
          </button>
        ))}
        <div className="w-px h-4 bg-[#2a2a2a] mx-1" />
        {[
          { label: '• List', cmd: 'insertUnorderedList' },
          { label: '1. List', cmd: 'insertOrderedList' },
        ].map(({ label, cmd }) => (
          <button
            key={cmd}
            onClick={() => execCommand(cmd)}
            className="px-2 h-7 rounded text-gray-400 hover:text-white hover:bg-[#2a2a2a] text-xs transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-6 py-4 relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={e => setContent(e.currentTarget.innerHTML)}
          className="min-h-full focus:outline-none text-gray-300 text-sm leading-relaxed prose-editor"
          style={{
            caretColor: '#7c3aed',
          }}
        />
        {!content && (
          <p className="absolute top-4 left-6 text-gray-700 text-sm pointer-events-none">
            Start writing or select a template...
          </p>
        )}
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <TemplateSelector
          onSelect={handleTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default NoteEditor;