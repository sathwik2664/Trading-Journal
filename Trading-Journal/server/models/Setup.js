const mongoose = require('mongoose');

const SetupSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  rules:           [{ type: String }],
  tags:            [{ type: String }],
  timeframes:      [{ type: String }],
  marketCondition: { type: String, enum: ['Any', 'Trending', 'Ranging', 'Volatile'], default: 'Any' },
  notes:           { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Setup', SetupSchema);