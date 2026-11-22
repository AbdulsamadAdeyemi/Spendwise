const wholeNaira = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

/**
 * Normalizes any value to a finite number.
 * Defaults to 0 if null, undefined, NaN, or non-finite.
 */
export function normalizeAmount(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Standardized, safe, case-insensitive check for expense transactions.
 */
export function isExpenseTransaction(transaction) {
  if (!transaction || typeof transaction !== "object") return false;
  return String(transaction.type || "").trim().toLowerCase() === "expense";
}

/**
 * Standardized, safe, case-insensitive check for income transactions.
 */
export function isIncomeTransaction(transaction) {
  if (!transaction || typeof transaction !== "object") return false;
  return String(transaction.type || "").trim().toLowerCase() === "income";
}

/**
 * Robust date part parser that parses YYYY-MM-DD, ISO strings, and timestamps
 * without timezone boundary rollover pushing late-night entries into another month.
 */
export function getTransactionDateParts(value) {
  if (!value && value !== 0) return null;

  // Handle numbers or raw numeric timestamp strings (e.g. 1732219200000)
  if (typeof value === "number" || (/^\d{10,}$/.test(String(value).trim()))) {
    const d = new Date(Number(value));
    if (Number.isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), date: d };
  }

  // Handle YYYY-MM-DD or ISO strings starting with YYYY-MM-DD
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1; // 0-based month (0 = Jan, 11 = Dec)
    const day = Number(match[3]);
    // Pin at local midday (12:00:00) to eliminate daylight saving or midnight shifts
    const d = new Date(year, month, day, 12, 0, 0);
    return { year, month, day, date: d };
  }

  // Fallback for general date strings
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), date: d };
}

export function parseDate(value) {
  const parts = getTransactionDateParts(value);
  return parts ? parts.date : new Date(NaN);
}

/**
 * Calculates total expenses safely from an array of transactions.
 */
export function getTotalExpenses(transactions = []) {
  if (!Array.isArray(transactions)) return 0;
  return transactions.reduce((total, transaction) => {
    if (!isExpenseTransaction(transaction)) return total;
    return total + Math.max(0, normalizeAmount(transaction.amount));
  }, 0);
}

/**
 * Calculates total income safely from an array of transactions.
 */
export function getTotalIncome(transactions = []) {
  if (!Array.isArray(transactions)) return 0;
  return transactions.reduce((total, transaction) => {
    if (!isIncomeTransaction(transaction)) return total;
    return total + Math.max(0, normalizeAmount(transaction.amount));
  }, 0);
}

/**
 * Returns an object with normalized income and expenses totals.
 */
export function getTransactionTotals(transactions = []) {
  return {
    income: getTotalIncome(transactions),
    expenses: getTotalExpenses(transactions),
  };
}

/**
 * Calculates net balance (totalIncome - totalExpenses).
 */
export function getNetBalance(transactions = []) {
  return getTotalIncome(transactions) - getTotalExpenses(transactions);
}

/**
 * Calculates current month expenses safely using timezone-hardened date parts.
 */
export function getCurrentMonthExpenses(transactions = [], currentDate = new Date()) {
  if (!Array.isArray(transactions)) return 0;
  const targetYear = currentDate.getFullYear();
  const targetMonth = currentDate.getMonth();

  return transactions.reduce((total, transaction) => {
    if (!isExpenseTransaction(transaction)) return total;

    const parts = getTransactionDateParts(transaction.date);
    if (!parts) return total;

    if (parts.year === targetYear && parts.month === targetMonth) {
      return total + Math.max(0, normalizeAmount(transaction.amount));
    }

    return total;
  }, 0);
}

/**
 * Calculates budget usage ratio without dividing by zero.
 * Returns null if target <= 0 or not finite.
 */
export function getBudgetUsageRatio(spent, target) {
  const normTarget = normalizeAmount(target);
  const normSpent = normalizeAmount(spent);
  if (normTarget <= 0) return null;
  return (normSpent / normTarget) * 100;
}

/**
 * Calculates spending health ratio (expenses / income * 100) without dividing by zero.
 * Returns null if income <= 0 or not finite.
 */
export function getSpendingHealthRatio(expenses, income) {
  const normIncome = normalizeAmount(income);
  const normExpenses = normalizeAmount(expenses);
  if (normIncome <= 0) return null;
  return (normExpenses / normIncome) * 100;
}

export function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₦0";

  const sign = amount < 0 ? "-" : "";
  return `${sign}₦${wholeNaira.format(Math.abs(amount))}`;
}

export function formatTransactionAmount(transaction) {
  const amount = normalizeAmount(transaction?.amount);
  const sign = isIncomeTransaction(transaction) ? "+" : "-";

  return `${sign}₦${wholeNaira.format(Math.abs(amount))}`;
}

export function formatCompactMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₦0";
  if (Math.abs(amount) < 1000) return formatMoney(amount);

  const sign = amount < 0 ? "-" : "";
  return `${sign}₦${wholeNaira.format(Math.abs(amount) / 1000)}k`;
}

export function formatDate(value) {
  const parts = getTransactionDateParts(value);

  if (!parts) return String(value || "");

  return parts.date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
