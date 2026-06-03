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

/* PUT /api/account  — profile / settings (never touches balance directly) */
const updateAccount = async (req, res) => {
  try {
    const account = await getOrCreate();
    // Strip fields that have their own dedicated endpoints
    const { currentBalance, transactions, _id, __v, createdAt, updatedAt, ...updates } = req.body;
    Object.assign(account, updates);
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* PUT /api/account/balance  — manual balance override from the edit pencil */
const updateBalance = async (req, res) => {
  try {
    const { balance } = req.body;
    if (balance === undefined || balance < 0) {
      return res.status(400).json({ message: 'Invalid balance value' });
    }
    const account = await getOrCreate();
    account.currentBalance = parseFloat(balance);
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/account/deposit */
const deposit = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    const account = await getOrCreate();
    account.currentBalance += parsed;
    account.transactions.push({
      type: 'deposit',
      amount: parsed,
      description: description?.trim() || 'Deposit',
      date: new Date(),
    });
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/account/withdraw */
const withdraw = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    const account = await getOrCreate();
    if (account.currentBalance < parsed) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    account.currentBalance -= parsed;
    account.transactions.push({
      type: 'withdrawal',
      amount: -parsed,                              // stored negative
      description: description?.trim() || 'Withdrawal',
      date: new Date(),
    });
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/account/trade-pnl  — called automatically after a trade is saved */
const applyTradePnl = async (req, res) => {
  try {
    const { pnl, tradeId, symbol } = req.body;
    if (pnl === null || pnl === undefined) {
      return res.status(400).json({ message: 'pnl is required' });
    }
    const parsed = parseFloat(pnl);
    const account = await getOrCreate();
    account.currentBalance += parsed;
    account.transactions.push({
      type: 'trade_pnl',
      amount: parsed,
      description: `Trade P&L — ${symbol || 'Unknown'}`,
      tradeId: tradeId || null,
      date: new Date(),
    });
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAccount, updateAccount, updateBalance, deposit, withdraw, applyTradePnl };