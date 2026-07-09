"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types";

export function useAuth() {
  const { user, isLoading, setUser, setLoading, reset } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const getInitialUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single();

          setUser(profile as User | null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    getInitialUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser(profile as User | null);
      } else if (event === "SIGNED_OUT") {
        reset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setLoading, reset]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    reset();
  }, [supabase, reset]);

  return { user, isLoading, signOut };
}
