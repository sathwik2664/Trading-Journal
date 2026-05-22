import { useState, useRef } from 'react';
import {
  User, DollarSign, Shield, Bell, Palette,
  TrendingUp, Save, Edit2, Check, X,
  ChevronRight, Globe, Clock, BarChart2,
  ArrowUpRight, ArrowDownRight, Target, AlertTriangle,
  Camera,
} from 'lucide-react';
import { useAccount } from '../context/AccountContext';

/* ─── Tiny reusable components ─────────────────────────────────────────── */

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-[#141414] border border-[#1e1e1e] rounded-2xl p-5 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-8 h-8 rounded-lg bg-purple-600/15 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={15} className="text-purple-400" />
    </div>
    <div>
      <h3 className="text-white text-sm font-semibold">{title}</h3>
      {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
      checked ? 'bg-purple-600' : 'bg-[#2a2a2a]'
    }`}
  >
    <span
      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

const InputField = ({ label, value, onChange, type = 'text', prefix, suffix, disabled }) => (
  <div>
    <label className="block text-gray-500 text-xs mb-1.5 font-medium uppercase tracking-wide">
      {label}
    </label>
    <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 gap-2 focus-within:border-purple-600/50 transition-colors">
      {prefix && <span className="text-gray-500 text-sm">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 disabled:text-gray-500"
      />
      {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
    </div>
  </div>
);

const StatBadge = ({ label, value, positive }) => (
  <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl p-3 text-center">
    <p className="text-gray-500 text-xs mb-1">{label}</p>
    <p className={`text-sm font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>{value}</p>
  </div>
);

/* ─── Main Component ────────────────────────────────────────────────────── */

const TAB_ITEMS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: DollarSign },
  { id: 'risk', label: 'Risk Rules', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const AVATAR_COLORS = [
  '#7c3aed', '#db2777', '#059669', '#d97706',
  '#2563eb', '#dc2626', '#0891b2', '#65a30d',
];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney',
];

const BROKERS = [
  'TD Ameritrade', 'Interactive Brokers', 'Webull', 'Robinhood',
  'E*TRADE', 'Fidelity', 'Schwab', 'TradeStation', 'Other',
];

