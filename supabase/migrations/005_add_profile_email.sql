-- ============================================
-- WELLSY: Username-based login support
-- ============================================

-- Add email column to profiles table
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for fast username→email lookup during login
CREATE INDEX IF NOT EXISTS idx_profiles_email 
    ON public.profiles(email);

-- Update the handle_new_user() trigger to also store the email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'username', LOWER(REPLACE(NEW.raw_user_meta_data ->> 'display_name', ' ', '')) || SUBSTR(NEW.id::text, 1, 4)),
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'User'),
        NEW.raw_user_meta_data ->> 'avatar_url',
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Backfill email for any existing users that don't have it set
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND (p.email IS NULL OR p.email = '');

-- Create a secure function to get email by username (callable by anon users for login)
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- First try the profiles table
    SELECT p.email INTO user_email
    FROM public.profiles p
    WHERE p.username = LOWER(lookup_username)
    LIMIT 1;
    
    -- If not found in profiles, try auth.users directly
    IF user_email IS NULL THEN
        SELECT u.email INTO user_email
        FROM auth.users u
        INNER JOIN public.profiles p ON p.id = u.id
        WHERE p.username = LOWER(lookup_username)
        LIMIT 1;
    END IF;
    
    RETURN user_email;
END;
$$;
