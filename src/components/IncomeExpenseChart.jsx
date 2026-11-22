import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  formatMoney,
  getNetBalance,
  getSpendingHealthRatio,
  getTransactionTotals,
} from "../utils/finance";

function IncomeExpenseChart({ transactions = [] }) {
  const totals = useMemo(
    () => getTransactionTotals(transactions),
    [transactions]
  );
  const netBalance = useMemo(
    () => getNetBalance(transactions),
    [transactions]
  );
  const percentage = useMemo(
    () => getSpendingHealthRatio(totals.expenses, totals.income),
    [totals]
  );

  return (
    <div className="rounded-3xl border border-midnight/8 bg-ice-white p-4 shadow-[0_12px_32px_rgba(36,28,22,0.06)] sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-midnight">
        Income vs Expenses
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-income/10 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-midnight">Total Income</p>
            <TrendingUp className="text-income" size={22} />
          </div>
          <h3 className="text-2xl font-bold font-sans tabular-nums text-midnight">
            {formatMoney(totals.income)}
          </h3>
          <p className="mt-2 text-xs text-midnight/65">Money received</p>
        </div>

        <div className="rounded-2xl bg-expense/10 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-midnight">Total Expenses</p>
            <TrendingDown className="text-expense" size={22} />
          </div>
          <h3 className="text-2xl font-bold font-sans tabular-nums text-midnight">
            {formatMoney(totals.expenses)}
          </h3>
          <p className="mt-2 text-xs text-midnight/65">Money spent</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-midnight">Income spent</p>
          <p className="text-sm font-semibold text-midnight">
            {percentage === null ? "—" : `${percentage.toFixed(1)}%`}
          </p>
        </div>

        <div
          className="h-2.5 w-full rounded-full bg-sand"
          role="progressbar"
          aria-label="Income spent"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage === null ? 0 : Math.min(percentage, 100)}
        >
          <div
            className="h-2.5 rounded-full bg-aurora transition-all duration-500"
            style={{
              width: `${percentage === null ? 0 : Math.min(percentage, 100)}%`,
            }}
          />
        </div>

        <p className="mt-2 text-xs text-midnight/60">
          {percentage === null
            ? "Record income to calculate the spending ratio."
            : `${formatMoney(netBalance)} remaining after expenses`}
        </p>
      </div>
    </div>
  );
}

export default IncomeExpenseChart;
