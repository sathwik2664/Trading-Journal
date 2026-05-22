import { createContext, useContext, useState, useEffect } from 'react';

const AccountContext = createContext(null);

const DEFAULT_ACCOUNT = {
  name: 'Trading Queen',
  initials: 'T',
  email: 'tradingqueen@example.com',
  accountType: 'Personal',
  broker: 'TD Ameritrade',
  currency: 'USD',
  startingBalance: 32000,
  currentBalance: 32806,
  riskPerTrade: 1,
  maxDailyLoss: 3,
  targetProfit: 5,
  timezone: 'America/New_York',
  notifications: {
    tradeAlerts: true,
    dailySummary: true,
    weeklyReport: false,
    milestones: true,
  },
  theme: 'dark',
  avatarColor: '#7c3aed',
};

export const AccountProvider = ({ children }) => {
  const [account, setAccount] = useState(() => {
    try {
      const stored = localStorage.getItem('tz_account');
      return stored ? { ...DEFAULT_ACCOUNT, ...JSON.parse(stored) } : DEFAULT_ACCOUNT;
    } catch {
      return DEFAULT_ACCOUNT;
    }
  });

  useEffect(() => {
    localStorage.setItem('tz_account', JSON.stringify(account));
  }, [account]);

  const updateAccount = (updates) => {
    setAccount(prev => ({ ...prev, ...updates }));
  };

  const updateBalance = (newBalance) => {
    setAccount(prev => ({ ...prev, currentBalance: parseFloat(newBalance) }));
  };

  const updateNotification = (key, value) => {
    setAccount(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  return (
    <AccountContext.Provider value={{ account, updateAccount, updateBalance, updateNotification }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider');
  return ctx;
};