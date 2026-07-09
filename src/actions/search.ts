"use server";

import { createClient } from "@/lib/supabase/server";
import type { User, Post } from "@/types";

export async function getTrendingHashtags(limit: number = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hashtags")
    .select("*")
    .order("usage_count", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export async function searchUsers(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);

  if (error) return { results: [], error: error.message };
  return { results: data || [] };
}

export async function searchPosts(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(*)
    `)
    .ilike("content", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { results: [], error: error.message };

  // Format to match old client schema expectations if needed
  const formatted = (data || []).map((post) => ({
    ...post,
    profiles: post.author, // Fallback for old component expectations
  }));

  return { results: formatted };
}

export async function searchHashtags(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hashtags")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(20);

  if (error) return [];
  return data || [];
}
