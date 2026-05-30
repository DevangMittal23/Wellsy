"use client";

import { useActionState, useState, useCallback } from "react";
import { signUp, checkUsernameAvailability, type AuthActionState } from "@/actions/auth-actions";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, Check, X } from "lucide-react";

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    signUp,
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [password, setPassword] = useState("");

  const checkUsername = useCallback(
    async (username: string) => {
      if (username.length < 3) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus("checking");
      const available = await checkUsernameAvailability(username);
      setUsernameStatus(available ? "available" : "taken");
    },
    []
  );

  // Debounced username check
  const handleUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const timeout = setTimeout(() => checkUsername(value), 500);
      return () => clearTimeout(timeout);
    },
    [checkUsername]
  );

  const passwordChecks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Contains letter", met: /[a-zA-Z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-text-primary">
          Create your account
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Join the community and start connecting
        </p>
      </div>

      <form action={action} className="space-y-4">
        {state?.error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-lg bg-error-muted px-4 py-3 text-sm text-error"
          >
            {state.error}
          </motion.div>
        )}

        {/* Display Name */}
        <div className="space-y-2">
          <label
            htmlFor="signup-name"
            className="text-sm font-medium text-text-secondary"
          >
            Display Name
          </label>
          <input
            id="signup-name"
            name="display_name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={50}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label
            htmlFor="signup-username"
            className="text-sm font-medium text-text-secondary"
          >
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
              @
            </span>
            <input
              id="signup-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_]+$"
              placeholder="username"
              onChange={handleUsernameChange}
              className="w-full rounded-lg border border-border bg-surface py-3 pl-8 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === "checking" && (
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
              )}
              {usernameStatus === "available" && (
                <Check className="h-4 w-4 text-success" />
              )}
              {usernameStatus === "taken" && (
                <X className="h-4 w-4 text-error" />
              )}
            </div>
          </div>
          {usernameStatus === "taken" && (
            <p className="text-xs text-error">Username is already taken</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="signup-email"
            className="text-sm font-medium text-text-secondary"
          >
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="signup-password"
            className="text-sm font-medium text-text-secondary"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {/* Password strength indicators */}
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap gap-2 pt-1"
            >
              {passwordChecks.map((check) => (
                <span
                  key={check.label}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                    check.met
                      ? "bg-success-muted text-success"
                      : "bg-surface text-text-muted"
                  }`}
                >
                  {check.met ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  {check.label}
                </span>
              ))}
            </motion.div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label
            htmlFor="signup-confirm"
            className="text-sm font-medium text-text-secondary"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="signup-confirm"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Confirm your password"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={pending || usernameStatus === "taken"}
          className="group relative w-full overflow-hidden rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </span>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Login link */}
      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
