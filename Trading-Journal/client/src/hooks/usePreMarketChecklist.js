import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api/checklist';

export const getDefaultState = () => ({
  // Mental
  emotion:          '',
  sleepQuality:     0,
  mentalReadiness:  5,
  readyToTrade:     '',       // 'Yes' | 'Maybe' | 'No'
  sessionMode:      '',       // 'Full Send' | 'Selective' | 'Observe' | 'Sit Out'
  mindsetNotes:     '',
  // Market
  marketBias:       '',       // 'Bullish' | 'Bearish' | 'Neutral'
  marketCondition:  '',       // 'Trending' | 'Ranging' | 'Volatile' | 'Choppy'
  volatility:       '',       // 'Low' | 'Med' | 'High'
  session:          '',
  keyNews:          '',
  marketNotes:      '',
  // Risk
  accountSize:      '',
  riskPerTrade:     '',
  maxDailyLoss:     '',
  stopTradingIf:    '',
  // Watchlist — [{ symbol, direction, keyLevels, notes }]
  watchlist:        [],
  // Custom rules — [string]
  customRules:      [],
  // Session plan
  sessionGoals:     '',
  avoidToday:       '',
  affirmation:      '',
  // Meta
  completionPct:    0,
  updatedAt:        null,
  exists:           false,
});

export const getTodayKey = () => new Date().toISOString().split('T')[0];

const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const usePreMarketChecklist = (date) => {
  const targetDate = date || getTodayKey();

  const [data,    setData]    = useState(getDefaultState);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);

  const saveTimer = useRef(null);
  const dataRef   = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchChecklist = useCallback(async () => {
    setLoading(true); setError(null); setSaved(false);
    try {
      const res = await apiFetch(`${API_BASE}?date=${targetDate}`);
      setData({ ...getDefaultState(), ...res });
      setSaved(!!res.exists);
    } catch (err) {
      setError(err.message);
      setData(getDefaultState());
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async (payload) => {
    setSaving(true); setError(null);
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        body:   JSON.stringify({ ...payload, date: targetDate }),
      });
      setData(prev => ({ ...getDefaultState(), ...prev, ...res }));
      setSaved(true);
      return res;
    } catch (err) {
      setError(err.message); throw err;
    } finally {
      setSaving(false);
    }
  }, [targetDate]);

  const autoSave = useCallback(() => {
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(dataRef.current), 2000);
  }, [save]);

  // ── Field updater ─────────────────────────────────────────────────────────
  const update = useCallback((key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    autoSave();
  }, [autoSave]);

  // ── Watchlist mutations ───────────────────────────────────────────────────
  const addWatchItem = useCallback((item) => {
    setData(prev => ({ ...prev, watchlist: [...(prev.watchlist || []), item] }));
    setSaved(false); autoSave();
  }, [autoSave]);

  const updateWatchItem = useCallback((index, field, value) => {
    setData(prev => {
      const list = (prev.watchlist || []).map((it, i) =>
        i === index ? { ...it, [field]: value } : it
      );
      return { ...prev, watchlist: list };
    });
    setSaved(false); autoSave();
  }, [autoSave]);

  const removeWatchItem = useCallback((index) => {
    setData(prev => ({
      ...prev,
      watchlist: (prev.watchlist || []).filter((_, i) => i !== index),
    }));
    setSaved(false); autoSave();
  }, [autoSave]);

  // ── Custom rules ──────────────────────────────────────────────────────────
  const addCustomRule = useCallback((label) => {
    if (!label.trim()) return;
    setData(prev => ({
      ...prev,
      customRules: [...(prev.customRules || []), label.trim()],
    }));
    setSaved(false); autoSave();
  }, [autoSave]);

  const removeCustomRule = useCallback((index) => {
    setData(prev => ({
      ...prev,
      customRules: (prev.customRules || []).filter((_, i) => i !== index),
    }));
    setSaved(false); autoSave();
  }, [autoSave]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteChecklist = useCallback(async () => {
    clearTimeout(saveTimer.current);
    try {
      await apiFetch(`${API_BASE}/${targetDate}`, { method: 'DELETE' });
      setData(getDefaultState()); setSaved(false); setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [targetDate]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  return {
    data, loading, saving, saved, error,
    update,
    addWatchItem, updateWatchItem, removeWatchItem,
    addCustomRule, removeCustomRule,
    // kept for compatibility
    toggleRule: () => {},
    save: () => save(dataRef.current),
    deleteChecklist,
    refetch: fetchChecklist,
  };
};

// ── History hook ──────────────────────────────────────────────────────────────
export const useChecklistHistory = (limit = 30) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`${API_BASE}/history?limit=${limit}`);
        if (!cancelled) setHistory(res.checklists || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [limit]);

  return { history, loading, error };
};