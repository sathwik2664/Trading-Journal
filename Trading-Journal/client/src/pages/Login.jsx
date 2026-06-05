import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────────────────────
   STYLES — ultra-premium cinematic trading terminal aesthetic
   All scoped under .trj-root — zero global pollution
   ───────────────────────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('__trj_premium_v1__')) {
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href =
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap';
  document.head.appendChild(font);

  const s = document.createElement('style');
  s.id = '__trj_premium_v1__';
  s.textContent = `
    :root {
      --trj-void:       #020409;
      --trj-deep:       #040811;
      --trj-surface:    #070e1a;
      --trj-border:     rgba(255,255,255,0.06);
      --trj-border-hi:  rgba(0,210,150,0.35);
      --trj-green:      #00d296;
      --trj-green-dim:  #00b07e;
      --trj-green-glow: rgba(0,210,150,0.18);
      --trj-red:        #ff3d5a;
      --trj-amber:      #f5a623;
      --trj-text:       #c8d8ec;
      --trj-text-muted: #4a6080;
      --trj-text-dim:   #1e3048;
      --trj-gold:       #c9a84c;
    }

    .trj-root {
      font-family: 'Outfit', system-ui, sans-serif;
      min-height: 100vh;
      background: var(--trj-void);
      color: var(--trj-text);
      overflow: hidden;
      position: relative;
      box-sizing: border-box;
    }
    .trj-root *, .trj-root *::before, .trj-root *::after {
      box-sizing: border-box; margin: 0; padding: 0;
    }

    /* ══════════════════════════════════════
       BACKGROUND SYSTEM
    ══════════════════════════════════════ */
    .trj-bg {
      position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
    }

    /* Deep space noise */
    .trj-bg-noise {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      opacity: 0.45;
    }

    /* Radial aurora blobs */
    .trj-aurora {
      position: absolute; border-radius: 50%; filter: blur(90px);
    }
    .trj-aurora-1 {
      width: 900px; height: 900px;
      background: radial-gradient(circle, rgba(0,180,120,0.09) 0%, transparent 60%);
      top: -350px; left: -200px;
      animation: trj-float-a 18s ease-in-out infinite;
    }
    .trj-aurora-2 {
      width: 700px; height: 700px;
      background: radial-gradient(circle, rgba(30,80,200,0.07) 0%, transparent 60%);
      bottom: -250px; right: -150px;
      animation: trj-float-b 24s ease-in-out infinite;
    }
    .trj-aurora-3 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(0,210,150,0.04) 0%, transparent 60%);
      top: 40%; left: 30%;
      animation: trj-float-c 20s ease-in-out infinite;
    }
    @keyframes trj-float-a {
      0%,100% { transform: translate(0,0) scale(1); }
      33%  { transform: translate(60px,-80px) scale(1.08); }
      66%  { transform: translate(-30px,50px) scale(0.94); }
    }
    @keyframes trj-float-b {
      0%,100% { transform: translate(0,0) scale(1); }
      40%  { transform: translate(-50px,60px) scale(1.1); }
      70%  { transform: translate(30px,-40px) scale(0.96); }
    }
    @keyframes trj-float-c {
      0%,100% { transform: translate(0,0); opacity: 0.6; }
      50%  { transform: translate(-40px,-60px); opacity: 1; }
    }

    /* Fine dot grid */
    .trj-grid {
      position: absolute; inset: 0;
      background-image: radial-gradient(circle, rgba(0,210,150,0.08) 1px, transparent 1px);
      background-size: 36px 36px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
    }

    /* Scan line sweep */
    .trj-scanline {
      position: absolute; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(to right, transparent, rgba(0,210,150,0.15), transparent);
      animation: trj-scan 8s linear infinite;
      pointer-events: none;
    }
    @keyframes trj-scan {
      0%   { top: -4px; opacity: 0; }
      5%   { opacity: 1; }
      95%  { opacity: 1; }
      100% { top: 100vh; opacity: 0; }
    }

    /* Vertical seam */
    .trj-seam {
      position: absolute; top: 0; bottom: 0;
      right: 520px; width: 1px;
      background: linear-gradient(to bottom,
        transparent 0%,
        rgba(0,210,150,0.04) 10%,
        rgba(0,210,150,0.12) 50%,
        rgba(0,210,150,0.04) 90%,
        transparent 100%);
    }

    /* Canvas for particles */
    .trj-particles {
      position: absolute; inset: 0;
    }

    /* ══════════════════════════════════════
       TOP BAR
    ══════════════════════════════════════ */
    .trj-topbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 300;
      height: 36px;
      display: flex; align-items: stretch;
      background: rgba(2,4,9,0.98);
      border-bottom: 1px solid rgba(0,210,150,0.08);
    }

    /* Status cluster */
    .trj-status-cluster {
      display: flex; align-items: center; gap: 16px;
      padding: 0 20px;
      border-right: 1px solid var(--trj-border);
      flex-shrink: 0;
    }
    .trj-status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--trj-green);
      box-shadow: 0 0 10px var(--trj-green);
      animation: trj-pulse-dot 2s ease-in-out infinite;
    }
    @keyframes trj-pulse-dot {
      0%,100% { box-shadow: 0 0 6px var(--trj-green); opacity: 1; }
      50%     { box-shadow: 0 0 18px var(--trj-green), 0 0 30px rgba(0,210,150,0.3); opacity: 0.8; }
    }
    .trj-status-label {
      font-family: 'Space Mono', monospace;
      font-size: 9px; letter-spacing: 2px; color: var(--trj-green);
      text-transform: uppercase;
    }
    .trj-status-time {
      font-family: 'Space Mono', monospace;
      font-size: 9px; color: var(--trj-text-dim); letter-spacing: 1px;
    }

    /* Ticker */
    .trj-ticker-wrap {
      flex: 1; overflow: hidden;
      display: flex; align-items: center;
      position: relative;
    }
    .trj-ticker-fade-l, .trj-ticker-fade-r {
      position: absolute; top: 0; bottom: 0; width: 60px; z-index: 2; pointer-events: none;
    }
    .trj-ticker-fade-l { left: 0; background: linear-gradient(to right, rgba(2,4,9,0.98), transparent); }
    .trj-ticker-fade-r { right: 0; background: linear-gradient(to left, rgba(2,4,9,0.98), transparent); }
    .trj-ticker-track {
      display: flex; white-space: nowrap;
      animation: trj-ticker 40s linear infinite;
    }
    @keyframes trj-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .trj-tick {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 0 22px;
      border-right: 1px solid rgba(255,255,255,0.03);
    }
    .trj-tick-sym {
      font-family: 'Space Mono', monospace; font-size: 9px;
      letter-spacing: 1.5px; color: var(--trj-text-dim); font-weight: 700;
    }
    .trj-tick-price {
      font-family: 'Space Mono', monospace; font-size: 9px;
      color: rgba(200,216,236,0.5); letter-spacing: 0.5px;
    }
    .trj-tick-chg {
      font-family: 'Space Mono', monospace; font-size: 9px;
      font-weight: 700; letter-spacing: 0.5px;
    }
    .trj-tick.up .trj-tick-chg { color: var(--trj-green); }
    .trj-tick.dn .trj-tick-chg { color: var(--trj-red); }
    .trj-tick-bar {
      width: 28px; height: 2px; border-radius: 2px; flex-shrink: 0;
    }
    .trj-tick.up .trj-tick-bar { background: linear-gradient(to right, transparent, var(--trj-green)); }
    .trj-tick.dn .trj-tick-bar { background: linear-gradient(to right, transparent, var(--trj-red)); }

    /* ══════════════════════════════════════
       LAYOUT
    ══════════════════════════════════════ */
    .trj-layout {
      display: flex; min-height: 100vh; padding-top: 36px;
      position: relative; z-index: 10;
    }

    /* ══════════════════════════════════════
       LEFT PANEL
    ══════════════════════════════════════ */
    .trj-left {
      flex: 1; display: flex; flex-direction: column;
      padding: 48px 56px 48px 64px;
      max-width: calc(100% - 520px);
      position: relative;
    }

    /* Brand */
    .trj-brand {
      display: flex; align-items: center; gap: 14px; margin-bottom: auto;
      animation: trj-rise 0.6s cubic-bezier(0.16,1,0.3,1) both;
    }
    .trj-brand-mark {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, rgba(0,210,150,0.12), rgba(0,150,100,0.06));
      border: 1px solid rgba(0,210,150,0.25);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .trj-brand-mark::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, transparent 40%, rgba(0,210,150,0.12));
    }
    .trj-brand-text { display: flex; flex-direction: column; gap: 1px; }
    .trj-brand-name {
      font-family: 'Bebas Neue', display; font-size: 17px;
      letter-spacing: 3.5px; color: rgba(200,216,236,0.85);
    }
    .trj-brand-sub {
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 2.5px; color: var(--trj-text-dim);
      text-transform: uppercase;
    }

    /* Hero */
    .trj-hero {
      flex: 1; display: flex; flex-direction: column;
      justify-content: center; padding: 40px 0;
    }

    .trj-eyebrow {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 28px;
      animation: trj-rise 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both;
    }
    .trj-eyebrow-line {
      width: 32px; height: 1px;
      background: linear-gradient(to right, transparent, var(--trj-green));
    }
    .trj-eyebrow-text {
      font-family: 'Space Mono', monospace; font-size: 9px;
      letter-spacing: 3px; text-transform: uppercase; color: var(--trj-green);
      opacity: 0.8;
    }

    .trj-headline {
      margin-bottom: 28px;
      animation: trj-rise 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both;
    }
    .trj-h1-line {
      display: block;
      font-family: 'Bebas Neue', display;
      font-size: clamp(64px, 6.5vw, 100px);
      line-height: 0.92;
      letter-spacing: -1px;
    }
    .trj-h1-solid  { color: #e8f0fa; }
    .trj-h1-ghost  { color: rgba(255,255,255,0.07); -webkit-text-stroke: 1px rgba(255,255,255,0.08); }
    .trj-h1-green  {
      background: linear-gradient(110deg, #00d296 0%, #00ffc0 50%, #00d296 100%);
      background-size: 200% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: trj-shimmer 4s ease infinite;
    }
    @keyframes trj-shimmer {
      0%,100% { background-position: 0% 50%; }
      50%     { background-position: 100% 50%; }
    }

    .trj-desc {
      font-family: 'Space Mono', monospace; font-size: 11px;
      color: var(--trj-text-dim); line-height: 1.9; max-width: 330px;
      margin-bottom: 48px;
      animation: trj-rise 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both;
    }

    /* Chart widget */
    .trj-widget {
      background: rgba(255,255,255,0.014);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px; overflow: hidden;
      max-width: 560px; position: relative;
      animation: trj-rise 0.7s 0.3s cubic-bezier(0.16,1,0.3,1) both;
      backdrop-filter: blur(20px);
    }
    .trj-widget::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(to right, transparent, rgba(0,210,150,0.4), transparent);
    }
    .trj-widget-hd {
      padding: 16px 20px 14px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.035);
    }
    .trj-widget-left { display: flex; flex-direction: column; gap: 4px; }
    .trj-widget-label {
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 2.5px; color: var(--trj-text-dim); text-transform: uppercase;
    }
    .trj-widget-price {
      font-family: 'Bebas Neue', display; font-size: 28px;
      letter-spacing: 1px; color: #e8f0fa;
    }
    .trj-widget-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .trj-widget-badge {
      font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
      color: var(--trj-green); background: rgba(0,210,150,0.1);
      border: 1px solid rgba(0,210,150,0.2);
      border-radius: 6px; padding: 3px 9px;
    }
    .trj-widget-tabs {
      display: flex; gap: 0;
    }
    .trj-tab {
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 1px; color: var(--trj-text-dim);
      padding: 2px 7px; border-radius: 4px; cursor: default;
      transition: all 0.2s;
    }
    .trj-tab.active { color: var(--trj-green); background: rgba(0,210,150,0.08); }
    .trj-chart-body { padding: 0 0 4px; position: relative; }

    /* Animated SVG chart */
    .trj-chart-svg { width: 100%; height: 120px; display: block; overflow: visible; }
    .trj-area-path { animation: trj-draw-area 1.5s ease forwards; }
    .trj-line-path { animation: trj-draw-line 1.4s ease forwards; stroke-dashoffset: 1000; stroke-dasharray: 1000; }
    @keyframes trj-draw-line {
      to { stroke-dashoffset: 0; }
    }
    @keyframes trj-draw-area {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .trj-candle-g { animation: trj-candle-in 0.4s ease both; transform-origin: bottom; }
    @keyframes trj-candle-in {
      from { opacity: 0; transform: scaleY(0); }
      to   { opacity: 1; transform: scaleY(1); }
    }

    /* Volume bars */
    .trj-vol-row {
      padding: 0 12px 12px;
      display: flex; align-items: flex-end; gap: 3px; height: 32px;
    }
    .trj-vol-bar {
      flex: 1; border-radius: 2px 2px 0 0;
      transition: opacity 0.2s;
      animation: trj-vol-in 0.5s ease both;
    }
    @keyframes trj-vol-in {
      from { transform: scaleY(0); }
      to   { transform: scaleY(1); }
    }

    /* Stats row */
    .trj-stats-row {
      display: flex; padding: 14px 20px 16px;
      border-top: 1px solid rgba(255,255,255,0.03);
      gap: 0;
    }
    .trj-stat-item {
      flex: 1; display: flex; flex-direction: column; gap: 5px;
      padding: 0 16px;
      border-right: 1px solid rgba(255,255,255,0.04);
    }
    .trj-stat-item:first-child { padding-left: 0; }
    .trj-stat-item:last-child  { border-right: none; }
    .trj-stat-label {
      font-family: 'Space Mono', monospace; font-size: 7px;
      letter-spacing: 2px; color: var(--trj-text-dim); text-transform: uppercase;
    }
    .trj-stat-val {
      font-family: 'Bebas Neue', display; font-size: 20px;
      letter-spacing: 1px; color: #c8d8ec;
    }
    .trj-stat-val.green { color: var(--trj-green); }
    .trj-stat-val.red   { color: var(--trj-red); }

    /* Metrics strip */
    .trj-metrics {
      display: flex; gap: 0; margin-top: 24px;
      animation: trj-rise 0.6s 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }
    .trj-metric {
      display: flex; flex-direction: column; gap: 6px;
      padding: 0 28px 0 0; margin-right: 28px;
      border-right: 1px solid rgba(255,255,255,0.04);
    }
    .trj-metric:last-child { border-right: none; padding-right: 0; margin-right: 0; }
    .trj-metric-n {
      font-family: 'Bebas Neue', display; font-size: 28px;
      letter-spacing: 1px; color: #c8d8ec; line-height: 1;
    }
    .trj-metric-l {
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 2px; text-transform: uppercase; color: var(--trj-text-dim);
    }

    /* ══════════════════════════════════════
       RIGHT PANEL (GLASS FORM)
    ══════════════════════════════════════ */
    .trj-right {
      width: 520px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 40px 48px;
      position: relative;
    }
    .trj-right-bg {
      position: absolute; inset: 0;
      background: linear-gradient(160deg,
        rgba(0,210,150,0.025) 0%,
        rgba(5,12,25,0.4) 40%,
        rgba(5,12,25,0.5) 100%);
      backdrop-filter: blur(32px);
      -webkit-backdrop-filter: blur(32px);
      border-left: 1px solid rgba(0,210,150,0.08);
    }

    .trj-form-container {
      width: 100%; max-width: 380px;
      position: relative; z-index: 1;
      animation: trj-rise 0.55s 0.12s cubic-bezier(0.16,1,0.3,1) both;
    }

    /* Terminal header */
    .trj-terminal-hd {
      display: flex; align-items: center; gap: 8px; margin-bottom: 32px;
    }
    .trj-terminal-btn {
      width: 10px; height: 10px; border-radius: 50%;
    }
    .trj-terminal-btn.red    { background: #ff5f57; box-shadow: 0 0 8px rgba(255,95,87,0.5); }
    .trj-terminal-btn.amber  { background: #febc2e; box-shadow: 0 0 8px rgba(254,188,46,0.5); }
    .trj-terminal-btn.green  { background: #2acb43; box-shadow: 0 0 8px rgba(42,203,67,0.5); }
    .trj-terminal-title {
      margin-left: 6px;
      font-family: 'Space Mono', monospace; font-size: 9px;
      letter-spacing: 2px; color: var(--trj-text-dim); text-transform: uppercase;
    }
    .trj-terminal-status {
      margin-left: auto; display: flex; align-items: center; gap: 5px;
      font-family: 'Space Mono', monospace; font-size: 8px;
      color: var(--trj-green); opacity: 0.7;
    }

    /* Avatar section */
    .trj-user-section { margin-bottom: 32px; }
    .trj-avatar-wrap {
      display: flex; align-items: center; gap: 16px;
      padding: 18px 20px;
      background: rgba(0,210,150,0.03);
      border: 1px solid rgba(0,210,150,0.09);
      border-radius: 16px; margin-bottom: 0;
      position: relative; overflow: hidden;
    }
    .trj-avatar-wrap::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(to right, transparent, rgba(0,210,150,0.25), transparent);
    }
    .trj-avatar-ring {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, rgba(0,210,150,0.15), rgba(0,100,200,0.1));
      border: 1px solid rgba(0,210,150,0.3);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Bebas Neue', display; font-size: 24px; color: var(--trj-green);
      position: relative; flex-shrink: 0;
    }
    .trj-avatar-online {
      position: absolute; bottom: -2px; right: -2px;
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--trj-green); border: 2px solid var(--trj-void);
      animation: trj-pulse-dot 2.5s ease-in-out infinite;
    }
    .trj-avatar-info { display: flex; flex-direction: column; gap: 5px; }
    .trj-welcome-txt {
      font-size: 16px; font-weight: 600; color: #dde8f5; letter-spacing: -0.2px;
    }
    .trj-email-pill {
      display: inline-flex; align-items: center; gap: 5px;
      font-family: 'Space Mono', monospace; font-size: 9px;
      color: var(--trj-green); opacity: 0.8;
      background: rgba(0,210,150,0.07);
      border: 1px solid rgba(0,210,150,0.14);
      border-radius: 20px; padding: 3px 10px;
    }
    .trj-session-info {
      margin-top: 10px;
      display: flex; gap: 8px;
    }
    .trj-session-chip {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
      padding: 6px 10px;
      background: rgba(255,255,255,0.018);
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 8px;
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 0.5px; color: var(--trj-text-dim);
    }
    .trj-session-chip svg { color: var(--trj-green); opacity: 0.6; }

    /* Divider */
    .trj-rule {
      height: 1px; margin: 28px 0;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent);
    }

    /* Fields */
    .trj-field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
    .trj-field-label {
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 2.5px; text-transform: uppercase; color: var(--trj-text-dim);
      display: flex; align-items: center; gap: 8px;
    }
    .trj-field-label span {
      color: var(--trj-green); opacity: 0.6; font-size: 7px;
    }

    .trj-input-shell {
      position: relative; display: flex; align-items: center;
    }
    .trj-input-icon {
      position: absolute; left: 15px; color: var(--trj-text-dim);
      pointer-events: none; z-index: 1; transition: color 0.2s;
    }
    .trj-input-shell:focus-within .trj-input-icon { color: var(--trj-green); }

    .trj-input {
      width: 100%; height: 52px;
      background: rgba(255,255,255,0.022);
      border: 1px solid rgba(255,255,255,0.055);
      border-radius: 13px;
      padding: 0 50px 0 46px;
      color: var(--trj-text); font-size: 13px;
      font-family: 'Outfit', sans-serif; font-weight: 400;
      outline: none; transition: all 0.22s;
    }
    .trj-input::placeholder {
      color: var(--trj-text-dim); font-size: 11px;
      font-family: 'Space Mono', monospace; letter-spacing: 0.5px;
    }
    .trj-input:hover:not([readonly]):not(:disabled) {
      border-color: rgba(255,255,255,0.09);
      background: rgba(255,255,255,0.03);
    }
    .trj-input:focus {
      border-color: rgba(0,210,150,0.5);
      background: rgba(0,210,150,0.025);
      box-shadow: 0 0 0 3px rgba(0,210,150,0.08), 0 2px 20px rgba(0,210,150,0.05);
    }
    .trj-input[readonly] {
      color: var(--trj-text-dim); cursor: default;
      background: rgba(0,210,150,0.015);
      border-color: rgba(0,210,150,0.07);
    }
    .trj-input:disabled { opacity: 0.35; cursor: not-allowed; }

    /* Eye */
    .trj-eye {
      position: absolute; right: 13px;
      background: none; border: none; cursor: pointer;
      padding: 6px; color: var(--trj-text-dim);
      border-radius: 7px; display: flex; align-items: center;
      transition: all 0.15s;
    }
    .trj-eye:hover { color: var(--trj-green); background: rgba(0,210,150,0.06); }

    /* Strength */
    .trj-strength-wrap { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .trj-strength-bars { display: flex; gap: 3px; flex: 1; }
    .trj-s-seg {
      flex: 1; height: 2px; border-radius: 2px;
      background: rgba(255,255,255,0.05); transition: background 0.3s;
    }
    .trj-s-seg.lvl-1 { background: var(--trj-red); }
    .trj-s-seg.lvl-2 { background: var(--trj-amber); }
    .trj-s-seg.lvl-3 { background: var(--trj-green); }
    .trj-strength-label {
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 1px; white-space: nowrap;
    }
    .trj-strength-label.s1 { color: var(--trj-red); }
    .trj-strength-label.s2 { color: var(--trj-amber); }
    .trj-strength-label.s3 { color: var(--trj-green); }

    /* Error */
    .trj-error {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 15px;
      background: rgba(255,61,90,0.07);
      border: 1px solid rgba(255,61,90,0.2);
      border-radius: 11px;
      font-family: 'Space Mono', monospace; font-size: 10px;
      color: rgba(255,100,120,0.9); letter-spacing: 0.3px;
      animation: trj-shake 0.38s ease;
    }
    @keyframes trj-shake {
      0%,100% { transform: translateX(0); }
      20% { transform: translateX(-5px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(3px); }
    }

    /* Note */
    .trj-note {
      display: flex; align-items: flex-start; gap: 9px;
      padding: 11px 14px;
      background: rgba(0,210,150,0.025);
      border: 1px solid rgba(0,210,150,0.07);
      border-radius: 11px;
      font-family: 'Space Mono', monospace; font-size: 9px;
      color: var(--trj-text-dim); line-height: 1.7; letter-spacing: 0.3px;
      margin-bottom: 6px;
    }
    .trj-note-icon { flex-shrink: 0; color: var(--trj-green); opacity: 0.5; margin-top: 1px; }

    /* CTA Button */
    .trj-btn {
      width: 100%; height: 54px;
      background: linear-gradient(135deg, #00d296, #00b07e);
      border: none; border-radius: 13px;
      color: #020409; font-size: 14px; font-weight: 700;
      font-family: 'Outfit', sans-serif; letter-spacing: 0.6px;
      cursor: pointer; position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      transition: all 0.2s;
    }
    .trj-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
      opacity: 0; transition: opacity 0.2s;
    }
    .trj-btn::after {
      content: '';
      position: absolute; bottom: -100%; left: 0; right: 0; height: 100%;
      background: linear-gradient(to top, rgba(255,255,255,0.1), transparent);
      transition: bottom 0.3s ease;
    }
    .trj-btn:hover::before { opacity: 1; }
    .trj-btn:hover::after  { bottom: 0; }
    .trj-btn:hover {
      box-shadow: 0 0 40px rgba(0,210,150,0.35), 0 8px 24px rgba(0,210,150,0.2);
      transform: translateY(-1px);
    }
    .trj-btn:active { transform: scale(0.985) translateY(0); }
    .trj-btn:disabled {
      opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none;
    }
    .trj-btn-label { position: relative; z-index: 1; }
    .trj-btn-arrow {
      font-size: 18px; position: relative; z-index: 1;
      transition: transform 0.2s;
    }
    .trj-btn:not(:disabled):hover .trj-btn-arrow { transform: translateX(5px); }
    .trj-spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(2,4,9,0.2);
      border-top-color: #020409; border-radius: 50%;
      animation: trj-spin 0.55s linear infinite;
    }
    @keyframes trj-spin { to { transform: rotate(360deg); } }

    /* Footer */
    .trj-form-footer {
      margin-top: 24px; display: flex; flex-direction: column;
      align-items: center; gap: 10px;
    }
    .trj-security-row {
      display: flex; align-items: center; gap: 16px;
    }
    .trj-security-item {
      display: flex; align-items: center; gap: 5px;
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 0.5px; color: var(--trj-text-dim);
    }
    .trj-security-item svg { color: var(--trj-green); opacity: 0.45; }
    .trj-session-line {
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 0.5px; color: rgba(255,255,255,0.06);
      text-align: center;
    }
    .trj-session-line em { color: rgba(0,210,150,0.3); font-style: normal; }

    /* Rise animation */
    @keyframes trj-rise {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .trj-left { display: none; }
      .trj-right { width: 100%; }
      .trj-seam  { display: none; }
    }
    @media (max-width: 480px) {
      .trj-right { padding: 24px 18px; align-items: flex-start; padding-top: 50px; }
    }
  `;
  document.head.appendChild(s);
}

