"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PulseType } from "@/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  setPulse as setPulseAction,
  clearPulse as clearPulseAction,
} from "@/actions/pulse";
import { PULSE_CONFIG } from "@/types";
import { toast } from "sonner";

let channelCounter = 0;

export function usePulse(userId: string) {
  const [pulseType, setPulseType] = useState<PulseType | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Guard: don't subscribe for empty/missing userId
    if (!userId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchPulse = async () => {
      const { data } = await supabase
        .from("users")
        .select("pulse_type, pulse_expires_at")
        .eq("id", userId)
        .single();

      if (data) {
        const isExpired =
          data.pulse_expires_at &&
          new Date(data.pulse_expires_at) < new Date();
        setPulseType(isExpired ? null : (data.pulse_type as PulseType | null));
        setExpiresAt(isExpired ? null : data.pulse_expires_at);
      }
      setLoading(false);
    };
    fetchPulse();

    // Use a unique channel name per mount to avoid "cannot add callbacks after subscribe()" in Strict Mode
    const channelName = `pulse:${userId}:${++channelCounter}`;

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
          const isExpired =
            updated.pulse_expires_at &&
            new Date(updated.pulse_expires_at as string) < new Date();
          setPulseType(
            isExpired ? null : (updated.pulse_type as PulseType | null)
          );
          setExpiresAt(
            isExpired ? null : (updated.pulse_expires_at as string | null)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const updatePulse = useCallback(
    async (type: PulseType) => {
      try {
        const result = await setPulseAction(type);
        setPulseType(result.pulseType);
        setExpiresAt(result.expiresAt);
        toast.success(`Pulse set to ${PULSE_CONFIG[type].label} ${PULSE_CONFIG[type].emoji}`);
      } catch {
        toast.error("Could not update your Pulse");
      }
    },
    []
  );

  const removePulse = useCallback(async () => {
    try {
      await clearPulseAction();
      setPulseType(null);
      setExpiresAt(null);
      toast.success("Pulse cleared");
    } catch {
      toast.error("Could not clear your Pulse");
    }
  }, []);

  return { pulseType, expiresAt, loading, updatePulse, removePulse };
}

