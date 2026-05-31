"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  Globe,
  AtSign,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Hash,
  Code2,
  Briefcase,
} from "lucide-react";
import { updateProfile } from "@/actions/profile-actions";
import { AvatarUpload } from "./avatar-upload";
import { CoverUpload } from "./cover-upload";
import { TagInput } from "./tag-input";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/user";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EditProfileFormProps {
  profile: Profile;
}

const socialPlatforms = [
  { key: "twitter", label: "X / Twitter", icon: Hash, placeholder: "https://x.com/username" },
  { key: "github", label: "GitHub", icon: Code2, placeholder: "https://github.com/username" },
  { key: "linkedin", label: "LinkedIn", icon: Briefcase, placeholder: "https://linkedin.com/in/username" },
];

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    profile.social_links || {}
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile.avatar_url
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(profile.cover_url);

  const bioChars = bio.length;
  const maxBioChars = 300;

  const updateSocialLink = (key: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.set("display_name", displayName.trim());
    formData.set("bio", bio.trim());
    formData.set("location", location.trim());
    formData.set("website", website.trim());
    if (skills.length > 0) {
      formData.set("skills", skills.join(","));
    }
    if (interests.length > 0) {
      formData.set("interests", interests.join(","));
    }

    startTransition(async () => {
      const result = await updateProfile(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.push(`/profile/${profile.username}`);
          router.refresh();
        }, 1200);
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/profile/${profile.username}`}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Edit Profile</h1>
          <p className="text-sm text-text-secondary">
            Customize how others see you on WELLSY
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Cover Image Section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <CoverUpload
            currentUrl={coverUrl}
            onUploaded={(url) => setCoverUrl(url)}
          />
        </motion.section>

        {/* Avatar Section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center -mt-4"
        >
          <AvatarUpload
            currentUrl={avatarUrl}
            displayName={displayName}
            onUploaded={(url) => setAvatarUrl(url)}
          />
        </motion.section>

        {/* Basic Info */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 space-y-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Basic Info
            </h2>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label
              htmlFor="edit-display-name"
              className="text-sm font-medium text-text-secondary"
            >
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="edit-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                placeholder="Your display name"
                className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
              />
            </div>
          </div>

          {/* Username (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full rounded-lg border border-border bg-surface/50 py-3 pl-10 pr-4 text-sm text-text-muted cursor-not-allowed opacity-60"
              />
            </div>
            <p className="text-[11px] text-text-muted">
              Username cannot be changed
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-bio"
                className="text-sm font-medium text-text-secondary"
              >
                Bio
              </label>
              <span
                className={cn(
                  "text-xs",
                  bioChars > maxBioChars * 0.9
                    ? bioChars >= maxBioChars
                      ? "text-error"
                      : "text-warning"
                    : "text-text-muted"
                )}
              >
                {bioChars}/{maxBioChars}
              </span>
            </div>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
              <textarea
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, maxBioChars))}
                placeholder="Tell the world about yourself..."
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label
              htmlFor="edit-location"
              className="text-sm font-medium text-text-secondary"
            >
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="edit-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, 100))}
                placeholder="Where are you based?"
                className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label
              htmlFor="edit-website"
              className="text-sm font-medium text-text-secondary"
            >
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="edit-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-site.com"
                className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
              />
            </div>
          </div>
        </motion.section>

        {/* Skills & Interests */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 space-y-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Skills & Interests
            </h2>
          </div>

          <TagInput
            tags={skills}
            onChange={setSkills}
            label="Skills"
            placeholder="e.g. React, Design, Photography..."
            maxTags={10}
          />

          <TagInput
            tags={interests}
            onChange={setInterests}
            label="Interests"
            placeholder="e.g. Music, Travel, Cooking..."
            maxTags={10}
          />
        </motion.section>

        {/* Social Links */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6 space-y-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Social Links
            </h2>
          </div>

          {socialPlatforms.map((platform) => (
            <div key={platform.key} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                <platform.icon className="h-3.5 w-3.5" />
                {platform.label}
              </label>
              <input
                type="url"
                value={socialLinks[platform.key] || ""}
                onChange={(e) =>
                  updateSocialLink(platform.key, e.target.value)
                }
                placeholder={platform.placeholder}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
              />
            </div>
          ))}
        </motion.section>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-error-muted px-4 py-3 text-sm text-error"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 pb-4"
        >
          <Link
            href={`/profile/${profile.username}`}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm font-medium text-text-primary transition-all duration-200 hover:bg-surface-hover active:scale-[0.98]"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isPending || !displayName.trim()}
            className="group relative flex-1 overflow-hidden rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : showSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </span>
            {/* Hover shimmer */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
