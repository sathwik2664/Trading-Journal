const Trade = require('../models/Trade');

const VALID_SESSIONS = ['New York', 'Tokyo', 'London', 'Sydney', 'Indian'];

// Normalize incoming session value: trim whitespace, treat '' / undefined as null,
// and reject anything that isn't one of the known session names.
const normalizeSession = (val) => {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  if (!trimmed) return null;
  return VALID_SESSIONS.includes(trimmed) ? trimmed : null;
};

exports.getAllTrades = async (req, res) => {
  try {
    const trades = await Trade.find()
      .select('-screenshot -images.src')
      .sort({ date: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTradeById = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json(trade);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTrade = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      session: normalizeSession(req.body.session),
    };
    const trade = new Trade(payload);
    const saved = await trade.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTrade = async (req, res) => {
  try {
    const payload = { ...req.body };
    if ('session' in payload) {
      payload.session = normalizeSession(payload.session);
    }
    const updated = await Trade.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true } // ← runValidators added so enum errors surface clearly instead of silently
    );
    if (!updated) return res.status(404).json({ message: 'Trade not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    await Trade.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trade deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTradeScreenshot = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id).select('screenshot');
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json({ screenshot: trade.screenshot });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTradeImages = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id).select('images');
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json({ images: trade.images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};