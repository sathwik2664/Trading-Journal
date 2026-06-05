import axios from 'axios';

const BASE = 'http://localhost:5000/api/account';

export const getAccount    = ()                        => axios.get(BASE);
export const updateAccount = (data)                    => axios.put(BASE, data);
export const updateBalance = (balance)                 => axios.put(`${BASE}/balance`, { balance });
export const deposit       = (amount, description)     => axios.post(`${BASE}/deposit`,   { amount, description });
export const withdraw      = (amount, description)     => axios.post(`${BASE}/withdraw`,  { amount, description });
export const applyTradePnl = (pnl, tradeId, symbol)   => axios.post(`${BASE}/trade-pnl`, { pnl, tradeId, symbol });
export const removeTradePnl = (tradeId)                => axios.delete(`${BASE}/trade-pnl/${tradeId}`);  // ← ADD THIS