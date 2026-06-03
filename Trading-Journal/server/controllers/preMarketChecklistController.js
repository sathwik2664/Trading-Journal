const PreMarketChecklist = require('../models/PreMarketChecklist');

const toDateString = () => new Date().toISOString().split('T')[0];

// ── GET /api/checklist?date=YYYY-MM-DD ────────────────────────────────────────
exports.getChecklist = async (req, res) => {
  try {
    const date      = req.query.date || toDateString();
    const checklist = await PreMarketChecklist.findOne({ date });

    if (!checklist) {
      // Pull yesterday's tomorrowFocus as carry-forward note
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().split('T')[0];
      const prev  = await PreMarketChecklist.findOne({ date: yDate }).select('tomorrowFocus dailyMantra sessionRating');

      const shell = new PreMarketChecklist({ date });
      const obj   = shell.toObject();

      // Carry forward mantra & yesterday's note
      if (prev?.dailyMantra)   obj.dailyMantra    = prev.dailyMantra;
      if (prev?.tomorrowFocus) obj.lastSessionNote = prev.tomorrowFocus;
      if (prev?.sessionRating) obj.yesterdayRating = prev.sessionRating;

      return res.json({ exists: false, ...obj });
    }

    res.json({ exists: true, ...checklist.toObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/checklist  (upsert) ─────────────────────────────────────────────
exports.saveChecklist = async (req, res) => {
  try {
    const date = req.body.date || toDateString();
    const { _id, __v, createdAt, updatedAt, exists, yesterdayRating, ...payload } = req.body;

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

// ── GET /api/checklist/history?limit=30&skip=0 ────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const skip  = parseInt(req.query.skip) || 0;
    const tag   = req.query.tag;   // optional tag filter
    const bias  = req.query.bias;  // optional marketBias filter
    const ready = req.query.ready; // optional readyToTrade filter

    const query = {};
    if (tag)   query.tags        = tag;
    if (bias)  query.marketBias  = bias;
    if (ready) query.readyToTrade = ready;

    const [checklists, total] = await Promise.all([
      PreMarketChecklist.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('date emotion emotionIntensity marketBias volatility readyToTrade sessionMode completionPct readinesScore mentalReadiness sleepQuality sessionRating actualPnl tradesCount tags updatedAt'),
      PreMarketChecklist.countDocuments(query),
    ]);

    res.json({ total, skip, limit, checklists });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/checklist/stats ──────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [aggregate] = await PreMarketChecklist.aggregate([
      {
        $group: {
          _id:                  null,
          totalSessions:        { $sum: 1 },
          avgCompletion:        { $avg: '$completionPct'   },
          avgMentalReadiness:   { $avg: '$mentalReadiness' },
          avgSleepQuality:      { $avg: '$sleepQuality'    },
          avgSleepHours:        { $avg: '$sleepHours'      },
          avgReadiness:         { $avg: '$readinesScore'   },
          avgSessionRating:     { $avg: '$sessionRating'   },
          avgRulesFollowed:     { $avg: '$rulesFollowed'   },
          readyCount:           { $sum: { $cond: [{ $eq: ['$readyToTrade', 'Yes']   }, 1, 0] } },
          maybeCount:           { $sum: { $cond: [{ $eq: ['$readyToTrade', 'Maybe'] }, 1, 0] } },
          notReadyCount:        { $sum: { $cond: [{ $eq: ['$readyToTrade', 'No']    }, 1, 0] } },
          bullishCount:         { $sum: { $cond: [{ $eq: ['$marketBias', 'Bullish'] }, 1, 0] } },
          bearishCount:         { $sum: { $cond: [{ $eq: ['$marketBias', 'Bearish'] }, 1, 0] } },
          totalTrades:          { $sum: '$tradesCount' },
          fullSendCount:        { $sum: { $cond: [{ $eq: ['$sessionMode', 'Full Send'] }, 1, 0] } },
          sitOutCount:          { $sum: { $cond: [{ $eq: ['$sessionMode', 'Sit Out']   }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalSessions:      1,
          avgCompletion:      { $round: ['$avgCompletion',      1] },
          avgMentalReadiness: { $round: ['$avgMentalReadiness', 1] },
          avgSleepQuality:    { $round: ['$avgSleepQuality',    1] },
          avgSleepHours:      { $round: ['$avgSleepHours',      1] },
          avgReadiness:       { $round: ['$avgReadiness',       1] },
          avgSessionRating:   { $round: ['$avgSessionRating',   1] },
          avgRulesFollowed:   { $round: ['$avgRulesFollowed',   1] },
          readyCount:         1,
          maybeCount:         1,
          notReadyCount:      1,
          bullishCount:       1,
          bearishCount:       1,
          totalTrades:        1,
          fullSendCount:      1,
          sitOutCount:        1,
        },
      },
    ]);

    // Top emotion
    const emotionAgg = await PreMarketChecklist.aggregate([
      { $match: { emotion: { $ne: '' } } },
      { $group: { _id: '$emotion', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 5 },
    ]);

    // Consistency streak (consecutive days with completionPct >= 70)
    const recentDocs = await PreMarketChecklist
      .find({})
      .sort({ date: -1 })
      .limit(60)
      .select('date completionPct readyToTrade');

    let streak = 0;
    let longestStreak = 0;
    let current = 0;
    for (const doc of recentDocs) {
      if (doc.completionPct >= 70) {
        current++;
        if (streak === 0) streak = current; // streak from most recent
      } else {
        if (streak === 0 && current > 0) streak = 0; // broke before we set it
        longestStreak = Math.max(longestStreak, current);
        current = 0;
      }
    }
    longestStreak = Math.max(longestStreak, current, streak);

    // Last 7 days readiness trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekKey = sevenDaysAgo.toISOString().split('T')[0];

    const weekDocs = await PreMarketChecklist
      .find({ date: { $gte: weekKey } })
      .sort({ date: 1 })
      .select('date readinesScore completionPct sessionRating emotion sessionMode');

    res.json({
      ...(aggregate || {}),
      topEmotions:   emotionAgg.map(e => ({ emotion: e._id, count: e.count })),
      topEmotion:    emotionAgg[0]?._id || null,
      streak,
      longestStreak,
      weekTrend:     weekDocs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/checklist/insights ───────────────────────────────────────────────
// AI-like pattern insights from historical data
exports.getInsights = async (req, res) => {
  try {
    // Best trading days by day of week
    const dayOfWeekAgg = await PreMarketChecklist.aggregate([
      { $match: { sessionRating: { $gt: 0 } } },
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: { $dateFromString: { dateString: '$date' } } },
        },
      },
      {
        $group: {
          _id:            '$dayOfWeek',
          avgRating:      { $avg: '$sessionRating'   },
          avgReadiness:   { $avg: '$readinesScore'   },
          avgCompletion:  { $avg: '$completionPct'   },
          count:          { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
    ]);

    const DOW = ['','Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dayInsights = dayOfWeekAgg.map(d => ({
      day:          DOW[d._id] || 'Unknown',
      avgRating:    Math.round(d.avgRating * 10) / 10,
      avgReadiness: Math.round(d.avgReadiness),
      count:        d.count,
    }));

    // Emotion vs session rating correlation
    const emotionPerf = await PreMarketChecklist.aggregate([
      { $match: { emotion: { $ne: '' }, sessionRating: { $gt: 0 } } },
      {
        $group: {
          _id:       '$emotion',
          avgRating: { $avg: '$sessionRating' },
          count:     { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
    ]);

    // Sleep vs readiness correlation (binned)
    const sleepReadiness = await PreMarketChecklist.aggregate([
      { $match: { sleepQuality: { $gt: 0 } } },
      {
        $group: {
          _id:          '$sleepQuality',
          avgReadiness: { $avg: '$readinesScore' },
          avgCompletion:{ $avg: '$completionPct' },
          count:        { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Session mode effectiveness
    const modePerf = await PreMarketChecklist.aggregate([
      { $match: { sessionMode: { $ne: '' }, sessionRating: { $gt: 0 } } },
      {
        $group: {
          _id:       '$sessionMode',
          avgRating: { $avg: '$sessionRating' },
          count:     { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
    ]);

    // Rules adherence vs session rating
    const [rulesCorr] = await PreMarketChecklist.aggregate([
      { $match: { rulesFollowed: { $gt: 0 }, sessionRating: { $gt: 0 } } },
      {
        $group: {
          _id:          null,
          avgRating_highRules: {
            $avg: {
              $cond: [{ $gte: ['$rulesFollowed', 8] }, '$sessionRating', null],
            },
          },
          avgRating_lowRules: {
            $avg: {
              $cond: [{ $lt: ['$rulesFollowed', 5] }, '$sessionRating', null],
            },
          },
        },
      },
    ]);

    res.json({
      dayOfWeek:     dayInsights,
      emotionPerf:   emotionPerf.map(e => ({
        emotion:   e._id,
        avgRating: Math.round(e.avgRating * 10) / 10,
        count:     e.count,
      })),
      sleepReadiness: sleepReadiness.map(s => ({
        sleep:        s._id,
        avgReadiness: Math.round(s.avgReadiness),
        avgCompletion:Math.round(s.avgCompletion),
        count:        s.count,
      })),
      modePerf: modePerf.map(m => ({
        mode:      m._id,
        avgRating: Math.round(m.avgRating * 10) / 10,
        count:     m.count,
      })),
      rulesCorrelation: rulesCorr || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/checklist/week?date=YYYY-MM-DD ───────────────────────────────────
// Returns the full week containing the given date
exports.getWeek = async (req, res) => {
  try {
    const anchor = new Date((req.query.date || toDateString()) + 'T00:00:00');
    const day    = anchor.getDay(); // 0=Sun
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() - (day === 0 ? 6 : day - 1));

    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const docs = await PreMarketChecklist
      .find({ date: { $in: dates } })
      .select('date emotion sessionMode marketBias completionPct readinesScore sessionRating actualPnl readyToTrade');

    // Build a map date -> doc (or null)
    const map = {};
    docs.forEach(d => { map[d.date] = d.toObject(); });
    const week = dates.map(d => map[d] || { date: d, empty: true });

    res.json({ weekStart: dates[0], weekEnd: dates[6], days: week });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/checklist/:date ───────────────────────────────────────────────
exports.deleteChecklist = async (req, res) => {
  try {
    const result = await PreMarketChecklist.findOneAndDelete({ date: req.params.date });
    if (!result) return res.status(404).json({ message: 'No checklist found for that date.' });
    res.json({ message: 'Checklist deleted.', date: req.params.date });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/checklist/:date/post-session ───────────────────────────────────
// Lightweight endpoint to fill post-session fields without touching the whole doc
exports.savePostSession = async (req, res) => {
  try {
    const { sessionRating, rulesFollowed, actualPnl, tradesCount, sessionReview, lessonLearned, tomorrowFocus } = req.body;
    const update = {};
    if (sessionRating  !== undefined) update.sessionRating  = sessionRating;
    if (rulesFollowed  !== undefined) update.rulesFollowed  = rulesFollowed;
    if (actualPnl      !== undefined) update.actualPnl      = actualPnl;
    if (tradesCount    !== undefined) update.tradesCount    = tradesCount;
    if (sessionReview  !== undefined) update.sessionReview  = sessionReview;
    if (lessonLearned  !== undefined) update.lessonLearned  = lessonLearned;
    if (tomorrowFocus  !== undefined) update.tomorrowFocus  = tomorrowFocus;

    const doc = await PreMarketChecklist.findOneAndUpdate(
      { date: req.params.date },
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'No checklist found for that date.' });
    res.json({ exists: true, ...doc.toObject() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};