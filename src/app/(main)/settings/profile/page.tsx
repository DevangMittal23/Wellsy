import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { EditProfileForm } from "@/components/profile/edit-profile-form";

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Edit your HUDdang profile — update your avatar, username, display name, and bio.",
};

export default async function EditProfilePage() {
  const profile = await getCurrentUser();

  if (!profile) {
    redirect("/login");
  }

  return <EditProfileForm profile={profile} />;
}
