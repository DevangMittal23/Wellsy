"use server";

import { createClient } from "@/lib/supabase/server";

const NOTIFICATIONS_PER_PAGE = 20;

export async function getNotifications(cursor?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { notifications: [], hasMore: false };

  let query = supabase
    .from("notifications")
    .select(
      `
      *,
      actor:actor_id (
        id, username, display_name, avatar_url, is_online
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_PER_PAGE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: notifications, error } = await query;

  if (error || !notifications) return { notifications: [], hasMore: false };

  return {
    notifications,
    hasMore: notifications.length === NOTIFICATIONS_PER_PAGE,
  };
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { success: true };
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return { success: true };
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count || 0;
}

export async function createNotification(data: {
  userId: string;
  actorId: string;
  type: string;
  entityType?: string;
  entityId?: string;
  content?: string;
}) {
  // Don't notify yourself
  if (data.userId === data.actorId) return;

  const supabase = await createClient();

  await supabase.from("notifications").insert({
    user_id: data.userId,
    actor_id: data.actorId,
    type: data.type,
    entity_type: data.entityType || null,
    entity_id: data.entityId || null,
    content: data.content || null,
  });
}
