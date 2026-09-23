/**
 * useSetups.js — single shared source of truth for Playbook setups.
 *
 * - One module-level store: Playbook page and AddTradeModal read the SAME data,
 *   so a setup added in Playbook shows up in Add Trade instantly.
 * - Server (MongoDB) is the only source of truth → works from any laptop/browser.
 * - Auto re-syncs on: window focus, tab becoming visible, every 30s, and
 *   instantly across other tabs of the same browser (BroadcastChannel).
 * - Exposes readable error messages instead of a generic "Something went wrong".
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import * as setupService from '../services/setupService';

const POLL_MS = 30000;
const CHANNEL_NAME = 'zella-setups-sync';

let state = { setups: [], loading: true, loaded: false, error: '' };
const listeners = new Set();
let inflight = null;
let timer = null;
let channel = null;

const emit = () => listeners.forEach(fn => fn(state));
const setState = patch => { state = { ...state, ...patch }; emit(); };

/* Turn any axios/fetch error into a message a human can act on */
export const errMsg = (e) => {
  const status = e?.response?.status;
  const server = e?.response?.data?.message || e?.response?.data?.error;
  if (status === 401) return 'Session expired or not logged in on this device — please log out and log in again.';
  if (status === 403) return 'Not allowed to do that (403).';
  if (status === 404) return 'API route not found (404) — check the server is deployed with the latest code.';
  if (status === 413) return 'Request too large (413).';
  if (server) return `${server}${status ? ` (${status})` : ''}`;
  if (status) return `Server error (${status}).`;
  if (e?.message === 'Network Error' || e?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your internet, and that the API URL and CORS allow this device.';
  }
  return e?.message || 'Unknown error.';
};

const toList = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.setups)) return d.setups;
  return [];
};

const toItem = (res) => {
  const d = res?.data;
  return d?.data && !Array.isArray(d.data) ? d.data : d?.setup ? d.setup : d;
};

const broadcast = () => {
  try { channel?.postMessage('changed'); } catch { /* ignore */ }
};

export const refreshSetups = async () => {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await setupService.getSetups();
      setState({ setups: toList(res), loading: false, loaded: true, error: '' });
    } catch (e) {
      // keep whatever we already have; just surface the error
      setState({ loading: false, error: errMsg(e) });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};

const onVisible = () => { if (document.visibilityState === 'visible') refreshSetups(); };
const onFocus = () => refreshSetups();

const start = () => {
  refreshSetups();
  timer = setInterval(refreshSetups, POLL_MS);
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisible);
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => refreshSetups();
  }
};

const stop = () => {
  clearInterval(timer);
  timer = null;
  window.removeEventListener('focus', onFocus);
  document.removeEventListener('visibilitychange', onVisible);
  try { channel?.close(); } catch { /* ignore */ }
  channel = null;
};

/* ── Mutations (throw on failure so the UI can show the real error) ── */
export const addSetup = async (data) => {
  const res = await setupService.createSetup(data);
  const item = toItem(res);
  setState({ setups: [item, ...state.setups.filter(s => s._id !== item._id)], error: '' });
  broadcast();
  refreshSetups();
  return item;
};

export const editSetup = async (id, data) => {
  const res = await setupService.updateSetup(id, data);
  const item = toItem(res);
  setState({ setups: state.setups.map(s => (s._id === id ? item : s)), error: '' });
  broadcast();
  refreshSetups();
  return item;
};

export const removeSetup = async (id) => {
  await setupService.deleteSetup(id);
  setState({ setups: state.setups.filter(s => s._id !== id), error: '' });
  broadcast();
  refreshSetups();
};

/* ── Hook ── */
export function useSetups() {
  const [snap, setSnap] = useState(state);

  useEffect(() => {
    const fn = s => setSnap(s);
    listeners.add(fn);
    if (listeners.size === 1) start();
    else if (!state.loaded) refreshSetups();
    setSnap(state);
    return () => {
      listeners.delete(fn);
      if (listeners.size === 0) stop();
    };
  }, []);

  // { 'ICT / SMC': [setup, setup], 'Breakout': [...], 'Uncategorized': [...] }
  const groupedSetups = useMemo(() => {
    const g = {};
    snap.setups.forEach(s => {
      const key = s.category || 'Uncategorized';
      (g[key] = g[key] || []).push(s);
    });
    return g;
  }, [snap.setups]);

  const refresh = useCallback(() => refreshSetups(), []);

  return {
    setups: snap.setups,
    groupedSetups,
    loading: snap.loading && !snap.loaded,
    error: snap.error,
    refresh,
    addSetup,
    updateSetup: editSetup,
    removeSetup,
  };
}

export default useSetups;