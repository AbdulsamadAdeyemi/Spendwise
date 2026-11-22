import { useState, useMemo, useRef, useEffect } from "react";
import { LogOut, Search, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";
import {
  formatDate,
  formatTransactionAmount,
  isIncomeTransaction,
} from "../utils/finance";

function Header({
  user,
  onSignOut,
  transactions = [],
  transactionCount = 0,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activePath = pathname.replace(/\/+$/, "") || "/";

  // Search state
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const searchContainerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter live matching records
  const searchResults = useMemo(() => {
    const q = headerSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return transactions
      .filter((t) => {
        const nameMatch = (t.name || "").toLowerCase().includes(q);
        const catMatch = (t.category || "").toLowerCase().includes(q);
        return nameMatch || catMatch;
      })
      .slice(0, 5);
  }, [headerSearchQuery, transactions]);

  function handleSearchSubmit(event) {
    if (event) event.preventDefault();
    const q = headerSearchQuery.trim();
    setIsSearchOpen(false);
    if (q) {
      navigate(`/transactions?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/transactions");
    }
  }

  function handleSelectResult(transaction) {
    setIsSearchOpen(false);
    navigate(`/transactions?search=${encodeURIComponent(transaction.name || "")}`);
  }

  // Dynamic changing day/month/year e.g. "21 Nov 2026"
  const currentDateFormatted = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const userDisplayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.firstName || "Account"
    : "Abdul Adeyemi";

  const cycleSubtitle = (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="text-stone-500 font-sans tabular-nums font-medium">
        {currentDateFormatted}
      </span>
      <span className="text-stone-300 font-normal">—</span>
      <span className="font-extrabold text-aurora">
        {userDisplayName}
      </span>
    </span>
  );

  const page = {
    "/": ["Dashboard", cycleSubtitle],
    "/dashboard": ["Dashboard", cycleSubtitle],
    "/transactions": ["Active Ledger", "Manage your income and expenses."],
    "/analytics": ["Analytics", "Understand your spending patterns."],
    "/wallet": ["My Wallet", "Your money, clearly organized."],
    "/settings": ["Settings", "Manage your income and preferences."],
  }[activePath] ?? ["Dashboard", cycleSubtitle];

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <Link
          to="/dashboard/"
          className="group block rounded-lg focus:outline-none focus:ring-2 focus:ring-aurora"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-aurora transition group-hover:text-aurora/80">
            SpendWise
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-midnight leading-tight">
              {page[0]}
            </h1>
            {activePath === "/transactions" && (
              <span className="inline-flex items-center rounded-full border border-midnight/15 bg-sand/80 px-2.5 py-0.5 font-sans text-xs font-bold tabular-nums text-midnight/75 shadow-2xs">
                {transactionCount} {transactionCount === 1 ? "record" : "records"}
              </span>
            )}
          </div>
        </Link>
        <p className="mt-1 text-xs sm:text-sm font-medium text-midnight/70">
          {page[1]}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Working Search Bar with Live Popover */}
        <div ref={searchContainerRef} className="relative">
          <form
            onSubmit={handleSearchSubmit}
            className="flex h-10 w-48 sm:w-64 md:w-72 items-center gap-2 rounded-full border border-stone-300/80 bg-white/90 px-3.5 shadow-xs transition-all focus-within:border-aurora focus-within:bg-white focus-within:ring-2 focus-within:ring-aurora/20"
          >
            <Search size={15} className="text-midnight/50 shrink-0" />
            <input
              type="text"
              value={headerSearchQuery}
              onChange={(e) => {
                setHeaderSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (headerSearchQuery.trim()) setIsSearchOpen(true);
              }}
              placeholder="Search records..."
              className="w-full bg-transparent text-xs font-medium text-midnight outline-none placeholder:text-midnight/40"
            />
            {headerSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setHeaderSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="text-stone-400 hover:text-midnight transition"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Live Search Quick Results Dropdown */}
          {isSearchOpen && headerSearchQuery.trim() && (
            <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50">
              <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100 flex items-center justify-between">
                <span>Matching Records</span>
                <span className="font-sans font-bold tabular-nums">
                  {searchResults.length}
                </span>
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-stone-100 py-1">
                  {searchResults.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectResult(t)}
                      className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-left rounded-xl hover:bg-stone-50 transition active:scale-[0.99]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-midnight">
                          {t.name}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {t.category} — {formatDate(t.date)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-sans text-xs font-bold tabular-nums ${
                          isIncomeTransaction(t) ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {formatTransactionAmount(t)}
                      </span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="mt-1 w-full text-center py-2 text-xs font-bold text-aurora hover:text-[#b55e24] transition rounded-lg hover:bg-amber-50/50"
                  >
                    View all results in Active Ledger →
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-stone-500">
                    No transactions matching "{headerSearchQuery}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Pill & Logout Control */}
        <div className="flex h-10 items-center gap-2 rounded-full border border-stone-300/80 bg-white/80 py-1 pl-1.5 pr-2 shadow-xs transition-all hover:border-midnight/30">
          <ProfileAvatar user={user} className="h-7 w-7 text-xs" />
          <span className="hidden max-w-28 truncate text-xs font-extrabold tracking-tight text-aurora sm:block">
            {user?.firstName || "Account"}
          </span>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            aria-label="Log out"
            title="Log out"
            className="flex h-7 w-7 items-center justify-center rounded-full text-midnight/50 transition-colors hover:bg-expense/10 hover:text-expense focus:outline-none focus:ring-2 focus:ring-aurora"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-midnight/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-midnight/10 bg-ice-white p-6 shadow-2xl transition-all sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 shadow-xs">
              <LogOut size={22} strokeWidth={2.5} />
            </div>

            <h3 className="text-center font-sans text-lg font-extrabold tracking-tight text-midnight">
              Log out of SpendWise?
            </h3>
            <p className="mt-2 text-center text-xs sm:text-sm font-medium leading-relaxed text-stone-500">
              Are you sure you want to end your current session? You can sign back in anytime with your credentials.
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-stone-300 bg-white py-2.5 text-xs font-bold text-midnight shadow-2xs transition hover:bg-stone-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onSignOut();
                }}
                className="flex-1 rounded-xl bg-rose-700 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-800 active:scale-95"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
