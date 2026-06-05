import { useState } from 'react';
import {
  User, Shield,
  Save, Check, X, ChevronRight,
  AlertTriangle,
  Plus, Minus, Target, Brain, Flame,
  Sparkles, AlertCircle, CheckCircle2, Circle,
  RefreshCw, Award, LogOut,
} from 'lucide-react';
import { useAccount } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';

/* ── Inject fonts + styles ── */
if (typeof document !== 'undefined' && !document.getElementById('__ac_s__')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);

  const s = document.createElement('style');
  s.id = '__ac_s__';
  s.textContent = `
    @keyframes ac-up   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
    @keyframes ac-spin  { to{transform:rotate(360deg)} }
    @keyframes ac-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    .ac-up { animation: ac-up .4s cubic-bezier(.16,1,.3,1) both; }
    .ac-tab { transition: all .15s; }
    .ac-tab:hover { background: rgba(255,255,255,.04); }
    .ac-inp {
      width:100%; background:#111317; border:1px solid #1f2229;
      border-radius:10px; color:#e8eaf0; font-family:'DM Mono',monospace;
      font-size:12px; padding:9px 13px; outline:none; box-sizing:border-box;
      transition:border-color .15s, box-shadow .15s;
    }
    .ac-inp:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
    .ac-inp::placeholder { color:#2a2d35; }
    .ac-card { background:#0d0f14; border:1px solid #1a1d24; border-radius:16px; padding:20px; }
    .ac-scroll::-webkit-scrollbar { width:3px; }
    .ac-scroll::-webkit-scrollbar-thumb { background:#1f2229; border-radius:99px; }
    .ac-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700; font-family:'Manrope',sans-serif; cursor:pointer; border:none; transition:all .15s; }
    .ac-btn:hover { transform:translateY(-1px); filter:brightness(1.1); }
    .ac-row:hover { background:rgba(255,255,255,.025); border-radius:10px; }
    .ac-habit-check { transition:all .15s; }
    .ac-habit-check:hover { transform:scale(1.1); }
    .ac-logout-btn {
      display:inline-flex; align-items:center; gap:6px;
      padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700;
      font-family:'Manrope',sans-serif; cursor:pointer;
      background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2);
      color:#ef4444; transition:all .15s;
    }
    .ac-logout-btn:hover {
      background:rgba(239,68,68,.16); transform:translateY(-1px);
      box-shadow:0 4px 12px rgba(239,68,68,.15);
    }
    .ac-logout-modal-overlay {
      position:fixed; inset:0; z-index:100;
      display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,.75); backdrop-filter:blur(8px); padding:16px;
    }
    .ac-logout-modal {
      background:#0d0f14; border:1px solid #1a1d24; border-radius:18px;
      width:100%; max-width:340px; padding:24px;
      box-shadow:0 32px 80px rgba(0,0,0,.8);
      animation: ac-up .3s cubic-bezier(.16,1,.3,1) both;
    }
  `;
  document.head.appendChild(s);
}

/* ── Constants ── */
const TABS = [
  { id: 'profile',  label: 'Profile',      icon: User        },
  { id: 'goals',    label: 'Goals',         icon: Target      },
  { id: 'habits',   label: 'Daily Habits',  icon: Flame       },
  { id: 'mindset',  label: 'Mindset',       icon: Brain       },
  { id: 'mistakes', label: 'Mistakes',      icon: AlertCircle },
  { id: 'risk',     label: 'Risk Rules',    icon: Shield      },
];

const AVATAR_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4','#84cc16'];
const TIMEZONES     = ['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Europe/London','Europe/Berlin','Asia/Tokyo','Asia/Kolkata','Australia/Sydney'];
const BROKERS       = ['TD Ameritrade','Interactive Brokers','Webull','Robinhood','E*TRADE','Fidelity','Schwab','TradeStation','Other'];

const DEFAULT_HABITS = [
  { id:'h1', label:'Reviewed trading plan',        done:false },
  { id:'h2', label:'Checked economic calendar',    done:false },
  { id:'h3', label:'Defined max loss for the day', done:false },
  { id:'h4', label:'No revenge trading promise',   done:false },
  { id:'h5', label:'Journal entry written',        done:false },
  { id:'h6', label:'Closed all positions at EOD',  done:false },
];

const MOOD_OPTIONS = [
  { value:'focused',    label:'Focused',    emoji:'🎯', color:'#6366f1' },
  { value:'confident',  label:'Confident',  emoji:'💪', color:'#10b981' },
  { value:'anxious',    label:'Anxious',    emoji:'😰', color:'#f59e0b' },
  { value:'frustrated', label:'Frustrated', emoji:'😤', color:'#ef4444' },
  { value:'neutral',    label:'Neutral',    emoji:'😐', color:'#6b7280' },
  { value:'greedy',     label:'Greedy',     emoji:'🤑', color:'#ec4899' },
];

const COMMON_MISTAKES = [
  'Moving stop loss','Overtrading','Revenge trading','FOMO entry',
  'Skipping entry rules','Oversizing position','Early exit','Late entry',
  'Trading news blindly','Not journaling',
];

