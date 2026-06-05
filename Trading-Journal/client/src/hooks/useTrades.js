import { useState, useEffect } from 'react';
import {
  getTrades, createTrade,
  updateTrade, deleteTrade,
  getTradeScreenshot, getTradeImages,
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
    setTrades(prev => [res.data, ...prev]);
    return res.data;  // ← just return, let the caller handle applyTradePnl
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

  const fetchTradeImages = async (id) => {
    const res = await getTradeImages(id);
    return res.data.images;
  };

  return { trades, loading, addTrade, editTrade, removeTrade, fetchTrades, fetchScreenshot, fetchTradeImages };
};