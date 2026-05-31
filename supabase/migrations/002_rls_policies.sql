-- ============================================
-- WELLSY Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- POSTS
-- ============================================
CREATE POLICY "Published posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (is_draft = false OR user_id = auth.uid());

CREATE POLICY "Auth users can create posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- POST MEDIA
-- ============================================
CREATE POLICY "Post media viewable by everyone"
    ON public.post_media FOR SELECT
    USING (true);

CREATE POLICY "Auth users can insert post media"
    ON public.post_media FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own post media"
    ON public.post_media FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

-- ============================================
-- COMMENTS
-- ============================================
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Auth users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- LIKES
-- ============================================
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Auth users can like"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- SAVED POSTS
-- ============================================
CREATE POLICY "Users can view own saved posts"
    ON public.saved_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Auth users can save posts"
    ON public.saved_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
    ON public.saved_posts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- FOLLOWS
-- ============================================
CREATE POLICY "Follows are viewable by everyone"
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "Auth users can follow"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);

-- ============================================
-- HASHTAGS
-- ============================================
CREATE POLICY "Hashtags are viewable by everyone"
    ON public.hashtags FOR SELECT
    USING (true);

CREATE POLICY "Auth users can create hashtags"
    ON public.hashtags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update hashtag counts"
    ON public.hashtags FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- POST HASHTAGS
-- ============================================
CREATE POLICY "Post hashtags are viewable by everyone"
    ON public.post_hashtags FOR SELECT
    USING (true);

CREATE POLICY "Auth users can tag posts"
    ON public.post_hashtags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- FRIEND REQUESTS
-- ============================================
CREATE POLICY "Users can view their friend requests"
    ON public.friend_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Auth users can send friend requests"
    ON public.friend_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update friend requests"
    ON public.friend_requests FOR UPDATE
    USING (auth.uid() = receiver_id);

CREATE POLICY "Sender can delete friend requests"
    ON public.friend_requests FOR DELETE
    USING (auth.uid() = sender_id);

-- ============================================
-- FRIENDS
-- ============================================
CREATE POLICY "Users can view their friendships"
    ON public.friends FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Auth users can create friendships"
    ON public.friends FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can remove friendships"
    ON public.friends FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- CHAT ROOMS
-- ============================================
CREATE POLICY "Room members can view rooms"
    ON public.chat_rooms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Auth users can create rooms"
    ON public.chat_rooms FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- ============================================
-- ROOM MEMBERS
-- ============================================
CREATE POLICY "Room members can view members"
    ON public.room_members FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.chat_rooms cr
            WHERE cr.id = room_id
        )
    );

CREATE POLICY "Auth users can join rooms"
    ON public.room_members FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own membership"
    ON public.room_members FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES
-- ============================================
CREATE POLICY "Room members can view messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_id = messages.room_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Room members can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_id = messages.room_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = sender_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- BLOCKED USERS
-- ============================================
CREATE POLICY "Users can view own blocks"
    ON public.blocked_users FOR SELECT
    USING (auth.uid() = blocker_id);

CREATE POLICY "Auth users can block"
    ON public.blocked_users FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
    ON public.blocked_users FOR DELETE
    USING (auth.uid() = blocker_id);
