import { useState } from "react";
import { Trash2, Plus, X, Pencil, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  formatDate,
  formatTransactionAmount,
  isExpenseTransaction,
  isIncomeTransaction,
  normalizeAmount,
} from "../utils/finance";

function TransactionList({ transactions, setTransactions }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get("category");
  const mappedInitialCat =
    initialCat === "Data & Bills"
      ? "Utilities"
      : initialCat === "Salary"
        ? "Income"
        : initialCat || "";

  function getDefaultEntryPreferences() {
    try {
      const savedType = window.localStorage.getItem("spendwise-default-type") || "expense";
      const savedCat =
        window.localStorage.getItem("spendwise-default-category") ||
        (savedType === "income" ? "Income" : "Food");
      return { type: savedType, category: savedCat };
    } catch {
      return { type: "expense", category: "Food" };
    }
  }

  const urlType = searchParams.get("type");
  const initialFilterType =
    urlType === "expense" || urlType === "income" ? urlType : "all";

  const [isModalOpen, setIsModalOpen] = useState(
    () => searchParams.get("add") === "1"
  );
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(() => {
    if (mappedInitialCat) return mappedInitialCat;
    const defaults = getDefaultEntryPreferences();
    return urlType === "income" ? "Income" : defaults.category;
  });
  const [type, setType] = useState(() => {
    if (urlType === "expense" || urlType === "income") return urlType;
    if (mappedInitialCat === "Income") return "income";
    if (mappedInitialCat) return "expense";
    return getDefaultEntryPreferences().type;
  });
  const [editingId, setEditingId] = useState(null);

  // Search and filter states
  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [filterType, setFilterType] = useState(initialFilterType);
  const [filterCategory, setFilterCategory] = useState("all");

  // Adjust state during render when URL query params change (React-recommended pattern)
  const [prevParams, setPrevParams] = useState(searchParams);
  if (searchParams !== prevParams) {
    setPrevParams(searchParams);
    const paramType = searchParams.get("type");
    if (paramType === "expense" || paramType === "income") {
      setFilterType(paramType);
    } else if (!paramType && searchParams.get("add") !== "1") {
      setFilterType("all");
    }

    const paramSearch = searchParams.get("search") || searchParams.get("q") || "";
    if (paramSearch !== prevParams.get("search") && paramSearch !== prevParams.get("q")) {
      setSearchTerm(paramSearch);
    }

    if (searchParams.get("add") === "1") {
      setIsModalOpen(true);
      const cat = searchParams.get("category");
      const mapped =
        cat === "Data & Bills"
          ? "Utilities"
          : cat === "Salary"
            ? "Income"
            : cat || "";
      const defaults = getDefaultEntryPreferences();
      const resolvedType =
        paramType || (mapped === "Income" ? "income" : mapped ? "expense" : defaults.type);
      setType(resolvedType);
      setCategory(
        mapped || (resolvedType === "income" ? "Income" : defaults.category === "Income" ? "Food" : defaults.category)
      );
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.category || "").toLowerCase().includes(searchTerm.toLowerCase());

    const isExp = isExpenseTransaction(transaction);
    const isInc = isIncomeTransaction(transaction);

    const matchesType =
      filterType === "all" ||
      (filterType === "expense" && isExp) ||
      (filterType === "income" && isInc);

    const matchesCategory =
      filterCategory === "all" ||
      transaction.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Open popup for adding
  function openAddModal(forcedType) {
    const defaults = getDefaultEntryPreferences();
    const targetType = forcedType || (filterType !== "all" ? filterType : defaults.type);
    setName("");
    setAmount("");
    setType(targetType);
    setCategory(targetType === "income" ? "Income" : defaults.category === "Income" ? "Food" : defaults.category);
    setEditingId(null);
    setIsModalOpen(true);
  }

  // Open popup for editing
  function openEditModal(transaction) {
    setName(transaction.name || "");
    setAmount(String(transaction.amount || ""));
    setCategory(transaction.category || "");
    setType(transaction.type || "expense");
    setEditingId(transaction.id);
    setIsModalOpen(true);
  }

  // Close popup and clear URL query parameters
  function closeModal() {
    setIsModalOpen(false);
    setName("");
    setAmount("");
    setCategory("");
    setType("");
    setEditingId(null);
    if (searchParams.get("add")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("add");
      nextParams.delete("category");
      setSearchParams(nextParams, { replace: true });
    }
  }

  function handleFilterTypeChange(newType) {
    setFilterType(newType);
    const nextParams = new URLSearchParams(searchParams);
    if (newType === "all") {
      nextParams.delete("type");
    } else {
      nextParams.set("type", newType);
    }
    setSearchParams(nextParams, { replace: true });
  }

  // Add or update transaction
  function saveTransaction(event) {
    event.preventDefault();

    const cleanAmount = Math.max(0, normalizeAmount(amount));
    if (!name.trim() || !category || !type || cleanAmount <= 0) return;

    if (editingId !== null) {
      setTransactions((prevTransactions) =>
        prevTransactions.map((transaction) =>
          transaction.id === editingId
            ? {
              ...transaction,
              name: name.trim(),
              amount: cleanAmount,
              category,
              type: type.toLowerCase(),
            }
            : transaction
        )
      );
    } else {
      const now = new Date();
      const localYear = now.getFullYear();
      const localMonth = String(now.getMonth() + 1).padStart(2, "0");
      const localDay = String(now.getDate()).padStart(2, "0");

      const newTransaction = {
        id: Date.now(),
        name: name.trim(),
        amount: cleanAmount,
        category,
        type: type.toLowerCase(),
        date: `${localYear}-${localMonth}-${localDay}`,
      };

      setTransactions((prevTransactions) => [
        ...prevTransactions,
        newTransaction,
      ]);
    }

    closeModal();
  }

  // Delete transaction
  function deleteTransaction(id) {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;

    setTransactions((prevTransactions) =>
      prevTransactions.filter((item) => item.id !== id)
    );
  }

  function clearFilters() {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("type");
    nextParams.delete("category");
    nextParams.delete("search");
    nextParams.delete("q");
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div className="rounded-3xl border border-midnight/8 bg-ice-white p-4 shadow-[0_12px_32px_rgba(36,28,22,0.06)] sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-midnight">
            Active Ledger
          </h1>
          <p className="text-xs sm:text-sm text-midnight/65">
            View, filter, and manage your income and expenses.
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 rounded-xl bg-midnight px-4 py-2 text-xs sm:text-sm font-semibold text-ice-white shadow-sm hover:bg-midnight/85 transition active:scale-95"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Type Filter Tabs */}
        <div className="flex rounded-xl bg-sand/70 p-1 border border-midnight/10 shadow-2xs">
          <button
            type="button"
            onClick={() => handleFilterTypeChange("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${filterType === "all"
              ? "bg-midnight text-ice-white shadow-xs"
              : "text-midnight/70 hover:text-midnight"
              }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleFilterTypeChange("expense")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${filterType === "expense"
              ? "bg-rose-700 text-white shadow-xs"
              : "text-midnight/70 hover:text-rose-700"
              }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => handleFilterTypeChange("income")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${filterType === "income"
              ? "bg-emerald-800 text-white shadow-xs"
              : "text-midnight/70 hover:text-emerald-800"
              }`}
          >
            Income
          </button>
        </div>

        {/* Search */}
        <div className="flex min-w-0 flex-1 basis-full items-center gap-2 rounded-full border border-midnight/15 bg-sand px-3.5 py-2 sm:min-w-[200px] sm:basis-60">
          <Search size={16} className="text-midnight/55" />

          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-midnight outline-none placeholder:text-midnight/45"
          />
        </div>

        {/* Category Filter & Reset */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-midnight/20 bg-ice-white px-3 py-2 text-xs sm:text-sm text-midnight outline-none focus:border-midnight focus:ring-2 focus:ring-aurora sm:flex-none"
          >
            <option value="all">All Categories</option>
            <option value="Income">Salary / Income</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Utilities">Utilities & Bills</option>
            <option value="Shopping">Shopping</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>

          {(filterType !== "all" || filterCategory !== "all" || searchTerm) && (
            <button
              onClick={clearFilters}
              className="shrink-0 text-xs sm:text-sm font-medium text-aurora underline decoration-aurora/40 underline-offset-2 hover:text-aurora/80 px-1 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-midnight/10">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between gap-3 py-3 sm:py-4"
          >
            {/* Info */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm sm:text-base font-semibold text-midnight">
                {transaction.name}
              </h3>
              <p className="text-xs text-midnight/65">
                {transaction.category} — {formatDate(transaction.date)}
              </p>
            </div>

            {/* Amount */}
            <span
              className={`font-semibold tabular-nums text-sm sm:text-base ${isIncomeTransaction(transaction) ? "text-income" : "text-expense"
                }`}
            >
              {formatTransactionAmount(transaction)}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEditModal(transaction)}
                className="rounded-lg p-1.5 text-midnight/60 hover:bg-midnight/5 hover:text-midnight transition"
                title="Edit transaction"
              >
                <Pencil size={16} />
              </button>

              <button
                onClick={() => deleteTransaction(transaction.id)}
                className="rounded-lg p-1.5 text-midnight/60 hover:bg-expense/10 hover:text-expense transition"
                title="Delete transaction"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <p className="py-8 text-center text-xs sm:text-sm text-midnight/60">
            No matching transactions found.
          </p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-midnight/60 p-4 sm:items-center backdrop-blur-xs">
          <div className="my-auto w-full max-w-md rounded-3xl bg-ice-white p-5 shadow-2xl sm:p-6 border border-midnight/10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-midnight">
                {editingId !== null ? "Edit Transaction" : "New Transaction"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 text-midnight/60 hover:bg-midnight/5 hover:text-midnight transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTransaction} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-midnight/70">
                  Transaction Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supermarket Groceries"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-midnight/15 bg-sand/40 px-3.5 py-2.5 text-sm text-midnight outline-none transition focus:border-aurora focus:bg-ice-white focus:ring-2 focus:ring-aurora/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-midnight/70">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  min="1"
                  step="any"
                  required
                  className="w-full rounded-xl border border-midnight/15 bg-sand/40 px-3.5 py-2.5 font-sans text-sm text-midnight tabular-nums outline-none transition focus:border-aurora focus:bg-ice-white focus:ring-2 focus:ring-aurora/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-midnight/70">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => {
                    const nextCategory = event.target.value;
                    setCategory(nextCategory);
                    if (nextCategory === "Income") setType("income");
                  }}
                  required
                  className="w-full rounded-xl border border-midnight/15 bg-sand/40 px-3.5 py-2.5 text-sm text-midnight outline-none transition focus:border-aurora focus:bg-ice-white focus:ring-2 focus:ring-aurora/20"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  <option value="Income">Salary / Income</option>
                  <option value="Food">Food & Dining</option>
                  <option value="Transport">Transport & Fuel</option>
                  <option value="Utilities">Utilities, Data & Bills</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Health & Fitness</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-midnight/70">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setType(nextType);
                    setCategory((currentCategory) => {
                      if (nextType === "income") return "Income";
                      if (currentCategory === "Income") return "";
                      return currentCategory;
                    });
                  }}
                  required
                  className="w-full rounded-xl border border-midnight/15 bg-sand/40 px-3.5 py-2.5 text-sm text-midnight outline-none transition focus:border-aurora focus:bg-ice-white focus:ring-2 focus:ring-aurora/20"
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="expense">Expense (Money Out)</option>
                  <option value="income">Income (Money In)</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-midnight/15 px-4 py-2.5 text-xs font-semibold text-midnight hover:bg-midnight/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-midnight px-5 py-2.5 text-xs font-bold text-ice-white shadow-sm hover:bg-midnight/85 transition focus:ring-2 focus:ring-aurora"
                >
                  {editingId !== null ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionList;
