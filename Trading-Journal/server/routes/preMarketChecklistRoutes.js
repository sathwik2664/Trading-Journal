const express = require('express');
const router  = express.Router();
const {
  getChecklist,
  saveChecklist,
  getHistory,
  getStats,
  deleteChecklist,
} = require('../controllers/preMarketChecklistController');

// No auth — open routes
router.get('/history',   getHistory);
router.get('/stats',     getStats);
router.get('/',          getChecklist);
router.post('/',         saveChecklist);
router.delete('/:date',  deleteChecklist);

module.exports = router;