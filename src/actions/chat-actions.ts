"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MESSAGES_PER_PAGE = 30;

export async function getUserRooms() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get all rooms where the user is a member
  const { data: memberships, error: memberError } = await supabase
    .from("room_members")
    .select("room_id, last_read_at")
    .eq("user_id", user.id);

  if (memberError || !memberships || memberships.length === 0) return [];

  const roomIds = memberships.map((m) => m.room_id);
  const lastReadMap = new Map(
    memberships.map((m) => [m.room_id, m.last_read_at])
  );

  // Get rooms with their members' profiles
  const { data: rooms, error: roomError } = await supabase
    .from("chat_rooms")
    .select(
      `
      *,
      room_members (
        user_id,
        profiles:user_id (
          id, username, display_name, avatar_url, is_online
        )
      )
    `
    )
    .in("id", roomIds)
    .order("last_message_at", { ascending: false });

  if (roomError || !rooms) return [];

  // Deduplicate rooms: if there are multiple DM rooms with the same user, keep only the most active one
  const seenUsers = new Set<string>();
  const deduplicatedRooms: typeof rooms = [];

  for (const room of rooms) {
    const otherMember = room.room_members?.find(
      (m: { user_id: string }) => m.user_id !== user.id
    );

    if (!room.is_group && otherMember) {
      if (seenUsers.has(otherMember.user_id)) {
        // Skip duplicate empty or less active DM rooms with this user
        continue;
      }
      seenUsers.add(otherMember.user_id);
    }
    deduplicatedRooms.push(room);
  }

  // Get last message for each room
  const roomsWithPreview = await Promise.all(
    deduplicatedRooms.map(async (room) => {
      // Get last message
      const { data: lastMessages } = await supabase
        .from("messages")
        .select(
          `
          id, content, message_type, created_at, sender_id,
          profiles:sender_id (
            id, username, display_name, avatar_url
          )
        `
        )
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(1);

      // Get unread count
      const lastRead = lastReadMap.get(room.id);
      let unreadCount = 0;
      if (lastRead) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("room_id", room.id)
          .neq("sender_id", user.id)
          .gt("created_at", lastRead);
        unreadCount = count || 0;
      }

      // Find the other user in DMs
      const otherMember = room.room_members?.find(
        (m: { user_id: string }) => m.user_id !== user.id
      );

      return {
        ...room,
        last_message: lastMessages?.[0] || null,
        unread_count: unreadCount,
        other_user: otherMember?.profiles || null,
      };
    })
  );

  return roomsWithPreview;
}

