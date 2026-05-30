"use client";

import { useActionState } from "react";
import { resetPassword, type AuthActionState } from "@/actions/auth-actions";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    resetPassword,
    null
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      {state?.success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-muted">
            <Mail className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {state.message}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Return to login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-text-primary">
              Reset your password
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Enter your email and we&apos;ll send you a reset link
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

            <div className="space-y-2">
              <label
                htmlFor="reset-email"
                className="text-sm font-medium text-text-secondary"
              >
                Email address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
              />
            </div>

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
                    Send reset link
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </form>
        </>
      )}
    </motion.div>
  );
}
