const express = require('express');
const router  = express.Router();
const {
  getAllTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade,
  getTradeScreenshot,
} = require('../controllers/tradeController');

router.get('/',                   getAllTrades);
router.get('/:id',                getTradeById);
router.get('/:id/screenshot',     getTradeScreenshot);
router.post('/',                  createTrade);
router.put('/:id',                updateTrade);
router.delete('/:id',             deleteTrade);

module.exports = router;