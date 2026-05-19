export const formatCurrency = (amount) => {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(abs);
  return amount < 0 ? `-${formatted}` : formatted;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

export const getPnlColor = (pnl) => {
  if (pnl > 0) return '#22c55e';
  if (pnl < 0) return '#ef4444';
  return '#6b7280';
};

export const getPnlBg = (pnl) => {
  if (pnl > 0) return 'rgba(34,197,94,0.1)';
  if (pnl < 0) return 'rgba(239,68,68,0.1)';
  return 'rgba(107,114,128,0.1)';
};

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};