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
  const confirmPassword = formData.get("confirmPassword") as string;
  const displayName = formData.get("display_name") as string;
  const username = formData.get("username") as string;

  if (!email || !password || !displayName || !username) {
    return { error: "All fields are required" };
  }

  if (confirmPassword && password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
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

  const { data, error } = await supabase.auth.signUp({
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

  // Store email on the profile so we can look it up by username during login
  if (data.user) {
    await supabase
      .from("profiles")
      .update({ email: email.toLowerCase() })
      .eq("id", data.user.id);
  }

  // Check if email confirmation is required
  // When confirmation is required, data.session will be null
  if (!data.session) {
    return {
      success: true,
      message: `Account created! We've sent a confirmation email to ${email.toLowerCase()}. Please check your inbox (and spam folder) to verify your account before logging in.`,
    };
  }

  // If we have a session immediately (no email confirmation required), redirect to feed
  revalidatePath("/", "layout");
  redirect("/feed");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Username/email and password are required" };
  }

  let email = identifier.trim();

  // If the input doesn't look like an email, treat it as a username
  if (!email.includes("@")) {
    const username = email.toLowerCase().replace(/^@/, "");

    // Try the secure RPC function first (can access auth.users directly)
    let resolvedEmail: string | null = null;

    const { data: rpcResult } = await supabase.rpc("get_email_by_username", {
      lookup_username: username,
    });

    if (rpcResult) {
      resolvedEmail = rpcResult as string;
    }

    // Fallback: try profiles table directly
    if (!resolvedEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", username)
        .single();

      resolvedEmail = profile?.email || null;
    }

    if (!resolvedEmail) {
      return { error: "No account found with that username" };
    }

    email = resolvedEmail;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === "Invalid login credentials") {
      return { error: "Incorrect username/email or password" };
    }
    if (error.message === "Email not confirmed") {
      return { error: "Please check your email to confirm your account first" };
    }
    return { error: error.message };
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
