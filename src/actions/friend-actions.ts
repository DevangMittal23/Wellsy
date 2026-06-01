"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notification-actions";

export type FriendshipStatus =
  | "none"
  | "friends"
  | "request_sent"
  | "request_received";

export async function checkFriendshipStatus(
  targetUserId: string
): Promise<FriendshipStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id === targetUserId) return "none";

  // Check if already friends
  const { data: friendship } = await supabase
    .from("friends")
    .select("id")
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle();

  if (friendship) return "friends";

  // Check if there's a pending request
  const { data: sentRequest } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("sender_id", user.id)
    .eq("receiver_id", targetUserId)
    .eq("status", "pending")
    .maybeSingle();

  if (sentRequest) return "request_sent";

  const { data: receivedRequest } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("sender_id", targetUserId)
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (receivedRequest) return "request_received";

  return "none";
}

export async function sendFriendRequest(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (user.id === targetUserId)
    return { error: "Cannot send request to yourself" };

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: user.id,
    receiver_id: targetUserId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "Request already sent" };
    return { error: error.message };
  }

  // Create notification
  await createNotification({
    userId: targetUserId,
    actorId: user.id,
    type: "friend_request",
    entityType: "friend_request",
  });

  return { success: true };
}

export async function acceptFriendRequest(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Get the request
  const { data: request, error: fetchError } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", requestId)
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .single();

  if (fetchError || !request) return { error: "Request not found" };

  // Update request status
  await supabase
    .from("friend_requests")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", requestId);

  // Create bidirectional friendship
  await supabase.from("friends").insert([
    { user_id: request.sender_id, friend_id: request.receiver_id },
    { user_id: request.receiver_id, friend_id: request.sender_id },
  ]);

  // Notify sender that their request was accepted
  await createNotification({
    userId: request.sender_id,
    actorId: user.id,
    type: "friend_accept",
    entityType: "friend_request",
    entityId: requestId,
  });

  revalidatePath("/notifications");
  return { success: true };
}

export async function rejectFriendRequest(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("friend_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("receiver_id", user.id);

  return { success: true };
}

export async function cancelFriendRequest(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("friend_requests")
    .delete()
    .eq("sender_id", user.id)
    .eq("receiver_id", targetUserId)
    .eq("status", "pending");

  return { success: true };
}

export async function removeFriend(friendUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Remove both directions
  await supabase
    .from("friends")
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${user.id})`
    );

  return { success: true };
}

export async function getPendingFriendRequests() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      `
      *,
      sender:sender_id (
        id, username, display_name, avatar_url, bio, is_online
      )
    `
    )
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getSuggestedPeople() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get IDs of users we already follow or are friends with
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const { data: friends } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", user.id);

  const { data: sentRequests } = await supabase
    .from("friend_requests")
    .select("receiver_id")
    .eq("sender_id", user.id)
    .eq("status", "pending");

  const excludeIds = new Set([
    user.id,
    ...(following?.map((f) => f.following_id) || []),
    ...(friends?.map((f) => f.friend_id) || []),
    ...(sentRequests?.map((r) => r.receiver_id) || []),
  ]);

  // Get profiles not in exclude list, ordered by follower count
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, is_online, followers_count")
    .order("followers_count", { ascending: false })
    .limit(20);

  if (error || !profiles) return [];

  // Filter out excluded users
  return profiles.filter((p) => !excludeIds.has(p.id));
}

export async function getFriends() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("friends")
    .select(`
      id,
      created_at,
      friend:friend_id (
        id, username, display_name, avatar_url, bio, is_online, last_seen
      )
    `)
    .eq("user_id", user.id);

  if (error || !data) return [];

  return data.map((f: any) => f.friend).filter(Boolean);
}
