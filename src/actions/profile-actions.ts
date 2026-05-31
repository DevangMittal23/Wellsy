"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notification-actions";

export async function getProfile(username: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) return null;
  return profile;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const updates: Record<string, unknown> = {};

  const displayName = formData.get("display_name") as string;
  if (displayName) updates.display_name = displayName;

  const bio = formData.get("bio") as string;
  if (bio !== null) updates.bio = bio || null;

  const location = formData.get("location") as string;
  if (location !== null) updates.location = location || null;

  const website = formData.get("website") as string;
  if (website !== null) updates.website = website || null;

  const skillsRaw = formData.get("skills") as string;
  if (skillsRaw) {
    updates.skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const interestsRaw = formData.get("interests") as string;
  if (interestsRaw) {
    updates.interests = interestsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/profile/${data.username}`);
  return { profile: data };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const file = formData.get("avatar") as File;
  if (!file) return { error: "No file provided" };

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return { url: publicUrl };
}

export async function followUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (user.id === targetUserId) return { error: "Cannot follow yourself" };

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: targetUserId,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already following" };
    return { error: error.message };
  }

  // Create notification for target user
  await createNotification({
    userId: targetUserId,
    actorId: user.id,
    type: "follow",
  });

  return { success: true };
}

export async function unfollowUser(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);

  return { success: true };
}

export async function checkFollowing(targetUserId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .single();

  return !!data;
}
