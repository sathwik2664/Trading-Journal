import { useState, useEffect } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '../services/noteService';

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const res = await getNotes();
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  const addNote = async (data) => {
    const res = await createNote(data);
    setNotes(prev => [res.data, ...prev]);
    return res.data;
  };

  const editNote = async (id, data) => {
    const res = await updateNote(id, data);
    setNotes(prev => prev.map(n => n._id === id ? res.data : n));
  };

  const removeNote = async (id) => {
    await deleteNote(id);
    setNotes(prev => prev.filter(n => n._id !== id));
  };

  return { notes, loading, addNote, editNote, removeNote };
};