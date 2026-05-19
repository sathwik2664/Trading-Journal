const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  date: { type: Date, required: true },
  side: { type: String, enum: ['Long', 'Short'], required: true },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number, required: true },
  contracts: { type: Number, required: true },
  pnl: { type: Number, required: true },
  grossPnl: { type: Number },
  commissions: { type: Number, default: 0 },
  volume: { type: Number },
  netRoi: { type: Number },
  rMultiple: { type: Number },
  initialRisk: { type: Number },
  notes: { type: String },
  tags: [{ type: String }],
  images: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Trade', TradeSchema);