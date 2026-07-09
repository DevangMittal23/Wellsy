import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron fallback endpoint for Pulse + Signal Score scheduled jobs.
 *
 * This endpoint is only needed if pg_cron is NOT available on your Supabase plan.
 * It should be called by an external cron service (e.g. cron-job.org) every 15 minutes.
 *
 * Setup:
 * 1. Add CRON_SECRET to your .env.local (any random string)
 * 2. Set up a cron job to hit: GET /api/cron?secret=YOUR_CRON_SECRET
 *
 * What it does every 15 minutes:
 * - Expires stale pulses (where pulse_expires_at < now)
 *
 * What it does once daily (at the 3 AM UTC invocation):
 * - Recalculates all signal scores
 */

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: Record<string, string> = {};

  // Always expire stale pulses (runs every 15 min)
  try {
    const { error } = await supabase.rpc("expire_stale_pulses");
    results.pulse_cleanup = error ? `error: ${error.message}` : "ok";
  } catch (err) {
    results.pulse_cleanup = `exception: ${String(err)}`;
  }

  // Recalculate signal scores — only run once daily
  // Check if it's roughly 3 AM UTC (allow 15-min window: 02:45-03:15)
  const nowUTC = new Date();
  const hour = nowUTC.getUTCHours();
  const minute = nowUTC.getUTCMinutes();
  const isScoreWindow =
    (hour === 2 && minute >= 45) || (hour === 3 && minute <= 15);

  if (isScoreWindow) {
    try {
      const { error } = await supabase.rpc("calculate_all_signal_scores");
      results.signal_scores = error ? `error: ${error.message}` : "ok";
    } catch (err) {
      results.signal_scores = `exception: ${String(err)}`;
    }
  } else {
    results.signal_scores = "skipped (not in 3AM UTC window)";
  }

  return NextResponse.json({
    success: true,
    timestamp: nowUTC.toISOString(),
    results,
  });
}
