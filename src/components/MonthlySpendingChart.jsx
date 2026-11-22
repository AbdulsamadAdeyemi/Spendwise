import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  formatCompactMoney,
  formatMoney,
  getTransactionDateParts,
  isExpenseTransaction,
  normalizeAmount,
} from "../utils/finance";

function MonthlySpendingChart({ transactions = [] }) {
  const monthlyData = useMemo(() => {
    const groupedData = {};

    transactions.forEach((transaction) => {
      if (!isExpenseTransaction(transaction)) return;

      const parts = getTransactionDateParts(transaction.date);
      const amount = normalizeAmount(transaction.amount);
      if (!parts || amount <= 0) return;

      const monthKey = `${parts.year}-${String(parts.month + 1).padStart(2, "0")}`;

      if (!groupedData[monthKey]) {
        groupedData[monthKey] = {
          month: parts.date.toLocaleDateString("en-NG", {
            month: "short",
            year: "numeric",
          }),
          expenses: 0,
        };
      }

      groupedData[monthKey].expenses += amount;
    });

    return Object.keys(groupedData)
      .sort()
      .map((key) => groupedData[key]);
  }, [transactions]);

  return (
    <div className="rounded-3xl border border-midnight/8 bg-ice-white p-4 shadow-[0_12px_32px_rgba(36,28,22,0.06)] sm:p-6">
      <h2 className="mb-1 text-lg font-semibold text-midnight">
        Monthly Spending Trend
      </h2>
      <p className="mb-6 text-sm text-midnight/65">
        Track how your expenses change over time.
      </p>

      {monthlyData.length ? (
        <div className="h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ left: 8, right: 12 }}>
              <CartesianGrid stroke="#241c16" strokeOpacity={0.08} />
              <XAxis dataKey="month" tick={{ fill: "#241c16", fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tickFormatter={formatCompactMoney}
                tick={{ fill: "#241c16", fontSize: 12 }}
                width={64}
              />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#C56A2D"
                strokeWidth={3}
                dot={{ r: 4, fill: "#241c16" }}
                activeDot={{ r: 7, fill: "#C56A2D", stroke: "#241c16" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-midnight/60">
          Add expense transactions to see your monthly trend.
        </p>
      )}
    </div>
  );
}

export default MonthlySpendingChart;
