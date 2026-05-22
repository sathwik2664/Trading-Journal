const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  symbol:      { type: String, required: true },
  tradeType:   { type: String, enum: ['crypto','forex','stocks','futures','indices','commodities'], default: 'futures' },
  date:        { type: Date, default: Date.now },
  side:        { type: String, enum: ['Long','Short'], required: true },
  entryPrice:  { type: Number, required: true },
  sl:          { type: Number, default: null },
  tp:          { type: Number, default: null },
  rr:          { type: Number, default: null },
  timeframe:   { type: String, default: null },
  strategy:    { type: String, default: null },
  outcome:     { type: String, enum: ['Win','Loss','Breakeven',null], default: null },
  riskAmount:  { type: Number, default: null },
  pnl:         { type: Number, default: null },
  tags:        [{ type: String }],
  notes:       { type: String, default: null },
  screenshot:  { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Trade', TradeSchema);