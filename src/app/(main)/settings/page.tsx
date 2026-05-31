import type { Metadata } from "next";
import { getCurrentProfile } from "@/actions/profile-actions";
import { signOut } from "@/actions/auth-actions";
import {
  User,
  Shield,
  Bell,
  Palette,
  LogOut,
  ChevronRight,
  Edit3,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your WELLSY account settings.",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  const settingSections = [
    {
      icon: User,
      title: "Edit Profile",
      description: "Update your avatar, bio, skills, and more",
      href: "/settings/profile",
      accent: true,
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Control your privacy settings",
      href: null,
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure notification preferences",
      href: null,
    },
    {
      icon: Palette,
      title: "Appearance",
      description: "Customize your experience",
      href: null,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile summary card */}
      {profile && (
        <Link
          href="/settings/profile"
          className="group glass-card mb-6 flex items-center gap-4 p-5 transition-all duration-200 hover:shadow-xl hover:border-accent/20"
        >
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-border transition-all duration-200 group-hover:ring-accent/50"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-lg font-bold text-accent ring-2 ring-border transition-all duration-200 group-hover:ring-accent/50">
                {profile.display_name
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            {/* Edit badge */}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-md transition-transform group-hover:scale-110">
              <Edit3 className="h-3 w-3" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text-primary truncate">
              {profile.display_name}
            </p>
            <p className="text-sm text-text-muted truncate">@{profile.username}</p>
            <p className="text-xs text-text-muted truncate mt-0.5">
              {profile.bio || "Tap to add a bio ✨"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
        </Link>
      )}

      {/* Settings sections */}
      <div className="space-y-2">
        {settingSections.map((section) => {
          const content = (
            <>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  section.accent
                    ? "bg-accent-subtle group-hover:bg-accent-muted"
                    : "bg-surface"
                }`}
              >
                <section.icon
                  className={`h-5 w-5 transition-colors ${
                    section.accent
                      ? "text-accent"
                      : "text-text-secondary group-hover:text-text-primary"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {section.title}
                </p>
                <p className="text-xs text-text-muted">{section.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
            </>
          );

          const sharedClassName = `glass-card flex w-full items-center gap-4 p-4 text-left transition-all duration-200 hover:bg-surface-hover group ${
            section.accent ? "hover:border-accent/20" : ""
          }`;

          if (section.href) {
            return (
              <Link
                key={section.title}
                href={section.href}
                className={sharedClassName}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={section.title}
              className={`${sharedClassName} cursor-default opacity-60`}
              title="Coming soon"
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Sign out */}
      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/30 bg-error-muted px-4 py-3 text-sm font-medium text-error transition-all duration-200 hover:bg-error/20 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}
