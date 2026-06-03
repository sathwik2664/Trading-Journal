const express = require('express');
const router  = express.Router();
const {
  getChecklist,
  saveChecklist,
  getHistory,
  getStats,
  getInsights,
  getWeek,
  deleteChecklist,
  savePostSession,
} = require('../controllers/preMarketChecklistController');

// ── Core CRUD ─────────────────────────────────────────────────────────────────
router.get  ('/',                    getChecklist);
router.post ('/',                    saveChecklist);
router.delete('/:date',              deleteChecklist);

// ── History & stats ───────────────────────────────────────────────────────────
router.get  ('/history',             getHistory);
router.get  ('/stats',               getStats);

// ── New premium endpoints ─────────────────────────────────────────────────────
router.get  ('/insights',            getInsights);     // pattern analysis
router.get  ('/week',                getWeek);         // weekly summary view

// ── Post-session (lightweight patch, fills review fields) ─────────────────────
router.patch('/:date/post-session',  savePostSession);

module.exports = router;