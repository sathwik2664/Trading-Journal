import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as accountService from '../services/accountService';

const AccountContext = createContext(null);

const DEFAULT_ACCOUNT = {
  name: 'Trader', initials: 'T', email: '',
  accountType: 'Personal', broker: 'TD Ameritrade', currency: 'USD',
  startingBalance: 32000, currentBalance: 32000,
  riskPerTrade: 1, maxDailyLoss: 3, targetProfit: 5,
  timezone: 'America/New_York',
  notifications: { tradeAlerts: true, dailySummary: true, weeklyReport: false, milestones: true },
  theme: 'dark', avatarColor: '#7c3aed',
  transactions: [],
};

export const AccountProvider = ({ children }) => {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT);
  const [accountLoading, setAccountLoading] = useState(true);

  const fetchAccount = useCallback(async () => {
    try {
      const res = await accountService.getAccount();
      setAccount(res.data);
    } catch (err) {
      console.error('Could not load account:', err);
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  const updateAccount = async (updates) => {
    try {
      const res = await accountService.updateAccount(updates);
      setAccount(res.data);
    } catch (err) {
      console.error('updateAccount failed:', err);
    }
  };

  const updateBalance = async (newBalance) => {
    try {
      const res = await accountService.updateBalance(newBalance);
      setAccount(res.data);
    } catch (err) {
      console.error('updateBalance failed:', err);
    }
  };

  const updateNotification = async (key, value) => {
    try {
      const updated = {
        ...account,
        notifications: { ...account.notifications, [key]: value },
      };
      const res = await accountService.updateAccount(updated);
      setAccount(res.data);
    } catch (err) {
      console.error('updateNotification failed:', err);
    }
  };

  const deposit = async (amount, description) => {
    const res = await accountService.deposit(amount, description);
    setAccount(res.data);
    return res.data;
  };

  const withdraw = async (amount, description) => {
    const res = await accountService.withdraw(amount, description);
    setAccount(res.data);
    return res.data;
  };

  const applyTradePnl = async (pnl, tradeId, symbol) => {
    try {
      const res = await accountService.applyTradePnl(pnl, tradeId, symbol);
      setAccount(res.data);
    } catch (err) {
      console.error('applyTradePnl failed:', err);
    }
  };

  return (
    <AccountContext.Provider value={{
      account, accountLoading, fetchAccount,
      updateAccount, updateBalance, updateNotification,
      deposit, withdraw, applyTradePnl,
    }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider');
  return ctx;
};