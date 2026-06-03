/**
 * Reports.jsx — Elite Trading Analytics Dashboard
 * Features: Animated stats, Performance Score Gauge, 52-week P&L Heatmap,
 * Sharpe/Sortino/Calmar/VaR/Kelly, Day-of-week analysis,
 * AI Trade Coach (Anthropic API), Behavioral Patterns, Trade Log + filters.
 */

import { useTrades } from '../hooks/useTrades';
import Loader from '../components/shared/Loader';
import { formatCurrency } from '../utils/helpers';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell, ComposedChart,
} from 'recharts';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════ */
const T = {
  bg:       '#05050d',
  surface:  '#09091a',
  card:     '#0d0d1f',
  border:   '#161630',
  hover:    '#1e1e3a',
  accent:   '#00d4aa',
  accentDim:'rgba(0,212,170,0.12)',
  green:    '#00c896',
  greenDim: 'rgba(0,200,150,0.12)',
  red:      '#ff3b5c',
  redDim:   'rgba(255,59,92,0.12)',
  yellow:   '#ffb020',
  blue:     '#4f8ef7',
  text:     '#dde1f2',
  sub:      '#9090b8',
  muted:    '#3f3f6a',
  mono:     "'JetBrains Mono', 'Fira Code', monospace",
  sans:     "'Outfit', 'DM Sans', system-ui, sans-serif",
};

/* ═══════════════════════════════════════════════════
   INJECT FONTS + GLOBAL STYLES ONCE
═══════════════════════════════════════════════════ */
if (typeof document !== 'undefined') {
  if (!document.getElementById('__rpt_fonts__')) {
    const l = document.createElement('link');
    l.id = '__rpt_fonts__'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(l);
  }
  if (!document.getElementById('__rpt_styles__')) {
    const s = document.createElement('style');
    s.id = '__rpt_styles__';
    s.textContent = `
      @keyframes rptFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes rptSpin    { to{transform:rotate(360deg)} }
      @keyframes rptPulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
      .rpt-fade { animation: rptFadeUp .45s cubic-bezier(.16,1,.3,1) both; }
      .rpt-hover-row:hover { background: #1e1e3a !important; }
      .rpt-btn:hover { opacity:.85; transform:translateY(-1px); }
      ::-webkit-scrollbar{width:4px;height:4px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#3f3f6a;border-radius:4px}
    `;
    document.head.appendChild(s);
  }
}

/* ═══════════════════════════════════════════════════
   STAT HELPERS
═══════════════════════════════════════════════════ */
const fix2 = n => +n.toFixed(2);
const pct  = (a, b) => b ? +((a / b) * 100).toFixed(1) : 0;

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1));
}
const calcSharpe  = d => { if (d.length < 5) return 0; const m = d.reduce((a,b)=>a+b,0)/d.length; const s=stdDev(d); return s?fix2((m/s)*Math.sqrt(252)):0; };
const calcSortino = d => { if (d.length < 5) return 0; const m = d.reduce((a,b)=>a+b,0)/d.length; const dn=d.filter(r=>r<0); if(!dn.length) return 9.99; const ds=Math.sqrt(dn.reduce((s,r)=>s+r*r,0)/dn.length); return ds?fix2((m/ds)*Math.sqrt(252)):0; };
const calcVaR     = (d, c=.95) => { if(!d.length) return 0; const s=[...d].sort((a,b)=>a-b); return fix2(Math.abs(s[Math.floor((1-c)*s.length)]||0)); };
const scoreOf = (wr,pf,sh,rr,cons) => {
  const n=(v,lo,hi)=>Math.max(0,Math.min(1,(v-lo)/(hi-lo)));
  return Math.round(n(wr,30,75)*30+n(Math.min(typeof pf==='number'?pf:5,5),.8,3)*25+n(sh,-1,3)*20+n(rr,.5,3)*15+n(cons,0,1)*10);
};

const RANGE_OPTS = ['All','1W','1M','3M','6M','YTD'];
function applyRange(trades, r) {
  const n = dayjs();
  if (r==='All') return trades;
  if (r==='YTD') return trades.filter(t=>dayjs(t.date).isAfter(n.startOf('year')));
  const map={1:[7,'day'],'1W':[7,'day'],'1M':[1,'month'],'3M':[3,'month'],'6M':[6,'month']};
  const [amt,unit]=map[r]||[7,'day'];
  return trades.filter(t=>dayjs(t.date).isAfter(n.subtract(amt,unit)));
}

/* ═══════════════════════════════════════════════════
   ANIMATED NUMBER
═══════════════════════════════════════════════════ */
function AnimNum({ value, fmt=v=>v, dur=900 }) {
  const [disp, setDisp] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from=prev.current, to=value, t0=Date.now();
    const run=()=>{ const p=Math.min((Date.now()-t0)/dur,1), e=1-Math.pow(1-p,3); setDisp(from+(to-from)*e); if(p<1) requestAnimationFrame(run); else { setDisp(to); prev.current=to; } };
    requestAnimationFrame(run);
  },[value,dur]);
  return <span>{fmt(disp)}</span>;
}

