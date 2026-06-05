const Account = require('../models/Account');

/* ── helpers ── */
const getOrCreate = async () => {
  let account = await Account.findOne();
  if (!account) account = await Account.create({});
  return account;
};

/* GET /api/account */
const getAccount = async (req, res) => {
  try {
    const account = await getOrCreate();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* PUT /api/account — profile / settings (never touches balance directly) */
const updateAccount = async (req, res) => {
  try {
    const account = await getOrCreate();
    const { currentBalance, transactions, _id, __v, createdAt, updatedAt, ...updates } = req.body;
    Object.assign(account, updates);
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/account/trade-pnl — called automatically after a trade is saved */
const applyTradePnl = async (req, res) => {
  try {
    const { pnl, tradeId, symbol } = req.body;
    if (pnl === null || pnl === undefined) {
      return res.status(400).json({ message: 'pnl is required' });
    }
    const parsed  = parseFloat(pnl);
    const account = await getOrCreate();
    account.transactions.push({
      type: 'trade_pnl',
      amount: parsed,
      description: `Trade P&L — ${symbol || 'Unknown'}`,
      tradeId: tradeId || null,
      date: new Date(),
    });
    account.currentBalance = account.transactions
      .filter(t => t.type === 'trade_pnl')
      .reduce((sum, t) => sum + t.amount, 0);
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE /api/account/trade-pnl/:tradeId — reverses a trade's P&L when deleted */
const removeTradePnl = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const account = await getOrCreate();
    const tx = account.transactions.find(
      t => t.type === 'trade_pnl' && t.tradeId?.toString() === tradeId
    );
    if (tx) {
      account.transactions = account.transactions.filter(
        t => !(t.type === 'trade_pnl' && t.tradeId?.toString() === tradeId)
      );
      account.currentBalance = account.transactions
        .filter(t => t.type === 'trade_pnl')
        .reduce((sum, t) => sum + t.amount, 0);
      await account.save();
    }
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/account/recalculate — one-time cleanup, remove after use */
const recalculate = async (req, res) => {
  try {
    const account = await getOrCreate();
    account.transactions = account.transactions.filter(t => t.type === 'trade_pnl');
    account.currentBalance = account.transactions.reduce((sum, t) => sum + t.amount, 0);
    await account.save();
    res.json({ message: 'Recalculated', balance: account.currentBalance, account });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAccount, updateAccount, applyTradePnl, removeTradePnl, recalculate };