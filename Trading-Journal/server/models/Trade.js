const mongoose = require('mongoose');

const SESSIONS = ['New York', 'Tokyo', 'London', 'Sydney', 'Indian'];

const TradeSchema = new mongoose.Schema({
  symbol:      { type: String, required: true },
  tradeType:   { type: String, enum: ['crypto','forex','stocks','futures','indices','commodities'], default: 'futures' },
  date:        { type: Date, default: Date.now },

  // Non-option markets: Long / Short. Options are always bought first, so side stays 'Long'
  // and the real direction (Call / Put) lives in optionType.
  side:        { type: String, enum: ['Long','Short'], required: true },
  optionType:  { type: String, enum: ['Call','Put',null], default: null },

  entryPrice:  { type: Number, required: true },
  sl:          { type: Number, default: null },
  tp:          { type: Number, default: null },
  rr:          { type: Number, default: null },
  exitPrice:   { type: Number, default: null },

  // Options sizing + costs (null for other markets)
  lots:        { type: Number, default: null },
  lotSize:     { type: Number, default: null },
  quantity:    { type: Number, default: null },
  grossPnl:    { type: Number, default: null },
  charges:     { type: Number, default: null },

  timeframe:   { type: String, default: null },
  session:     { type: String, enum: [...SESSIONS, null], default: null },
  strategy:    { type: String, default: null },
  outcome:     { type: String, enum: ['Win','Loss','Breakeven',null], default: null },

  // Discipline
  followedRules: { type: Boolean, default: null },
  mistakes:      [{ type: String }],

  riskAmount:  { type: Number, default: null },
  pnl:         { type: Number, default: null },
  tags:        [{ type: String }],
  notes:       { type: String, default: null },
  screenshot:  { type: String, default: null }, // kept for backward compat
  images: [{
    id:      { type: String },
    src:     { type: String },
    name:    { type: String },
    addedAt: { type: String },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Trade', TradeSchema);