/* ── Reusable UI ── */
const Field = ({ label, children }) => (
  <div>
    <label style={{ display:'block', fontSize:10, textTransform:'uppercase', letterSpacing:'.1em', color:'#4b5263', fontWeight:700, marginBottom:6, fontFamily:'Manrope,sans-serif' }}>{label}</label>
    {children}
  </div>
);

const Input = ({ label, value, onChange, type='text', prefix, suffix, disabled, placeholder }) => (
  <Field label={label}>
    <div style={{ display:'flex', alignItems:'center', background:'#111317', border:'1px solid #1f2229', borderRadius:10, padding:'9px 13px', gap:8, transition:'border-color .15s' }}
      onFocusCapture={e => e.currentTarget.style.borderColor='#6366f1'}
      onBlurCapture={e  => e.currentTarget.style.borderColor='#1f2229'}
    >
      {prefix && <span style={{ color:'#4b5263', fontSize:13 }}>{prefix}</span>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
        style={{ flex:1, background:'transparent', color:'#e8eaf0', fontFamily:'DM Mono,monospace', fontSize:12, outline:'none', border:'none' }}
      />
      {suffix && <span style={{ color:'#4b5263', fontSize:12 }}>{suffix}</span>}
    </div>
  </Field>
);

const Select = ({ label, value, onChange, options }) => (
  <Field label={label}>
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:'100%', background:'#111317', border:'1px solid #1f2229', borderRadius:10, padding:'9px 13px', color:'#e8eaf0', fontFamily:'DM Mono,monospace', fontSize:12, outline:'none' }}
    >
      {options.map(o => <option key={o} value={o} style={{background:'#111317'}}>{o}</option>)}
    </select>
  </Field>
);

const Card = ({ children, style }) => (
  <div className="ac-card" style={style}>{children}</div>
);

const CardTitle = ({ icon:Icon, title, subtitle, action }) => (
  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
      <div style={{ width:34, height:34, borderRadius:10, background:'rgba(99,102,241,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={15} color="#6366f1"/>
      </div>
      <div>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'#e8eaf0' }}>{title}</div>
        {subtitle && <div style={{ fontFamily:'Manrope,sans-serif', fontSize:11, color:'#4b5263', marginTop:2 }}>{subtitle}</div>}
      </div>
    </div>
    {action}
  </div>
);

/* ── Logout Confirm Modal ── */
const LogoutModal = ({ onConfirm, onCancel }) => (
  <div className="ac-logout-modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
    <div className="ac-logout-modal">
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'rgba(239,68,68,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <LogOut size={18} color="#ef4444"/>
        </div>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'#e8eaf0' }}>Sign out?</div>
          <div style={{ fontFamily:'Manrope,sans-serif', fontSize:12, color:'#4b5263', marginTop:2 }}>You'll be returned to the login screen.</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onCancel} className="ac-btn" style={{ flex:1, justifyContent:'center', background:'#1a1d24', color:'#6b7280' }}>Cancel</button>
        <button onClick={onConfirm} className="ac-btn" style={{ flex:1, justifyContent:'center', background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.25)', color:'#ef4444' }}>
          <LogOut size={13}/> Sign out
        </button>
      </div>
    </div>
  </div>
);

