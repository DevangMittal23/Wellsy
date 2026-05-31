"use server";

import { createClient } from "@/lib/supabase/server";

const RESULTS_PER_PAGE = 15;

export async function searchUsers(query: string, cursor?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { results: [], hasMore: false };
  if (!query.trim()) return { results: [], hasMore: false };

  const searchTerm = `%${query.trim()}%`;

  let dbQuery = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, is_online, followers_count")
    .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
    .order("followers_count", { ascending: false })
    .limit(RESULTS_PER_PAGE);

  if (cursor) {
    dbQuery = dbQuery.lt("followers_count", parseInt(cursor));
  }

  const { data, error } = await dbQuery;

  if (error || !data) return { results: [], hasMore: false };

  return {
    results: data,
    hasMore: data.length === RESULTS_PER_PAGE,
  };
}

export async function searchPosts(query: string, cursor?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { results: [], hasMore: false };
  if (!query.trim()) return { results: [], hasMore: false };

  const searchTerm = `%${query.trim()}%`;

  let dbQuery = supabase
    .from("posts")
    .select(
      `
      id, content, post_type, likes_count, comments_count, created_at,
      profiles:user_id (
        id, username, display_name, avatar_url
      )
    `
    )
    .ilike("content", searchTerm)
    .eq("is_draft", false)
    .order("created_at", { ascending: false })
    .limit(RESULTS_PER_PAGE);

  if (cursor) {
    dbQuery = dbQuery.lt("created_at", cursor);
  }

  const { data, error } = await dbQuery;

  if (error || !data) return { results: [], hasMore: false };

  return {
    results: data,
    hasMore: data.length === RESULTS_PER_PAGE,
  };
}

export async function searchHashtags(query: string) {
  const supabase = await createClient();

  if (!query.trim()) return [];

  const searchTerm = `%${query.trim().replace(/^#/, "")}%`;

  const { data, error } = await supabase
    .from("hashtags")
    .select("id, name, usage_count")
    .ilike("name", searchTerm)
    .order("usage_count", { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data;
}

export async function getTrendingHashtags() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hashtags")
    .select("id, name, usage_count")
    .order("usage_count", { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data;
}
