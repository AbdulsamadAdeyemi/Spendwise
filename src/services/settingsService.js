import { apiClient } from "./apiClient";

export const settingsService = {
  async getIncomePlan() {
    try {
      return await apiClient.get("/settings/plan");
    } catch (err) {
      console.error("[Settings Service] Failed to load income plan from backend:", err);
      return { amount: 0, period: "monthly" };
    }
  },

  async saveIncomePlan(plan) {
    try {
      return await apiClient.put("/settings/plan", plan);
    } catch (err) {
      console.error("[Settings Service] Failed to save income plan to backend:", err);
      throw err;
    }
  },

  async getPreferences() {
    try {
      return await apiClient.get("/settings/preferences");
    } catch (err) {
      console.error("[Settings Service] Failed to load preferences from backend:", err);
      return { defaultType: "expense", defaultCategory: "Food" };
    }
  },

  async savePreferences(preferences) {
    try {
      return await apiClient.put("/settings/preferences", preferences);
    } catch (err) {
      console.error("[Settings Service] Failed to save preferences to backend:", err);
      throw err;
    }
  },

  // One-time legacy migration for income plan and preferences from localStorage to backend
  async migrateLegacySettings(userId) {
    if (!userId) return;
    const amountKey = `spendwise-income-amount:${userId}`;
    const periodKey = `spendwise-income-period:${userId}`;
    const typeKey = `spendwise-default-type:${userId}`;
    const categoryKey = `spendwise-default-category:${userId}`;

    try {
      const savedAmount = window.localStorage.getItem(amountKey);
      const savedPeriod = window.localStorage.getItem(periodKey);
      if (savedAmount || savedPeriod) {
        await apiClient.put("/settings/plan", {
          amount: Number(savedAmount) || 0,
          period: savedPeriod === "yearly" ? "yearly" : "monthly",
        });
      }

      const savedType = window.localStorage.getItem(typeKey) || window.localStorage.getItem("spendwise-default-type");
      const savedCat = window.localStorage.getItem(categoryKey) || window.localStorage.getItem("spendwise-default-category");
      if (savedType || savedCat) {
        await apiClient.put("/settings/preferences", {
          defaultType: savedType === "income" ? "income" : "expense",
          defaultCategory: savedCat || "Food",
        });
      }
    } catch (e) {
      console.warn("[Migration] Error migrating legacy settings from localStorage:", e);
    } finally {
      // Clean up localStorage keys permanently
      window.localStorage.removeItem(amountKey);
      window.localStorage.removeItem(periodKey);
      window.localStorage.removeItem(typeKey);
      window.localStorage.removeItem(categoryKey);
      window.localStorage.removeItem("spendwise-default-type");
      window.localStorage.removeItem("spendwise-default-category");
    }
  },
};
