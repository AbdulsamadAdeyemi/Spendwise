import { ArrowRight, Plus, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import SummaryCards from "../components/SummaryCards";
import {
  formatDate,
  formatTransactionAmount,
  isIncomeTransaction,
} from "../utils/finance";

function Dashboard({ transactions, incomePlan }) {
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)]">
      <SummaryCards transactions={transactions} incomePlan={incomePlan} />

      {/* Recent Activity Card with Stronger Contrast */}
      <section className="rounded-3xl border border-stone-300/80 bg-white/90 p-5 sm:p-6 shadow-[0_8px_30px_rgba(36,28,22,0.06)] backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-midnight">
              Recent Activity
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-midnight/65">
              Your latest income and expenses.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/transactions?add=1"
              className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-3.5 py-2 text-xs font-bold text-ice-white shadow-xs transition hover:bg-midnight/85 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-aurora"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add</span>
            </Link>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-sand/80 px-3.5 py-2 text-xs font-bold text-midnight shadow-2xs transition hover:bg-sand active:scale-95"
            >
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-midnight/10">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3.5 first:pt-2 last:pb-0 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-midnight text-sm sm:text-base">
                    {transaction.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-midnight/65">
                    <span className="rounded-full bg-stone-100 border border-stone-200/80 px-2.5 py-0.5 font-bold text-midnight text-[11px]">
                      {transaction.category}
                    </span>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs sm:text-sm font-extrabold tabular-nums border ${
                    isIncomeTransaction(transaction)
                      ? "bg-emerald-500/12 text-emerald-800 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-800 border-rose-500/20"
                  }`}
                >
                  {formatTransactionAmount(transaction)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200/90 bg-sand/70 text-aurora shadow-xs">
              <ReceiptText className="w-5 h-5 text-aurora" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-extrabold tracking-tight text-midnight">
              No transactions yet
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-5 text-midnight/70">
              Start your ledger by adding your first record, or pick a category below to quick-start:
            </p>

            {/* Tactile Quick-Start Category Action Pills */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                to="/transactions?add=1&category=Food&type=expense"
                className="group inline-flex items-center gap-2 rounded-2xl border border-stone-300/90 bg-white px-3.5 py-2 text-xs font-bold text-midnight shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50/60 hover:shadow-md active:translate-y-0 active:scale-95"
              >
                <span className="text-sm">🍔</span>
                <span>Food</span>
              </Link>

              <Link
                to="/transactions?add=1&category=Transport&type=expense"
                className="group inline-flex items-center gap-2 rounded-2xl border border-stone-300/90 bg-white px-3.5 py-2 text-xs font-bold text-midnight shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-50/60 hover:shadow-md active:translate-y-0 active:scale-95"
              >
                <span className="text-sm">🚗</span>
                <span>Transport</span>
              </Link>

              <Link
                to="/transactions?add=1&category=Utilities&type=expense"
                className="group inline-flex items-center gap-2 rounded-2xl border border-stone-300/90 bg-white px-3.5 py-2 text-xs font-bold text-midnight shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-aurora hover:bg-amber-50/80 hover:shadow-md active:translate-y-0 active:scale-95"
              >
                <span className="text-sm">⚡</span>
                <span>Data & Bills</span>
              </Link>

              <Link
                to="/transactions?add=1&category=Income&type=income"
                className="group inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50/70 px-3.5 py-2 text-xs font-extrabold text-emerald-900 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100/80 hover:shadow-md active:translate-y-0 active:scale-95"
              >
                <span className="text-sm">💼</span>
                <span>Salary</span>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
