const express = require('express');
const router  = express.Router();
const {
  getAccount,
  updateAccount,
  updateBalance,
  deposit,
  withdraw,
  applyTradePnl,
} = require('../controllers/accountController');

router.get('/',            getAccount);
router.put('/',            updateAccount);
router.put('/balance',     updateBalance);
router.post('/deposit',    deposit);
router.post('/withdraw',   withdraw);
router.post('/trade-pnl',  applyTradePnl);

module.exports = router;