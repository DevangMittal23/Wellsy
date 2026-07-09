"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function RegisterForm() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsPending(true);
    const result = await signUp({
      email: data.email,
      password: data.password,
      username: data.username,
      display_name: data.display_name,
    });
    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Account created successfully! Check email for verification if required.");
      router.push("/login");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            {...register("username")}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            placeholder="johndoe"
          />
          {errors.username && (
            <p className="mt-1.5 text-xs text-error">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="display_name"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2"
          >
            Display Name
          </label>
          <input
            id="display_name"
            type="text"
            {...register("display_name")}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            placeholder="John Doe"
          />
          {errors.display_name && (
            <p className="mt-1.5 text-xs text-error">
              {errors.display_name.message}
            </p>
          )}
        </div>
      </div>

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
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-error">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1.5 text-xs text-error">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirm_password"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2"
        >
          Confirm Password
        </label>
        <input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          {...register("confirm_password")}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
          placeholder="••••••••"
        />
        {errors.confirm_password && (
          <p className="mt-1.5 text-xs text-error">
            {errors.confirm_password.message}
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
            <LoadingSpinner size="sm" /> Creating account...
          </span>
        ) : (
          "Register"
        )}
      </Button>

      <div className="text-center text-xs text-text-muted mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline hover:text-accent-hover">
          Sign in
        </Link>
      </div>
    </form>
  );
}
