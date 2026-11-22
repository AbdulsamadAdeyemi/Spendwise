
import CategoryDonutChart from "../components/CategoryDonutChart";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import MonthlySpendingChart from "../components/MonthlySpendingChart";

function Analytics({ transactions }) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <CategoryDonutChart transactions={transactions} />
        <IncomeExpenseChart transactions={transactions} />
      </div>

      <div className="mt-5">
        <MonthlySpendingChart transactions={transactions} />
      </div>
    </div>
  );
}

export default Analytics;
