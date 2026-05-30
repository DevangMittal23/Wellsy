-- ============================================
-- WELLSY Database Functions & Triggers
-- ============================================

-- 1. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'username', LOWER(REPLACE(NEW.raw_user_meta_data ->> 'display_name', ' ', '')) || SUBSTR(NEW.id::text, 1, 4)),
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'User'),
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
END;
$$;

-- Trigger: create profile after auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Update post counts on profiles
CREATE OR REPLACE FUNCTION public.update_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_post_change ON public.posts;
CREATE TRIGGER on_post_change
    AFTER INSERT OR DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_post_count();

-- 3. Update like counts on posts
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
        UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_like_count();

-- 4. Update comment counts on posts
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();

-- 5. Update save counts on posts
CREATE OR REPLACE FUNCTION public.update_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_save_change ON public.saved_posts;
CREATE TRIGGER on_save_change
    AFTER INSERT OR DELETE ON public.saved_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_save_count();

-- 6. Update follower/following counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- 7. Increment hashtag usage count (RPC)
CREATE OR REPLACE FUNCTION public.increment_hashtag_count(tag_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    UPDATE public.hashtags SET usage_count = usage_count + 1 WHERE id = tag_id;
END;
$$;

-- 8. Update friends count
CREATE OR REPLACE FUNCTION public.update_friends_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles SET friends_count = friends_count + 1 WHERE id = NEW.user_id;
        UPDATE public.profiles SET friends_count = friends_count + 1 WHERE id = NEW.friend_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles SET friends_count = GREATEST(friends_count - 1, 0) WHERE id = OLD.user_id;
        UPDATE public.profiles SET friends_count = GREATEST(friends_count - 1, 0) WHERE id = OLD.friend_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_friend_change ON public.friends;
CREATE TRIGGER on_friend_change
    AFTER INSERT OR DELETE ON public.friends
    FOR EACH ROW EXECUTE FUNCTION public.update_friends_count();
