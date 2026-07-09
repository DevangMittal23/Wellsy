"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsPending(true);
    const result = await signIn(data);
    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Signed in successfully!");
      router.push("/feed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-error">{errors.email.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-accent hover:underline hover:text-accent-hover"
          >
            Forgot?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1.5 text-xs text-error">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        variant="glow"
        className="w-full font-semibold cursor-pointer"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size="sm" /> Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="text-center text-xs text-text-muted mt-4">
        New to HUDdang?{" "}
        <Link href="/signup" className="text-accent hover:underline hover:text-accent-hover">
          Create an account
        </Link>
      </div>
    </form>
  );
}
