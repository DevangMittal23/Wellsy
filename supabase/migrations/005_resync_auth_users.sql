-- ============================================================
-- HUDdang — Migration 005: Re-sync auth users into public.users
-- ============================================================
-- This fixes the issue where the old public.users table was dropped
-- (along with all profile data) but auth.users still has existing accounts.
-- The handle_new_user trigger only fires on NEW signups, so existing
-- auth users need to be manually re-inserted.
-- ============================================================

INSERT INTO public.users (id, username, display_name, avatar_url)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', 'user_' || substr(au.id::text, 1, 8)),
  COALESCE(au.raw_user_meta_data->>'display_name', COALESCE(au.raw_user_meta_data->>'full_name', 'User')),
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;
