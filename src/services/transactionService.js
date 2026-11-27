// Transaction service communicating directly with backend PostgreSQL API.
import { apiClient } from "./apiClient";

const LEGACY_STORAGE_PREFIX = "spendwise_transactions_";

export const transactionService = {
  // Fetch fresh transactions directly from PostgreSQL
  async fetchUserTransactions() {
    try {
      const data = await apiClient.get("/transactions");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[Transaction Service] Failed to load transactions from backend:", error);
      throw error;
    }
  },

  // Create a new transaction directly on the backend
  async createTransaction(transaction) {
    return await apiClient.post("/transactions", transaction);
  },

  // Update a transaction on the backend
  async updateTransaction(id, transaction) {
    return await apiClient.put(`/transactions/${id}`, transaction);
  },

  // Delete a transaction from the backend
  async deleteTransaction(id) {
    return await apiClient.delete(`/transactions/${id}`);
  },

  // Batch sync transactions to backend
  async syncTransactions(transactions) {
    return await apiClient.post("/transactions/sync", { transactions });
  },

  // One-time safe migration from legacy browser localStorage to backend PostgreSQL
  async migrateLegacyTransactions(userId) {
    if (!userId) return;
    const legacyKey = `${LEGACY_STORAGE_PREFIX}${userId}`;
    try {
      const raw = localStorage.getItem(legacyKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[Migration] Migrating ${parsed.length} legacy transactions to backend PostgreSQL...`);
          await apiClient.post("/transactions/sync", { transactions: parsed });
        }
        localStorage.removeItem(legacyKey);
      }
    } catch (err) {
      console.warn("[Migration] Error migrating legacy transactions:", err);
      localStorage.removeItem(legacyKey);
    }
  },
};
