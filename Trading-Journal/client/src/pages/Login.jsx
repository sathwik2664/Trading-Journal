import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Inject CSS (merged from Login.css) ── */
if (typeof document !== 'undefined' && !document.getElementById('__login_styles__')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);

  const s = document.createElement('style');
  s.id = '__login_styles__';
  s.textContent = `
    .login-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      min-height: 100vh;
      background: #080b10;
      color: #e2e8f0;
      overflow: hidden;
      position: relative;
    }
    .login-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0, 212, 170, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 212, 170, 0.03) 1px, transparent 1px);
      background-size: 48px 48px;
    }
    .bg-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.12;
      animation: floatGlow 8s ease-in-out infinite;
    }
    .bg-glow-1 {
      width: 600px; height: 600px;
      background: radial-gradient(circle, #00d4aa 0%, transparent 70%);
      top: -200px; left: -100px;
      animation-delay: 0s;
    }
    .bg-glow-2 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
      bottom: -150px; right: -50px;
      animation-delay: 4s;
    }
    .bg-orb {
      position: absolute;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 212, 170, 0.06) 0%, transparent 70%);
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      animation: pulseOrb 4s ease-in-out infinite;
    }
    @keyframes floatGlow {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-40px) scale(1.05); }
    }
    @keyframes pulseOrb {
      0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
    }
    .ticker-tape {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 36px;
      background: rgba(8, 11, 16, 0.95);
      border-bottom: 1px solid rgba(0, 212, 170, 0.12);
      overflow: hidden;
      z-index: 100;
      display: flex;
      align-items: center;
    }
    .ticker-track {
      display: flex;
      gap: 0;
      animation: tickerScroll 30s linear infinite;
      white-space: nowrap;
    }
    @keyframes tickerScroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .ticker-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 24px;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
    }
    .ticker-symbol { color: #94a3b8; font-weight: 500; }
    .ticker-item.up .ticker-price { color: #e2e8f0; }
    .ticker-item.down .ticker-price { color: #e2e8f0; }
    .ticker-item.up .ticker-change { color: #00d4aa; }
    .ticker-item.down .ticker-change { color: #ff4d6d; }
    .login-layout {
      display: flex;
      min-height: 100vh;
      padding-top: 36px;
      position: relative;
      z-index: 10;
    }
    .login-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px 56px;
      max-width: 560px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 64px;
    }
    .brand-icon {
      width: 40px; height: 40px;
      background: rgba(0, 212, 170, 0.1);
      border: 1px solid rgba(0, 212, 170, 0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-name {
      font-size: 17px;
      font-weight: 600;
      color: #f1f5f9;
      letter-spacing: -0.3px;
    }
    .left-headline h1 {
      font-size: clamp(44px, 5vw, 64px);
      font-weight: 300;
      line-height: 1.1;
      letter-spacing: -2px;
      color: #f1f5f9;
      margin: 0 0 20px;
    }
    .accent-text {
      color: #00d4aa;
      font-style: italic;
      font-weight: 300;
    }
    .left-sub {
      font-size: 15px;
      color: #64748b;
      line-height: 1.65;
      max-width: 380px;
      margin: 0 0 48px;
    }
    .chart-preview {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      padding: 20px 24px 16px;
      margin-bottom: 32px;
    }
    .chart-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 12px;
      color: #475569;
    }
    .chart-delta {
      color: #00d4aa;
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      font-weight: 500;
    }
    .period { color: #475569; font-weight: 400; }
    .candle-chart { width: 100%; height: 90px; }
    .candle { opacity: 0; animation: candleIn 0.4s ease forwards; }
    .candle-0 { animation-delay: 0.1s; } .candle-1 { animation-delay: 0.15s; }
    .candle-2 { animation-delay: 0.2s; } .candle-3 { animation-delay: 0.25s; }
    .candle-4 { animation-delay: 0.3s; } .candle-5 { animation-delay: 0.35s; }
    .candle-6 { animation-delay: 0.4s; } .candle-7 { animation-delay: 0.45s; }
    .candle-8 { animation-delay: 0.5s; } .candle-9 { animation-delay: 0.55s; }
    .candle-10 { animation-delay: 0.6s; } .candle-11 { animation-delay: 0.65s; }
    @keyframes candleIn {
      from { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
      to { opacity: 1; transform: scaleY(1); }
    }
    .left-stats { display: flex; align-items: center; gap: 0; }
    .stat-pill { display: flex; flex-direction: column; gap: 2px; }
    .stat-num {
      font-size: 22px; font-weight: 600;
      color: #f1f5f9;
      font-family: 'DM Mono', monospace;
      letter-spacing: -1px;
    }
    .stat-label {
      font-size: 11px; color: #475569;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .stat-divider {
      width: 1px; height: 32px;
      background: rgba(255, 255, 255, 0.08);
      margin: 0 28px;
    }
    .login-right {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 480px;
      padding: 40px;
      border-left: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(255, 255, 255, 0.015);
    }
    .form-card { width: 100%; max-width: 380px; }
    .form-section { width: 100%; }
    .animate-in {
      animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .form-header { margin-bottom: 32px; }
    .form-header h2 {
      font-size: 26px; font-weight: 500;
      color: #f1f5f9; letter-spacing: -0.5px;
      margin: 0 0 6px;
    }
    .form-header p { font-size: 14px; color: #64748b; margin: 0; }
    .welcome-user { display: flex; align-items: center; gap: 14px; }
    .user-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, rgba(0, 212, 170, 0.2), rgba(59, 130, 246, 0.2));
      border: 1px solid rgba(0, 212, 170, 0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 600; color: #00d4aa; flex-shrink: 0;
    }
    .email-chip {
      font-family: 'DM Mono', monospace; font-size: 12px;
      color: #00d4aa !important;
      background: rgba(0, 212, 170, 0.08);
      border: 1px solid rgba(0, 212, 170, 0.15);
      border-radius: 20px; padding: 3px 10px;
      display: inline-flex; align-items: center; gap: 6px; margin: 0;
    }
    .auth-form { display: flex; flex-direction: column; gap: 18px; }
    .field-group { display: flex; flex-direction: column; gap: 7px; }
    .field-group label {
      font-size: 12px; font-weight: 500; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-icon {
      position: absolute; left: 14px; color: #334155;
      pointer-events: none; z-index: 1; flex-shrink: 0;
    }
    .input-wrap input {
      width: 100%; height: 48px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 0 44px 0 42px;
      color: #f1f5f9; font-size: 14px;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      outline: none; box-sizing: border-box;
    }
    .input-wrap input::placeholder { color: #334155; }
    .input-wrap input:hover {
      border-color: rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.055);
    }
    .input-wrap input:focus {
      border-color: rgba(0, 212, 170, 0.5);
      background: rgba(0, 212, 170, 0.03);
      box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.08);
    }
    .input-wrap input:disabled { opacity: 0.5; cursor: not-allowed; }
    .input-wrap input[readonly] {
      color: #94a3b8;
      cursor: default;
      background: rgba(0, 212, 170, 0.04);
      border-color: rgba(0, 212, 170, 0.15);
    }
    .toggle-visibility {
      position: absolute; right: 14px;
      background: none; border: none; color: #475569;
      cursor: pointer; padding: 4px;
      display: flex; align-items: center;
      transition: color 0.15s;
    }
    .toggle-visibility:hover { color: #94a3b8; }
    .error-msg {
      background: rgba(255, 77, 109, 0.1);
      border: 1px solid rgba(255, 77, 109, 0.2);
      border-radius: 10px; padding: 11px 14px;
      font-size: 13px; color: #ff8fa3;
      display: flex; align-items: center; gap: 8px;
    }
    .btn-primary {
      height: 50px; background: #00d4aa; border: none;
      border-radius: 12px; color: #080b10;
      font-size: 14px; font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 8px;
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
      position: relative; overflow: hidden; margin-top: 4px;
    }
    .btn-primary::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%);
      opacity: 0; transition: opacity 0.2s;
    }
    .btn-primary:hover::before { opacity: 1; }
    .btn-primary:hover { box-shadow: 0 0 24px rgba(0, 212, 170, 0.35); }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-arrow { font-size: 16px; transition: transform 0.2s; }
    .btn-primary:not(:disabled):hover .btn-arrow { transform: translateX(3px); }
    .btn-spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(8, 11, 16, 0.3);
      border-top-color: #080b10; border-radius: 50%;
      animation: loginSpin 0.7s linear infinite; display: inline-block;
    }
    @keyframes loginSpin { to { transform: rotate(360deg); } }
    .form-footer { margin-top: 28px; display: flex; justify-content: center; }
    .security-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 11px; color: #334155;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px; padding: 6px 14px;
    }
    .access-note {
      display: flex; align-items: center; gap: 8px;
      background: rgba(0, 212, 170, 0.06);
      border: 1px solid rgba(0, 212, 170, 0.12);
      border-radius: 10px; padding: 10px 14px;
      font-size: 12px; color: #475569; line-height: 1.4;
    }
    .access-note svg { flex-shrink: 0; color: #00d4aa; }
    @media (max-width: 900px) {
      .login-left { display: none; }
      .login-right { flex: 1; border-left: none; background: none; padding: 24px 20px; }
      .form-card { max-width: 420px; }
    }
    @media (max-width: 480px) {
      .login-right { padding: 16px; align-items: flex-start; padding-top: 40px; }
    }
  `;
  document.head.appendChild(s);
}

