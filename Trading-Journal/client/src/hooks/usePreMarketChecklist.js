import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api/checklist';

// ── Default state — all fields ─────────────────────────────────────────────────
export const getDefaultState = () => ({
  // Trader state
  emotion:          '',
  emotionIntensity: 3,
  sleepQuality:     0,
  sleepHours:       0,
  mentalReadiness:  5,
  physicalState:    '',
  readyToTrade:     '',
  sessionMode:      '',
  mindsetNotes:     '',
  morningRoutine:   false,
  caffeineStatus:   '',
  lastSessionNote:  '',
  yesterdayRating:  null,   // read-only carry-forward

  // Market
  marketBias:       '',
  marketCondition:  '',
  volatility:       '',
  session:          '',
  keyNews:          '',
  marketNotes:      '',
  vixLevel:         '',
  dxyBias:          '',
  dominantPairs:    '',

  // Risk
  accountSize:          '',
  riskPerTrade:         '',
  maxDailyLoss:         '',
  maxDailyProfit:       '',
  stopTradingIf:        '',
  trailRulesIf:         '',
  maxTradesPerSession:  '',
  currentBalance:       '',

  // Market checks
  marketChecks: [
    { label: 'Checked pre-market news & economic events',      checked: false },
    { label: 'Key support/resistance levels marked on chart',  checked: false },
    { label: 'Overall market bias clearly identified',         checked: false },
    { label: 'Correlated assets/pairs reviewed',              checked: false },
    { label: 'Liquidity & session open conditions noted',      checked: false },
    { label: 'HTF (Daily/H4) trend confirmed',                checked: false },
    { label: 'Open gaps or unfilled FVGs noted',              checked: false },
    { label: 'Session kill zones mapped (London/NY open)',    checked: false },
  ],

  // Watchlist
  watchlist: [],

  // Strategy rules
  strategyRules: [
    { label: 'Setup aligns with higher timeframe trend',       checked: false },
    { label: 'Entry is at a key level (S/R, zone, wick)',      checked: false },
    { label: 'Risk:Reward is minimum 1:2',                     checked: false },
    { label: 'Stop loss is at a logical structure point',      checked: false },
    { label: 'No conflicting news within session window',      checked: false },
    { label: 'Volume or momentum confirms direction',          checked: false },
    { label: 'Not entering out of boredom or revenge',         checked: false },
    { label: 'Position size respects per-trade risk %',        checked: false },
    { label: 'I have a clear invalidation level',              checked: false },
    { label: 'This is genuinely an A+ setup',                  checked: false },
  ],
  customRules: [],

  // Session plan
  sessionGoals:   '',
  avoidToday:     '',
  affirmation:    '',
  dailyMantra:    '',
  focusPairs:     '',
  exitStrategy:   '',

  // Post-session
  sessionRating:  0,
  rulesFollowed:  0,
  actualPnl:      '',
  tradesCount:    0,
  sessionReview:  '',
  lessonLearned:  '',
  tomorrowFocus:  '',

  // Meta
  completionPct:  0,
  readinesScore:  0,
  tags:           [],
  updatedAt:      null,
  exists:         false,
});

export const getTodayKey = () => new Date().toISOString().split('T')[0];

// ── API helper ─────────────────────────────────────────────────────────────────
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

