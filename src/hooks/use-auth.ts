"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Profile } from "@/types/user";

// Global singleton flags to ensure initialization runs exactly once per app session
let isInitializing = false;
let isInitialized = false;

export function useAuth() {
  const { user, isLoading, setUser, setLoading, reset } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserProfile(userId: string) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) return null;

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
            return null;
          }
          return newProfile as Profile;
        }
        return profile as Profile;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return null;
      }
    }

    async function initializeAuth() {
      if (isInitialized || isInitializing) return;
      isInitializing = true;
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error in useAuth initialization:", err);
        setUser(null);
      } finally {
        isInitializing = false;
        isInitialized = true;
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Avoid processing events until initial fetch is complete
      if (!isInitialized) return;

      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else if (event === "SIGNED_OUT") {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, reset]);

  return { user, isLoading };
}
