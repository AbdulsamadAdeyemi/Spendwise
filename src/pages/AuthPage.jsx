import { useState, useEffect } from "react";
import { Eye, EyeOff, Wallet, X } from "lucide-react";
import { authService } from "../services/authService";

function AuthPage({ onAuthenticated }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [modalShowPassword, setModalShowPassword] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isSignUpModalOpen) {
        setIsSignUpModalOpen(false);
        setErrorMessage("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSignUpModalOpen]);

  async function handleLogin(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());

    try {
      const user = await authService.login(body);
      onAuthenticated(user);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to log in. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());

    try {
      const user = await authService.register(body);
      setIsSignUpModalOpen(false);
      onAuthenticated(user);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please check the form."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8 text-midnight sm:px-6 lg:px-8">
      {/* Facebook 2-column Container */}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
        {/* Left Column: Brand & Tagline */}
        <div className="text-center lg:col-span-7 lg:text-left lg:pr-8">
          <div className="inline-flex items-center gap-3 lg:gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-midnight text-aurora shadow-md sm:h-14 sm:w-14">
              <Wallet size={28} strokeWidth={2.3} className="sm:size-8" />
            </div>
            <span className="font-display text-4xl font-black tracking-tight text-midnight sm:text-5xl lg:text-[54px]">
              Spend<span className="text-aurora">Wise</span>
            </span>
          </div>
          <p className="mx-auto mt-4 max-w-md text-lg font-medium leading-relaxed text-midnight/80 sm:text-2xl sm:leading-normal lg:mx-0 lg:mt-5 lg:max-w-lg lg:text-[26px]">
            SpendWise helps you track expenses, manage budgets, and take total
            control of your financial freedom.
          </p>
        </div>

        {/* Right Column: Facebook-style Auth Box */}
        <div className="mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div className="rounded-2xl border border-midnight/10 bg-ice-white p-5 shadow-[0_8px_30px_rgba(36,28,22,0.08)] sm:p-7">
            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email Address */}
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  maxLength={254}
                  required
                  className="w-full rounded-xl border border-midnight/15 bg-white px-4 py-3.5 text-base text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  minLength={8}
                  maxLength={128}
                  required
                  className="w-full rounded-xl border border-midnight/15 bg-white px-4 py-3.5 pr-11 text-base text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 rounded-lg p-1.5 text-midnight/40 transition hover:text-midnight focus:outline-none focus:ring-2 focus:ring-aurora"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && !isSignUpModalOpen && (
                <div
                  role="alert"
                  className="rounded-xl border border-expense/20 bg-expense/10 px-3.5 py-2.5 text-sm font-medium text-expense"
                >
                  {errorMessage}
                </div>
              )}

              {/* Facebook-style Log In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-midnight py-3.5 text-base font-bold text-ice-white shadow-sm transition hover:bg-midnight/90 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-aurora focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Logging in..." : "Log In"}
              </button>

              {/* Forgotten Password Link */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "SpendWise accounts are stored only in this browser. There is no password reset; clearing browser site data removes local accounts and records."
                    )
                  }
                  className="text-xs font-medium text-aurora transition hover:underline focus:outline-none sm:text-sm"
                >
                  Forgotten password?
                </button>
              </div>

              {/* Facebook Divider */}
              <div className="my-4 border-t border-midnight/15" />

              {/* Create new account Button - SpendWise aurora color convention */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setIsSignUpModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-aurora px-6 py-3.5 text-base font-bold text-white shadow-md shadow-aurora/25 transition hover:bg-[#b55e24] active:scale-95 focus:outline-none focus:ring-2 focus:ring-aurora focus:ring-offset-2"
                >
                  Create new account
                </button>
              </div>
            </form>
          </div>

          {/* Subtle subtext below card */}
          <p className="mt-6 text-center text-xs text-midnight/70 sm:text-sm">
            <strong className="font-semibold text-midnight">
              SpendWise Ledger
            </strong>{" "}
            — smart, private expense tracking & budgeting for your financial peace.
          </p>
        </div>
      </div>

      {/* Facebook-style "Sign Up" Modal Dialog */}
      {isSignUpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-up-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/60 p-4 backdrop-blur-[2px]"
          onClick={() => {
            setIsSignUpModalOpen(false);
            setErrorMessage("");
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-midnight/15 bg-ice-white shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-midnight/10 p-4 sm:p-5">
              <div>
                <h2
                  id="sign-up-title"
                  className="font-display text-2xl font-bold tracking-tight text-midnight sm:text-3xl"
                >
                  Sign Up
                </h2>
                <p className="mt-0.5 text-xs text-midnight/65 sm:text-sm">
                  It’s quick and easy.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close sign up dialog"
                onClick={() => {
                  setIsSignUpModalOpen(false);
                  setErrorMessage("");
                }}
                className="rounded-full p-1.5 text-midnight/50 transition hover:bg-midnight/10 hover:text-midnight focus:outline-none focus:ring-2 focus:ring-aurora"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form className="space-y-3.5 p-4 sm:p-5" onSubmit={handleRegister}>
              {/* First Name & Last Name (Facebook 2-column row) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="First name"
                    maxLength={60}
                    required
                    className="w-full rounded-xl border border-midnight/15 bg-white px-3.5 py-2.5 text-sm text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                  />
                </div>
                <div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Surname"
                    maxLength={60}
                    required
                    className="w-full rounded-xl border border-midnight/15 bg-white px-3.5 py-2.5 text-sm text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <input
                  id="regEmail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  maxLength={254}
                  required
                  className="w-full rounded-xl border border-midnight/15 bg-white px-3.5 py-2.5 text-sm text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                />
              </div>

              {/* New Password with Eye Toggle */}
              <div className="relative flex items-center">
                <input
                  id="regPassword"
                  name="password"
                  type={modalShowPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="New password (min 8 characters)"
                  minLength={8}
                  maxLength={128}
                  required
                  className="w-full rounded-xl border border-midnight/15 bg-white px-3.5 py-2.5 pr-10 text-sm text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                />
                <button
                  type="button"
                  aria-label={modalShowPassword ? "Hide password" : "Show password"}
                  onClick={() => setModalShowPassword((visible) => !visible)}
                  className="absolute right-2.5 rounded-lg p-1 text-midnight/40 transition hover:text-midnight focus:outline-none focus:ring-2 focus:ring-aurora"
                >
                  {modalShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Optional Avatar URL */}
              <div>
                <input
                  id="profilePictureUrl"
                  name="profilePictureUrl"
                  type="url"
                  placeholder="Profile picture URL (optional https://...)"
                  maxLength={2048}
                  className="w-full rounded-xl border border-midnight/15 bg-white px-3.5 py-2.5 text-sm text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                />
              </div>

              {/* Terms / Disclaimer */}
              <p className="text-[11px] leading-relaxed text-midnight/60">
                By clicking Sign Up, you agree to our ledger terms. SpendWise
                stores your budget and expenses in this browser only. They are not protected by a server account.
              </p>

              {/* Error Message inside Modal */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-expense/20 bg-expense/10 px-3.5 py-2.5 text-xs font-medium text-expense"
                >
                  {errorMessage}
                </div>
              )}

              {/* SpendWise-styled Aurora Sign Up Button */}
              <div className="pt-2 text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-aurora px-12 py-2.5 text-base font-bold text-white shadow-md shadow-aurora/25 transition hover:bg-[#b55e24] active:scale-95 focus:outline-none focus:ring-2 focus:ring-aurora focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Creating..." : "Sign Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default AuthPage;
