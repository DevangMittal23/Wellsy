import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/actions/profile-actions";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import type { Profile } from "@/types/user";

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Edit your WELLSY profile — update your avatar, bio, skills, and more.",
};

export default async function EditProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return <EditProfileForm profile={profile as Profile} />;
}
