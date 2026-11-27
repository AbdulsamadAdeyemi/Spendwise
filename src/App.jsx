import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Pages
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";

// Services
import { authService } from "./services/authService";
import { apiClient } from "./services/apiClient";
import { transactionService } from "./services/transactionService";
import { settingsService } from "./services/settingsService";

function App() {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => Boolean(apiClient.getToken()));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const token = apiClient.getToken();

    if (!token) {
      return;
    }

    authService
      .getProfile()
      .then((profile) => {
        if (isMounted) {
          if (profile) {
            setUser(profile);
          } else {
            apiClient.clearToken();
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          apiClient.clearToken();
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSignOut() {
    authService.logout();
    setUser(null);
    navigate("/", { replace: true });
  }

  function handleAuthenticated(authenticatedUser) {
    setUser(authenticatedUser);
    navigate("/dashboard/", { replace: true });
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-midnight">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-midnight/20 border-t-aurora" />
          <p className="mt-4 text-sm font-semibold tracking-wide text-midnight/70">
            Loading SpendWise...
          </p>
        </div>
      </div>
    );
  }

  // Allow /reset-password route even when not signed in
  if (location.pathname === "/reset-password") {
    return <ResetPasswordPage />;
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return <AuthenticatedApp user={user} onSignOut={handleSignOut} />;
}

function AuthenticatedApp({ user, onSignOut }) {
  const [incomePlan, setIncomePlan] = useState({ amount: "", period: "monthly" });
  const [transactions, setTransactions] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Sync latest transactions and income plan from PostgreSQL backend on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Run one-time safe migration from legacy browser localStorage to backend PostgreSQL
        await transactionService.migrateLegacyTransactions(user.id);
        await settingsService.migrateLegacySettings(user.id);

        // Fetch user's persistent transactions directly from PostgreSQL
        const serverTx = await transactionService.fetchUserTransactions();
        if (isMounted && Array.isArray(serverTx)) {
          setTransactions(serverTx);
        }

        // Fetch income plan directly from PostgreSQL
        const plan = await settingsService.getIncomePlan();
        if (isMounted && plan) {
          setIncomePlan(plan);
        }
      } catch (err) {
        console.error("[AuthenticatedApp] Error loading user data from backend:", err);
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  async function saveIncomePlan(nextPlan) {
    setIncomePlan(nextPlan);
    try {
      await settingsService.saveIncomePlan(nextPlan);
    } catch (err) {
      console.error("[AuthenticatedApp] Failed to save income plan to backend:", err);
    }
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
          {isLoadingData ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-midnight/20 border-t-aurora" />
                <p className="mt-3 text-xs font-semibold text-midnight/60">
                  Loading your financial data...
                </p>
              </div>
            </div>
          ) : (
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
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
