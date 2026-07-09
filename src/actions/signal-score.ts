"use server";

import { createClient } from "@/lib/supabase/server";
import type { SignalScoreHistory, User } from "@/types";

export async function getSignalScore(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("signal_score")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data.signal_score ?? 0;
}

export async function getSignalScoreHistory(
  userId: string,
  days = 7
): Promise<SignalScoreHistory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("signal_score_history")
    .select("*")
    .eq("user_id", userId)
    .order("calculated_at", { ascending: false })
    .limit(days);

  if (error) throw new Error(error.message);
  return data as SignalScoreHistory[];
}

// For dev/testing only — manually trigger recalculation for current user
export async function recalculateMySignalScore(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("calculate_signal_score", {
    target_user_id: user.id,
  });

  if (error) throw new Error(error.message);
  return data as number;
}

// Get top users by signal score for Explore page "Blazing Right Now" section
export async function getTopSignalUsers(limit = 10): Promise<User[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("signal_score", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []) as User[];
}
