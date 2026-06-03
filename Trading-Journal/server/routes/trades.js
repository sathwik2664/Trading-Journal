const express = require('express');
const router  = express.Router();
const {
  getAllTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade,
  getTradeScreenshot,
  getTradeImages,        // ✅ NEW
} = require('../controllers/tradeController');

router.get('/',                   getAllTrades);
router.get('/:id',                getTradeById);
router.get('/:id/screenshot',     getTradeScreenshot);
router.get('/:id/images',         getTradeImages);   // ✅ NEW
router.post('/',                  createTrade);
router.put('/:id',                updateTrade);
router.delete('/:id',             deleteTrade);

module.exports = router;