"use server";

import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/types";

export async function getActiveStories(): Promise<
  { author: { id: string; username: string; display_name: string; avatar_url: string | null }; stories: Story[] }[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: stories, error } = await supabase
    .from("stories")
    .select("*, author:users!stories_author_id_fkey(*)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !stories) return [];

  // Check which stories the current user has viewed
  const storyIds = stories.map((s) => s.id);
  const { data: views } = await supabase
    .from("story_views")
    .select("story_id")
    .eq("viewer_id", user.id)
    .in("story_id", storyIds);

  const viewedSet = new Set(views?.map((v) => v.story_id) || []);

  // Group stories by author
  const authorMap = new Map<
    string,
    {
      author: { id: string; username: string; display_name: string; avatar_url: string | null };
      stories: Story[];
    }
  >();

  stories.forEach((story) => {
    const enrichedStory = {
      ...story,
      is_viewed: viewedSet.has(story.id),
    } as Story;

    if (!authorMap.has(story.author_id)) {
      authorMap.set(story.author_id, {
        author: story.author as { id: string; username: string; display_name: string; avatar_url: string | null },
        stories: [],
      });
    }
    authorMap.get(story.author_id)!.stories.push(enrichedStory);
  });

  // Put current user's stories first
  const result = Array.from(authorMap.values());
  result.sort((a, b) => {
    if (a.author.id === user.id) return -1;
    if (b.author.id === user.id) return 1;
    return 0;
  });

  return result;
}

export async function createStory(data: {
  media_url: string;
  media_type: "image" | "video";
  caption?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: story, error } = await supabase
    .from("stories")
    .insert({
      author_id: user.id,
      media_url: data.media_url,
      media_type: data.media_type,
      caption: data.caption || null,
    })
    .select("*, author:users!stories_author_id_fkey(*)")
    .single();

  if (error) return { error: error.message };
  return { story: story as Story };
}

export async function viewStory(storyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Upsert — don't fail if already viewed
  await supabase.from("story_views").upsert(
    {
      story_id: storyId,
      viewer_id: user.id,
    },
    { onConflict: "story_id,viewer_id" }
  );
}

export async function deleteStory(storyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", storyId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
