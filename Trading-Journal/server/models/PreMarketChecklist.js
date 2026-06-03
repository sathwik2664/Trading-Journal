const mongoose = require('mongoose');

const CheckItemSchema = new mongoose.Schema({
  label:   { type: String, required: true },
  checked: { type: Boolean, default: false },
}, { _id: false });

const WatchItemSchema = new mongoose.Schema({
  symbol:    { type: String, default: '' },
  direction: { type: String, enum: ['Long','Short','Watching','Skip',''], default: 'Watching' },
  keyLevels: { type: String, default: '' },
  notes:     { type: String, default: '' },
  bias:      { type: String, default: '' },
  rrTarget:  { type: String, default: '' },  // R:R target e.g. "1:3"
  entryZone: { type: String, default: '' },
  stopZone:  { type: String, default: '' },
  timeframe: { type: String, default: '' },  // HTF confirmation TF
  grade:     { type: String, enum: ['A+','A','B','C','Watch',''], default: '' },
  result:    { type: String, enum: ['Win','Loss','BE','Skipped','Pending',''], default: 'Pending' },
}, { _id: false });

const PreMarketChecklistSchema = new mongoose.Schema(
  {
    date: {
      type:     String,
      required: true,
      unique:   true,
      match:    /^\d{4}-\d{2}-\d{2}$/,
    },

    // ── Trader State ──────────────────────────────────────────────────────
    emotion: {
      type:    String,
      enum:    ['Calm','Focused','Confident','Anxious','Excited','FOMO','Greedy','Tilted','Distracted','Revenge','Neutral','Tired','Sharp',''],
      default: '',
    },
    emotionIntensity: { type: Number, min: 1, max: 5, default: 3 },   // how strong the emotion is
    sleepQuality:     { type: Number, min: 0, max: 5,  default: 0 },
    sleepHours:       { type: Number, min: 0, max: 12, default: 0 },   // actual hours slept
    mentalReadiness:  { type: Number, min: 1, max: 10, default: 5 },
    physicalState:    { type: String, enum: ['Great','Good','Tired','Sick','Stressed',''], default: '' },
    readyToTrade:     { type: String, enum: ['Yes','Maybe','No', ''], default: '' },
    sessionMode: {
      type:    String,
      enum:    ['Full Send','Selective','Observe','Sit Out',''],
      default: '',
    },
    mindsetNotes:   { type: String, default: '' },
    morningRoutine: { type: Boolean, default: false }, // did morning routine?
    caffeineStatus: { type: String, enum: ['None','Coffee','Tea','Energy Drink',''], default: '' },
    lastSessionNote: { type: String, default: '' },    // carry-forward note from yesterday

    // ── Market Context ────────────────────────────────────────────────────
    marketBias:      { type: String, enum: ['Bullish','Bearish','Neutral',''],          default: '' },
    marketCondition: { type: String, enum: ['Trending','Ranging','Volatile','Choppy',''], default: '' },
    volatility:      { type: String, enum: ['Low','Medium','High',''],                  default: '' },
    session: {
      type:    String,
      enum:    ['Pre-market','London','New York','Asian','All Day',''],
      default: '',
    },
    keyNews:       { type: String, default: '' },
    marketNotes:   { type: String, default: '' },
    vixLevel:      { type: String, default: '' },   // VIX or volatility index reading
    dxyBias:       { type: String, enum: ['Strong','Weak','Neutral',''], default: '' },  // Dollar strength
    dominantPairs: { type: String, default: '' },   // pairs with the clearest setups

    // ── Risk Budget ───────────────────────────────────────────────────────
    accountSize:   { type: String, default: '' },
    riskPerTrade:  { type: String, default: '' },
    maxDailyLoss:  { type: String, default: '' },
    maxDailyProfit:{ type: String, default: '' },  // target profit cap before reviewing
    stopTradingIf: { type: String, default: '' },
    trailRulesIf:  { type: String, default: '' },  // e.g. "if up $300, tighten to B/E"
    maxTradesPerSession: { type: String, default: '' },
    currentBalance: { type: String, default: '' }, // optional live balance field

    // ── Market Checks ─────────────────────────────────────────────────────
    marketChecks: {
      type:    [CheckItemSchema],
      default: [
        { label: 'Checked pre-market news & economic events',      checked: false },
        { label: 'Key support/resistance levels marked on chart',  checked: false },
        { label: 'Overall market bias clearly identified',         checked: false },
        { label: 'Correlated assets/pairs reviewed',              checked: false },
        { label: 'Liquidity & session open conditions noted',      checked: false },
        { label: 'HTF (Daily/H4) trend confirmed',                checked: false },
        { label: 'Open gaps or unfilled FVGs noted',              checked: false },
        { label: 'Session kill zones mapped (London/NY open)',    checked: false },
      ],
    },

    // ── Watchlist ──────────────────────────────────────────────────────────
    watchlist: { type: [WatchItemSchema], default: [] },

    // ── Pre-Trade Rules ────────────────────────────────────────────────────
    strategyRules: {
      type:    [CheckItemSchema],
      default: [
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
    },
    customRules: { type: [String], default: [] },

    // ── Session Plan ───────────────────────────────────────────────────────
    sessionGoals:   { type: String, default: '' },
    avoidToday:     { type: String, default: '' },
    affirmation:    { type: String, default: '' },
    dailyMantra:    { type: String, default: '' },    // persistent short mantra
    focusPairs:     { type: String, default: '' },    // primary pairs/assets focus
    exitStrategy:   { type: String, default: '' },    // when/how to close the session

    // ── Post-session (filled after trading) ───────────────────────────────
    sessionRating:     { type: Number, min: 1, max: 5, default: 0 },  // how did session go
    rulesFollowed:     { type: Number, min: 0, max: 10, default: 0 }, // rules adherence score
    actualPnl:         { type: String, default: '' },
    tradesCount:       { type: Number, default: 0 },
    sessionReview:     { type: String, default: '' },  // post-session notes
    lessonLearned:     { type: String, default: '' },  // key takeaway
    tomorrowFocus:     { type: String, default: '' },  // note carried to tomorrow

    // ── Meta ──────────────────────────────────────────────────────────────
    completionPct:      { type: Number, min: 0, max: 100, default: 0 },
    readinesScore:      { type: Number, min: 0, max: 100, default: 0 }, // composite readiness
    tags:               { type: [String], default: [] },  // custom tags for filtering
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Auto-compute completionPct & readinessScore before every save ─────────────
PreMarketChecklistSchema.pre('save', function (next) {
  const d = this;

  // Completion — every meaningful field
  const completionItems = [
    d.emotion             !== '',
    d.sleepQuality         > 0,
    d.mentalReadiness      > 0,
    d.readyToTrade        !== '' && d.readyToTrade !== null,
    d.sessionMode         !== '',
    d.marketBias          !== '',
    d.marketCondition     !== '',
    d.volatility          !== '',
    (d.accountSize  || '').trim() !== '',
    (d.riskPerTrade || '').trim() !== '',
    (d.maxDailyLoss || '').trim() !== '',
    (d.stopTradingIf|| '').trim() !== '',
    ...d.marketChecks.map(c  => c.checked),
    ...d.strategyRules.map(r => r.checked),
    (d.watchlist || []).length > 0,
    (d.sessionGoals|| '').trim() !== '',
    (d.avoidToday  || '').trim() !== '',
  ];
  const done  = completionItems.filter(Boolean).length;
  d.completionPct = completionItems.length > 0
    ? Math.round((done / completionItems.length) * 100)
    : 0;

  // Readiness score — weighted composite
  const dangerEmotions = ['FOMO','Greedy','Tilted','Revenge','Anxious'];
  const isDangerous    = dangerEmotions.includes(d.emotion);
  const mentalScore    = d.mentalReadiness * 5;        // 0–50
  const sleepScore     = d.sleepQuality * 6;           // 0–30
  const penaltyDanger  = isDangerous ? -20 : 0;
  const penaltyNoReady = d.readyToTrade === 'No' ? -30 : d.readyToTrade === 'Maybe' ? -10 : 0;
  d.readinesScore = Math.max(0, Math.min(100,
    mentalScore + sleepScore + penaltyDanger + penaltyNoReady
  ));

  next();
});

// ── Virtual: dayOfWeek ─────────────────────────────────────────────────────────
PreMarketChecklistSchema.virtual('dayOfWeek').get(function () {
  return new Date(this.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
});

// ── Indexes ────────────────────────────────────────────────────────────────────
PreMarketChecklistSchema.index({ date: -1 });
PreMarketChecklistSchema.index({ emotion: 1 });
PreMarketChecklistSchema.index({ readyToTrade: 1 });
PreMarketChecklistSchema.index({ completionPct: -1 });

module.exports = mongoose.model('PreMarketChecklist', PreMarketChecklistSchema);