/**
 * useSetups.js
 * Fetches setups from MongoDB via setupService and groups them by category.
 * Used by AddTradeModal to show Playbook setups as selectable strategies.
 */

import { useState, useEffect, useMemo } from 'react';
import * as setupService from '../services/setupService';

export const useSetups = () => {
  const [setups,  setSetups]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;

    setupService.getSetups()
      .then(res => {
        if (!cancelled) setSetups(res.data || []);
      })
      .catch(err => {
        if (!cancelled) setError(err);
        console.error('useSetups fetch error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  /**
   * Grouped by category for the strategy picker UI.
   * Returns: { "Momentum": [setup, …], "Breakout": [setup, …], … }
   * Setups with no category fall under "Other".
   */
  const groupedSetups = useMemo(() => {
    const groups = {};
    setups.forEach(setup => {
      const cat = (setup.category && setup.category.trim()) ? setup.category.trim() : 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(setup);
    });
    return groups;
  }, [setups]);

  /** Flat list of all setup names (for quick lookups / untracked detection) */
  const setupNames = useMemo(
    () => new Set(setups.map(s => s.name.toLowerCase())),
    [setups]
  );

  return { setups, groupedSetups, setupNames, loading, error };
};