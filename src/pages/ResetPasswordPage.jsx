import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Wallet, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { authService } from "../services/authService";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(() => Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState(() =>
    token ? "" : "No reset token provided. Please use the link sent to your email."
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    let isMounted = true;
    if (!token) {
      return;
    }

    authService
      .verifyResetToken(token)
      .then((res) => {
        if (!isMounted) return;
        if (res.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(res.error || "This reset link is invalid or has expired.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setTokenValid(false);
        setTokenError(err.message || "Failed to verify reset link.");
      })
      .finally(() => {
        if (isMounted) setIsVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleReset(e) {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, password });
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 text-midnight sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-midnight text-aurora shadow-md">
              <Wallet size={26} strokeWidth={2.3} />
            </div>
            <span className="font-display text-3xl font-black tracking-tight text-midnight sm:text-4xl">
              Spend<span className="text-aurora">Wise</span>
            </span>
          </Link>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-midnight/10 bg-ice-white p-6 shadow-[0_8px_30px_rgba(36,28,22,0.08)] sm:p-8">
          {isVerifying ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-3 border-midnight/20 border-t-aurora" />
              <p className="mt-3 text-sm font-medium text-midnight/70">
                Verifying your reset link...
              </p>
            </div>
          ) : !tokenValid ? (
            <div className="py-2 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-expense/10 text-expense">
                <AlertCircle size={28} />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-midnight">
                Invalid or Expired Link
              </h2>
              <p className="text-sm leading-relaxed text-midnight/70">
                {tokenError ||
                  "This password reset link is invalid or has expired. Password reset links expire after 15 minutes."}
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-xl bg-midnight px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-midnight/90 active:scale-95"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="py-2 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-income/10 text-income">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-midnight">
                Password Reset Complete
              </h2>
              <p className="text-sm leading-relaxed text-midnight/75">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full rounded-xl bg-aurora py-3 text-base font-bold text-white shadow-md shadow-aurora/25 transition hover:bg-[#b55e24] active:scale-95"
                >
                  Sign In to SpendWise
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold tracking-tight text-midnight sm:text-3xl">
                  New Password
                </h2>
                <p className="mt-1 text-sm text-midnight/65">
                  Enter your new password below. Must be at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                {/* New Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold uppercase tracking-wider text-midnight/70 mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                      className="w-full rounded-xl border border-midnight/15 bg-white px-4 py-3 text-base text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 rounded-lg p-1 text-midnight/40 transition hover:text-midnight"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-bold uppercase tracking-wider text-midnight/70 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-midnight/15 bg-white px-4 py-3 text-base text-midnight placeholder:text-midnight/40 outline-none transition focus:border-aurora focus:bg-white focus:ring-2 focus:ring-aurora/20"
                  />
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-xl border border-expense/20 bg-expense/10 px-3.5 py-2.5 text-xs font-medium text-expense"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-aurora py-3.5 text-base font-bold text-white shadow-md shadow-aurora/25 transition hover:bg-[#b55e24] active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting ? "Updating Password..." : "Update Password"}
                </button>
              </form>

              <div className="mt-6 border-t border-midnight/10 pt-4 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-midnight/65 hover:text-midnight hover:underline"
                >
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default ResetPasswordPage;
