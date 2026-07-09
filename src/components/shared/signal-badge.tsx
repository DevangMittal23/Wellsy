"use client";

import { motion } from "framer-motion";
import { useSignalScore } from "@/hooks/use-signal-score";
import { SIGNAL_TIER_CONFIG } from "@/types";
import type { SignalTier } from "@/types";
import { getSignalTier } from "@/types";

interface SignalBadgeProps {
  userId: string;
  variant?: "compact" | "full";
  // Allow passing score directly to avoid opening a realtime channel
  staticScore?: number;
}

export function SignalBadge({
  userId,
  variant = "compact",
  staticScore,
}: SignalBadgeProps) {
  // Always call hook (Rules of Hooks) — pass empty string when using static score
  // so the hook's internal guard skips the fetch/subscription
  const hookResult = useSignalScore(staticScore !== undefined ? "" : userId);

  const score = staticScore !== undefined ? staticScore : hookResult.score;
  const tier: SignalTier =
    staticScore !== undefined ? getSignalTier(staticScore) : hookResult.tier;
  const loading = staticScore !== undefined ? false : hookResult.loading;

  const config = SIGNAL_TIER_CONFIG[tier];

  if (loading) return null;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor:
              config.ringColor === "transparent" ? "#4A4A54" : config.ringColor,
          }}
        />
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: config.textColor }}
        >
          {score}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
      <motion.span
        key={score}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-lg font-bold tabular-nums font-display"
        style={{ color: config.textColor }}
      >
        {score}
      </motion.span>
      <span className="text-xs text-text-muted uppercase tracking-wide">
        {config.label}
      </span>
    </div>
  );
}

