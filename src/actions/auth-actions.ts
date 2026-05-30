"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthActionState = {
  error?: string;
  success?: boolean;
  message?: string;
} | null;

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const username = formData.get("username") as string;

  if (!email || !password || !displayName || !username) {
    return { error: "All fields are required" };
  }

  // Check username availability
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username.toLowerCase())
    .single();

  if (existingUser) {
    return { error: "Username is already taken" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username: username.toLowerCase(),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/settings`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Check your email for a password reset link" };
}

export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username.toLowerCase())
    .single();

  return !data;
}