/* ── Constants (loaded from .env) ── */
const ALLOWED_EMAIL  = import.meta.env.VITE_APP_EMAIL;
const FIXED_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

/* ── Candlestick decoration ── */
const CandleChart = () => {
  const candles = [
    { h: 80, o: 55, c: 70, l: 30, bull: true },
    { h: 85, o: 72, c: 60, l: 40, bull: false },
    { h: 95, o: 58, c: 88, l: 35, bull: true },
    { h: 90, o: 85, c: 68, l: 50, bull: false },
    { h: 100, o: 65, c: 95, l: 42, bull: true },
    { h: 98, o: 92, c: 75, l: 55, bull: false },
    { h: 110, o: 72, c: 105, l: 48, bull: true },
    { h: 108, o: 100, c: 82, l: 60, bull: false },
    { h: 120, o: 78, c: 115, l: 55, bull: true },
    { h: 118, o: 112, c: 90, l: 65, bull: false },
    { h: 130, o: 85, c: 125, l: 60, bull: true },
    { h: 128, o: 122, c: 100, l: 72, bull: false },
  ];
  return (
    <svg className="candle-chart" viewBox="0 0 360 140" preserveAspectRatio="xMidYMid meet">
      {candles.map((c, i) => {
        const x = 14 + i * 28;
        const color = c.bull ? '#00d4aa' : '#ff4d6d';
        const bodyTop = 140 - Math.max(c.o, c.c);
        const bodyH = Math.abs(c.o - c.c) || 2;
        return (
          <g key={i} className={`candle candle-${i}`}>
            <line x1={x} y1={140 - c.h} x2={x} y2={140 - c.l} stroke={color} strokeWidth="1.5" opacity="0.6" />
            <rect x={x - 5} y={bodyTop} width="10" height={bodyH} fill={color} opacity="0.75" rx="1" />
          </g>
        );
      })}
      <polyline
        points={candles.map((c, i) => `${14 + i * 28},${140 - (c.o + c.c) / 2}`).join(' ')}
        fill="none" stroke="#00d4aa" strokeWidth="1" opacity="0.2" strokeDasharray="4 3"
      />
    </svg>
  );
};

