const Trade = require('../models/Trade');

exports.getAllTrades = async (req, res) => {
  try {
    // Exclude screenshot from list view for performance
    const trades = await Trade.find()
      .select('-screenshot')
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
    const trade = new Trade(req.body);
    const saved = await trade.save();
    // Return without screenshot for response speed
    const response = saved.toObject();
    delete response.screenshot;
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTrade = async (req, res) => {
  try {
    const updated = await Trade.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    ).select('-screenshot');
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

// Separate endpoint to get screenshot only when needed
exports.getTradeScreenshot = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id).select('screenshot');
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json({ screenshot: trade.screenshot });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};