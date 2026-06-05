import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as accountService from '../services/accountService';

const AccountContext = createContext(null);

const DEFAULT_ACCOUNT = {
  name: 'Trader', initials: 'T', email: '',
  accountType: 'Personal', broker: 'TD Ameritrade', currency: 'USD',
startingBalance: 0, currentBalance: 0,
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



  const applyTradePnl = async (pnl, tradeId, symbol) => {
    try {
      const res = await accountService.applyTradePnl(pnl, tradeId, symbol);
      setAccount(res.data);
    } catch (err) {
      console.error('applyTradePnl failed:', err);
    }
  };

const removeTradePnl = async (tradeId) => {
  try {
    const res = await accountService.removeTradePnl(tradeId);
    setAccount(res.data);
  } catch (err) {
    console.error('removeTradePnl failed:', err);
  }
};

  return (
    <AccountContext.Provider value={{
  account, accountLoading, fetchAccount,
  updateAccount, updateNotification,
  applyTradePnl, removeTradePnl,
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