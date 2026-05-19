import { useState, useEffect } from 'react';
import { getTrades, createTrade, updateTrade, deleteTrade } from '../services/tradeService';

export const useTrades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      const res = await getTrades();
      setTrades(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrades(); }, []);

  const addTrade = async (data) => {
    const res = await createTrade(data);
    setTrades(prev => [res.data, ...prev]);
  };

  const editTrade = async (id, data) => {
    const res = await updateTrade(id, data);
    setTrades(prev => prev.map(t => t._id === id ? res.data : t));
  };

  const removeTrade = async (id) => {
    await deleteTrade(id);
    setTrades(prev => prev.filter(t => t._id !== id));
  };

  return { trades, loading, addTrade, editTrade, removeTrade, fetchTrades };
};