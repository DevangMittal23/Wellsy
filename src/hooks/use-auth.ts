"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Profile } from "@/types/user";

export function useAuth() {
  const { user, isLoading, setUser, setLoading, reset } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        setUser(profile as Profile | null);
      } else {
        setUser(null);
      }
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setUser(profile as Profile | null);
      } else if (event === "SIGNED_OUT") {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, reset]);

  return { user, isLoading };
}