/* ─── Constants ─── */
const ALLOWED_EMAIL  = import.meta.env.VITE_APP_EMAIL;
const FIXED_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

/* ─── Ticker data ─── */
const TICKERS = [
  { sym: 'NQ1!',  price: '21,430', chg: '+0.84%', up: true  },
  { sym: 'ES1!',  price: '5,812',  chg: '+0.51%', up: true  },
  { sym: 'NVDA',  price: '875.20', chg: '-1.22%', up: false },
  { sym: 'SPY',   price: '512.33', chg: '+0.62%', up: true  },
  { sym: 'QQQ',   price: '441.78', chg: '-0.33%', up: false },
  { sym: 'DXY',   price: '104.22', chg: '+0.18%', up: true  },
  { sym: 'VIX',   price: '17.40',  chg: '+2.14%', up: false },
  { sym: 'GC1!',  price: '2,346',  chg: '+0.44%', up: true  },
  { sym: 'TSLA',  price: '248.91', chg: '-1.87%', up: false },
  { sym: 'BTC',   price: '68,240', chg: '+3.12%', up: true  },
  { sym: 'ETH',   price: '3,820',  chg: '+2.44%', up: true  },
  { sym: 'CL1!',  price: '82.14',  chg: '-0.62%', up: false },
];

/* ─── Candle data ─── */
const CANDLES = [
  { h:62, o:42, c:58, l:26, bull:true  },
  { h:70, o:56, c:44, l:32, bull:false },
  { h:82, o:42, c:74, l:28, bull:true  },
  { h:78, o:72, c:54, l:40, bull:false },
  { h:96, o:52, c:88, l:36, bull:true  },
  { h:90, o:86, c:64, l:48, bull:false },
  { h:108,o:62, c:100,l:42, bull:true  },
  { h:104,o:98, c:76, l:56, bull:false },
  { h:120,o:72, c:112,l:50, bull:true  },
  { h:116,o:110,c:84, l:62, bull:false },
  { h:130,o:80, c:122,l:56, bull:true  },
  { h:126,o:120,c:94, l:70, bull:false },
  { h:140,o:90, c:132,l:62, bull:true  },
  { h:136,o:130,c:104,l:76, bull:false },
  { h:150,o:98, c:142,l:68, bull:true  },
  { h:146,o:140,c:112,l:82, bull:false },
  { h:158,o:108,c:150,l:74, bull:true  },
  { h:154,o:148,c:120,l:88, bull:false },
];

