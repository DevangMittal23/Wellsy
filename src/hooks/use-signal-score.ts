"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSignalTier } from "@/types";
import type { SignalTier } from "@/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

let channelCounter = 0;

export function useSignalScore(userId: string) {
  const [score, setScore] = useState<number>(0);
  const [tier, setTier] = useState<SignalTier>("quiet");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchScore = async () => {
      const { data } = await supabase
        .from("users")
        .select("signal_score")
        .eq("id", userId)
        .single();

      if (data) {
        setScore(data.signal_score ?? 0);
        setTier(getSignalTier(data.signal_score ?? 0));
      }
      setLoading(false);
    };
    fetchScore();

    const channelName = `signal:${userId}:${++channelCounter}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const updated = payload.new as Record<string, unknown>;
          if (updated.signal_score !== undefined) {
            const newScore = (updated.signal_score as number) ?? 0;
            setScore(newScore);
            setTier(getSignalTier(newScore));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { score, tier, loading };
}

