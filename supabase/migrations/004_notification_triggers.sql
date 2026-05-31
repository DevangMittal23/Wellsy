-- ============================================
-- WELLSY Phase 2: Search Indexes & Realtime
-- ============================================

-- Enable pg_trgm if available (for fuzzy search)
-- Note: Run this manually in Supabase SQL Editor if needed:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Additional indexes for chat performance
CREATE INDEX IF NOT EXISTS idx_messages_room_created
    ON public.messages(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_room_members_room_user
    ON public.room_members(room_id, user_id);

-- Notification indexes for fast reads
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications(user_id, is_read, created_at DESC)
    WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_actor
    ON public.notifications(actor_id);

-- Search indexes (ilike fallback - works without extensions)
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower
    ON public.profiles(LOWER(display_name));

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
    ON public.profiles(LOWER(username));

-- Enable Supabase Realtime for messages and notifications
-- Run these in Supabase SQL Editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
