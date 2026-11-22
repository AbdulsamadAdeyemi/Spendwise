// Client-side transaction persistence service using localStorage.

const STORAGE_PREFIX = "spendwise_transactions_";

export const transactionService = {
  getUserTransactions(userId) {
    if (!userId) return [];
    try {
      const key = `${STORAGE_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch (error) {
      console.error("Failed to load user transactions from localStorage:", error);
      return [];
    }
  },

  saveUserTransactions(userId, transactions) {
    if (!userId) return;
    try {
      const key = `${STORAGE_PREFIX}${userId}`;
      localStorage.setItem(key, JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to persist user transactions in localStorage:", error);
    }
  },

  clearUserTransactions(userId) {
    if (!userId) return;
    try {
      const key = `${STORAGE_PREFIX}${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to clear user transactions:", error);
    }
  },
};
