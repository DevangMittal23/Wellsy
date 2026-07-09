"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { getSignalScoreHistory } from "@/actions/signal-score";
import type { SignalScoreHistory } from "@/types";

export function SignalScoreChart({ userId }: { userId: string }) {
  const [history, setHistory] = useState<SignalScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSignalScoreHistory(userId, 7)
      .then((data) => setHistory(data.reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || history.length < 2) return null; // Not enough data to show a trend

  const trending =
    history[history.length - 1].score >= history[0].score;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">7-day trend</span>
        <span
          className={`text-xs font-medium ${
            trending ? "text-green-400" : "text-red-400"
          }`}
        >
          {trending ? "↗ Rising" : "↘ Cooling"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={history}>
          <YAxis domain={[0, 1000]} hide />
          <Line
            type="monotone"
            dataKey="score"
            stroke={trending ? "#10B981" : "#EF4444"}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