// ── Main checklist hook ────────────────────────────────────────────────────────
export const usePreMarketChecklist = (date) => {
  const targetDate = date || getTodayKey();
  const isToday    = targetDate === getTodayKey();

  const [data,    setData]    = useState(getDefaultState);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [dirty,   setDirty]   = useState(false);

  const saveTimer = useRef(null);
  const dataRef   = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchChecklist = useCallback(async () => {
    setLoading(true); setError(null); setSaved(false); setDirty(false);
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

  // ── Save ─────────────────────────────────────────────────────────────────────
  const save = useCallback(async (payload) => {
    setSaving(true); setError(null);
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        body:   JSON.stringify({ ...payload, date: targetDate }),
      });
      setData(prev => ({ ...getDefaultState(), ...prev, ...res }));
      setSaved(true); setDirty(false);
      return res;
    } catch (err) {
      setError(err.message); throw err;
    } finally {
      setSaving(false);
    }
  }, [targetDate]);

  const autoSave = useCallback(() => {
    if (!isToday) return;
    setSaved(false); setDirty(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(dataRef.current), 1800);
  }, [save, isToday]);

  // Force immediate save (e.g. on blur or section collapse)
  const saveNow = useCallback(() => {
    if (!isToday) return;
    clearTimeout(saveTimer.current);
    return save(dataRef.current);
  }, [save, isToday]);

  // ── Field updater ────────────────────────────────────────────────────────────
  const update = useCallback((key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
    autoSave();
  }, [autoSave]);

  // ── Deep updater for nested objects ──────────────────────────────────────────
  const updateNested = useCallback((path, value) => {
    setData(prev => {
      const keys = path.split('.');
      if (keys.length === 1) return { ...prev, [path]: value };
      const top   = keys[0];
      const rest  = keys.slice(1).join('.');
      const clone = Array.isArray(prev[top]) ? [...prev[top]] : { ...prev[top] };
      // For array[index].field syntax: path like "marketChecks.2.checked"
      if (!isNaN(keys[1])) {
        const idx  = parseInt(keys[1]);
        const field = keys[2];
        clone[idx] = { ...clone[idx], [field]: value };
      }
      return { ...prev, [top]: clone };
    });
    autoSave();
  }, [autoSave]);

  // ── Toggle check item ─────────────────────────────────────────────────────────
  const toggleCheck = useCallback((listKey, index) => {
    setData(prev => {
      const list = [...(prev[listKey] || [])];
      list[index] = { ...list[index], checked: !list[index].checked };
      return { ...prev, [listKey]: list };
    });
    autoSave();
  }, [autoSave]);

  // ── Watchlist mutations ───────────────────────────────────────────────────────
  const addWatchItem = useCallback((item) => {
    setData(prev => ({ ...prev, watchlist: [...(prev.watchlist || []), item] }));
    autoSave();
  }, [autoSave]);

  const updateWatchItem = useCallback((index, field, value) => {
    setData(prev => {
      const list = (prev.watchlist || []).map((it, i) =>
        i === index ? { ...it, [field]: value } : it
      );
      return { ...prev, watchlist: list };
    });
    autoSave();
  }, [autoSave]);

  const removeWatchItem = useCallback((index) => {
    setData(prev => ({
      ...prev,
      watchlist: (prev.watchlist || []).filter((_, i) => i !== index),
    }));
    autoSave();
  }, [autoSave]);

  const reorderWatchItem = useCallback((from, to) => {
    setData(prev => {
      const list = [...(prev.watchlist || [])];
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return { ...prev, watchlist: list };
    });
    autoSave();
  }, [autoSave]);

  // ── Custom rules ──────────────────────────────────────────────────────────────
  const addCustomRule = useCallback((label) => {
    if (!label.trim()) return;
    setData(prev => ({
      ...prev,
      customRules: [...(prev.customRules || []), label.trim()],
    }));
    autoSave();
  }, [autoSave]);

  const removeCustomRule = useCallback((index) => {
    setData(prev => ({
      ...prev,
      customRules: (prev.customRules || []).filter((_, i) => i !== index),
    }));
    autoSave();
  }, [autoSave]);

  // ── Tags ──────────────────────────────────────────────────────────────────────
  const addTag = useCallback((tag) => {
    setData(prev => {
      if ((prev.tags || []).includes(tag)) return prev;
      return { ...prev, tags: [...(prev.tags || []), tag] };
    });
    autoSave();
  }, [autoSave]);

  const removeTag = useCallback((tag) => {
    setData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
    autoSave();
  }, [autoSave]);

  // ── Post-session save (separate endpoint, lighter) ────────────────────────────
  const savePostSession = useCallback(async (fields) => {
    setSaving(true); setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/${targetDate}/post-session`, {
        method: 'PATCH',
        body:   JSON.stringify(fields),
      });
      setData(prev => ({ ...prev, ...res }));
      setSaved(true);
      return res;
    } catch (err) {
      setError(err.message); throw err;
    } finally {
      setSaving(false);
    }
  }, [targetDate]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteChecklist = useCallback(async () => {
    clearTimeout(saveTimer.current);
    try {
      await apiFetch(`${API_BASE}/${targetDate}`, { method: 'DELETE' });
      setData(getDefaultState()); setSaved(false); setError(null); setDirty(false);
    } catch (err) {
      setError(err.message);
    }
  }, [targetDate]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  return {
    data, loading, saving, saved, dirty, error,
    update,
    updateNested,
    toggleCheck,
    addWatchItem, updateWatchItem, removeWatchItem, reorderWatchItem,
    addCustomRule, removeCustomRule,
    addTag, removeTag,
    save: () => save(dataRef.current),
    saveNow,
    savePostSession,
    deleteChecklist,
    refetch: fetchChecklist,
  };
};

// ── History hook ───────────────────────────────────────────────────────────────
export const useChecklistHistory = (limit = 30, filters = {}) => {
  const [history, setHistory] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit, ...filters }).toString();
        const res    = await apiFetch(`${API_BASE}/history?${params}`);
        if (!cancelled) {
          setHistory(res.checklists || []);
          setTotal(res.total || 0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [limit, JSON.stringify(filters)]);

  return { history, total, loading, error };
};

// ── Stats hook ─────────────────────────────────────────────────────────────────
export const useChecklistStats = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/stats`);
      setStats(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// ── Insights hook ──────────────────────────────────────────────────────────────
export const useChecklistInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`${API_BASE}/insights`);
        if (!cancelled) setInsights(res);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return { insights, loading, error };
};

// ── Week view hook ─────────────────────────────────────────────────────────────
export const useWeekView = (date) => {
  const [week,    setWeek]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const d = date || getTodayKey();
        const res = await apiFetch(`${API_BASE}/week?date=${d}`);
        if (!cancelled) setWeek(res);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [date]);

  return { week, loading, error };
};