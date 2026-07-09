"use server";

import { createClient } from "@/lib/supabase/server";
import type { Comment } from "@/types";

export async function getPostComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*, author:users!comments_author_id_fkey(*)")
    .eq("post_id", postId)
    .is("parent_comment_id", null)
    .order("created_at", { ascending: true });

  if (error || !comments) return [];

  // Get replies for each comment
  const commentIds = comments.map((c) => c.id);
  const { data: replies } = await supabase
    .from("comments")
    .select("*, author:users!comments_author_id_fkey(*)")
    .in("parent_comment_id", commentIds)
    .order("created_at", { ascending: true });

  // Check likes for current user
  let likedSet = new Set<string>();
  if (user) {
    const allIds = [...commentIds, ...(replies?.map((r) => r.id) || [])];
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", allIds);
    likedSet = new Set(likes?.map((l) => l.comment_id) || []);
  }

  const replyMap = new Map<string, Comment[]>();
  replies?.forEach((reply) => {
    const parentId = reply.parent_comment_id!;
    if (!replyMap.has(parentId)) replyMap.set(parentId, []);
    replyMap.get(parentId)!.push({
      ...reply,
      is_liked: likedSet.has(reply.id),
    } as Comment);
  });

  return comments.map((comment) => ({
    ...comment,
    is_liked: likedSet.has(comment.id),
    replies: replyMap.get(comment.id) || [],
  })) as Comment[];
}

export async function createComment(
  postId: string,
  content: string,
  parentCommentId?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
      parent_comment_id: parentCommentId || null,
    })
    .select("*, author:users!comments_author_id_fkey(*)")
    .single();

  if (error) return { error: error.message };

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
      type: "post_comment",
      entity_type: "post",
      entity_id: postId,
      body: `commented: "${content.slice(0, 100)}"`,
    });
  }

  // If this is a reply, notify the parent comment author
  if (parentCommentId) {
    const { data: parentComment } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", parentCommentId)
      .single();

    if (parentComment && parentComment.author_id !== user.id) {
      await supabase.from("notifications").insert({
        recipient_id: parentComment.author_id,
        actor_id: user.id,
        type: "comment_reply",
        entity_type: "comment",
        entity_id: parentCommentId,
        body: `replied: "${content.slice(0, 100)}"`,
      });
    }
  }

  return { comment: { ...comment, is_liked: false, replies: [] } as Comment };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function likeComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
    return { action: "unliked" };
  }

  const { error } = await supabase.from("comment_likes").insert({
    comment_id: commentId,
    user_id: user.id,
  });

  if (error) return { error: error.message };

  // Notify comment author
  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .single();

  if (comment && comment.author_id !== user.id) {
    await supabase.from("notifications").insert({
      recipient_id: comment.author_id,
      actor_id: user.id,
      type: "comment_like",
      entity_type: "comment",
      entity_id: commentId,
      body: "liked your comment",
    });
  }

  return { action: "liked" };
}
