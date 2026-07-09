"use server";

import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";
import { NOTIFICATIONS_PER_PAGE } from "@/lib/constants";

export async function getNotifications(
  cursor?: string
): Promise<{ notifications: Notification[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { notifications: [], hasMore: false };

  let query = supabase
    .from("notifications")
    .select("*, actor:users!notifications_actor_id_fkey(*)")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_PER_PAGE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error || !data) return { notifications: [], hasMore: false };

  return {
    notifications: data as Notification[],
    hasMore: data.length === NOTIFICATIONS_PER_PAGE,
  };
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  return count || 0;
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function markAllRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };
  return { success: true };
}
