const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title:         { type: String, default: '' },        // removed required:true so empty-title drafts work
  content:       { type: String, default: '' },
  folder: {
    type: String,
    enum: ['trade_notes', 'session_recap', 'pre_market'],
    default: 'trade_notes',
  },
  tags:            [{ type: String }],
  linkedTradeIds:  [{ type: String }],                 // trade _id strings linked to this note
  sessionDate:     { type: String, default: '' },      // 'YYYY-MM-DD' for session recaps
  netPnl:          { type: Number, default: 0 },
  images:          [{ type: String }],
  template:        { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);