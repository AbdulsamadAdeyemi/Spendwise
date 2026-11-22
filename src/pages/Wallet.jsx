import { ArrowDownLeft, ArrowRight, ArrowUpRight, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatMoney,
  formatDate,
  formatTransactionAmount,
  getNetBalance,
  getSpendingHealthRatio,
  getTransactionTotals,
  isIncomeTransaction,
} from "../utils/finance";

function Wallet({ transactions = [], incomePlan = {} }) {
  const { income, expenses } = getTransactionTotals(transactions);
  const balance = getNetBalance(transactions);
  const spendingRatio = getSpendingHealthRatio(expenses, income);
  const recentTransactions = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 4);

  const cards = [
    {
      label: "Planned income",
      value: incomePlan?.amount ? formatMoney(incomePlan.amount) : "Not set",
      description: incomePlan?.amount
        ? `Per ${incomePlan.period === "yearly" ? "year" : "month"}`
        : "Set a target in Settings",
      icon: WalletCards,
      accent: true,
      link: "/settings",
    },
    {
      label: "Total income",
      value: formatMoney(income),
      description: income > 0 ? "Recorded income (View →)" : "No income recorded yet",
      icon: ArrowDownLeft,
      accent: true,
      link: "/transactions?type=income",
    },
    {
      label: "Total expenses",
      value: formatMoney(expenses),
      description: "Recorded spending (View →)",
      icon: ArrowUpRight,
      accent: false,
      link: "/transactions?type=expense",
    },
    {
      label: "Income used",
      value: spendingRatio === null ? "—" : `${spendingRatio.toFixed(1)}%`,
      description:
        spendingRatio === null
          ? "Add income to calculate this ratio"
          : `${formatMoney(balance)} remaining after expenses`,
      icon: ArrowDownLeft,
      accent: false,
    },
  ];

  return (
    <div>
      <header className="mb-6 flex justify-end">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-2 rounded-full border border-midnight/15 bg-sand px-4 py-2 text-xs sm:text-sm font-semibold text-midnight transition hover:bg-ice-white"
        >
          <span>All Transactions</span>
          <ArrowRight size={15} />
        </Link>
      </header>

      {/* Available Balance Hero Card */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-midnight p-6 text-ice-white shadow-[0_18px_40px_rgba(36,28,22,0.18)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[28px] border-ice-white/10"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-ice-white/75">
              Available Balance
            </p>
            <h1 className="mt-3 font-sans text-3xl font-bold tracking-tight tabular-nums sm:text-4xl lg:text-5xl">
              {formatMoney(balance)}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-ice-white/70">
              Total income minus recorded expenses
            </p>
          </div>

          <div className="w-full max-w-56 rounded-2xl border border-ice-white/20 bg-ice-white/10 p-4 sm:w-auto">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-aurora text-ice-white">
              <WalletCards size={18} />
            </div>
            <p className="text-[11px] font-medium text-ice-white/70">Tracked transactions</p>
            <p className="mt-1 font-sans text-2xl font-bold tabular-nums">{transactions.length}</p>
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const CardTag = card.link ? Link : "article";
          const cardProps = card.link ? { to: card.link } : {};

          return (
            <CardTag
              key={card.label}
              {...cardProps}
              className={`min-w-0 rounded-2xl border border-midnight/8 bg-ice-white p-4 shadow-[0_4px_20px_rgba(36,28,22,0.04)] sm:p-5 transition-all ${card.link ? "hover:border-midnight/30 hover:shadow-md cursor-pointer block" : ""
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-midnight/65">
                    {card.label}
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold tracking-tight text-midnight tabular-nums">
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.accent
                    ? "bg-aurora text-ice-white"
                    : "bg-sand text-midnight"
                    }`}
                >
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-3 text-xs text-midnight/65">{card.description}</p>
              {card.label === "Income used" && (
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-sand"
                  role="progressbar"
                  aria-label="Income used"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    spendingRatio === null ? 0 : Math.min(spendingRatio, 100)
                  }
                >
                  <div
                    className="h-full rounded-full bg-aurora transition-all"
                    style={{
                      width: `${spendingRatio === null ? 0 : Math.min(spendingRatio, 100)
                        }%`,
                    }}
                  />
                </div>
              )}
            </CardTag>
          );
        })}
      </section>

      {/* Recent Activity in Wallet */}
      <section className="mt-6 rounded-3xl border border-midnight/8 bg-ice-white p-5 shadow-[0_12px_32px_rgba(36,28,22,0.06)] sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-midnight">Recent Activity</h2>
            <p className="mt-1 text-xs sm:text-sm text-midnight/65">
              The latest money in and money out.
            </p>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-aurora hover:underline"
          >
            <span>View all</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-midnight/10">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3.5 first:pt-2 last:pb-0 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-midnight text-sm">
                    {transaction.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-midnight/65">
                    <span className="rounded-full bg-midnight/5 px-2 py-0.5 text-midnight">
                      {transaction.category}
                    </span>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs sm:text-sm font-bold tabular-nums ${isIncomeTransaction(transaction)
                    ? "bg-income/12 text-income"
                    : "bg-expense/10 text-expense"
                    }`}
                >
                  {formatTransactionAmount(transaction)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-xs sm:text-sm text-midnight/60">
            No wallet activity yet. Add a transaction to get started.
          </p>
        )}
      </section>
    </div>
  );
}

export default Wallet;