/* ─── Particle canvas ─── */
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.05,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,210,150,${p.alpha})`;
        ctx.fill();
      });
      // Draw connecting lines
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,210,150,${0.04 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="trj-particles" />;
}

/* ─── Live clock ─── */
function LiveClock() {
  const [t, setT] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="trj-status-time">{t} EST</span>;
}

/* ─── Animated candle chart ─── */
function CandleChart() {
  const W = 560, H = 120, PAD = 10;
  const count = CANDLES.length;
  const slotW = (W - PAD * 2) / count;
  const maxH = Math.max(...CANDLES.map(c => c.h));
  const scale = (v) => H - (v / maxH) * (H - 8) - 4;
  const midX = (i) => PAD + i * slotW + slotW / 2;

  // Smooth line through candle midpoints
  const pts = CANDLES.map((c, i) => [midX(i), scale((c.o + c.c) / 2)]);
  const pathD = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cpx = (px + x) / 2;
    return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`;
  }, '');
  const areaD = `${pathD} L ${pts[pts.length-1][0]} ${H} L ${pts[0][0]} ${H} Z`;

  return (
    <svg className="trj-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trj-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#00d296" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#00d296" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#trj-area)" className="trj-area-path" />
      <path d={pathD} fill="none" stroke="#00d296" strokeWidth="1.5"
        opacity="0.35" className="trj-line-path" />
      {CANDLES.map((c, i) => {
        const x = midX(i);
        const col = c.bull ? '#00d296' : '#ff3d5a';
        const by = scale(Math.max(c.o, c.c));
        const bh = Math.max(Math.abs(scale(c.o) - scale(c.c)), 2);
        return (
          <g key={i} className="trj-candle-g" style={{ animationDelay: `${i * 0.04}s` }}>
            <line x1={x} y1={scale(c.h)} x2={x} y2={scale(c.l)}
              stroke={col} strokeWidth="1" opacity="0.4" />
            <rect x={x - 5} y={by} width={10} height={bh}
              fill={col} opacity="0.82" rx="1.5" />
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Volume bars ─── */
function VolumeBars() {
  const vols = CANDLES.map(c => Math.abs(c.h - c.l) * (Math.random() * 0.5 + 0.5));
  const maxV = Math.max(...vols);
  return (
    <div className="trj-vol-row">
      {CANDLES.map((c, i) => (
        <div key={i} className="trj-vol-bar"
          style={{
            height: `${(vols[i] / maxV) * 100}%`,
            background: c.bull ? 'rgba(0,210,150,0.22)' : 'rgba(255,61,90,0.18)',
            animationDelay: `${i * 0.04}s`,
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Password strength ─── */
function pwStrength(pw) {
  if (!pw) return 0;
  if (pw.length < 6) return 1;
  if (pw.length < 10) return 2;
  return 3;
}

const STRENGTH_LABELS = ['', 'WEAK', 'FAIR', 'STRONG'];

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading } = useAuth();

  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');

  const pwRef = useRef(null);
  const from  = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  useEffect(() => {
    setTimeout(() => pwRef.current?.focus(), 150);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Enter your password to continue.'); return; }
    if (password !== FIXED_PASSWORD) { setError('Incorrect password — please try again.'); return; }
    setIsLoading(true);
    const result = await login(ALLOWED_EMAIL.trim(), password);
    setIsLoading(false);
    if (result?.success) navigate(from, { replace: true });
    else setError(result?.message || 'Authentication failed. Please retry.');
  };

  const strength = pwStrength(password);
  const segCls   = (n) => `trj-s-seg${strength >= n ? ` lvl-${strength}` : ''}`;
  if (loading) return null;

  return (
    <div className="trj-root">

      {/* ── Background ── */}
      <div className="trj-bg">
        <div className="trj-bg-noise" />
        <div className="trj-aurora trj-aurora-1" />
        <div className="trj-aurora trj-aurora-2" />
        <div className="trj-aurora trj-aurora-3" />
        <div className="trj-grid" />
        <div className="trj-scanline" />
        <div className="trj-seam" />
        <ParticleCanvas />
      </div>

      {/* ── Top bar ── */}
      <div className="trj-topbar">
        <div className="trj-status-cluster">
          <div className="trj-status-dot" />
          <span className="trj-status-label">LIVE</span>
          <LiveClock />
        </div>
        <div className="trj-ticker-wrap">
          <div className="trj-ticker-fade-l" />
          <div className="trj-ticker-fade-r" />
          <div className="trj-ticker-track">
            {[...TICKERS, ...TICKERS].map((t, i) => (
              <span key={i} className={`trj-tick ${t.up ? 'up' : 'dn'}`}>
                <span className="trj-tick-bar" />
                <span className="trj-tick-sym">{t.sym}</span>
                <span className="trj-tick-price">{t.price}</span>
                <span className="trj-tick-chg">{t.chg}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="trj-layout">

        {/* ════ LEFT PANEL ════ */}
        <div className="trj-left">

          {/* Brand */}
          <div className="trj-brand">
            <div className="trj-brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <polyline points="2,18 7,10 12,14 17,6 22,9"
                  stroke="#00d296" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="22" cy="9" r="2" fill="#00d296" />
              </svg>
            </div>
            <div className="trj-brand-text">
              <span className="trj-brand-name">Trading Journal</span>
              <span className="trj-brand-sub">Private Access System</span>
            </div>
          </div>

          {/* Hero */}
          <div className="trj-hero">
            <div className="trj-eyebrow">
              <div className="trj-eyebrow-line" />
              <span className="trj-eyebrow-text">Personal Edge System</span>
            </div>

            <div className="trj-headline">
              <span className="trj-h1-line trj-h1-solid">TRADE</span>
              <span className="trj-h1-line trj-h1-ghost">WITH</span>
              <span className="trj-h1-line trj-h1-green">CLARITY.</span>
            </div>

            <p className="trj-desc">
              Log every trade. Review every pattern.<br />
              Your personal edge — quantified.
            </p>

            {/* Chart widget */}
            <div className="trj-widget">
              <div className="trj-widget-hd">
                <div className="trj-widget-left">
                  <span className="trj-widget-label">Portfolio Equity</span>
                  <span className="trj-widget-price">$84,231.40</span>
                </div>
                <div className="trj-widget-right">
                  <span className="trj-widget-badge">+18.4% MTD</span>
                  <div className="trj-widget-tabs">
                    {['1D','1W','1M'].map((l, i) => (
                      <span key={l} className={`trj-tab${i === 2 ? ' active' : ''}`}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="trj-chart-body">
                <CandleChart />
                <VolumeBars />
              </div>
              <div className="trj-stats-row">
                {[
                  { l: 'Win Rate',   v: '67.3%',  cls: 'green' },
                  { l: 'Profit Factor', v: '2.41', cls: 'green' },
                  { l: 'Max DD',     v: '-4.2%',  cls: 'red'   },
                  { l: 'Trades',     v: '2,840',  cls: ''      },
                ].map(({ l, v, cls }) => (
                  <div key={l} className="trj-stat-item">
                    <span className="trj-stat-label">{l}</span>
                    <span className={`trj-stat-val${cls ? ' ' + cls : ''}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="trj-metrics">
              {[
                { n: '2.8K+', l: 'Trades Logged' },
                { n: '98%',   l: 'Uptime'        },
                { n: '∞',     l: 'Entries'       },
              ].map(({ n, l }) => (
                <div key={l} className="trj-metric">
                  <span className="trj-metric-n">{n}</span>
                  <span className="trj-metric-l">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div className="trj-right">
          <div className="trj-right-bg" />

          <div className="trj-form-container">

            {/* Terminal header */}
            <div className="trj-terminal-hd">
              <div className="trj-terminal-btn red" />
              <div className="trj-terminal-btn amber" />
              <div className="trj-terminal-btn green" />
              <span className="trj-terminal-title">AUTH TERMINAL</span>
              <div className="trj-terminal-status">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d296', animation: 'trj-pulse-dot 2s infinite' }} />
                SECURED
              </div>
            </div>

            {/* User card */}
            <div className="trj-user-section">
              <div className="trj-avatar-wrap">
                <div className="trj-avatar-ring">
                  S
                  <div className="trj-avatar-online" />
                </div>
                <div className="trj-avatar-info">
                  <div className="trj-welcome-txt">Welcome back</div>
                  <span className="trj-email-pill">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {ALLOWED_EMAIL}
                  </span>
                </div>
              </div>
              <div className="trj-session-info">
                {[
                  { icon: '🔒', label: '256-bit AES' },
                  { icon: '⚡', label: 'Auto logout' },
                  { icon: '🛡', label: 'Zero logs' },
                ].map(({ icon, label }) => (
                  <div key={label} className="trj-session-chip">
                    <span style={{ fontSize: 9 }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="trj-rule" />

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Email — readonly */}
              <div className="trj-field">
                <label className="trj-field-label">
                  Email Address <span>// READ-ONLY</span>
                </label>
                <div className="trj-input-shell">
                  <svg className="trj-input-icon" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                  <input type="email" className="trj-input"
                    value={ALLOWED_EMAIL} readOnly tabIndex={-1} />
                </div>
              </div>

              {/* Password */}
              <div className="trj-field">
                <label className="trj-field-label">
                  Password <span>// REQUIRED</span>
                </label>
                <div className="trj-input-shell">
                  <svg className="trj-input-icon" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    ref={pwRef}
                    type={showPw ? 'text' : 'password'}
                    className="trj-input"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="enter passphrase"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button type="button" className="trj-eye"
                    onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    aria-label={showPw ? 'Hide' : 'Show'}>
                    {showPw
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                    }
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="trj-strength-wrap">
                    <div className="trj-strength-bars">
                      {[1, 2, 3].map(n => <div key={n} className={segCls(n)} />)}
                    </div>
                    <span className={`trj-strength-label s${strength}`}>
                      {STRENGTH_LABELS[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="trj-error" style={{ marginBottom: 14 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Note */}
              <div className="trj-note">
                <svg className="trj-note-icon" width="11" height="11" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Private journal. Access is restricted solely to the account owner. All sessions are encrypted end-to-end.
              </div>

              {/* Submit */}
              <button type="submit" className="trj-btn" disabled={isLoading}>
                {isLoading
                  ? <span className="trj-spinner" />
                  : <>
                      <span className="trj-btn-label">Access Journal</span>
                      <span className="trj-btn-arrow">→</span>
                    </>
                }
              </button>
            </form>

            {/* Footer */}
            <div className="trj-form-footer">
              <div className="trj-security-row">
                {[
                  { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, label: 'End-to-end encrypted' },
                  { icon: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></>, label: 'Session auto-expires' },
                ].map(({ icon, label }) => (
                  <div key={label} className="trj-security-item">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {icon}
                    </svg>
                    {label}
                  </div>
                ))}
              </div>
              <div className="trj-session-line">
                session · <em>encrypted</em> · auto-logout on tab close
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}