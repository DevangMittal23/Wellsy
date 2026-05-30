"use client";

import { useActionState } from "react";
import { signIn, type AuthActionState } from "@/actions/auth-actions";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    signIn,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-text-primary">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in to your account to continue
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

        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-text-secondary"
          >
            Email
          </label>
          <input
            id="login-email"
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
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-text-secondary"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
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
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="group relative w-full overflow-hidden rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </span>
          {/* Hover gradient effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Sign up link */}
      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Create one
        </Link>
      </p>
    </motion.div>
  );
}