const AccountCenter = () => {
  const { account, updateAccount, updateBalance, updateNotification } = useAccount();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceDraft, setBalanceDraft] = useState(String(account.currentBalance));

  // Local draft state — committed on Save
  const [draft, setDraft] = useState({ ...account });
  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  const handleSave = () => {
    updateAccount(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBalanceSave = () => {
    const parsed = parseFloat(balanceDraft.replace(/,/g, ''));
    if (!isNaN(parsed) && parsed >= 0) {
      updateBalance(parsed);
      set('currentBalance', parsed);
    }
    setEditingBalance(false);
  };

  const handleBalanceCancel = () => {
    setBalanceDraft(String(account.currentBalance));
    setEditingBalance(false);
  };

  const pnl = account.currentBalance - account.startingBalance;
  const pnlPct = ((pnl / account.startingBalance) * 100).toFixed(2);
  const isProfit = pnl >= 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-600 text-xs mb-3">
          <span>Dashboard</span>
          <ChevronRight size={12} />
          <span className="text-gray-400">Account Center</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Account Center</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your profile, balance, and preferences</p>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {saved ? (
              <>
                <Check size={15} />
                Saved!
              </>
            ) : (
              <>
                <Save size={15} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Tabs */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-2xl p-2 sticky top-6">
            {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors mb-0.5 last:mb-0 ${
                  activeTab === id
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-[#1e1e1e]'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 space-y-4">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <>
              {/* Avatar */}
              <SectionCard>
                <SectionTitle icon={User} title="Profile Information" subtitle="Your personal details" />
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-[#1e1e1e]">
                  <div className="relative group">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                      style={{ backgroundColor: draft.avatarColor }}
                    >
                      {draft.initials || draft.name?.[0] || 'T'}
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">{draft.name}</p>
                    <p className="text-gray-500 text-sm mb-3">{draft.email}</p>
                    <div className="flex gap-2 flex-wrap">
                      {AVATAR_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => set('avatarColor', color)}
                          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                            draft.avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141414]' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Display Name"
                    value={draft.name}
                    onChange={v => set('name', v)}
                  />
                  <InputField
                    label="Initials"
                    value={draft.initials}
                    onChange={v => set('initials', v.toUpperCase().slice(0, 2))}
                  />
                  <div className="col-span-2">
                    <InputField
                      label="Email Address"
                      value={draft.email}
                      onChange={v => set('email', v)}
                      type="email"
                    />
                  </div>
                  <InputField
                    label="Account Type"
                    value={draft.accountType}
                    onChange={v => set('accountType', v)}
                  />
                  <div>
                    <label className="block text-gray-500 text-xs mb-1.5 font-medium uppercase tracking-wide">
                      Timezone
                    </label>
                    <select
                      value={draft.timezone}
                      onChange={e => set('timezone', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-purple-600/50 transition-colors"
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz} className="bg-[#1a1a1a]">{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── ACCOUNT TAB ── */}
          {activeTab === 'account' && (
            <>
              {/* Balance Hero */}
              <SectionCard>
                <SectionTitle icon={DollarSign} title="Account Balance" subtitle="Your live trading balance — changes sync to Dashboard instantly" />

                <div className="bg-[#1a1a1a] border border-[#252525] rounded-2xl p-5 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Current Balance</p>
                      {editingBalance ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-2xl">$</span>
                          <input
                            autoFocus
                            type="number"
                            value={balanceDraft}
                            onChange={e => setBalanceDraft(e.target.value)}
                            className="bg-transparent text-white text-3xl font-bold outline-none w-48 border-b border-purple-600"
                            onKeyDown={e => { if (e.key === 'Enter') handleBalanceSave(); if (e.key === 'Escape') handleBalanceCancel(); }}
                          />
                          <button onClick={handleBalanceSave} className="text-green-400 hover:text-green-300 transition-colors">
                            <Check size={20} />
                          </button>
                          <button onClick={handleBalanceCancel} className="text-red-400 hover:text-red-300 transition-colors">
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <p className="text-white text-3xl font-bold">
                            ${account.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <button
                            onClick={() => { setEditingBalance(true); setBalanceDraft(String(account.currentBalance)); }}
                            className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#2f2f2f] text-gray-400 hover:text-purple-400 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      isProfit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {isProfit ? '+' : ''}{pnlPct}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <StatBadge
                      label="Starting Balance"
                      value={`$${account.startingBalance.toLocaleString()}`}
                      positive
                    />
                    <StatBadge
                      label="Total P&L"
                      value={`${isProfit ? '+' : ''}$${pnl.toFixed(2)}`}
                      positive={isProfit}
                    />
                    <StatBadge
                      label="P&L %"
                      value={`${isProfit ? '+' : ''}${pnlPct}%`}
                      positive={isProfit}
                    />
                  </div>

                  {!editingBalance && (
                    <p className="text-gray-600 text-xs mt-3 flex items-center gap-1.5">
                      <Edit2 size={10} />
                      Click the edit icon to update your balance. This syncs to your Dashboard immediately.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Starting Balance"
                    value={draft.startingBalance}
                    onChange={v => set('startingBalance', parseFloat(v) || 0)}
                    type="number"
                    prefix="$"
                  />
                  <div>
                    <label className="block text-gray-500 text-xs mb-1.5 font-medium uppercase tracking-wide">
                      Currency
                    </label>
                    <select
                      value={draft.currency}
                      onChange={e => set('currency', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-purple-600/50 transition-colors"
                    >
                      {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'].map(c => (
                        <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>

              {/* Broker */}
              <SectionCard>
                <SectionTitle icon={BarChart2} title="Broker & Trading Account" subtitle="Your connected broker details" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-500 text-xs mb-1.5 font-medium uppercase tracking-wide">
                      Broker
                    </label>
                    <select
                      value={draft.broker}
                      onChange={e => set('broker', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-purple-600/50 transition-colors"
                    >
                      {BROKERS.map(b => (
                        <option key={b} value={b} className="bg-[#1a1a1a]">{b}</option>
                      ))}
                    </select>
                  </div>
                  <InputField
                    label="Account Type"
                    value={draft.accountType}
                    onChange={v => set('accountType', v)}
                  />
                </div>
              </SectionCard>
            </>
          )}

          {/* ── RISK RULES TAB ── */}
          {activeTab === 'risk' && (
            <SectionCard>
              <SectionTitle icon={Shield} title="Risk Management Rules" subtitle="Set guardrails for your trading discipline" />

              <div className="space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-300/80 text-xs leading-relaxed">
                    These limits are for personal discipline tracking only. TradeZella does not enforce them automatically.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputField
                      label="Risk Per Trade (%)"
                      value={draft.riskPerTrade}
                      onChange={v => set('riskPerTrade', parseFloat(v) || 0)}
                      type="number"
                      suffix="%"
                    />
                    <p className="text-gray-600 text-xs mt-1.5 pl-1">
                      = ${((account.currentBalance * draft.riskPerTrade) / 100).toFixed(2)} per trade
                    </p>
                  </div>
                  <div>
                    <InputField
                      label="Max Daily Loss (%)"
                      value={draft.maxDailyLoss}
                      onChange={v => set('maxDailyLoss', parseFloat(v) || 0)}
                      type="number"
                      suffix="%"
                    />
                    <p className="text-gray-600 text-xs mt-1.5 pl-1">
                      = ${((account.currentBalance * draft.maxDailyLoss) / 100).toFixed(2)} max loss
                    </p>
                  </div>
                  <div>
                    <InputField
                      label="Daily Profit Target (%)"
                      value={draft.targetProfit}
                      onChange={v => set('targetProfit', parseFloat(v) || 0)}
                      type="number"
                      suffix="%"
                    />
                    <p className="text-gray-600 text-xs mt-1.5 pl-1">
                      = ${((account.currentBalance * draft.targetProfit) / 100).toFixed(2)} target
                    </p>
                  </div>
                </div>

                {/* Risk Summary Visualization */}
                <div className="mt-2 pt-4 border-t border-[#1e1e1e]">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Risk at a Glance</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Risk Per Trade', pct: draft.riskPerTrade, color: 'bg-blue-500' },
                      { label: 'Max Daily Loss', pct: draft.maxDailyLoss, color: 'bg-red-500' },
                      { label: 'Profit Target', pct: draft.targetProfit, color: 'bg-green-500' },
                    ].map(({ label, pct, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <p className="text-gray-400 text-xs w-32">{label}</p>
                        <div className="flex-1 h-1.5 bg-[#252525] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full transition-all`}
                            style={{ width: `${Math.min(pct * 10, 100)}%` }}
                          />
                        </div>
                        <p className="text-white text-xs w-8 text-right">{pct}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <SectionCard>
              <SectionTitle icon={Bell} title="Notification Preferences" subtitle="Control what updates you receive" />
              <div className="space-y-1">
                {[
                  { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'Get notified when a trade is added or updated' },
                  { key: 'dailySummary', label: 'Daily Summary', desc: 'End-of-day P&L and performance recap' },
                  { key: 'weeklyReport', label: 'Weekly Report', desc: 'Comprehensive weekly performance email' },
                  { key: 'milestones', label: 'Milestones', desc: 'Celebrate win streaks and balance milestones' },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-4 border-b border-[#1e1e1e] last:border-0"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                    </div>
                    <Toggle
                      checked={account.notifications[key]}
                      onChange={v => updateNotification(key, v)}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── APPEARANCE TAB ── */}
          {activeTab === 'appearance' && (
            <SectionCard>
              <SectionTitle icon={Palette} title="Appearance" subtitle="Customize how TradeZella looks" />
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark', bg: '#0f0f0f', border: '#1e1e1e' },
                    { id: 'darker', label: 'Midnight', bg: '#070707', border: '#111' },
                    { id: 'dim', label: 'Dim', bg: '#1a1a2e', border: '#16213e' },
                  ].map(({ id, label, bg, border }) => (
                    <button
                      key={id}
                      onClick={() => set('theme', id)}
                      className={`rounded-xl overflow-hidden border-2 transition-all ${
                        draft.theme === id ? 'border-purple-500' : 'border-[#2a2a2a]'
                      }`}
                    >
                      <div className="h-14" style={{ backgroundColor: bg, borderBottom: `2px solid ${border}` }}>
                        <div className="m-2 rounded-md h-4" style={{ backgroundColor: border }} />
                        <div className="mx-2 rounded-sm h-2 w-1/2" style={{ backgroundColor: border }} />
                      </div>
                      <div className="py-2 text-center text-xs font-medium text-gray-400 bg-[#1a1a1a]">
                        {label}
                        {draft.theme === id && <span className="text-purple-400 ml-1">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-3">More themes coming soon.</p>
              </div>
            </SectionCard>
          )}

        </div>
      </div>
    </div>
  );
};

export default AccountCenter;