/* ═══════════════════════════════════════════════════
   SCORE GAUGE
═══════════════════════════════════════════════════ */
function ScoreGauge({ score }) {
  const R=62, circ=2*Math.PI*R;
  const offset = circ-(score/100)*circ;
  const color  = score>=65?T.green:score>=45?T.yellow:T.red;
  const lbl    = score>=65?'Strong':score>=45?'Moderate':'Weak';
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <defs><filter id="sg"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="80" cy="80" r={R} fill="none" stroke={T.muted} strokeWidth="9" strokeOpacity=".3"/>
      <circle cx="80" cy="80" r={R} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 80 80)" filter="url(#sg)"
        style={{transition:'stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1),stroke .4s'}}/>
      <text x="80" y="76" textAnchor="middle" fill={color} fontSize="30" fontWeight="800"
        fontFamily={T.mono} style={{letterSpacing:'-2px'}}>{score}</text>
      <text x="80" y="95" textAnchor="middle" fill={T.sub} fontSize="11" fontWeight="600"
        fontFamily={T.sans} style={{letterSpacing:'.1em',textTransform:'uppercase'}}>{lbl}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   52-WEEK HEATMAP
═══════════════════════════════════════════════════ */
function Heatmap({ trades }) {
  const [hov, setHov] = useState(null);
  const { weeks, maxAbs } = useMemo(() => {
    const dm={};
    trades.forEach(t=>{ const k=dayjs(t.date).format('YYYY-MM-DD'); dm[k]=(dm[k]||0)+t.pnl; });
    const start=dayjs().subtract(51,'week').startOf('isoWeek');
    const weeks=[];
    for(let w=0;w<52;w++){
      const week=[];
      for(let d=0;d<7;d++){
        const date=start.add(w*7+d,'day');
        week.push({date,pnl:dm[date.format('YYYY-MM-DD')]??null});
      }
      weeks.push(week);
    }
    return {weeks, maxAbs:Math.max(...Object.values(dm).map(Math.abs),1)};
  },[trades]);

  const DOW=['M','T','W','T','F','S','S'];
  return (
    <div>
      <div style={{display:'flex',gap:3}}>
        <div style={{display:'flex',flexDirection:'column',gap:3,marginRight:4}}>
          {DOW.map((d,i)=>(
            <div key={i} style={{height:11,fontSize:8,color:T.muted,fontFamily:T.mono,display:'flex',alignItems:'center'}}>{d}</div>
          ))}
        </div>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{display:'flex',flexDirection:'column',gap:3}}>
            {week.map((day,di)=>{
              const {date,pnl}=day;
              const future=date.isAfter(dayjs());
              const intensity=pnl!==null?Math.min(Math.abs(pnl)/maxAbs,1):0;
              let bg;
              if(future||pnl===null) bg=T.muted+'28';
              else if(pnl>0) bg=`rgba(0,200,150,${.15+intensity*.85})`;
              else if(pnl<0) bg=`rgba(255,59,92,${.15+intensity*.85})`;
              else bg=T.muted+'40';
              return (
                <div key={di} onMouseEnter={()=>setHov({date:date.format('MMM DD, YYYY'),pnl,wi,di})}
                  onMouseLeave={()=>setHov(null)}
                  style={{width:11,height:11,borderRadius:2,background:bg,cursor:'default',
                    outline:hov?.wi===wi&&hov?.di===di?`1px solid ${T.accent}`:'none',transition:'outline .1s'}}/>
              );
            })}
          </div>
        ))}
      </div>
      {hov&&(
        <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:T.muted,fontSize:11,fontFamily:T.mono}}>{hov.date}</span>
          {hov.pnl!==null
            ?<span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:hov.pnl>=0?T.green:T.red}}>{formatCurrency(hov.pnl)}</span>
            :<span style={{color:T.muted,fontSize:11}}>No trades</span>}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:10}}>
        <span style={{color:T.muted,fontSize:10,fontFamily:T.sans}}>Less</span>
        {[.15,.35,.55,.75,.95].map((o,i)=>(
          <div key={i} style={{width:10,height:10,borderRadius:2,background:`rgba(0,200,150,${o})`}}/>
        ))}
        <span style={{color:T.muted,fontSize:10,fontFamily:T.sans}}>Profit</span>
        <div style={{width:1,height:12,background:T.muted,margin:'0 4px'}}/>
        {[.15,.35,.55,.75,.95].map((o,i)=>(
          <div key={i} style={{width:10,height:10,borderRadius:2,background:`rgba(255,59,92,${o})`}}/>
        ))}
        <span style={{color:T.muted,fontSize:10,fontFamily:T.sans}}>Loss</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════ */
const ChartTip = ({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:'8px 12px',fontFamily:T.mono}}>
      <p style={{color:T.sub,fontSize:10,marginBottom:3}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:typeof p.value==='number'&&p.value<0?T.red:T.green,fontSize:13,fontWeight:700}}>
          {typeof p.value==='number'?formatCurrency(p.value):p.value}
        </p>
      ))}
    </div>
  );
};

const SectionLabel = ({children,action})=>(
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
    <span style={{fontFamily:T.sans,fontSize:10,fontWeight:700,color:T.sub,letterSpacing:'.12em',textTransform:'uppercase',
      display:'flex',alignItems:'center',gap:7}}>
      <span style={{display:'inline-block',width:3,height:12,background:T.accent,borderRadius:2}}/>
      {children}
    </span>
    {action}
  </div>
);

const Pill=({label,value,sub,color,delay=0})=>(
  <div className="rpt-fade" style={{animationDelay:`${delay}ms`,background:T.card,border:`1px solid ${T.border}`,
    borderRadius:12,padding:'13px 16px',transition:'border-color .15s,transform .15s',cursor:'default'}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=color||T.accent;e.currentTarget.style.transform='translateY(-1px)';}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform='';}}>
    <p style={{fontFamily:T.sans,fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:5}}>{label}</p>
    <p style={{fontFamily:T.mono,fontSize:19,fontWeight:800,color:color||T.text,letterSpacing:'-1px'}}>{value}</p>
    {sub&&<p style={{fontFamily:T.sans,fontSize:10,color:T.sub,marginTop:3}}>{sub}</p>}
  </div>
);

const Badge=({children,color})=>(
  <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:4,
    background:(color||T.accent)+'20',color:color||T.accent,border:`1px solid ${(color||T.accent)}40`}}>{children}</span>
);

const Empty=()=>(
  <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',color:T.muted,fontFamily:T.sans,fontSize:13}}>
    No data for this period
  </div>
);

