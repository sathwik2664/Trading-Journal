import { useState, useEffect } from 'react';
import {
  getTrades, createTrade,
  updateTrade, deleteTrade,
  getTradeScreenshot,
} from '../services/tradeService';

export const useTrades = () => {
  const [trades,  setTrades]  = useState([]);
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
    // Add to list — screenshot excluded from list response
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

  const fetchScreenshot = async (id) => {
    const res = await getTradeScreenshot(id);
    return res.data.screenshot;
  };

  return { trades, loading, addTrade, editTrade, removeTrade, fetchTrades, fetchScreenshot };
};