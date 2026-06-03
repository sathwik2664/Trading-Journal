const Trade = require('../models/Trade');

exports.getAllTrades = async (req, res) => {
  try {
    // ✅ CHANGED: was .select('-screenshot'), now also excludes src from images
    // to keep list view fast — only metadata, not base64 blobs
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
    const trade = new Trade(req.body);
    const saved = await trade.save();
    // ✅ CHANGED: was deleting screenshot and returning partial object.
    // Now returns full saved doc including images array
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTrade = async (req, res) => {
  try {
    // ✅ CHANGED: was .select('-screenshot') which also stripped images.
    // Now returns full doc so images persist correctly after update
    const updated = await Trade.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },   // ✅ CHANGED: was req.body directly, $set allows partial updates
      { new: true }
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

// Separate endpoint to get screenshot only when needed (unchanged)
exports.getTradeScreenshot = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id).select('screenshot');
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json({ screenshot: trade.screenshot });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW: dedicated endpoint to get full images for a trade (with base64 src)
exports.getTradeImages = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id).select('images');
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json({ images: trade.images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};