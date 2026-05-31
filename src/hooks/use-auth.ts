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
      try {
        setLoading(true);
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (authUser) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

          if (profileError || !profile) {
            // Auto backfill profile if missing
            const displayName = authUser.user_metadata?.display_name || "User";
            const username = authUser.user_metadata?.username || `user_${authUser.id.substring(0, 8)}`;
            
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: authUser.id,
                username: username.toLowerCase(),
                display_name: displayName,
                email: authUser.email?.toLowerCase(),
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error backfilling profile:", insertError.message);
              setUser(null);
            } else {
              setUser(newProfile as Profile | null);
            }
          } else {
            setUser(profile as Profile | null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error in useAuth.getUser:", err);
        setUser(null);
      }
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileError || !profile) {
            const displayName = session.user.user_metadata?.display_name || "User";
            const username = session.user.user_metadata?.username || `user_${session.user.id.substring(0, 8)}`;

            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                username: username.toLowerCase(),
                display_name: displayName,
                email: session.user.email?.toLowerCase(),
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error backfilling profile on state change:", insertError.message);
              setUser(null);
            } else {
              setUser(newProfile as Profile | null);
            }
          } else {
            setUser(profile as Profile | null);
          }
        } catch (err) {
          console.error("Error checking profile on auth state change:", err);
          setUser(null);
        }
      } else if (event === "SIGNED_OUT") {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, reset]);

  return { user, isLoading };
}
