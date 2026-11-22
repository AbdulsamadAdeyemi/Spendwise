import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Label,
  ResponsiveContainer,
} from "recharts";
import {
  formatMoney,
  getTotalExpenses,
  isExpenseTransaction,
  normalizeAmount,
} from "../utils/finance";

function CategoryDonutChart({ transactions = [] }) {
  const data = useMemo(() => {
    const categoryTotals = {};

    transactions.forEach((transaction) => {
      if (!isExpenseTransaction(transaction)) return;
      const amount = Math.max(0, normalizeAmount(transaction.amount));
      if (amount <= 0) return;

      const catName = transaction.category || "Uncategorized";
      categoryTotals[catName] = (categoryTotals[catName] || 0) + amount;
    });

    return Object.keys(categoryTotals).map((catName) => ({
      name: catName,
      value: categoryTotals[catName],
    }));
  }, [transactions]);

  const totalExpenses = getTotalExpenses(transactions);
  const colors = ["#C56A2D", "#1F6B45", "#A33B32", "#8C5A3C", "#D4A574", "#5C4A3A"];

  return (
    <div className="rounded-3xl border border-midnight/8 bg-ice-white p-4 shadow-[0_12px_32px_rgba(36,28,22,0.06)] sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-midnight">
        Expenses by Category
      </h2>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="48%"
              innerRadius={64}
              outerRadius={98}
              paddingAngle={data.length > 1 ? 3 : 0}
              stroke="#fffdf8"
              strokeWidth={1}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
              <Label
                position="center"
                content={({ viewBox }) => {
                  if (!viewBox?.cx || !viewBox?.cy) return null;
                  return (
                    <g>
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy - 3}
                        textAnchor="middle"
                        fill="#241c16"
                        className="text-sm font-bold"
                      >
                        {formatMoney(totalExpenses)}
                      </text>
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy + 16}
                        textAnchor="middle"
                        fill="#241c16"
                        className="text-[10px]"
                      >
                        Total expenses
                      </text>
                    </g>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="py-20 text-center text-sm text-midnight/60">
          No expense transactions recorded yet.
        </p>
      )}

      {/* Category Legend list */}
      {data.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-midnight">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="font-medium">{item.name}</span>
              <span className="font-sans font-bold tabular-nums text-midnight/70">
                ({formatMoney(item.value)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryDonutChart;
