"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