export async function getOrCreateDMRoom(targetUserId: string) {
  const fs = require("fs");
  const logDebug = (msg: string) => {
    try {
      fs.appendFileSync("d:\\Desktop\\projects\\messenger\\chat-debug.log", `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {}
  };

  logDebug(`getOrCreateDMRoom called for targetUserId: ${targetUserId}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logDebug("Error: Unauthorized (no user)");
    return { error: "Unauthorized" };
  }
  
  logDebug(`Logged in user: ${user.id} (${user.email})`);
  if (user.id === targetUserId) {
    logDebug("Error: Cannot message yourself");
    return { error: "Cannot message yourself" };
  }

  // Check if a DM room already exists between these two users
  logDebug("Checking existing rooms for logged in user...");
  const { data: existingRooms, error: existError } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", user.id);

  if (existError) {
    logDebug(`Error fetching existing rooms: ${existError.message}`);
  }

  if (existingRooms && existingRooms.length > 0) {
    const userRoomIds = existingRooms.map((r) => r.room_id);
    logDebug(`Found user rooms: ${JSON.stringify(userRoomIds)}`);

    logDebug(`Checking shared rooms with target user ${targetUserId}...`);
    const { data: sharedRooms, error: sharedError } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("user_id", targetUserId)
      .in("room_id", userRoomIds);

    if (sharedError) {
      logDebug(`Error fetching shared rooms: ${sharedError.message}`);
    }

    if (sharedRooms && sharedRooms.length > 0) {
      logDebug(`Found shared rooms: ${JSON.stringify(sharedRooms)}`);
      // Check if any of these is a non-group room
      for (const sr of sharedRooms) {
        logDebug(`Checking room properties for room ${sr.room_id}...`);
        const { data: room, error: roomError } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("id", sr.room_id)
          .eq("is_group", false)
          .single();

        if (roomError) {
          logDebug(`Room query error for ${sr.room_id}: ${roomError.message}`);
        }

        if (room) {
          logDebug(`Found existing non-group DM room: ${room.id}. Returning.`);
          return { roomId: room.id };
        }
      }
    } else {
      logDebug("No shared rooms with target user.");
    }
  } else {
    logDebug("Logged in user has no existing chat rooms.");
  }

  // Create new DM room
  const roomId = crypto.randomUUID();
  logDebug(`Creating new DM room: ${roomId}...`);
  const { error: roomError } = await supabase
    .from("chat_rooms")
    .insert({
      id: roomId,
      is_group: false,
      created_by: user.id,
    });

  if (roomError) {
    logDebug(`Error creating new DM room: ${roomError.message}`);
    return { error: roomError.message };
  }

  logDebug(`Inserting room members for room ${roomId}: ${user.id} (admin) and ${targetUserId} (member)...`);
  // Add both users as members
  const { error: memberError } = await supabase.from("room_members").insert([
    { room_id: roomId, user_id: user.id, role: "admin" },
    { room_id: roomId, user_id: targetUserId, role: "member" },
  ]);

  if (memberError) {
    logDebug(`Error inserting room members: ${memberError.message}`);
    return { error: memberError.message };
  }

  logDebug(`Successfully created DM room: ${roomId}. Returning.`);
  return { roomId };
}

export async function getRoomMessages(roomId: string, cursor?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { messages: [], hasMore: false };

  // Verify user is a member of this room
  const { data: membership } = await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return { messages: [], hasMore: false };

  let query = supabase
    .from("messages")
    .select(
      `
      *,
      profiles:sender_id (
        id, username, display_name, avatar_url
      )
    `
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(MESSAGES_PER_PAGE);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: messages, error } = await query;

  if (error || !messages) return { messages: [], hasMore: false };

  return {
    messages: messages.reverse(),
    hasMore: messages.length === MESSAGES_PER_PAGE,
  };
}

export async function getRoomInfo(roomId: string) {
  const fs = require("fs");
  const logDebug = (msg: string) => {
    try {
      fs.appendFileSync("d:\\Desktop\\projects\\messenger\\chat-debug.log", `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {}
  };

  logDebug(`getRoomInfo called for roomId: ${roomId}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logDebug("getRoomInfo: No user found");
    return null;
  }

  logDebug(`getRoomInfo: Logged in user is ${user.id}`);

  // Verify membership and get room with members
  const { data: room, error: roomError } = await supabase
    .from("chat_rooms")
    .select(
      `
      *,
      room_members (
        user_id,
        role,
        profiles:user_id (
          id, username, display_name, avatar_url, is_online
        )
      )
    `
    )
    .eq("id", roomId)
    .single();

  if (roomError) {
    logDebug(`getRoomInfo: chat_rooms query error: ${roomError.message}`);
  }

  if (!room) {
    logDebug("getRoomInfo: Room not found in DB");
    return null;
  }

  logDebug(`getRoomInfo: Room found! Members: ${JSON.stringify(room.room_members?.map((m: any) => m.user_id))}`);

  // Check user is a member
  const isMember = room.room_members?.some(
    (m: { user_id: string }) => m.user_id === user.id
  );
  if (!isMember) {
    logDebug("getRoomInfo: User is not a member of this room");
    return null;
  }

  // Find other user for DM
  const otherMember = room.room_members?.find(
    (m: { user_id: string }) => m.user_id !== user.id
  );

  logDebug(`getRoomInfo: otherMember user_id is ${otherMember?.user_id || "null"}`);

  return {
    ...room,
    other_user: otherMember?.profiles || null,
    current_user_id: user.id,
  };
}

export async function sendMessage(roomId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const content = formData.get("content") as string;
  if (!content?.trim()) return { error: "Message cannot be empty" };

  // Insert message
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content: content.trim(),
      message_type: "text",
    })
    .select(
      `
      *,
      profiles:sender_id (
        id, username, display_name, avatar_url
      )
    `
    )
    .single();

  if (error) return { error: error.message };

  // Update room's last_message_at
  await supabase
    .from("chat_rooms")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", roomId);

  return { message };
}

export async function markRoomAsRead(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("room_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", user.id);
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getTotalUnreadMessages() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: memberships } = await supabase
    .from("room_members")
    .select("room_id, last_read_at")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) return 0;

  let total = 0;
  for (const m of memberships) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("room_id", m.room_id)
      .neq("sender_id", user.id)
      .gt("created_at", m.last_read_at);
    total += count || 0;
  }

  return total;
}
