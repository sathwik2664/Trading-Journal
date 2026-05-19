const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  folder: { 
    type: String, 
    enum: [
      'Trade Notes',
      'Daily Journal', 
      'Sessions Recap',
      'Quarterly Goals',
      'Trading Plan',
      'Plan of Action',
      'Templates'
    ],
    default: 'Trade Notes'
  },
  tags: [{ type: String }],
  netPnl: { type: Number, default: 0 },
  tradeDate: { type: Date },
  images: [{ type: String }],
  template: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);