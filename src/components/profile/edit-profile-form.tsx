"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, AtSign, FileText, ArrowLeft, Loader2, ImagePlus } from "lucide-react";
import { updateProfile } from "@/actions/users";
import { useUpload } from "@/hooks/use-upload";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { User as UserType } from "@/types";
import Link from "next/link";

interface EditProfileFormProps {
  profile: UserType;
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form fields
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);

  // Media upload
  const { uploadFile, isUploading, progress } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${profile.id}/avatar_${Date.now()}.${ext}`;
      
      const url = await uploadFile("avatars", fileName, file);
      if (url) {
        setAvatarUrl(url);
        toast.success("Avatar uploaded successfully! Save changes to apply.");
      }
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    if (!username.trim() || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateProfile({
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        });

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Profile updated successfully!");
          router.push(`/profile/${username.trim()}`);
          router.refresh();
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update profile");
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${profile.username}`}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Edit Profile</h1>
          <p className="text-sm text-text-muted">Customize your HUDdang identity</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center py-4 border-b border-border/20 gap-3">
          <div className="relative group rounded-full overflow-hidden">
            <UserAvatar src={avatarUrl} name={displayName} size="xl" className="ring-4 ring-border" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
            >
              <ImagePlus className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-bold">Change</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {isUploading && (
            <div className="w-40 bg-border h-1 rounded-full overflow-hidden">
              <div className="bg-accent h-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-text-muted" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
              placeholder="Display Name"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Username
          </label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-text-muted" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.slice(0, 30).replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="username"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            />
          </div>
          <p className="text-[10px] text-text-muted">Letters, numbers, and underscores only</p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Bio
            </label>
            <span className="text-[10px] text-text-muted">{bio.length}/160</span>
          </div>
          <div className="relative">
            <FileText className="absolute left-3 top-3.5 h-4.5 w-4.5 text-text-muted" />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder="Tell others about yourself..."
              rows={3}
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full font-semibold cursor-pointer"
          variant="glow"
          disabled={isPending || isUploading}
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-4.5 w-4.5 animate-spin" /> Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </div>
  );
}
