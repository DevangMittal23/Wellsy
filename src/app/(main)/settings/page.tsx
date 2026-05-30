import type { Metadata } from "next";
import { getCurrentProfile } from "@/actions/profile-actions";
import { signOut } from "@/actions/auth-actions";
import { Settings, User, Shield, Bell, Palette, LogOut } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your WELLSY account settings.",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  const settingSections = [
    {
      icon: User,
      title: "Account",
      description: "Manage your account details",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Control your privacy settings",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure notification preferences",
    },
    {
      icon: Palette,
      title: "Appearance",
      description: "Customize your experience",
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

      {/* Profile summary */}
      {profile && (
        <div className="glass-card mb-6 flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-lg font-bold text-accent">
            {profile.display_name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-text-primary">
              {profile.display_name}
            </p>
            <p className="text-sm text-text-muted">@{profile.username}</p>
            <p className="text-xs text-text-muted">{profile.bio || "No bio set"}</p>
          </div>
        </div>
      )}

      {/* Settings sections */}
      <div className="space-y-2">
        {settingSections.map((section) => (
          <button
            key={section.title}
            className="glass-card flex w-full items-center gap-4 p-4 text-left transition-all duration-200 hover:bg-surface-hover"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface">
              <section.icon className="h-5 w-5 text-text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                {section.title}
              </p>
              <p className="text-xs text-text-muted">{section.description}</p>
            </div>
            <Settings className="h-4 w-4 text-text-muted" />
          </button>
        ))}
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
