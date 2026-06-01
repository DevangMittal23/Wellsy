"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notification-actions";

const POSTS_PER_PAGE = 10;

export async function getFeedPosts(cursor?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { posts: [], hasMore: false };

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      profiles!posts_user_id_fkey (
        id, username, display_name, avatar_url, is_online
      ),
      post_media (
        id, url, media_type, width, height, thumbnail_url, sort_order
      )
    `
    )
    .eq("is_draft", false)
    .order("created_at", { ascending: false })
    .limit(POSTS_PER_PAGE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;

  if (error || !posts) return { posts: [], hasMore: false };

  // Check likes and saves for current user
  const postIds = posts.map((p) => p.id);

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
    supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
  ]);

  const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
  const savedPostIds = new Set(saves?.map((s) => s.post_id) || []);

  const enrichedPosts = posts.map((post) => ({
    ...post,
    has_liked: likedPostIds.has(post.id),
    has_saved: savedPostIds.has(post.id),
  }));

  return {
    posts: enrichedPosts,
    hasMore: posts.length === POSTS_PER_PAGE,
  };
}

export async function getUserPosts(userId: string, cursor?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      profiles!posts_user_id_fkey (
        id, username, display_name, avatar_url, is_online
      ),
      post_media (
        id, url, media_type, width, height, thumbnail_url, sort_order
      )
    `
    )
    .eq("user_id", userId)
    .eq("is_draft", false)
    .order("created_at", { ascending: false })
    .limit(POSTS_PER_PAGE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error || !posts) return { posts: [], hasMore: false };

  let enrichedPosts = posts;
  if (user && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const [{ data: likes }, { data: saves }] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
      supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
    ]);

    const likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
    const savedPostIds = new Set(saves?.map((s) => s.post_id) || []);

    enrichedPosts = posts.map((post) => ({
      ...post,
      has_liked: likedPostIds.has(post.id),
      has_saved: savedPostIds.has(post.id),
    }));
  }

  return {
    posts: enrichedPosts,
    hasMore: posts.length === POSTS_PER_PAGE,
  };
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const content = formData.get("content") as string;
  const postType = (formData.get("post_type") as string) || "text";
  const mediaUrls = formData.getAll("media_urls") as string[];

  if (!content && mediaUrls.length === 0) {
    return { error: "Post must have content or media" };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content: content || null,
      post_type: postType,
    })
    .select(
      `
      *,
      profiles!posts_user_id_fkey (
        id, username, display_name, avatar_url, is_online
      )
    `
    )
    .single();

  if (error) return { error: error.message };

  // Insert media if any
  if (mediaUrls.length > 0) {
    const mediaInserts = mediaUrls.map((url, index) => ({
      post_id: post.id,
      url,
      media_type: postType === "video" ? "video" : "image",
      sort_order: index,
    }));

    await supabase.from("post_media").insert(mediaInserts);
  }

  // Extract and save hashtags
  const hashtagMatches = content?.match(/#[\w]+/g);
  if (hashtagMatches) {
    const tags = [...new Set(hashtagMatches.map((t) => t.slice(1).toLowerCase()))];
    for (const tag of tags) {
      const { data: existingTag } = await supabase
        .from("hashtags")
        .select("id")
        .eq("name", tag)
        .single();

      let hashtagId: string;
      if (existingTag) {
        hashtagId = existingTag.id;
        await supabase.rpc("increment_hashtag_count", { tag_id: hashtagId });
      } else {
        const { data: newTag } = await supabase
          .from("hashtags")
          .insert({ name: tag, usage_count: 1 })
          .select("id")
          .single();
        hashtagId = newTag!.id;
      }
      await supabase
        .from("post_hashtags")
        .insert({ post_id: post.id, hashtag_id: hashtagId });
    }
  }

  revalidatePath("/feed");
  return { post: { ...post, post_media: [], has_liked: false, has_saved: false } };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { success: true };
}

export async function likePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("likes").insert({
    user_id: user.id,
    post_id: postId,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already liked" };
    return { error: error.message };
  }

  // Create notification for post owner
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (post) {
    await createNotification({
      userId: post.user_id,
      actorId: user.id,
      type: "like",
      entityType: "post",
      entityId: postId,
    });
  }

  return { success: true };
}

export async function unlikePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("likes")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId);

  return { success: true };
}

export async function savePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("saved_posts").insert({
    user_id: user.id,
    post_id: postId,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already saved" };
    return { error: error.message };
  }

  return { success: true };
}

export async function unsavePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("saved_posts")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId);

  return { success: true };
}

export async function createComment(postId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const content = formData.get("content") as string;
  const parentId = formData.get("parent_id") as string | null;

  if (!content) return { error: "Comment cannot be empty" };

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_id: parentId || null,
    })
    .select(
      `
      *,
      profiles!comments_user_id_fkey (
        id, username, display_name, avatar_url
      )
    `
    )
    .single();

  if (error) return { error: error.message };

  // Create notification for post owner
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (post) {
    await createNotification({
      userId: post.user_id,
      actorId: user.id,
      type: "comment",
      entityType: "post",
      entityId: postId,
      content: content.slice(0, 100),
    });
  }

  revalidatePath("/feed");
  return { comment };
}

export async function getPostComments(postId: string) {
  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles!comments_user_id_fkey (
        id, username, display_name, avatar_url
      )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return comments;
}

export async function getLikedPosts(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { posts: [] };

  // Fetch liked post references
  const { data: likedRefs, error: refError } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId);

  if (refError || !likedRefs || likedRefs.length === 0) return { posts: [] };

  const postIds = likedRefs.map((l) => l.post_id);

  // Fetch actual posts
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles!posts_user_id_fkey (
        id, username, display_name, avatar_url, is_online
      ),
      post_media (
        id, url, media_type, width, height, thumbnail_url, sort_order
      )
    `
    )
    .in("id", postIds)
    .eq("is_draft", false)
    .order("created_at", { ascending: false });

  if (error || !posts) return { posts: [] };

  // Enrich with active like/save states for current logged in user
  const [{ data: userLikes }, { data: userSaves }] = await Promise.all([
    supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
    supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
  ]);

  const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);
  const savedPostIds = new Set(userSaves?.map((s) => s.post_id) || []);

  const enrichedPosts = posts.map((post) => ({
    ...post,
    has_liked: likedPostIds.has(post.id),
    has_saved: savedPostIds.has(post.id),
  }));

  return { posts: enrichedPosts };
}

export async function getSavedPosts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { posts: [] };

  // Fetch saved post references for the current user
  const { data: savedRefs, error: refError } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("user_id", user.id);

  if (refError || !savedRefs || savedRefs.length === 0) return { posts: [] };

  const postIds = savedRefs.map((s) => s.post_id);

  // Fetch actual posts
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles!posts_user_id_fkey (
        id, username, display_name, avatar_url, is_online
      ),
      post_media (
        id, url, media_type, width, height, thumbnail_url, sort_order
      )
    `
    )
    .in("id", postIds)
    .eq("is_draft", false)
    .order("created_at", { ascending: false });

  if (error || !posts) return { posts: [] };

  // Enrich with active states
  const [{ data: userLikes }, { data: userSaves }] = await Promise.all([
    supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
    supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
  ]);

  const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);
  const savedPostIds = new Set(userSaves?.map((s) => s.post_id) || []);

  const enrichedPosts = posts.map((post) => ({
    ...post,
    has_liked: likedPostIds.has(post.id),
    has_saved: savedPostIds.has(post.id),
  }));

  return { posts: enrichedPosts };
}