const Card=({children,style={}})=>(
  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:24,...style}}>{children}</div>
);

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const Reports = () => {
  const { trades: allTrades, loading } = useTrades();
  const [range,   setRange]     = useState('All');
  const [tab,     setTab]       = useState('overview');
  const [logFilter, setLogFilter] = useState('all');
  const [logSort, setLogSort]   = useState({key:'date',dir:-1});
  const [logSym,  setLogSym]    = useState('');
  const [aiLoad,  setAiLoad]    = useState(false);
  const [aiText,  setAiText]    = useState('');
  const [aiErr,   setAiErr]     = useState('');

  const trades = useMemo(() => applyRange(allTrades, range), [allTrades, range]);

  /* ── Core stats ── */
  const S = useMemo(() => {
    const winners = trades.filter(t=>t.pnl>0);
    const losers  = trades.filter(t=>t.pnl<0);
    const netPnl  = trades.reduce((s,t)=>s+t.pnl,0);
    const wr      = pct(winners.length,trades.length);
    const avgWin  = winners.length?winners.reduce((s,t)=>s+t.pnl,0)/winners.length:0;
    const avgLoss = losers.length?Math.abs(losers.reduce((s,t)=>s+t.pnl,0)/losers.length):0;
    const gProfit = winners.reduce((s,t)=>s+t.pnl,0);
    const gLoss   = Math.abs(losers.reduce((s,t)=>s+t.pnl,0));
    const pf      = gLoss?fix2(gProfit/gLoss):(winners.length?99:0);
    const rr      = avgLoss?fix2(avgWin/avgLoss):0;
    const exp     = fix2(wr/100*avgWin-(1-wr/100)*avgLoss);
    const kelly   = rr>0?fix2((wr/100)-(1-wr/100)/rr)*100:0;

    const dayMap={};
    trades.forEach(t=>{ const k=dayjs(t.date).format('YYYY-MM-DD'); dayMap[k]=(dayMap[k]||0)+t.pnl; });
    const dayArr=Object.values(dayMap);
    const sharpe =calcSharpe(dayArr);
    const sortino=calcSortino(dayArr);
    const var95  =calcVaR(dayArr);
    const pDays  =dayArr.filter(v=>v>0).length;
    const lDays  =dayArr.filter(v=>v<0).length;
    const cons   =pDays/Math.max(dayArr.length,1);

    const sorted=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
    let cum=0,peak=0,maxDD=0;
    sorted.forEach(t=>{ cum+=t.pnl; if(cum>peak)peak=cum; const dd=peak>0?(peak-cum)/peak*100:0; if(dd>maxDD)maxDD=dd; });
    const calmar=maxDD>0?fix2(netPnl/maxDD):0;

    let bStr=0,wStr=0,cur=0;
    sorted.forEach(t=>{ if(t.pnl>0){cur=Math.max(cur,0)+1;bStr=Math.max(bStr,cur);} else if(t.pnl<0){cur=Math.min(cur,0)-1;wStr=Math.max(wStr,Math.abs(cur));} });

    const score=scoreOf(wr,pf,sharpe,rr,cons);

    return {
      netPnl,winners,losers,wr,avgWin,avgLoss,gProfit,gLoss,pf,rr,exp,kelly,
      sharpe,sortino,var95,calmar,maxDD:fix2(maxDD),pDays,lDays,cons,score,
      bStr,wStr,best:trades.length?Math.max(...trades.map(t=>t.pnl)):0,
      worst:trades.length?Math.min(...trades.map(t=>t.pnl)):0,
      total:trades.length,sorted,
    };
  },[trades]);

  /* ── Chart data ── */
  const CD = useMemo(()=>{
    const {sorted}=S;
    let cum=0,peak=0;
    const equity=sorted.map(t=>{
      cum+=t.pnl; if(cum>peak)peak=cum;
      const dd=peak>0?-((peak-cum)/peak*100):0;
      return {date:dayjs(t.date).format('MMM DD'),pnl:fix2(cum),drawdown:fix2(dd)};
    });

    const dm={};
    sorted.forEach(t=>{ const k=dayjs(t.date).format('MMM DD'); if(!dm[k])dm[k]={pnl:0,count:0}; dm[k].pnl+=t.pnl; dm[k].count++; });
    const daily=Object.entries(dm).map(([date,d])=>({date,pnl:fix2(d.pnl),count:d.count}));

    const mm={};
    sorted.forEach(t=>{ const k=dayjs(t.date).format('MMM YY'); mm[k]=(mm[k]||0)+t.pnl; });
    const monthly=Object.entries(mm).map(([month,pnl])=>({month,pnl:fix2(pnl)}));

    const dowPnl={Mon:0,Tue:0,Wed:0,Thu:0,Fri:0};
    const dowCnt={Mon:0,Tue:0,Wed:0,Thu:0,Fri:0};
    sorted.forEach(t=>{ const d=dayjs(t.date).format('ddd'); if(d in dowPnl){dowPnl[d]+=t.pnl;dowCnt[d]++;} });
    const dow=Object.entries(dowPnl).map(([day,pnl])=>({day,pnl:fix2(pnl),avg:dowCnt[day]?fix2(pnl/dowCnt[day]):0}));

    const sm={};
    trades.forEach(t=>{ if(!sm[t.symbol])sm[t.symbol]={pnl:0,count:0,wins:0}; sm[t.symbol].pnl+=t.pnl; sm[t.symbol].count++; if(t.pnl>0)sm[t.symbol].wins++; });
    const symbols=Object.entries(sm).map(([s,d])=>({symbol:s,pnl:fix2(d.pnl),count:d.count,wr:pct(d.wins,d.count),avg:fix2(d.pnl/d.count),wins:d.wins,losses:d.count-d.wins})).sort((a,b)=>b.pnl-a.pnl);

    const buckets=[
      {label:'< -500',count:0,color:T.red},
      {label:'-500–-100',count:0,color:'#ff7a7a'},
      {label:'-100–0',count:0,color:T.yellow},
      {label:'0–100',count:0,color:'#7af7b8'},
      {label:'100–500',count:0,color:T.green},
      {label:'> 500',count:0,color:'#00ffca'},
    ];
    trades.forEach(t=>{
      if(t.pnl<-500)buckets[0].count++;
      else if(t.pnl<-100)buckets[1].count++;
      else if(t.pnl<0)buckets[2].count++;
      else if(t.pnl<100)buckets[3].count++;
      else if(t.pnl<500)buckets[4].count++;
      else buckets[5].count++;
    });

    return {equity,daily,monthly,dow,symbols,buckets};
  },[trades,S]);

  /* ── Behavioral analysis ── */
  const behaviors = useMemo(()=>{
    const {sorted,wr,wStr}=S;
    const flags=[];
    let revenge=0;
    const dcnt={};
    sorted.forEach((t,i)=>{ const k=dayjs(t.date).format('YYYY-MM-DD'); dcnt[k]=(dcnt[k]||0)+1; if(i>0&&sorted[i-1].pnl<-100&&sorted[i-1].date===t.date)revenge++; });
    const overtrade=Object.values(dcnt).filter(c=>c>5).length;
    if(revenge>2)     flags.push({icon:'⚠️',color:T.red,    label:'Possible Revenge Trading',  detail:`${revenge} trades placed immediately after a big loss`});
    if(overtrade>0)   flags.push({icon:'🔥',color:T.yellow, label:'Overtrading Detected',       detail:`${overtrade} day(s) with more than 5 trades`});
    if(wr<45)         flags.push({icon:'📉',color:T.red,    label:'Low Win Rate',               detail:'Focus on trade selection — only take high-conviction setups'});
    if(wStr>=4)       flags.push({icon:'❄️',color:T.blue,  label:'Extended Loss Streak',        detail:`${wStr} consecutive losses — review your risk rules`});
    if(S.rr>2)        flags.push({icon:'🎯',color:T.green,  label:'Excellent R:R Ratio',        detail:`Avg winner is ${S.rr}× your avg loser — protect this`});
    if(S.bStr>=5)     flags.push({icon:'🔥',color:T.green,  label:`${S.bStr}-Trade Win Streak`, detail:'Strong momentum — stay disciplined, avoid overconfidence'});
    if(S.pf>2)        flags.push({icon:'💎',color:T.accent, label:'Elite Profit Factor',        detail:`${S.pf} — top-tier traders target above 1.5`});
    if(S.maxDD>25)    flags.push({icon:'🚨',color:T.red,    label:'High Drawdown Warning',      detail:`${S.maxDD}% peak-to-trough — consider tightening risk per trade`});
    if(!flags.length) flags.push({icon:'✅',color:T.accent, label:'No Major Behavioral Issues', detail:'Keep monitoring as you add more trades'});
    return flags;
  },[S]);

  /* ── AI Coach ── */
  const runAI = useCallback(async()=>{
    setAiLoad(true); setAiText(''); setAiErr('');
    const {netPnl,wr,pf,sharpe,sortino,rr,exp,maxDD,best,worst,bStr,wStr,total,calmar,var95}=S;
    const topSym=CD.symbols[0]?.symbol||'N/A';
    const botSym=CD.symbols[CD.symbols.length-1]?.symbol||'N/A';
    const prompt=`You are an elite trading performance coach. Here are a trader's statistics for the ${range} period (${total} trades):

Net P&L: ${formatCurrency(netPnl)}
Win Rate: ${wr}% | Profit Factor: ${pf} | Expectancy: ${formatCurrency(exp)}/trade
Sharpe: ${sharpe} | Sortino: ${sortino} | Calmar: ${calmar} | VaR(95%): ${formatCurrency(var95)}
Avg R:R: ${rr} | Max Drawdown: ${maxDD}%
Best trade: ${formatCurrency(best)} | Worst trade: ${formatCurrency(worst)}
Best streak: ${bStr} wins | Worst streak: ${wStr} losses
Best symbol: ${topSym} | Worst symbol: ${botSym}

Give exactly 4 specific, numbered, actionable coaching insights. Reference their actual numbers. Be direct and concrete. Format each as:
**[Category]**: [insight and specific action to take]

Keep total response under 220 words.`;
    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]}),
      });
      const data=await res.json();
      const text=data.content?.map(b=>b.text||'').join('')||'';
      setAiText(text||'No response received.');
    } catch(e) { setAiErr('Could not connect to AI. Check your network.'); }
    setAiLoad(false);
  },[S,CD,range]);

  /* ── Trade log ── */
  const logTrades = useMemo(()=>{
    let t=[...trades];
    if(logFilter==='winners') t=t.filter(x=>x.pnl>0);
    if(logFilter==='losers')  t=t.filter(x=>x.pnl<0);
    if(logSym) t=t.filter(x=>x.symbol?.toLowerCase().includes(logSym.toLowerCase()));
    t.sort((a,b)=>{
      const va=logSort.key==='date'?new Date(a.date):a[logSort.key];
      const vb=logSort.key==='date'?new Date(b.date):b[logSort.key];
      return logSort.dir*(va>vb?1:-1);
    });
    return t;
  },[trades,logFilter,logSym,logSort]);

  const sortBy=key=>setLogSort(s=>({key,dir:s.key===key?-s.dir:-1}));
  const sortArrow=key=>logSort.key===key?(logSort.dir===-1?'↓':'↑'):'↕';

  /* ── CSV export ── */
  const exportCSV=()=>{
    let cum=0;
    const rows=S.sorted.map(t=>{cum+=t.pnl;return`${t.date},${t.symbol},${t.side||''},${t.pnl},${fix2(cum)}`;});
    const blob=new Blob([['Date,Symbol,Side,P&L,Cumulative',...rows].join('\n')],{type:'text/csv'});
    const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`trades_${range}.csv`});
    a.click(); URL.revokeObjectURL(a.href);
  };

  if (loading) return <Loader />;

  const TABS=['overview','deep dive','symbols','behavior','ai coach'];
  const {netPnl,wr,pf,sharpe,sortino,rr,exp,kelly,best,worst,maxDD,var95,calmar,score,pDays,lDays,bStr,wStr,total,avgWin,avgLoss,gProfit,gLoss}=S;

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.sans,color:T.text,padding:'28px 32px'}}>

      {/* ══ HEADER ══ */}
      <div className="rpt-fade" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
        <div>
          <h1 style={{fontFamily:T.mono,fontSize:24,fontWeight:800,letterSpacing:'-1.5px',marginBottom:4,
            background:`linear-gradient(90deg,${T.text},${T.accent})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Performance Analytics
          </h1>
          <p style={{color:T.sub,fontSize:12,letterSpacing:'.04em'}}>
            {total} trades in view · {allTrades.length} total in journal
          </p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{display:'flex',background:T.card,border:`1px solid ${T.border}`,borderRadius:10,overflow:'hidden'}}>
            {RANGE_OPTS.map(r=>(
              <button key={r} onClick={()=>setRange(r)} style={{
                padding:'7px 13px',fontSize:11,fontFamily:T.mono,fontWeight:700,border:'none',cursor:'pointer',
                letterSpacing:'.04em',background:range===r?T.accent:'transparent',
                color:range===r?T.bg:T.sub,transition:'all .15s'}}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="rpt-btn" style={{
            padding:'7px 14px',fontSize:11,fontFamily:T.mono,fontWeight:700,background:'transparent',
            border:`1px solid ${T.border}`,borderRadius:10,color:T.sub,cursor:'pointer',transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.sub;}}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* ══ HERO ROW ══ */}
      <div className="rpt-fade" style={{display:'grid',gridTemplateColumns:'220px 1fr 230px',gap:16,marginBottom:16,animationDelay:'50ms'}}>

        {/* Net P&L card */}
        <div style={{background:netPnl>=0?`linear-gradient(135deg,${T.greenDim},${T.card})`:`linear-gradient(135deg,${T.redDim},${T.card})`,
          border:`1px solid ${netPnl>=0?T.green+'40':T.red+'40'}`,borderRadius:16,padding:24,
          display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
          <p style={{fontFamily:T.sans,fontSize:10,color:T.sub,letterSpacing:'.12em',textTransform:'uppercase'}}>Net P&L</p>
          <div>
            <p style={{fontFamily:T.mono,fontSize:32,fontWeight:900,letterSpacing:'-2px',color:netPnl>=0?T.green:T.red,lineHeight:1}}>
              <AnimNum value={netPnl} fmt={v=>formatCurrency(v)}/>
            </p>
            <p style={{fontFamily:T.sans,fontSize:11,color:T.sub,marginTop:8}}>{total} trades · {pDays}d profit / {lDays}d loss</p>
          </div>
        </div>

        {/* Score + key metrics */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:24,display:'flex',alignItems:'center',gap:28}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
            <ScoreGauge score={score}/>
            <p style={{fontFamily:T.sans,fontSize:9,color:T.muted,letterSpacing:'.1em',textTransform:'uppercase',marginTop:4}}>Performance Score</p>
          </div>
          <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            {[
              {l:'Win Rate',      v:`${wr}%`,            c:wr>=50?T.green:T.yellow},
              {l:'Profit Factor', v:pf,                  c:pf>=1.5?T.green:T.yellow},
              {l:'Sharpe Ratio',  v:sharpe,              c:sharpe>=1?T.green:sharpe>=0?T.yellow:T.red},
              {l:'Expectancy',    v:formatCurrency(exp), c:exp>=0?T.green:T.red},
              {l:'Avg R:R',       v:rr,                  c:rr>=1.5?T.green:T.yellow},
              {l:'Kelly %',       v:`${Math.max(0,kelly).toFixed(1)}%`, c:kelly>0?T.accent:T.red},
            ].map(({l,v,c})=>(
              <div key={l}>
                <p style={{fontFamily:T.sans,fontSize:9,color:T.muted,marginBottom:3,letterSpacing:'.07em',textTransform:'uppercase'}}>{l}</p>
                <p style={{fontFamily:T.mono,fontSize:14,fontWeight:800,color:c}}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk panel */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:24,display:'flex',flexDirection:'column',gap:14}}>
          <p style={{fontFamily:T.sans,fontSize:10,color:T.sub,letterSpacing:'.12em',textTransform:'uppercase'}}>Risk Metrics</p>
          {[
            {l:'Max Drawdown', v:`${maxDD}%`,         c:maxDD>20?T.red:T.yellow},
            {l:'VaR (95%)',    v:formatCurrency(var95),c:T.yellow},
            {l:'Sortino',      v:sortino,              c:sortino>=1?T.green:T.yellow},
            {l:'Calmar Ratio', v:calmar,               c:calmar>=1?T.green:T.yellow},
          ].map(({l,v,c})=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:T.sans,fontSize:11,color:T.sub}}>{l}</span>
              <span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:c}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ SECONDARY KPIs ══ */}
      <div className="rpt-fade" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:24,animationDelay:'100ms'}}>
        <Pill delay={0}   label="Best Trade"   value={formatCurrency(best)}  color={T.green}/>
        <Pill delay={40}  label="Worst Trade"  value={formatCurrency(worst)} color={T.red}/>
        <Pill delay={80}  label="Best Streak"  value={`${bStr} wins`}        color={T.green} sub={`${wStr} worst loss streak`}/>
        <Pill delay={120} label="Avg Win"       value={formatCurrency(avgWin)} color={T.green} sub={`Avg loss: ${formatCurrency(avgLoss)}`}/>
        <Pill delay={160} label="Gross Profit"  value={formatCurrency(gProfit)} color={T.accent} sub={`Gross loss: ${formatCurrency(gLoss)}`}/>
      </div>

      {/* ══ TABS ══ */}
      <div style={{display:'flex',borderBottom:`1px solid ${T.border}`,marginBottom:20}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'9px 18px',fontSize:11,fontFamily:T.mono,fontWeight:700,border:'none',cursor:'pointer',
            background:'transparent',textTransform:'uppercase',letterSpacing:'.08em',
            color:tab===t?T.accent:T.muted,
            borderBottom:`2px solid ${tab===t?T.accent:'transparent'}`,
            marginBottom:-1,transition:'color .15s'}}>
            {t}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════
          OVERVIEW
      ════════════════════════════════ */}
      {tab==='overview'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* Equity curve */}
          <Card>
            <SectionLabel>Equity Curve <span style={{color:T.muted,fontSize:9,marginLeft:8}}>— Drawdown overlaid (dashed, right axis)</span></SectionLabel>
            {!CD.equity.length?<Empty/>:(
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={CD.equity}>
                  <defs>
                    <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={netPnl>=0?T.green:T.red} stopOpacity={.35}/>
                      <stop offset="100%" stopColor={netPnl>=0?T.green:T.red} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={T.muted+'18'} strokeDasharray="4 4"/>
                  <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="l" tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="r" orientation="right" tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={<ChartTip/>}/>
                  <ReferenceLine yAxisId="l" y={0} stroke={T.muted+'40'}/>
                  <Area yAxisId="l" type="monotone" dataKey="pnl" stroke={netPnl>=0?T.green:T.red}
                    strokeWidth={2.5} fill="url(#eqG)" dot={false}
                    activeDot={{r:5,fill:netPnl>=0?T.green:T.red}}/>
                  <Line yAxisId="r" type="monotone" dataKey="drawdown" stroke={T.red+'80'}
                    strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Daily + Monthly */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <SectionLabel>Daily P&L</SectionLabel>
              {!CD.daily.length?<Empty/>:(
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={CD.daily} barSize={10}>
                    <CartesianGrid stroke={T.muted+'15'} strokeDasharray="4 4"/>
                    <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>}/>
                    <ReferenceLine y={0} stroke={T.border}/>
                    <Bar dataKey="pnl" radius={[3,3,0,0]}>
                      {CD.daily.map((e,i)=><Cell key={i} fill={e.pnl>=0?T.green:T.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card>
              <SectionLabel>Monthly P&L</SectionLabel>
              {!CD.monthly.length?<Empty/>:(
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={CD.monthly} barSize={22}>
                    <CartesianGrid stroke={T.muted+'15'} strokeDasharray="4 4"/>
                    <XAxis dataKey="month" tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>}/>
                    <ReferenceLine y={0} stroke={T.border}/>
                    <Bar dataKey="pnl" radius={[5,5,0,0]}>
                      {CD.monthly.map((e,i)=><Cell key={i} fill={e.pnl>=0?T.green:T.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* 52-week heatmap */}
          <Card>
            <SectionLabel>52-Week P&L Heatmap</SectionLabel>
            <Heatmap trades={trades}/>
          </Card>

          {/* DOW + distribution */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Card>
              <SectionLabel>Day-of-Week P&L</SectionLabel>
              {!CD.dow.some(d=>d.pnl!==0)?<Empty/>:(
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={CD.dow} barSize={36}>
                    <CartesianGrid stroke={T.muted+'15'} strokeDasharray="4 4"/>
                    <XAxis dataKey="day" tick={{fill:T.sub,fontSize:12,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>}/>
                    <ReferenceLine y={0} stroke={T.border}/>
                    <Bar dataKey="pnl" radius={[5,5,0,0]}>
                      {CD.dow.map((e,i)=><Cell key={i} fill={e.pnl>=0?T.green:T.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card>
              <SectionLabel>P&L Distribution</SectionLabel>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={CD.buckets} barSize={32}>
                  <CartesianGrid stroke={T.muted+'15'} strokeDasharray="4 4"/>
                  <XAxis dataKey="label" tick={{fill:T.muted,fontSize:8,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={v=>[v,'Trades']}/>
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {CD.buckets.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          DEEP DIVE
      ════════════════════════════════ */}
      {tab==='deep dive'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* 8-metric grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[
              {l:'Sharpe Ratio',  v:sharpe,              sub:'Risk-adj. return (>1 good)',    c:sharpe>=1?T.green:sharpe>=0?T.yellow:T.red},
              {l:'Sortino Ratio', v:sortino,             sub:'Downside-only risk (>1 good)',  c:sortino>=1?T.green:T.yellow},
              {l:'Calmar Ratio',  v:calmar,              sub:'Return / max drawdown',         c:calmar>=1?T.green:T.yellow},
              {l:'VaR (95%)',     v:formatCurrency(var95),sub:'Expected worst daily loss',    c:T.red},
              {l:'Kelly %',       v:`${Math.max(0,kelly).toFixed(1)}%`,sub:'Optimal position sizing',c:T.accent},
              {l:'Max Drawdown',  v:`${maxDD}%`,         sub:'Peak-to-trough decline',        c:maxDD>20?T.red:T.yellow},
              {l:'Expectancy',    v:formatCurrency(exp), sub:'Avg dollar per trade',          c:exp>=0?T.green:T.red},
              {l:'Profit Factor', v:pf,                  sub:'Gross profit ÷ gross loss',     c:pf>=1.5?T.green:T.yellow},
            ].map(({l,v,sub,c})=>(
              <div key={l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:'16px 18px'}}>
                <p style={{fontFamily:T.sans,fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{l}</p>
                <p style={{fontFamily:T.mono,fontSize:21,fontWeight:800,color:c,marginBottom:4}}>{v}</p>
                <p style={{fontFamily:T.sans,fontSize:10,color:T.muted}}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Drawdown chart */}
          <Card>
            <SectionLabel>Drawdown Curve</SectionLabel>
            {!CD.equity.length?<Empty/>:(
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={CD.equity}>
                  <defs>
                    <linearGradient id="ddG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.red} stopOpacity={.4}/>
                      <stop offset="100%" stopColor={T.red} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={T.muted+'15'} strokeDasharray="4 4"/>
                  <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                  <Tooltip formatter={v=>[`${v}%`,'Drawdown']}/>
                  <Area type="monotone" dataKey="drawdown" stroke={T.red} strokeWidth={2} fill="url(#ddG)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Top wins / losses */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[
              {title:'Top 5 Wins',   list:[...trades].sort((a,b)=>b.pnl-a.pnl).slice(0,5), color:T.green},
              {title:'Top 5 Losses', list:[...trades].sort((a,b)=>a.pnl-b.pnl).slice(0,5), color:T.red},
            ].map(({title,list,color})=>(
              <Card key={title}>
                <SectionLabel>{title}</SectionLabel>
                {!list.length?<Empty/>:list.map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',
                    background:color+'10',borderRadius:10,marginBottom:8,border:`1px solid ${color}20`}}>
                    <span style={{color:T.muted,fontFamily:T.mono,fontSize:11,width:18}}>#{i+1}</span>
                    <div style={{flex:1}}>
                      <span style={{color:T.text,fontFamily:T.mono,fontSize:13,fontWeight:700}}>{t.symbol}</span>
                      <span style={{color:T.muted,fontFamily:T.sans,fontSize:11,marginLeft:8}}>{dayjs(t.date).format('MMM DD, YYYY')}</span>
                    </div>
                    {t.side&&<Badge color={t.side?.toLowerCase()==='long'?T.green:T.red}>{t.side?.toUpperCase()}</Badge>}
                    <span style={{fontFamily:T.mono,fontSize:14,fontWeight:800,color}}>{formatCurrency(t.pnl)}</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          SYMBOLS
      ════════════════════════════════ */}
      {tab==='symbols'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card>
            <SectionLabel>Net P&L by Symbol</SectionLabel>
            {!CD.symbols.length?<Empty/>:(
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={CD.symbols} barSize={24}>
                  <CartesianGrid stroke={T.muted+'15'} strokeDasharray="4 4"/>
                  <XAxis dataKey="symbol" tick={{fill:T.sub,fontSize:11,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <ReferenceLine y={0} stroke={T.border}/>
                  <Bar dataKey="pnl" radius={[5,5,0,0]}>
                    {CD.symbols.map((e,i)=><Cell key={i} fill={e.pnl>=0?T.green:T.red}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:'hidden'}}>
            <div style={{padding:'14px 22px',borderBottom:`1px solid ${T.border}`}}>
              <SectionLabel>Symbol Breakdown</SectionLabel>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {['Symbol','Trades','Wins','Losses','Win Rate','Net P&L','Avg P&L'].map(h=>(
                    <th key={h} style={{padding:'10px 22px',textAlign:'left',color:T.muted,fontFamily:T.sans,
                      fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CD.symbols.map(({symbol,count,wins,losses,wr:swr,pnl,avg})=>(
                  <tr key={symbol} className="rpt-hover-row" style={{borderBottom:`1px solid ${T.border}`,background:'transparent',transition:'background .15s'}}>
                    <td style={{padding:'13px 22px',fontFamily:T.mono,fontSize:13,fontWeight:800,color:T.text}}>{symbol}</td>
                    <td style={{padding:'13px 22px',fontFamily:T.mono,color:T.sub}}>{count}</td>
                    <td style={{padding:'13px 22px',fontFamily:T.mono,color:T.green}}>{wins}</td>
                    <td style={{padding:'13px 22px',fontFamily:T.mono,color:T.red}}>{losses}</td>
                    <td style={{padding:'13px 22px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:56,height:4,background:T.muted+'40',borderRadius:3,overflow:'hidden'}}>
                          <div style={{width:`${swr}%`,height:'100%',background:swr>=50?T.green:T.red,borderRadius:3}}/>
                        </div>
                        <span style={{fontFamily:T.mono,fontSize:12,color:swr>=50?T.green:T.red}}>{swr}%</span>
                      </div>
                    </td>
                    <td style={{padding:'13px 22px',fontFamily:T.mono,fontSize:13,fontWeight:700,color:pnl>=0?T.green:T.red}}>{formatCurrency(pnl)}</td>
                    <td style={{padding:'13px 22px',fontFamily:T.mono,fontSize:12,color:avg>=0?T.green:T.red}}>{formatCurrency(avg)}</td>
                  </tr>
                ))}
                {!CD.symbols.length&&<tr><td colSpan={7} style={{padding:40,textAlign:'center',color:T.muted,fontSize:13}}>No symbol data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          BEHAVIOR
      ════════════════════════════════ */}
      {tab==='behavior'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card>
            <SectionLabel>Behavioral Patterns Detected</SectionLabel>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {behaviors.map((b,i)=>(
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 18px',
                  background:b.color+'12',border:`1px solid ${b.color}30`,borderRadius:12}}>
                  <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{b.icon}</span>
                  <div>
                    <p style={{fontFamily:T.sans,fontSize:13,fontWeight:700,color:b.color,marginBottom:3}}>{b.label}</p>
                    <p style={{fontFamily:T.sans,fontSize:12,color:T.sub}}>{b.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* DOW avg */}
          <Card>
            <SectionLabel>Average P&L per Trade by Day</SectionLabel>
            {!CD.dow.some(d=>d.avg!==0)?<Empty/>:(
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={CD.dow} barSize={40}>
                    <CartesianGrid stroke={T.muted+'15'} strokeDasharray="4 4"/>
                    <XAxis dataKey="day" tick={{fill:T.sub,fontSize:12,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={v=>[formatCurrency(v),'Avg P&L']}/>
                    <ReferenceLine y={0} stroke={T.border}/>
                    <Bar dataKey="avg" radius={[5,5,0,0]}>
                      {CD.dow.map((e,i)=><Cell key={i} fill={e.avg>=0?T.green:T.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{display:'flex',gap:12,marginTop:16,flexWrap:'wrap'}}>
                  {CD.dow.map(({day,avg,pnl})=>(
                    <div key={day} style={{flex:'1 1 90px',background:T.surface,borderRadius:10,padding:'10px 14px',
                      border:`1px solid ${avg>=0?T.green+'40':T.red+'40'}`}}>
                      <p style={{fontFamily:T.mono,fontSize:14,fontWeight:800,color:avg>=0?T.green:T.red}}>{day}</p>
                      <p style={{fontFamily:T.sans,fontSize:10,color:T.sub,marginTop:3}}>Avg: {formatCurrency(avg)}</p>
                      <p style={{fontFamily:T.sans,fontSize:10,color:T.muted}}>Total: {formatCurrency(pnl)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Streaks */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[{label:'Longest Win Streak',n:bStr,color:T.green,icon:'🔥',desc:'consecutive wins'},{label:'Longest Loss Streak',n:wStr,color:T.red,icon:'❄️',desc:'consecutive losses'}].map(({label,n,color,icon,desc})=>(
              <Card key={label}>
                <SectionLabel>{label}</SectionLabel>
                <div style={{display:'flex',alignItems:'center',gap:20}}>
                  <span style={{fontSize:40}}>{icon}</span>
                  <div>
                    <p style={{fontFamily:T.mono,fontSize:42,fontWeight:900,color,letterSpacing:'-3px',lineHeight:1}}>{n}</p>
                    <p style={{fontFamily:T.sans,fontSize:12,color:T.sub,marginTop:4}}>{desc}</p>
                  </div>
                </div>
                <div style={{display:'flex',gap:5,marginTop:18,flexWrap:'wrap'}}>
                  {Array.from({length:Math.max(n,1)},(_,i)=>(
                    <div key={i} style={{width:26,height:26,borderRadius:7,background:color,
                      opacity:.12+(i/Math.max(n-1,1))*.88,transition:'opacity .3s'}}/>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          AI COACH
      ════════════════════════════════ */}
      {tab==='ai coach'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}}>
              <div>
                <p style={{fontFamily:T.sans,fontSize:17,fontWeight:700,color:T.text,marginBottom:4}}>AI Trading Coach</p>
                <p style={{fontFamily:T.sans,fontSize:12,color:T.sub}}>
                  Powered by Claude · Analyzes your {total} trades to deliver personalized coaching
                </p>
              </div>
              <button onClick={runAI} disabled={aiLoad} style={{
                padding:'11px 24px',fontFamily:T.mono,fontSize:12,fontWeight:700,border:'none',
                borderRadius:10,cursor:aiLoad?'not-allowed':'pointer',transition:'all .2s',letterSpacing:'.04em',
                background:aiLoad?T.muted+'40':T.accent,color:aiLoad?T.muted:T.bg}}>
                {aiLoad?'⟳  Analyzing…':'✦  Analyze My Trading'}
              </button>
            </div>

            {/* Stats snapshot */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,padding:16,
              background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,marginBottom:20}}>
              {[['Trades',total],['Win Rate',`${wr}%`],['P.Factor',pf],['Sharpe',sharpe],
                ['Net P&L',formatCurrency(netPnl)],['R:R',rr],['Max DD',`${maxDD}%`],['Expectancy',formatCurrency(exp)],
              ].map(([l,v])=>(
                <div key={l}>
                  <p style={{fontFamily:T.sans,fontSize:9,color:T.muted,textTransform:'uppercase',letterSpacing:'.08em'}}>{l}</p>
                  <p style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:T.text,marginTop:2}}>{v}</p>
                </div>
              ))}
            </div>

            {aiErr&&<div style={{padding:16,background:T.redDim,border:`1px solid ${T.red}30`,borderRadius:12,color:T.red,fontFamily:T.sans,fontSize:13}}>{aiErr}</div>}

            {aiText&&(
              <div style={{padding:22,background:T.accentDim,border:`1px solid ${T.accent}30`,borderRadius:14}}>
                <p style={{fontFamily:T.sans,fontSize:11,color:T.accent,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:16}}>✦ AI Coaching Report</p>
                <div style={{fontFamily:T.sans,fontSize:13,color:T.text,lineHeight:1.9,whiteSpace:'pre-wrap'}}>
                  {aiText.split(/\*\*(.+?)\*\*/g).map((p,i)=>
                    i%2===1?<strong key={i} style={{color:T.accent,fontWeight:700}}>{p}</strong>:p
                  )}
                </div>
              </div>
            )}

            {!aiLoad&&!aiText&&(
              <div style={{padding:48,textAlign:'center',border:`1px dashed ${T.border}`,borderRadius:14}}>
                <p style={{fontSize:32,marginBottom:12}}>🧠</p>
                <p style={{fontFamily:T.sans,color:T.sub,fontSize:15,fontWeight:600}}>Ready to coach you</p>
                <p style={{fontFamily:T.sans,color:T.muted,fontSize:12,marginTop:6}}>Click "Analyze My Trading" for personalized Claude-powered insights</p>
              </div>
            )}

            {aiLoad&&(
              <div style={{padding:48,textAlign:'center'}}>
                <div style={{width:38,height:38,border:`3px solid ${T.border}`,borderTopColor:T.accent,
                  borderRadius:'50%',margin:'0 auto 14px',animation:'rptSpin .8s linear infinite'}}/>
                <p style={{fontFamily:T.sans,color:T.sub,fontSize:13}}>Claude is analyzing your trading patterns…</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════
          TRADE LOG (always visible)
      ════════════════════════════════ */}
      <div style={{marginTop:24,background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:'hidden'}}>
        <div style={{padding:'14px 22px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <SectionLabel>Trade Log</SectionLabel>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input value={logSym} onChange={e=>setLogSym(e.target.value)} placeholder="Filter symbol…"
              style={{padding:'6px 12px',fontFamily:T.mono,fontSize:11,background:T.surface,
                border:`1px solid ${T.border}`,borderRadius:8,color:T.text,outline:'none',width:130}}/>
            {['all','winners','losers'].map(f=>(
              <button key={f} onClick={()=>setLogFilter(f)} style={{
                padding:'6px 12px',fontSize:10,fontFamily:T.mono,fontWeight:700,cursor:'pointer',
                textTransform:'uppercase',letterSpacing:'.06em',transition:'all .15s',
                background:logFilter===f?T.accent:T.surface,
                color:logFilter===f?T.bg:T.muted,
                border:`1px solid ${logFilter===f?T.accent:T.border}`,borderRadius:8}}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.mono,fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.border}`}}>
                {[['date','Date'],['symbol','Symbol'],['side','Side'],['pnl','P&L']].map(([k,h])=>(
                  <th key={k} onClick={()=>sortBy(k)} style={{padding:'10px 22px',textAlign:'left',cursor:'pointer',userSelect:'none',
                    color:logSort.key===k?T.accent:T.muted,fontFamily:T.sans,fontWeight:700,fontSize:10,
                    textTransform:'uppercase',letterSpacing:'.08em'}}>
                    {h} {sortArrow(k)}
                  </th>
                ))}
                <th style={{padding:'10px 22px',textAlign:'left',color:T.muted,fontFamily:T.sans,fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:'.08em'}}>Running P&L</th>
              </tr>
            </thead>
            <tbody>
              {(()=>{
                let run=0;
                return logTrades.slice(0,50).map((t,i)=>{
                  run+=t.pnl;
                  return (
                    <tr key={i} className="rpt-hover-row" style={{borderBottom:`1px solid ${T.border}22`,background:'transparent',transition:'background .1s'}}>
                      <td style={{padding:'10px 22px',color:T.sub}}>{dayjs(t.date).format('MMM DD, YYYY')}</td>
                      <td style={{padding:'10px 22px',color:T.text,fontWeight:700}}>{t.symbol}</td>
                      <td style={{padding:'10px 22px'}}>
                        {t.side?<Badge color={t.side?.toLowerCase()==='long'?T.green:T.red}>{t.side?.toUpperCase()}</Badge>
                          :<span style={{color:T.muted}}>—</span>}
                      </td>
                      <td style={{padding:'10px 22px',fontWeight:800,color:t.pnl>=0?T.green:T.red}}>{formatCurrency(t.pnl)}</td>
                      <td style={{padding:'10px 22px',color:run>=0?T.green:T.red}}>{formatCurrency(fix2(run))}</td>
                    </tr>
                  );
                });
              })()}
              {!logTrades.length&&<tr><td colSpan={5} style={{padding:32,textAlign:'center',color:T.muted,fontFamily:T.sans,fontSize:13}}>No trades match filters</td></tr>}
            </tbody>
          </table>
          {logTrades.length>50&&<p style={{padding:'10px 22px',fontFamily:T.sans,fontSize:11,color:T.muted}}>Showing first 50 of {logTrades.length} trades</p>}
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{marginTop:28,paddingTop:16,borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontFamily:T.mono,color:T.muted,fontSize:10}}>
          {total} trades · Gross profit {formatCurrency(gProfit)} · Gross loss {formatCurrency(gLoss)}
        </span>
        <span style={{fontFamily:T.mono,color:T.muted,fontSize:10}}>
          Last trade: {S.sorted.length?dayjs(S.sorted[S.sorted.length-1].date).format('MMM DD, YYYY'):'—'}
        </span>
      </div>

    </div>
  );
};

export default Reports;