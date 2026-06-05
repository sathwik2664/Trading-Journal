const express = require('express');
const router  = express.Router();
const {
  getAccount,
  updateAccount,
  applyTradePnl,
  removeTradePnl,
  recalculate,
} = require('../controllers/accountController');

router.get('/',                      getAccount);
router.put('/',                      updateAccount);
router.post('/trade-pnl',            applyTradePnl);
router.delete('/trade-pnl/:tradeId', removeTradePnl);
router.post('/recalculate',          recalculate);

module.exports = router;