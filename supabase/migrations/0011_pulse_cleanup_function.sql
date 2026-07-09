-- ============================================================
-- Migration 0011: Pulse cleanup function + scheduled jobs
-- ============================================================

-- Auto-expire pulses that have passed their expiry time
CREATE OR REPLACE FUNCTION expire_stale_pulses()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET pulse_type = NULL, pulse_expires_at = NULL, pulse_set_at = NULL
  WHERE pulse_expires_at IS NOT NULL AND pulse_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SCHEDULED JOBS (requires pg_cron extension)
-- If pg_cron is not available on your Supabase plan, use the
-- API route fallback at /api/cron instead. See:
-- src/app/api/cron/route.ts
-- ============================================================

-- Uncomment the lines below if pg_cron is available:

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Recalculate signal scores daily at 3 AM UTC
-- SELECT cron.schedule(
--   'recalculate-signal-scores',
--   '0 3 * * *',
--   $$SELECT calculate_all_signal_scores();$$
-- );

-- Expire stale pulses every 15 minutes
-- SELECT cron.schedule(
--   'expire-stale-pulses',
--   '*/15 * * * *',
--   $$SELECT expire_stale_pulses();$$
-- );
