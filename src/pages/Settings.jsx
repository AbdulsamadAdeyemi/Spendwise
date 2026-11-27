import { useState, useEffect } from "react";
import { Check, Sliders, User, WalletCards } from "lucide-react";
import { formatMoney } from "../utils/finance";
import ProfileAvatar from "../components/ProfileAvatar";
import { settingsService } from "../services/settingsService";

const EXPENSE_CATEGORIES = [
  { value: "Food", label: "Food & Dining" },
  { value: "Transport", label: "Transport & Fuel" },
  { value: "Utilities", label: "Utilities, Data & Bills" },
  { value: "Shopping", label: "Shopping" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Health", label: "Health & Fitness" },
  { value: "Other", label: "Other" },
];

const INCOME_CATEGORIES = [
  { value: "Income", label: "Salary / Income" },
  { value: "Other", label: "Other / Freelance" },
];

function Settings({ user, incomePlan, onSaveIncomePlan }) {
  const [amount, setAmount] = useState(
    incomePlan?.amount ? String(incomePlan.amount) : ""
  );
  const [period, setPeriod] = useState(incomePlan?.period || "monthly");

  // Default Entry Preferences state loaded directly from backend PostgreSQL
  const [defaultType, setDefaultType] = useState("expense");
  const [defaultCategory, setDefaultCategory] = useState("Food");
  const [isPrefSaved, setIsPrefSaved] = useState(false);

  // Sync preferences from PostgreSQL backend on mount
  useEffect(() => {
    let isMounted = true;
    settingsService.getPreferences().then((prefs) => {
      if (isMounted && prefs) {
        if (prefs.defaultType) setDefaultType(prefs.defaultType);
        if (prefs.defaultCategory) setDefaultCategory(prefs.defaultCategory);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (onSaveIncomePlan) {
      onSaveIncomePlan({ amount: Number(amount) || 0, period });
    }
  }

  function handleTypeChange(nextType) {
    setDefaultType(nextType);
    const nextCat =
      nextType === "income"
        ? "Income"
        : defaultCategory === "Income"
          ? "Food"
          : defaultCategory;
    setDefaultCategory(nextCat);
    settingsService.savePreferences({ defaultType: nextType, defaultCategory: nextCat });
    setIsPrefSaved(true);
    setTimeout(() => setIsPrefSaved(false), 1500);
  }

  function handleCategoryChange(nextCat) {
    setDefaultCategory(nextCat);
    settingsService.savePreferences({ defaultType, defaultCategory: nextCat });
    setIsPrefSaved(true);
    setTimeout(() => setIsPrefSaved(false), 1500);
  }

  function handleSavePreferences(event) {
    if (event) event.preventDefault();
    settingsService.savePreferences({ defaultType, defaultCategory });
    setIsPrefSaved(true);
    setTimeout(() => setIsPrefSaved(false), 2000);
  }

  // Active target metrics
  const activeAmount = Number(incomePlan?.amount) || 0;
  const activePeriod = incomePlan?.period === "yearly" ? "yearly" : "monthly";
  const monthlyEquivalent =
    activeAmount > 0
      ? activePeriod === "yearly"
        ? activeAmount / 12
        : activeAmount
      : 0;

  const availableCategories =
    defaultType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28 sm:pb-32">
      {/* 1. Income & Budget Target */}
      <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-midnight">
            <WalletCards size={20} />
          </span>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-midnight sm:text-lg">
              Income & Budget Target
            </h2>
            <p className="text-xs text-stone-500">
              Benchmark income used to compute budget ratios and health.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="incomeAmount"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600"
              >
                Income Amount (₦)
              </label>
              <input
                id="incomeAmount"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="e.g. 500000"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 font-sans text-sm font-semibold tabular-nums text-midnight placeholder:text-stone-400 focus:border-aurora focus:ring-2 focus:ring-aurora/20 outline-none transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="incomeFrequency"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600"
              >
                Frequency
              </label>
              <select
                id="incomeFrequency"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 font-sans text-sm font-semibold text-midnight focus:border-aurora focus:ring-2 focus:ring-aurora/20 outline-none transition-all"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-start pt-1">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-midnight px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-midnight/90 active:scale-95"
            >
              Save Target
            </button>
          </div>
        </form>

        {/* Current status line */}
        <div className="mt-4 border-t border-stone-100 pt-3.5">
          {activeAmount > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-700">
              <span>
                Active target:{" "}
                <strong className="font-sans font-bold tabular-nums text-midnight">
                  {formatMoney(activeAmount)}
                </strong>{" "}
                per {activePeriod} ({formatMoney(monthlyEquivalent)}/mo equivalent)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>No regular income target currently set.</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Account Profile */}
      <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-midnight">
            <User size={20} />
          </span>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-midnight sm:text-lg">
              Account Profile
            </h2>
            <p className="text-xs text-stone-500">
              Active account credentials and local profile info.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3.5 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 sm:p-4">
          <ProfileAvatar user={user} className="h-11 w-11 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-midnight">
              {user?.firstName || "Abdul"} {user?.lastName || "Adeyemi"}
            </p>
            <p className="truncate text-xs text-stone-500">
              {user?.email || "No email registered"}
            </p>
          </div>
          <span className="inline-flex rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[11px] font-bold text-stone-700">
            Active
          </span>
        </div>
      </section>

      {/* 3. Default Entry Preferences */}
      <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-midnight">
            <Sliders size={20} />
          </span>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-midnight sm:text-lg">
              Default Entry Preferences
            </h2>
            <p className="text-xs text-stone-500">
              Pre-select the default type and category when logging new transactions.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Transaction Type */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Default Type
              </span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition-all active:scale-95 ${defaultType === "expense"
                    ? "border-midnight bg-midnight text-white shadow-xs"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition-all active:scale-95 ${defaultType === "income"
                    ? "border-midnight bg-midnight text-white shadow-xs"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="defaultCategory"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600"
              >
                Default Category
              </label>
              <select
                id="defaultCategory"
                value={defaultCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 font-sans text-sm font-semibold text-midnight focus:border-aurora focus:ring-2 focus:ring-aurora/20 outline-none transition-all"
              >
                {availableCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-midnight px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-midnight/90 active:scale-95"
            >
              {isPrefSaved ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>

          {/* Status summary */}
          <div className="mt-4 border-t border-stone-100 pt-3.5 text-xs text-stone-600">
            <span>
              New transactions will open pre-filled as{" "}
              <strong className="capitalize text-midnight">{defaultType}</strong>{" "}
              under{" "}
              <strong className="text-midnight">
                {availableCategories.find((c) => c.value === defaultCategory)?.label ||
                  defaultCategory}
              </strong>
              .
            </span>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Settings;
