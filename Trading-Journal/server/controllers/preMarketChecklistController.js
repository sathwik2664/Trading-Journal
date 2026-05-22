const PreMarketChecklist = require('../models/PreMarketChecklist');

const toDateString = () => new Date().toISOString().split('T')[0];

// GET /api/checklist?date=YYYY-MM-DD
exports.getChecklist = async (req, res) => {
  try {
    const date      = req.query.date || toDateString();
    const checklist = await PreMarketChecklist.findOne({ date });

    if (!checklist) {
      const shell = new PreMarketChecklist({ date });
      return res.json({ exists: false, ...shell.toObject() });
    }

    res.json({ exists: true, ...checklist.toObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/checklist  (upsert)
exports.saveChecklist = async (req, res) => {
  try {
    const date = req.body.date || toDateString();
    const { _id, __v, createdAt, updatedAt, ...payload } = req.body;

    const checklist = await PreMarketChecklist.findOneAndUpdate(
      { date },
      { $set: { ...payload, date } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ exists: true, ...checklist.toObject() });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Checklist for this date already exists.' });
    res.status(400).json({ message: err.message });
  }
};

// GET /api/checklist/history?limit=30&skip=0
exports.getHistory = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const skip  = parseInt(req.query.skip) || 0;

    const [checklists, total] = await Promise.all([
      PreMarketChecklist.find()
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('date emotion marketBias volatility readyToTrade completionPct mentalReadiness sleepQuality updatedAt'),
      PreMarketChecklist.countDocuments(),
    ]);

    res.json({ total, skip, limit, checklists });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/checklist/stats
exports.getStats = async (req, res) => {
  try {
    const [aggregate] = await PreMarketChecklist.aggregate([
      {
        $group: {
          _id:                null,
          totalSessions:      { $sum: 1 },
          avgCompletion:      { $avg: '$completionPct' },
          avgMentalReadiness: { $avg: '$mentalReadiness' },
          avgSleepQuality:    { $avg: '$sleepQuality' },
          readyCount:         { $sum: { $cond: [{ $eq: ['$readyToTrade', 'Yes'] }, 1, 0] } },
          notReadyCount:      { $sum: { $cond: [{ $eq: ['$readyToTrade', 'No']  }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalSessions:      1,
          avgCompletion:      { $round: ['$avgCompletion',      1] },
          avgMentalReadiness: { $round: ['$avgMentalReadiness', 1] },
          avgSleepQuality:    { $round: ['$avgSleepQuality',    1] },
          readyCount:         1,
          notReadyCount:      1,
        },
      },
    ]);

    const emotionAgg = await PreMarketChecklist.aggregate([
      { $match: { emotion: { $ne: '' } } },
      { $group: { _id: '$emotion', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 1 },
    ]);

    res.json({ ...(aggregate || {}), topEmotion: emotionAgg[0]?._id || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/checklist/:date
exports.deleteChecklist = async (req, res) => {
  try {
    const result = await PreMarketChecklist.findOneAndDelete({ date: req.params.date });
    if (!result) return res.status(404).json({ message: 'No checklist found for that date.' });
    res.json({ message: 'Checklist deleted.', date: req.params.date });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};