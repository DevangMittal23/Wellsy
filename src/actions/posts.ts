"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Post, PostVisibility } from "@/types";
import { POSTS_PER_PAGE } from "@/lib/constants";

export async function getFeedPosts(
  cursor?: string
): Promise<{ posts: Post[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { posts: [], hasMore: false };

  let query = supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(*)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(POSTS_PER_PAGE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;

  if (error || !posts) return { posts: [], hasMore: false };

  const postIds = posts.map((p) => p.id);

  // Check likes and bookmarks for current user
  const [{ data: likes }, { data: bookmarks }] = await Promise.all([
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
    supabase
      .from("post_bookmarks")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
  ]);

  const likedSet = new Set(likes?.map((l) => l.post_id) || []);
  const bookmarkedSet = new Set(bookmarks?.map((b) => b.post_id) || []);

  const enriched = posts.map((post) => ({
    ...post,
    is_liked: likedSet.has(post.id),
    is_bookmarked: bookmarkedSet.has(post.id),
  })) as Post[];

  return {
    posts: enriched,
    hasMore: posts.length === POSTS_PER_PAGE,
  };
}

export async function getUserPosts(
  userId: string,
  cursor?: string
): Promise<{ posts: Post[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(*)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(POSTS_PER_PAGE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;

  if (error || !posts) return { posts: [], hasMore: false };

  let enriched = posts as Post[];
  if (user && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const [{ data: likes }, { data: bookmarks }] = await Promise.all([
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
      supabase
        .from("post_bookmarks")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
    ]);

    const likedSet = new Set(likes?.map((l) => l.post_id) || []);
    const bookmarkedSet = new Set(bookmarks?.map((b) => b.post_id) || []);

    enriched = posts.map((post) => ({
      ...post,
      is_liked: likedSet.has(post.id),
      is_bookmarked: bookmarkedSet.has(post.id),
    })) as Post[];
  }

  return {
    posts: enriched,
    hasMore: posts.length === POSTS_PER_PAGE,
  };
}

export async function createPost(data: {
  content?: string;
  media_urls?: string[];
  media_types?: string[];
  visibility?: PostVisibility;
  link_url?: string | null;
  link_preview?: Record<string, string> | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  if (!data.content && (!data.media_urls || data.media_urls.length === 0)) {
    return { error: "Post must have content or media" };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content: data.content || null,
      media_urls: data.media_urls || [],
      media_types: data.media_types || [],
      visibility: data.visibility || "public",
      link_url: data.link_url || null,
      link_preview: data.link_preview || null,
    })
    .select("*, author:users!posts_author_id_fkey(*)")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/feed");
  return {
    post: {
      ...post,
      is_liked: false,
      is_bookmarked: false,
    } as Post,
  };
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
    .eq("author_id", user.id);

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

  const { error } = await supabase.from("post_likes").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already liked" };
    return { error: error.message };
  }

  // Notify post author
  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (post && post.author_id !== user.id) {
    await supabase.from("notifications").insert({
      recipient_id: post.author_id,
      actor_id: user.id,
      type: "post_like",
      entity_type: "post",
      entity_id: postId,
      body: "liked your post",
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
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  return { success: true };
}

export async function bookmarkPost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("post_bookmarks").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already bookmarked" };
    return { error: error.message };
  }

  return { success: true };
}

export async function unbookmarkPost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("post_bookmarks")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  return { success: true };
}

export async function getBookmarkedPosts(): Promise<{
  posts: Post[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { posts: [] };

  const { data: bookmarkRefs } = await supabase
    .from("post_bookmarks")
    .select("post_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!bookmarkRefs || bookmarkRefs.length === 0) return { posts: [] };

  const postIds = bookmarkRefs.map((b) => b.post_id);

  const { data: posts } = await supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(*)")
    .in("id", postIds);

  if (!posts) return { posts: [] };

  const [{ data: likes }] = await Promise.all([
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds),
  ]);

  const likedSet = new Set(likes?.map((l) => l.post_id) || []);
  const enriched = posts.map((post) => ({
    ...post,
    is_liked: likedSet.has(post.id),
    is_bookmarked: true,
  })) as Post[];

  return { posts: enriched };
}
