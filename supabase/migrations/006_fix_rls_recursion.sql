-- ============================================
-- WELLSY: Fix RLS Infinite Recursion
-- ============================================

-- 1. Create a secure function to check room membership that bypasses RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_room_member(room_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.room_members rm
        WHERE rm.room_id = $1 AND rm.user_id = $2
    );
END;
$$;

-- Grant execution permissions to public (authenticated and anonymous users)
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID, UUID) TO public;

-- 2. Recreate policies for public.room_members
DROP POLICY IF EXISTS "Room members can view members" ON public.room_members;
CREATE POLICY "Room members can view members"
    ON public.room_members FOR SELECT
    USING (
        public.is_room_member(room_id, auth.uid())
    );

-- 3. Recreate policies for public.chat_rooms
DROP POLICY IF EXISTS "Room members can view rooms" ON public.chat_rooms;
CREATE POLICY "Room members can view rooms"
    ON public.chat_rooms FOR SELECT
    USING (
        public.is_room_member(id, auth.uid())
    );

-- 4. Recreate policies for public.messages
DROP POLICY IF EXISTS "Room members can view messages" ON public.messages;
CREATE POLICY "Room members can view messages"
    ON public.messages FOR SELECT
    USING (
        public.is_room_member(room_id, auth.uid())
    );

DROP POLICY IF EXISTS "Room members can send messages" ON public.messages;
CREATE POLICY "Room members can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        public.is_room_member(room_id, auth.uid())
    );
