import { ArrowDownRight, ArrowRight, ArrowUpRight, Pencil, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatMoney,
  getBudgetUsageRatio,
  getCurrentMonthExpenses,
  getNetBalance,
  getTransactionTotals,
} from "../utils/finance";

function SummaryCards({ transactions, incomePlan }) {
  const { income, expenses } = getTransactionTotals(transactions);
  const balance = getNetBalance(transactions);
  const plannedAmount = Number(incomePlan?.amount) || 0;
  const monthlyPlan =
    incomePlan?.period === "yearly" ? plannedAmount / 12 : plannedAmount;
  const monthlyExpenses = getCurrentMonthExpenses(transactions);
  const budgetUsed = getBudgetUsageRatio(monthlyExpenses, monthlyPlan);

  // Remaining budget calculation
  const remainingBudget = monthlyPlan > 0 ? monthlyPlan - monthlyExpenses : null;
  const balanceContext =
    monthlyPlan > 0
      ? remainingBudget >= 0
        ? `${formatMoney(remainingBudget)} remaining in monthly budget`
        : `${formatMoney(Math.abs(remainingBudget))} over monthly budget`
      : balance >= 0
        ? `${formatMoney(balance)} available balance`
        : `${formatMoney(Math.abs(balance))} net deficit`;

  return (
    <div className="space-y-3.5">
      {/* 1. Punchy Dark Espresso Hero Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a130f] via-[#241c16] to-[#2d221a] p-6 text-ice-white shadow-[0_20px_50px_rgba(26,19,15,0.3)] ring-1 ring-amber-100/15 border border-amber-900/40 sm:p-7">
        {/* Subtle warm rim highlight glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-aurora/15 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/75">
              Total Balance
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 ring-1 ring-white/15 backdrop-blur-xs">
              Active Ledger
            </span>
          </div>

          <h2 className="my-3 font-sans text-4xl font-extrabold tracking-tight text-white tabular-nums sm:text-5xl lg:text-[3.5rem] leading-none">
            {formatMoney(balance)}
          </h2>

          <p className="text-xs sm:text-sm font-medium text-amber-100/80">
            {balanceContext}
          </p>

          {/* High-contrast Action Row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3.5 border-t border-white/10 pt-4">
            <Link
              to="/transactions?add=1"
              className="inline-flex items-center gap-2 rounded-full bg-aurora px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-aurora/35 transition-all hover:bg-[#b55e24] hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-aurora focus:ring-offset-2 focus:ring-offset-midnight ring-1 ring-white/20"
            >
              <Plus size={16} strokeWidth={3} />
              <span>+ Add Transaction</span>
            </Link>

            <Link
              to="/wallet"
              className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-200/85 transition-colors hover:text-white"
            >
              <span>View Wallet Overview</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Side-by-Side Total Income & Total Expenses Cards */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Total Income */}
        <article className="group flex flex-col justify-between rounded-2xl border border-stone-300/80 bg-white/90 p-4.5 shadow-[0_4px_24px_rgba(36,28,22,0.06)] backdrop-blur-sm transition-all hover:border-emerald-300 hover:shadow-md sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-midnight/70">
                Total Income
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
                <ArrowUpRight size={13} strokeWidth={3} />
                <span>+</span>
              </span>
            </div>

            <p className="mt-2.5 font-sans text-2xl font-extrabold tracking-tight text-emerald-800 tabular-nums sm:text-3xl leading-none">
              {formatMoney(income)}
            </p>
            <span className="mt-2 block text-[11px] sm:text-xs font-semibold text-midnight/55">
              Recorded cash in
            </span>
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px] font-bold">
            <Link
              to="/transactions?type=income"
              className="text-stone-600 transition-colors hover:text-emerald-800"
            >
              View income →
            </Link>
            <Link
              to="/transactions?add=1&type=income"
              className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-emerald-800 transition-all hover:bg-emerald-100 active:scale-95"
            >
              + Add
            </Link>
          </div>
        </article>

        {/* Total Expenses */}
        <article className="group flex flex-col justify-between rounded-2xl border border-stone-300/80 bg-white/90 p-4.5 shadow-[0_4px_24px_rgba(36,28,22,0.06)] backdrop-blur-sm transition-all hover:border-rose-300 hover:shadow-md sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-midnight/70">
                Total Expenses
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[11px] font-extrabold text-rose-800">
                <ArrowDownRight size={13} strokeWidth={3} />
                <span>-</span>
              </span>
            </div>

            <p className="mt-2.5 font-sans text-2xl font-extrabold tracking-tight text-rose-800 tabular-nums sm:text-3xl leading-none">
              {formatMoney(expenses)}
            </p>
            <span className="mt-2 block text-[11px] sm:text-xs font-semibold text-midnight/55">
              Recorded spending
            </span>
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-stone-100 pt-2.5 text-[11px] font-bold">
            <Link
              to="/transactions?type=expense"
              className="text-stone-600 transition-colors hover:text-rose-800"
            >
              View expenses →
            </Link>
            <Link
              to="/transactions?add=1&type=expense"
              className="rounded-full border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-rose-800 transition-all hover:bg-rose-100 active:scale-95"
            >
              + Add
            </Link>
          </div>
        </article>
      </div>

      {/* 3. High-Contrast Monthly Budget Card */}
      <section className="rounded-2xl border border-stone-300/80 bg-white/90 p-4.5 shadow-[0_4px_24px_rgba(36,28,22,0.06)] backdrop-blur-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-midnight/70">
            Monthly Budget
          </span>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-sand/80 px-3 py-1 text-xs font-bold text-midnight shadow-2xs transition-all hover:border-midnight hover:bg-midnight hover:text-white active:scale-95"
            title="Edit budget target in Settings"
          >
            <Pencil size={11} strokeWidth={2.5} />
            <span>Edit Target</span>
          </Link>
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-sans text-base sm:text-lg font-bold tracking-tight text-midnight tabular-nums">
            {monthlyPlan > 0
              ? `${formatMoney(monthlyExpenses)} spent of ${formatMoney(monthlyPlan)} planned`
              : `${formatMoney(monthlyExpenses)} spent — No target planned`}
          </p>

          <span
            className={`rounded-full border px-2.5 py-0.5 font-sans text-xs font-extrabold tabular-nums ${budgetUsed !== null && budgetUsed > 100
                ? "border-rose-300 bg-rose-500/15 text-rose-800"
                : "border-stone-300/80 bg-stone-100 text-midnight"
              }`}
          >
            {budgetUsed === null ? "0.0%" : `${budgetUsed.toFixed(1)}%`} used
          </span>
        </div>

        {/* Bold Progress Bar Track */}
        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-stone-200/90 shadow-inner"
          role="progressbar"
          aria-label="Monthly budget usage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={budgetUsed === null ? 0 : Math.min(budgetUsed, 100)}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${budgetUsed !== null && budgetUsed > 100
                ? "bg-rose-600"
                : "bg-gradient-to-r from-aurora via-[#cf7232] to-[#de8547]"
              }`}
            style={{
              width: `${budgetUsed === null ? 0 : Math.min(budgetUsed, 100)}%`,
            }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs font-medium text-midnight/70">
          <span>
            {monthlyPlan > 0
              ? remainingBudget >= 0
                ? `${formatMoney(remainingBudget)} remaining in monthly budget`
                : `${formatMoney(Math.abs(remainingBudget))} over monthly budget`
              : "Set your monthly target in Settings to activate tracking."}
          </span>
          {monthlyPlan > 0 && (
            <span className="font-bold tabular-nums text-midnight/80">
              {formatMoney(monthlyPlan)}/mo
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

export default SummaryCards;
