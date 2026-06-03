const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type:        { type: String, enum: ['deposit', 'withdrawal', 'trade_pnl'], required: true },
  amount:      { type: Number, required: true }, // positive = money in, negative = money out
  description: { type: String, default: '' },
  tradeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', default: null },
  date:        { type: Date, default: Date.now },
}, { timestamps: true });

const AccountSchema = new mongoose.Schema({
  name:            { type: String, default: 'Trader' },
  initials:        { type: String, default: 'T' },
  email:           { type: String, default: '' },
  accountType:     { type: String, default: 'Personal' },
  broker:          { type: String, default: 'TD Ameritrade' },
  currency:        { type: String, default: 'USD' },
  startingBalance: { type: Number, default: 32000 },
  currentBalance:  { type: Number, default: 32000 },
  riskPerTrade:    { type: Number, default: 1 },
  maxDailyLoss:    { type: Number, default: 3 },
  targetProfit:    { type: Number, default: 5 },
  timezone:        { type: String, default: 'America/New_York' },
  notifications: {
    tradeAlerts:  { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: false },
    milestones:   { type: Boolean, default: true },
  },
  theme:       { type: String, default: 'dark' },
  avatarColor: { type: String, default: '#7c3aed' },
  transactions: [TransactionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Account', AccountSchema);