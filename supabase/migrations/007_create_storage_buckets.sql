-- ============================================
-- WELLSY: Storage Buckets & Policies Setup
-- ============================================

-- 1. Create standard storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- 3. SELECT POLICY: Allow public read access to all public buckets
DROP POLICY IF EXISTS "Public Select Access on Storage" ON storage.objects;
CREATE POLICY "Public Select Access on Storage"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'covers', 'posts'));

-- 4. INSERT POLICY: Allow authenticated users to upload objects
DROP POLICY IF EXISTS "Authenticated Insert Access on Storage" ON storage.objects;
CREATE POLICY "Authenticated Insert Access on Storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('avatars', 'covers', 'posts')
  -- Ensure that the first folder in the path matches the user's ID
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. UPDATE POLICY: Allow owners to update their own objects
DROP POLICY IF EXISTS "Owner Update Access on Storage" ON storage.objects;
CREATE POLICY "Owner Update Access on Storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('avatars', 'covers', 'posts')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. DELETE POLICY: Allow owners to delete their own objects
DROP POLICY IF EXISTS "Owner Delete Access on Storage" ON storage.objects;
CREATE POLICY "Owner Delete Access on Storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('avatars', 'covers', 'posts')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
