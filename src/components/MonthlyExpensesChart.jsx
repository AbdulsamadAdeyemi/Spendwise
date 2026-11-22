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
  isExpenseTransaction,
  normalizeAmount,
  parseDate,
} from "../utils/finance";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-midnight/15 bg-ice-white p-4 shadow-lg">
      <p className="mb-1 text-sm text-midnight/65">{label}</p>
      <p className="text-lg font-bold text-midnight">
        {formatMoney(payload[0].value)}
      </p>
    </div>
  );
}

function MonthlyExpensesChart({ transactions = [] }) {
  const monthlyData = transactions
    .filter((transaction) => isExpenseTransaction(transaction))
    .reduce((acc, transaction) => {
      const date = parseDate(transaction.date);
      const amount = normalizeAmount(transaction.amount);
      if (Number.isNaN(date.getTime()) || amount <= 0) return acc;

      const month = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[month]) {
        acc[month] = 0;
      }

      acc[month] += amount;

      return acc;
    }, {});

  const data = Object.keys(monthlyData)
    .sort()
    .map((month) => {
      const date = new Date(month);
      return {
        month: date.toLocaleDateString("en-NG", {
          month: "short",
          year: "numeric",
        }),
        expenses: monthlyData[month],
      };
    });

  return (
    <div className="rounded-3xl border border-midnight/8 bg-ice-white p-4 shadow-[0_12px_32px_rgba(36,28,22,0.06)] sm:p-6">
      <h2 className="mb-1 text-lg font-semibold text-midnight">
        Monthly Expenses
      </h2>
      <p className="mb-6 text-sm text-midnight/65">
        Track how your expenses change over time.
      </p>

      {data.length ? (
        <div className="h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 8, right: 12 }}>
              <CartesianGrid stroke="#241c16" strokeOpacity={0.08} />
              <XAxis dataKey="month" tick={{ fill: "#241c16", fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tickFormatter={formatCompactMoney}
                tick={{ fill: "#241c16", fontSize: 12 }}
                width={64}
              />
              <Tooltip content={<CustomTooltip />} />
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
          Add expense transactions to see your monthly chart.
        </p>
      )}
    </div>
  );
}

export default MonthlyExpensesChart;
