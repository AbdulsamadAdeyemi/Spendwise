import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AuthPage from "./pages/AuthPage";

// Pages
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";

// Services
import { authService } from "./services/authService";
import { transactionService } from "./services/transactionService";

function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const navigate = useNavigate();

  function handleSignOut() {
    authService.logout();
    setUser(null);
    navigate("/", { replace: true });
  }

  function handleAuthenticated(authenticatedUser) {
    setUser(authenticatedUser);
    navigate("/dashboard/", { replace: true });
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return <AuthenticatedApp user={user} onSignOut={handleSignOut} />;
}

function AuthenticatedApp({ user, onSignOut }) {
  const incomeAmountKey = `spendwise-income-amount:${user.id}`;
  const incomePeriodKey = `spendwise-income-period:${user.id}`;

  const [incomePlan, setIncomePlan] = useState(() => {
    const savedAmount = Number(window.localStorage.getItem(incomeAmountKey));
    const savedPeriod = window.localStorage.getItem(incomePeriodKey);

    return {
      amount: Number.isFinite(savedAmount) && savedAmount > 0 ? savedAmount : "",
      period: savedPeriod === "yearly" ? "yearly" : "monthly",
    };
  });

  const [transactions, setTransactions] = useState(() =>
    transactionService.getUserTransactions(user.id)
  );

  // Automatically persist transactions to localStorage on every change
  useEffect(() => {
    transactionService.saveUserTransactions(user.id, transactions);
  }, [user.id, transactions]);

  function saveIncomePlan(nextPlan) {
    window.localStorage.setItem(incomeAmountKey, String(nextPlan.amount));
    window.localStorage.setItem(incomePeriodKey, nextPlan.period);
    setIncomePlan(nextPlan);
  }

  return (
    <div className="min-h-screen bg-canvas text-midnight">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <Header
            user={user}
            onSignOut={onSignOut}
            transactions={transactions}
            transactionCount={transactions.length}
          />
          <Routes>
            {/* Dashboard served on /dashboard/ and /dashboard */}
            <Route
              path="/dashboard"
              element={<Dashboard transactions={transactions} incomePlan={incomePlan} />}
            />
            {/* Root redirects to /dashboard/ */}
            <Route
              path="/"
              element={<Navigate to="/dashboard/" replace />}
            />
            <Route
              path="/transactions"
              element={
                <Transactions
                  transactions={transactions}
                  setTransactions={setTransactions}
                />
              }
            />
            <Route
              path="/analytics"
              element={<Analytics transactions={transactions} />}
            />
            <Route
              path="/wallet"
              element={<Wallet transactions={transactions} incomePlan={incomePlan} />}
            />
            <Route
              path="/settings"
              element={
                <Settings
                  user={user}
                  incomePlan={incomePlan}
                  onSaveIncomePlan={saveIncomePlan}
                />
              }
            />
            {/* Catch-all redirects to /dashboard/ */}
            <Route path="*" element={<Navigate to="/dashboard/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;