/* ── AI Coach Modal ── */
const AICoachModal = ({ account, draft, onClose }) => {
  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const run = async () => {
    setLoading(true); setText(''); setErr('');
    const tradePnl = (account.transactions||[]).filter(t=>t.type==='trade_pnl').reduce((s,t)=>s+t.amount,0);
    const pnlPct   = account.currentBalance > 0 ? ((tradePnl / account.currentBalance) * 100).toFixed(1) : '0.0';
    const prompt = `You are a professional trading performance coach. Analyze this trader's profile and give specific, actionable coaching.

Account: Current $${account.currentBalance} | Trade P&L ${tradePnl >= 0 ? '+' : ''}$${tradePnl.toFixed(2)} (${pnlPct}% return)
Risk per trade: ${draft.riskPerTrade}% | Max daily loss: ${draft.maxDailyLoss}% | Profit target: ${draft.targetProfit}%
Transactions: ${(account.transactions||[]).length} total
Broker: ${draft.broker || 'Unknown'} | Account type: ${draft.accountType || 'Unknown'}

Give exactly 4 coaching points numbered 1-4:
1. One specific thing they're doing right (or a foundation to build on)
2. Their most critical risk management improvement
3. A specific habit or process improvement
4. A mindset coaching point

Format each: **[Category]**: coaching advice. Be direct, personal, reference their specific numbers. Under 200 words total.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{role:'user',content:prompt}] }),
      });
      const d = await res.json();
      setText(d.content?.map(b=>b.text||'').join('') || 'No response.');
    } catch { setErr('Network error. Check connection.'); }
    setLoading(false);
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.8)',backdropFilter:'blur(10px)',padding:16 }}>
      <div style={{ background:'#0d0f14',border:'1px solid #1a1d24',borderRadius:20,width:'100%',maxWidth:520,padding:24,boxShadow:'0 32px 80px rgba(0,0,0,.9)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:'rgba(99,102,241,.15)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Sparkles size={16} color="#6366f1"/>
            </div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:700,color:'#e8eaf0' }}>AI Performance Coach</div>
              <div style={{ fontFamily:'Manrope,sans-serif',fontSize:11,color:'#4b5263' }}>Personalized analysis based on your account</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#4b5263',cursor:'pointer' }}><X size={15}/></button>
        </div>
        {!text && !loading && (
          <div style={{ textAlign:'center',padding:'24px 0' }}>
            <div style={{ fontSize:32,marginBottom:12 }}>🧠</div>
            <p style={{ fontFamily:'Manrope,sans-serif',fontSize:13,color:'#6b7280',marginBottom:20,lineHeight:1.6 }}>
              Get a personalized coaching session based on your actual account data, risk settings, and transaction history.
            </p>
            <button onClick={run} className="ac-btn" style={{ background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.3)',color:'#6366f1',padding:'10px 24px',fontSize:12 }}>
              <Sparkles size={13}/> Start My Coaching Session
            </button>
          </div>
        )}
        {loading && (
          <div style={{ textAlign:'center',padding:'32px 0' }}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12 }}>
              <div style={{ width:32,height:32,borderRadius:'50%',border:'2px solid #1f2229',borderTopColor:'#6366f1',animation:'ac-spin .8s linear infinite' }}/>
              <p style={{ fontFamily:'Manrope,sans-serif',fontSize:12,color:'#4b5263',animation:'ac-pulse 1.5s infinite' }}>Analyzing your trading profile…</p>
            </div>
          </div>
        )}
        {err && <p style={{ fontFamily:'Manrope,sans-serif',fontSize:12,color:'#ef4444',textAlign:'center' }}>{err}</p>}
        {text && (
          <div style={{ background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.15)',borderRadius:12,padding:16 }}>
            <div style={{ fontFamily:'Manrope,sans-serif',fontSize:13,color:'#b4b8c8',lineHeight:1.9,whiteSpace:'pre-wrap' }}>
              {text.split(/\*\*(.+?)\*\*/g).map((p,i) =>
                i%2===1 ? <strong key={i} style={{color:'#6366f1',fontWeight:700}}>{p}</strong> : p
              )}
            </div>
            <button onClick={run} style={{ marginTop:14,background:'none',border:'none',color:'#4b5263',cursor:'pointer',fontSize:11,fontFamily:'Manrope,sans-serif',display:'flex',alignItems:'center',gap:5 }}>
              <RefreshCw size={11}/> Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function AccountCenter() {
  const { account, updateAccount } = useAccount();
  const { user, logout } = useAuth();

  const [tab,         setTab]        = useState('profile');
  const [saved,       setSaved]      = useState(false);
  const [aiModal,     setAiModal]    = useState(false);
  const [logoutModal, setLogoutModal]= useState(false);

  const [draft, setDraft] = useState({
    ...account,
    name:        account.name        || user?.name  || 'Sathwik Reddy',
    email:       account.email       || user?.email || '',
    initials:    account.initials    || 'SR',
    avatarColor: account.avatarColor || '#6366f1',
  });

  const set = (k, v) => setDraft(p => ({ ...p, [k]: v }));

  /* ── Goals ── */
  const [goals, setGoals] = useState([
    { id:'g1', label:'Monthly P&L Target', target:2000, current:0, unit:'$', period:'monthly' },
    { id:'g2', label:'Win Rate Target',     target:60,   current:0, unit:'%', period:'monthly' },
    { id:'g3', label:'Max Drawdown Limit',  target:5,    current:0, unit:'%', period:'weekly'  },
    { id:'g4', label:'Trades Per Week',     target:20,   current:0, unit:'',  period:'weekly'  },
  ]);
  const [newGoal, setNewGoal] = useState({ label:'', target:'', unit:'$', period:'monthly' });

  /* ── Habits ── */
  const [habits,      setHabits]      = useState(DEFAULT_HABITS);
  const [customHabit, setCustomHabit] = useState('');

  /* ── Mindset ── */
  const [moodLog,   setMoodLog]   = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [moodNote,  setMoodNote]  = useState('');

  /* ── Mistakes ── */
  const [mistakes,    setMistakes]  = useState(COMMON_MISTAKES.slice(0,6).map((m,i)=>({ id:`m${i}`, label:m, count:0 })));
  const [newMistake,  setNewMistake]= useState('');

  /* ── Handlers ── */
  const handleSave = async () => {
    await updateAccount(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => { await logout(); };

  const habitsCompleted = habits.filter(h => h.done).length;

  const logMood = () => {
    if (!todayMood) return;
    setMoodLog(p => [{ mood:todayMood, note:moodNote, date:new Date().toISOString() }, ...p.slice(0,29)]);
    setTodayMood(null); setMoodNote('');
  };

  const topMistakes = [...mistakes].sort((a,b) => b.count - a.count).slice(0,3);

  /* ════════════════════════════════
     RENDER
  ════════════════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:'#080a0e', fontFamily:'Manrope,sans-serif', color:'#e8eaf0' }}>
      <div style={{ position:'fixed',top:-80,right:-80,width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 70%)',pointerEvents:'none',zIndex:0 }}/>

      <div style={{ position:'relative',zIndex:1,maxWidth:1100,margin:'0 auto',padding:'28px 24px 60px' }}>

        {/* ── Header ── */}
        <div className="ac-up" style={{ marginBottom:28 }}>
          <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#4b5263',marginBottom:10,fontFamily:'DM Mono,monospace' }}>
            <span>Dashboard</span><ChevronRight size={11}/><span style={{color:'#6b7280'}}>Account Center</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
            <div>
              <h1 style={{ fontFamily:'Syne,sans-serif',fontSize:26,fontWeight:800,color:'#e8eaf0',margin:0,letterSpacing:'-0.5px' }}>Account Center</h1>
              <p style={{ fontSize:12,color:'#4b5263',marginTop:4 }}>
                Signed in as <span style={{ color:'#6366f1', fontFamily:'DM Mono,monospace' }}>{user?.name || draft.name || 'Trader'}</span>
                {user?.email && <span style={{ color:'#4b5263' }}> · {user.email}</span>}
              </p>
            </div>
            <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
              <button onClick={() => setAiModal(true)} className="ac-btn" style={{ background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.25)',color:'#6366f1',fontSize:11 }}>
                <Sparkles size={13}/> AI Coach
              </button>
              <button onClick={handleSave} className="ac-btn" style={{ background:saved?'rgba(16,185,129,.15)':'#6366f1',border:saved?'1px solid rgba(16,185,129,.3)':'none',color:saved?'#10b981':'#fff',fontSize:11 }}>
                {saved ? <><Check size={13}/>Saved!</> : <><Save size={13}/>Save Changes</>}
              </button>
              <button onClick={() => setLogoutModal(true)} className="ac-logout-btn">
                <LogOut size={13}/> Sign out
              </button>
            </div>
          </div>
        </div>

        <div style={{ display:'flex',gap:20 }}>

          {/* ── Sidebar ── */}
          <div style={{ width:188, flexShrink:0 }}>
            <div style={{ background:'#0d0f14',border:'1px solid #1a1d24',borderRadius:14,padding:6,position:'sticky',top:20 }}>
              {TABS.map(({ id, label, icon:Icon }) => (
                <button key={id} onClick={() => setTab(id)} className="ac-tab" style={{
                  width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
                  borderRadius:9,border:'none',cursor:'pointer',marginBottom:2,textAlign:'left',
                  background: tab===id ? 'rgba(99,102,241,.15)' : 'transparent',
                  color:       tab===id ? '#6366f1' : '#6b7280',
                  fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:tab===id?700:500,
                  outline: tab===id ? '1px solid rgba(99,102,241,.25)' : 'none',
                  transition:'all .15s',
                }}>
                  <Icon size={14}/>{label}
                  {id==='habits' && habitsCompleted>0 && (
                    <span style={{ marginLeft:'auto',background:'#6366f1',color:'#fff',borderRadius:20,fontSize:9,fontWeight:800,padding:'1px 6px',fontFamily:'DM Mono,monospace' }}>
                      {habitsCompleted}/{habits.length}
                    </span>
                  )}
                </button>
              ))}
              <div style={{ borderTop:'1px solid #1a1d24', marginTop:6, paddingTop:6 }}>
                <button onClick={() => setLogoutModal(true)} className="ac-tab" style={{
                  width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
                  borderRadius:9,border:'none',cursor:'pointer',textAlign:'left',
                  background:'transparent',color:'#ef4444',
                  fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:500,
                  transition:'all .15s',
                }}>
                  <LogOut size={14}/> Sign out
                </button>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="ac-up ac-scroll" style={{ flex:1, display:'flex', flexDirection:'column', gap:14, overflowY:'auto', animationDelay:'60ms' }}>

            {/* ══ PROFILE ══ */}
            {tab === 'profile' && (
              <Card>
                <CardTitle icon={User} title="Profile Information" subtitle="Your personal trading identity"/>
                <div style={{ display:'flex',alignItems:'center',gap:20,marginBottom:24,paddingBottom:20,borderBottom:'1px solid #1a1d24' }}>
                  <div style={{ width:72,height:72,borderRadius:18,background:draft.avatarColor||'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,color:'#fff',fontFamily:'Syne,sans-serif' }}>
                    {draft.initials || draft.name?.[0]?.toUpperCase() || 'T'}
                  </div>
                  <div>
                    <div style={{ fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:'#e8eaf0',marginBottom:2 }}>{draft.name}</div>
                    <div style={{ fontFamily:'DM Mono,monospace',fontSize:11,color:'#4b5263',marginBottom:10 }}>{draft.email}</div>
                    <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                      {AVATAR_COLORS.map(c => (
                        <button key={c} onClick={() => set('avatarColor', c)} style={{
                          width:22,height:22,borderRadius:'50%',background:c,border:'none',cursor:'pointer',
                          outline:draft.avatarColor===c?`2px solid ${c}`:'none',
                          outlineOffset:2,transform:draft.avatarColor===c?'scale(1.2)':'scale(1)',transition:'all .15s',
                        }}/>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                  <Input label="Display Name"  value={draft.name}     onChange={v=>set('name',v)}    placeholder="Your name"/>
                  <Input label="Initials"       value={draft.initials} onChange={v=>set('initials',v.toUpperCase().slice(0,2))} placeholder="SR"/>
                  <div style={{ gridColumn:'1/-1' }}>
                    <Input label="Email Address" value={draft.email} onChange={v=>set('email',v)} type="email" placeholder="you@example.com"/>
                  </div>
                  <Input label="Account Type" value={draft.accountType||''} onChange={v=>set('accountType',v)} placeholder="Live / Paper"/>
                  <Select label="Timezone" value={draft.timezone||'Asia/Kolkata'} onChange={v=>set('timezone',v)} options={TIMEZONES}/>
                </div>
                <div style={{ marginTop:20,paddingTop:16,borderTop:'1px solid #1a1d24' }}>
                  <p style={{ fontFamily:'Manrope,sans-serif',fontSize:10,fontWeight:700,color:'#4b5263',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:12 }}>Authenticated Account</p>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                    {[
                      { label:'Name',        value: user?.name  || '—' },
                      { label:'Email',        value: user?.email || '—' },
                      { label:'Role',         value: user?.role  || '—' },
                      { label:'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background:'#111317',border:'1px solid #1f2229',borderRadius:10,padding:'10px 12px' }}>
                        <div style={{ fontFamily:'Manrope,sans-serif',fontSize:9,color:'#4b5263',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4 }}>{label}</div>
                        <div style={{ fontFamily:'DM Mono,monospace',fontSize:12,color:'#c8ccd8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* ══ GOALS ══ */}
            {tab === 'goals' && (
              <Card>
                <CardTitle icon={Target} title="Trading Goals" subtitle="Set targets and track progress"/>
                <div style={{ display:'flex',flexDirection:'column',gap:14,marginBottom:20 }}>
                  {goals.map(g => {
                    const pct   = Math.min((g.current / g.target) * 100, 100);
                    const color = pct>=100?'#10b981':pct>=60?'#6366f1':pct>=30?'#f59e0b':'#ef4444';
                    return (
                      <div key={g.id} style={{ background:'#111317',border:'1px solid #1f2229',borderRadius:12,padding:14 }}>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                          <div>
                            <div style={{ fontFamily:'Manrope,sans-serif',fontSize:13,fontWeight:600,color:'#c8ccd8' }}>{g.label}</div>
                            <div style={{ fontFamily:'DM Mono,monospace',fontSize:10,color:'#4b5263',marginTop:2,textTransform:'uppercase',letterSpacing:'.06em' }}>{g.period}</div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                              <input type="number" value={g.current} onChange={e=>setGoals(p=>p.map(x=>x.id===g.id?{...x,current:parseFloat(e.target.value)||0}:x))}
                                style={{ width:72,background:'transparent',border:'none',color,fontFamily:'DM Mono,monospace',fontSize:15,fontWeight:800,outline:'none',textAlign:'right' }}/>
                              <span style={{ fontFamily:'DM Mono,monospace',fontSize:12,color:'#4b5263' }}>/ {g.target}{g.unit}</span>
                            </div>
                            <div style={{ fontFamily:'Manrope,sans-serif',fontSize:10,color,marginTop:2,fontWeight:700 }}>{pct.toFixed(0)}%</div>
                          </div>
                        </div>
                        <div style={{ height:6,background:'#1a1d24',borderRadius:3,overflow:'hidden' }}>
                          <div style={{ height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width .6s cubic-bezier(.16,1,.3,1)' }}/>
                        </div>
                        {pct >= 100 && (
                          <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:8 }}>
                            <Award size={12} color="#10b981"/>
                            <span style={{ fontFamily:'Manrope,sans-serif',fontSize:11,color:'#10b981',fontWeight:700 }}>Goal achieved!</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.15)',borderRadius:12,padding:14 }}>
                  <p style={{ fontFamily:'Manrope,sans-serif',fontSize:11,fontWeight:700,color:'#6366f1',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10 }}>Add New Goal</p>
                  <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 80px 100px',gap:8,marginBottom:10 }}>
                    <input value={newGoal.label}  onChange={e=>setNewGoal(p=>({...p,label:e.target.value}))}  placeholder="Goal name" className="ac-inp"/>
                    <input type="number" value={newGoal.target} onChange={e=>setNewGoal(p=>({...p,target:e.target.value}))} placeholder="Target" className="ac-inp"/>
                    <input value={newGoal.unit}   onChange={e=>setNewGoal(p=>({...p,unit:e.target.value}))}   placeholder="Unit"    className="ac-inp"/>
                    <select value={newGoal.period} onChange={e=>setNewGoal(p=>({...p,period:e.target.value}))}
                      style={{ background:'#111317',border:'1px solid #1f2229',borderRadius:10,padding:'9px 10px',color:'#e8eaf0',fontFamily:'DM Mono,monospace',fontSize:11,outline:'none' }}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <button onClick={()=>{
                    if (!newGoal.label || !newGoal.target) return;
                    setGoals(p=>[...p,{ id:`g${Date.now()}`,label:newGoal.label,target:parseFloat(newGoal.target),current:0,unit:newGoal.unit,period:newGoal.period }]);
                    setNewGoal({label:'',target:'',unit:'$',period:'monthly'});
                  }} className="ac-btn" style={{ background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.25)',color:'#6366f1',fontSize:11 }}>
                    <Plus size={12}/> Add Goal
                  </button>
                </div>
              </Card>
            )}

            {/* ══ HABITS ══ */}
            {tab === 'habits' && (
              <Card>
                <CardTitle icon={Flame} title="Daily Trading Habits" subtitle="Your pre/post market routine checklist"
                  action={
                    <div style={{ display:'flex',alignItems:'center',gap:8,background:habitsCompleted===habits.length&&habits.length>0?'rgba(16,185,129,.1)':'rgba(99,102,241,.1)',border:`1px solid ${habitsCompleted===habits.length&&habits.length>0?'rgba(16,185,129,.25)':'rgba(99,102,241,.25)'}`,borderRadius:20,padding:'4px 12px' }}>
                      <Flame size={11} color={habitsCompleted===habits.length&&habits.length>0?'#10b981':'#6366f1'}/>
                      <span style={{ fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:700,color:habitsCompleted===habits.length&&habits.length>0?'#10b981':'#6366f1' }}>{habitsCompleted}/{habits.length}</span>
                    </div>
                  }
                />
                <div style={{ marginBottom:20 }}>
                  <div style={{ height:6,background:'#1a1d24',borderRadius:3,overflow:'hidden',marginBottom:6 }}>
                    <div style={{ height:'100%',width:`${habits.length?habitsCompleted/habits.length*100:0}%`,background:habitsCompleted===habits.length&&habits.length>0?'#10b981':'#6366f1',borderRadius:3,transition:'width .4s' }}/>
                  </div>
                  <p style={{ fontFamily:'Manrope,sans-serif',fontSize:11,color:'#4b5263' }}>
                    {habitsCompleted===habits.length&&habits.length>0 ? '🎉 Full routine complete! Great discipline.' : `${habits.length-habitsCompleted} habits remaining today`}
                  </p>
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:20 }}>
                  {habits.map(h => (
                    <div key={h.id} className="ac-row" style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 10px',cursor:'pointer' }}
                      onClick={() => setHabits(p=>p.map(x=>x.id===h.id?{...x,done:!x.done}:x))}>
                      <button className="ac-habit-check" style={{ background:'none',border:'none',cursor:'pointer',color:h.done?'#10b981':'#2a2d35',flexShrink:0 }}>
                        {h.done ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
                      </button>
                      <span style={{ fontFamily:'Manrope,sans-serif',fontSize:13,fontWeight:h.done?600:400,color:h.done?'#6b7280':'#c8ccd8',textDecoration:h.done?'line-through':'none',flex:1 }}>{h.label}</span>
                      <button onClick={e=>{e.stopPropagation();setHabits(p=>p.filter(x=>x.id!==h.id));}}
                        style={{ background:'none',border:'none',color:'#2a2d35',cursor:'pointer',transition:'color .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#2a2d35'}>
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  <input value={customHabit} onChange={e=>setCustomHabit(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&customHabit.trim()){setHabits(p=>[...p,{id:`h${Date.now()}`,label:customHabit.trim(),done:false}]);setCustomHabit('');}}}
                    placeholder="Add custom habit…" className="ac-inp" style={{ flex:1 }}/>
                  <button onClick={()=>{if(customHabit.trim()){setHabits(p=>[...p,{id:`h${Date.now()}`,label:customHabit.trim(),done:false}]);setCustomHabit('');}}}
                    className="ac-btn" style={{ background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.25)',color:'#6366f1',padding:'9px 14px',flexShrink:0 }}>
                    <Plus size={13}/>
                  </button>
                </div>
                <button onClick={()=>setHabits(p=>p.map(h=>({...h,done:false})))}
                  style={{ marginTop:12,background:'none',border:'none',color:'#4b5263',cursor:'pointer',fontSize:11,fontFamily:'Manrope,sans-serif',display:'flex',alignItems:'center',gap:5 }}>
                  <RefreshCw size={10}/> Reset for new day
                </button>
              </Card>
            )}

            {/* ══ MINDSET ══ */}
            {tab === 'mindset' && (
              <Card>
                <CardTitle icon={Brain} title="Mindset & Emotional Log" subtitle="Track how emotions affect your trading"/>
                <div style={{ background:'#111317',border:'1px solid #1f2229',borderRadius:12,padding:16,marginBottom:16 }}>
                  <p style={{ fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:700,color:'#c8ccd8',marginBottom:12 }}>How are you feeling today?</p>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:12 }}>
                    {MOOD_OPTIONS.map(m => (
                      <button key={m.value} onClick={()=>setTodayMood(m.value)} style={{
                        display:'flex',alignItems:'center',gap:6,padding:'7px 13px',borderRadius:20,
                        border:`1px solid ${todayMood===m.value?m.color:'#1f2229'}`,
                        background:todayMood===m.value?`${m.color}20`:'transparent',
                        color:todayMood===m.value?m.color:'#6b7280',
                        fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .15s',
                      }}>
                        <span>{m.emoji}</span>{m.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={moodNote} onChange={e=>setMoodNote(e.target.value)}
                    placeholder="Any notes about your mental state today? (optional)" rows={2}
                    style={{ width:'100%',background:'#0d0f14',border:'1px solid #1a1d24',borderRadius:10,padding:'9px 13px',color:'#e8eaf0',fontFamily:'Manrope,sans-serif',fontSize:12,outline:'none',resize:'vertical',boxSizing:'border-box',marginBottom:10 }}/>
                  <button onClick={logMood} disabled={!todayMood} className="ac-btn"
                    style={{ background:todayMood?'rgba(99,102,241,.15)':'transparent',border:`1px solid ${todayMood?'rgba(99,102,241,.3)':'#1f2229'}`,color:todayMood?'#6366f1':'#2a2d35',fontSize:11 }}>
                    <Check size={12}/> Log Mood
                  </button>
                </div>
                {moodLog.length > 0 ? (
                  <div>
                    <p style={{ fontFamily:'Manrope,sans-serif',fontSize:10,fontWeight:700,color:'#4b5263',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10 }}>Recent Entries</p>
                    <div className="ac-scroll" style={{ maxHeight:280,overflowY:'auto',display:'flex',flexDirection:'column',gap:6 }}>
                      {moodLog.map((e,i) => {
                        const m = MOOD_OPTIONS.find(x=>x.value===e.mood) || MOOD_OPTIONS[4];
                        return (
                          <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',background:'#111317',border:'1px solid #1f2229',borderRadius:10 }}>
                            <span style={{ fontSize:18,flexShrink:0 }}>{m.emoji}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                                <span style={{ fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:700,color:m.color }}>{m.label}</span>
                                <span style={{ fontFamily:'DM Mono,monospace',fontSize:10,color:'#4b5263' }}>{new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                              </div>
                              {e.note && <p style={{ fontFamily:'Manrope,sans-serif',fontSize:11,color:'#6b7280',marginTop:3,lineHeight:1.5 }}>{e.note}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign:'center',padding:'24px 0',color:'#4b5263' }}>
                    <Brain size={24} style={{ margin:'0 auto 8px',opacity:.3 }}/>
                    <p style={{ fontSize:12 }}>No mood entries yet. Log your first one above.</p>
                  </div>
                )}
              </Card>
            )}

            {/* ══ MISTAKES ══ */}
            {tab === 'mistakes' && (
              <Card>
                <CardTitle icon={AlertCircle} title="Mistake Tracker" subtitle="Log and eliminate recurring trading mistakes"/>
                {topMistakes.some(m=>m.count>0) && (
                  <div style={{ background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.15)',borderRadius:12,padding:14,marginBottom:16 }}>
                    <p style={{ fontFamily:'Manrope,sans-serif',fontSize:10,fontWeight:700,color:'#ef4444',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10 }}>🔥 Most Common Mistakes</p>
                    {topMistakes.filter(m=>m.count>0).map((m,i) => (
                      <div key={m.id} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:i<2?8:0 }}>
                        <span style={{ fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:800,color:'#ef4444',width:16 }}>#{i+1}</span>
                        <span style={{ fontFamily:'Manrope,sans-serif',fontSize:12,color:'#c8ccd8',flex:1 }}>{m.label}</span>
                        <span style={{ fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:800,color:'#ef4444' }}>{m.count}×</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:16 }}>
                  {mistakes.map(m => (
                    <div key={m.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#111317',border:'1px solid #1f2229',borderRadius:10 }}>
                      <div style={{ flex:1 }}>
                        <span style={{ fontFamily:'Manrope,sans-serif',fontSize:12,fontWeight:600,color:'#c8ccd8' }}>{m.label}</span>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <button onClick={()=>setMistakes(p=>p.map(x=>x.id===m.id?{...x,count:Math.max(0,x.count-1)}:x))}
                          style={{ width:24,height:24,borderRadius:6,background:'#1a1d24',border:'none',color:'#6b7280',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <Minus size={11}/>
                        </button>
                        <span style={{ fontFamily:'DM Mono,monospace',fontSize:14,fontWeight:800,color:m.count>0?'#ef4444':'#2a2d35',width:24,textAlign:'center' }}>{m.count}</span>
                        <button onClick={()=>setMistakes(p=>p.map(x=>x.id===m.id?{...x,count:x.count+1}:x))}
                          style={{ width:24,height:24,borderRadius:6,background:'rgba(239,68,68,.12)',border:'none',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <Plus size={11}/>
                        </button>
                        <button onClick={()=>setMistakes(p=>p.filter(x=>x.id!==m.id))}
                          style={{ width:24,height:24,borderRadius:6,background:'transparent',border:'none',color:'#2a2d35',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'color .15s' }}
                          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#2a2d35'}>
                          <X size={11}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  <input value={newMistake} onChange={e=>setNewMistake(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&newMistake.trim()){setMistakes(p=>[...p,{id:`m${Date.now()}`,label:newMistake.trim(),count:0}]);setNewMistake('');}}}
                    placeholder="Add custom mistake…" className="ac-inp" style={{ flex:1 }}/>
                  <button onClick={()=>{if(newMistake.trim()){setMistakes(p=>[...p,{id:`m${Date.now()}`,label:newMistake.trim(),count:0}]);setNewMistake('');}}}
                    className="ac-btn" style={{ background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.2)',color:'#ef4444',padding:'9px 14px',flexShrink:0 }}>
                    <Plus size={13}/>
                  </button>
                </div>
                <div style={{ marginTop:14 }}>
                  <p style={{ fontFamily:'Manrope,sans-serif',fontSize:10,color:'#4b5263',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8 }}>Quick Add</p>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {COMMON_MISTAKES.filter(c=>!mistakes.some(m=>m.label===c)).map(c => (
                      <button key={c} onClick={()=>setMistakes(p=>[...p,{id:`m${Date.now()}`,label:c,count:0}])}
                        style={{ padding:'4px 10px',borderRadius:20,fontFamily:'Manrope,sans-serif',fontSize:11,fontWeight:600,background:'transparent',border:'1px solid #1f2229',color:'#6b7280',cursor:'pointer',transition:'all .15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(239,68,68,.3)';e.currentTarget.style.color='#ef4444';}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='#1f2229';e.currentTarget.style.color='#6b7280';}}>
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* ══ RISK ══ */}
            {tab === 'risk' && (
              <Card>
                <CardTitle icon={Shield} title="Risk Management Rules" subtitle="Discipline guardrails — personal tracking only"/>
                <div style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,marginBottom:18 }}>
                  <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink:0,marginTop:1 }}/>
                  <p style={{ fontFamily:'Manrope,sans-serif',fontSize:11,color:'rgba(245,158,11,.8)',lineHeight:1.6 }}>These limits are for self-discipline tracking only and are not enforced automatically.</p>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20 }}>
                  <div>
                    <Input label="Risk Per Trade (%)" value={draft.riskPerTrade||0} onChange={v=>set('riskPerTrade',parseFloat(v)||0)} type="number" suffix="%"/>
                    <p style={{ fontFamily:'DM Mono,monospace',fontSize:10,color:'#4b5263',marginTop:5 }}>= ${((account.currentBalance*(draft.riskPerTrade||0))/100).toFixed(2)} per trade</p>
                  </div>
                  <div>
                    <Input label="Max Daily Loss (%)" value={draft.maxDailyLoss||0} onChange={v=>set('maxDailyLoss',parseFloat(v)||0)} type="number" suffix="%"/>
                    <p style={{ fontFamily:'DM Mono,monospace',fontSize:10,color:'#4b5263',marginTop:5 }}>= ${((account.currentBalance*(draft.maxDailyLoss||0))/100).toFixed(2)} max loss</p>
                  </div>
                  <div>
                    <Input label="Daily Profit Target (%)" value={draft.targetProfit||0} onChange={v=>set('targetProfit',parseFloat(v)||0)} type="number" suffix="%"/>
                    <p style={{ fontFamily:'DM Mono,monospace',fontSize:10,color:'#4b5263',marginTop:5 }}>= ${((account.currentBalance*(draft.targetProfit||0))/100).toFixed(2)} target</p>
                  </div>
                </div>
                <p style={{ fontFamily:'Manrope,sans-serif',fontSize:10,fontWeight:700,color:'#4b5263',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:12 }}>Risk at a Glance</p>
                {[
                  { label:'Risk Per Trade', pct:draft.riskPerTrade||0, color:'#6366f1' },
                  { label:'Max Daily Loss', pct:draft.maxDailyLoss||0, color:'#ef4444' },
                  { label:'Profit Target',  pct:draft.targetProfit||0, color:'#10b981' },
                ].map(({label,pct,color}) => (
                  <div key={label} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                    <span style={{ fontFamily:'Manrope,sans-serif',fontSize:12,color:'#6b7280',width:130,flexShrink:0 }}>{label}</span>
                    <div style={{ flex:1,height:5,background:'#1a1d24',borderRadius:3,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${Math.min(pct*10,100)}%`,background:color,borderRadius:3,transition:'width .4s' }}/>
                    </div>
                    <span style={{ fontFamily:'DM Mono,monospace',fontSize:11,color:'#e8eaf0',width:28,textAlign:'right' }}>{pct}%</span>
                  </div>
                ))}
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {aiModal     && <AICoachModal account={account} draft={draft} onClose={()=>setAiModal(false)}/>}
      {logoutModal && <LogoutModal  onConfirm={handleLogout} onCancel={()=>setLogoutModal(false)}/>}
    </div>
  );
}