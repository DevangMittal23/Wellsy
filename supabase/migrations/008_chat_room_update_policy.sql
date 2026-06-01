-- ============================================
-- WELLSY: Add UPDATE policy on chat_rooms
-- ============================================

-- Recreate UPDATE policy for public.chat_rooms using our secure helper function
DROP POLICY IF EXISTS "Room members can update rooms" ON public.chat_rooms;
CREATE POLICY "Room members can update rooms"
    ON public.chat_rooms FOR UPDATE
    USING (
        public.is_room_member(id, auth.uid())
    )
    WITH CHECK (
        public.is_room_member(id, auth.uid())
    );
