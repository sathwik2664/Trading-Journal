const mongoose = require('mongoose');

const CheckItemSchema = new mongoose.Schema({
  label:   { type: String, required: true },
  checked: { type: Boolean, default: false },
}, { _id: false });

const PreMarketChecklistSchema = new mongoose.Schema(
  {
    date: {
      type:     String,
      required: true,
      unique:   true,
      match:    /^\d{4}-\d{2}-\d{2}$/,
    },
    emotion: {
      type:    String,
      enum:    ['Calm','Focused','Confident','Anxious','Excited','FOMO','Greedy','Tilted','Distracted','Revenge',''],
      default: '',
    },
    sleepQuality:    { type: Number, min: 0, max: 5,  default: 0 },
    mentalReadiness: { type: Number, min: 1, max: 10, default: 5 },
    readyToTrade:    { type: String, enum: ['Yes','Maybe','No', null], default: null },
    marketBias:      { type: String, enum: ['Bullish','Bearish','Neutral',''], default: '' },
    volatility:      { type: String, enum: ['Low','Medium','High',''],         default: '' },
    session: {
      type:    String,
      enum:    ['Pre-market','London','New York','Asian','All Day',''],
      default: '',
    },
    marketChecks: {
      type:    [CheckItemSchema],
      default: [
        { label: 'Checked pre-market news & economic events',     checked: false },
        { label: 'Key support/resistance levels marked on chart', checked: false },
        { label: 'Overall market bias clearly identified',        checked: false },
        { label: 'Correlated assets/pairs reviewed',             checked: false },
        { label: 'Liquidity & session open conditions noted',     checked: false },
      ],
    },
    accountSize:  { type: String, default: '' },
    maxDailyLoss: { type: String, default: '' },
    maxTrades:    { type: String, default: '' },
    riskPerTrade: { type: String, default: '' },
    strategyRules: {
      type:    [CheckItemSchema],
      default: [
        { label: 'Setup aligns with higher timeframe trend',    checked: false },
        { label: 'Entry is at a key level (S/R, zone, wick)',   checked: false },
        { label: 'Risk:Reward is minimum 1:2',                  checked: false },
        { label: 'Stop loss is at a logical structure point',   checked: false },
        { label: 'No conflicting news within session window',   checked: false },
        { label: 'Volume or momentum confirms direction',       checked: false },
        { label: 'Within my max trade count for the day',       checked: false },
        { label: 'Not entering out of boredom or revenge',      checked: false },
      ],
    },
    watchlist:     { type: String, default: '' },
    sessionGoals:  { type: String, default: '' },
    completionPct: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Auto-compute completionPct before every save
PreMarketChecklistSchema.pre('save', function (next) {
  const d     = this;
  const items = [
    d.emotion         !== '',
    d.sleepQuality     > 0,
    d.readyToTrade    !== null,
    d.marketBias      !== '',
    d.volatility      !== '',
    ...d.marketChecks.map(c  => c.checked),
    d.maxDailyLoss    !== '',
    d.maxTrades       !== '',
    d.riskPerTrade    !== '',
    ...d.strategyRules.map(r => r.checked),
    (d.sessionGoals || '').trim() !== '',
  ];
  const done = items.filter(Boolean).length;
  d.completionPct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
  next();
});

module.exports = mongoose.model('PreMarketChecklist', PreMarketChecklistSchema);