/* ── Ticker ── */
const TickerItem = ({ symbol, price, change, up }) => (
  <span className={`ticker-item ${up ? 'up' : 'down'}`}>
    <span className="ticker-symbol">{symbol}</span>
    <span className="ticker-price">{price}</span>
    <span className="ticker-change">{up ? '▲' : '▼'} {change}</span>
  </span>
);

const TICKERS = [
  { symbol: 'AAPL', price: '189.42', change: '2.14%', up: true },
  { symbol: 'TSLA', price: '248.91', change: '1.87%', up: false },
  { symbol: 'SPY',  price: '512.33', change: '0.62%', up: true  },
  { symbol: 'NVDA', price: '875.20', change: '3.45%', up: true  },
  { symbol: 'QQQ',  price: '441.78', change: '0.33%', up: false },
  { symbol: 'AMZN', price: '182.07', change: '1.22%', up: true  },
  { symbol: 'META', price: '501.14', change: '0.94%', up: false },
  { symbol: 'MSFT', price: '414.62', change: '1.08%', up: true  },
];

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, user, loading } = useAuth();

  // Pre-fill with the allowed email — read-only so it can't be changed
  const [email,        setEmail]        = useState(ALLOWED_EMAIL);
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');

  const passwordRef = useRef(null);
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  useEffect(() => {
    // Auto-focus the password field since email is already filled
    setTimeout(() => passwordRef.current?.focus(), 80);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ── Gate 1: email must match exactly ──
    if (email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      setError('Access restricted. This account is not authorised.');
      return;
    }

    // ── Gate 2: password must match ──
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (password !== FIXED_PASSWORD) {
      setError('Incorrect password. Please try again.');
      return;
    }

    setIsLoading(true);
    // Pass through to AuthContext — credentials already validated above,
    // but we still call login() so the auth state is set correctly.
    const result = await login(email.trim(), password);
    setIsLoading(false);

    if (result?.success) {
      navigate(from, { replace: true });
    } else {
      setError(result?.message || 'Login failed. Please try again.');
    }
  };

  if (loading) return null;

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
        <div className="bg-orb" />
      </div>

      <div className="ticker-tape">
        <div className="ticker-track">
          {[...TICKERS, ...TICKERS].map((t, i) => <TickerItem key={i} {...t} />)}
        </div>
      </div>

      <div className="login-layout">
        {/* Left panel */}
        <div className="login-left">
          <div className="brand">
            <div className="brand-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 20L10 12L15 17L20 8L24 14" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="14" r="2" fill="#00d4aa"/>
              </svg>
            </div>
            <span className="brand-name">TradingJournal</span>
          </div>
          <div className="left-headline">
            <h1>Track every<br /><span className="accent-text">edge.</span></h1>
            <p className="left-sub">Your personal trading journal. Log trades, review patterns, and sharpen your strategy — all in one place.</p>
          </div>
          <div className="chart-preview">
            <div className="chart-label">
              <span>Portfolio performance</span>
              <span className="chart-delta">+18.4% <span className="period">this month</span></span>
            </div>
            <CandleChart />
          </div>
          <div className="left-stats">
            <div className="stat-pill"><span className="stat-num">2,400+</span><span className="stat-label">trades logged</span></div>
            <div className="stat-divider" />
            <div className="stat-pill"><span className="stat-num">98%</span><span className="stat-label">uptime</span></div>
            <div className="stat-divider" />
            <div className="stat-pill"><span className="stat-num">∞</span><span className="stat-label">entries</span></div>
          </div>
        </div>

        {/* Right panel */}
        <div className="login-right">
          <div className="form-card">
            <div className="form-section animate-in">
              <div className="form-header">
                <div className="welcome-user">
                  <div className="user-avatar">S</div>
                  <div>
                    <h2>Welcome back!</h2>
                    <p className="email-chip">{ALLOWED_EMAIL}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="auth-form" noValidate>

                {/* Email — read-only, pre-filled, not editable */}
                <div className="field-group">
                  <label htmlFor="email">Email address</label>
                  <div className="input-wrap">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>
                    </svg>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      tabIndex={-1}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="field-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrap">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      ref={passwordRef}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="error-msg"><span>⚠</span> {error}</div>
                )}

                {/* Private access notice */}
                <div className="access-note">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  This is a private journal. Access is restricted to the account owner only.
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? <span className="btn-spinner" /> : <>Sign in <span className="btn-arrow">→</span></>}
                </button>
              </form>
            </div>

            <div className="form-footer">
              <div className="security-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Secured with 256-bit encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}