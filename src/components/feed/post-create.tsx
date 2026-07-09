"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Send, Loader2, Globe, Users, Lock } from "lucide-react";
import { createPost } from "@/actions/posts";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Post, PostVisibility } from "@/types";
import { toast } from "sonner";

const MAX_CHARS = 2000;

interface PostCreateProps {
  onPostCreated?: (post: Post) => void;
}

export function PostCreate({ onPostCreated }: PostCreateProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  
  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const { uploadFile, isUploading, progress } = useUpload();
  
  // Link preview state
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<any | null>(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;

  // Auto-detect link in content
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = content.match(urlRegex);
    
    if (match && match[0] !== linkUrl) {
      const url = match[0];
      setLinkUrl(url);
      fetchLinkPreview(url);
    } else if (!match && linkUrl) {
      setLinkUrl(null);
      setLinkPreview(null);
    }
  }, [content, linkUrl]);

  const fetchLinkPreview = async (url: string) => {
    setFetchingPreview(true);
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setLinkPreview(data);
      }
    } catch (err) {
      console.error("Link preview error:", err);
    } finally {
      setFetchingPreview(false);
    }
  };

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 4) {
      toast.error("You can upload a maximum of 4 files.");
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setMediaFiles((prev) => [...prev, ...files]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    if (!user) {
      toast.error("You must be logged in to create a post.");
      return;
    }

    startTransition(async () => {
      try {
        const mediaUrls: string[] = [];
        const mediaTypes: string[] = [];

        // Upload files with progress bar
        if (mediaFiles.length > 0) {
          for (const file of mediaFiles) {
            const ext = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
            const isVideo = file.type.startsWith("video/");
            
            const url = await uploadFile("post-media", fileName, file);
            if (url) {
              mediaUrls.push(url);
              mediaTypes.push(isVideo ? "video" : "image");
            } else {
              throw new Error("Media upload failed");
            }
          }
        }

        const result = await createPost({
          content,
          visibility,
          media_urls: mediaUrls,
          media_types: mediaTypes,
          link_url: linkUrl,
          link_preview: linkPreview,
        });

        if (result.error) {
          toast.error(result.error);
        } else if (result.post) {
          toast.success("Post created successfully!");
          setContent("");
          setMediaFiles([]);
          setMediaPreviews([]);
          setLinkUrl(null);
          setLinkPreview(null);
          setIsExpanded(false);
          if (onPostCreated) onPostCreated(result.post);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to create post.");
      }
    });
  };

  return (
    <motion.div layout className="glass-card overflow-hidden mb-6">
      <div className="p-5">
        <div className="flex gap-3">
          <UserAvatar
            src={user?.avatar_url}
            name={user?.display_name || "User"}
            size="sm"
            isOnline={true}
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value.slice(0, MAX_CHARS));
                if (!isExpanded) setIsExpanded(true);
              }}
              onFocus={() => setIsExpanded(true)}
              placeholder="What's happening? Let's trigger the huddang!"
              rows={isExpanded ? 3 : 1}
              className="w-full resize-none bg-transparent text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>

        {/* Expanded area */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Media previews */}
              {mediaPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {mediaPreviews.map((src, index) => {
                    const isVideo = mediaFiles[index]?.type.startsWith("video/");
                    return (
                      <div key={src} className="relative overflow-hidden rounded-lg bg-surface">
                        {isVideo ? (
                          <video src={src} className="h-32 w-full object-cover" muted />
                        ) : (
                          <img
                            src={src}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                        )}
                        <button
                          onClick={() => removeMedia(index)}
                          className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="mt-3 bg-surface border border-border p-2.5 rounded-xl">
                  <div className="flex justify-between items-center text-xs text-text-muted mb-1.5">
                    <span>Uploading media...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Link preview card */}
              {linkPreview && (
                <div className="mt-3 relative rounded-xl border border-border/80 bg-surface/30 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {linkPreview.image && (
                      <img
                        src={linkPreview.image}
                        alt="OG image"
                        className="h-32 sm:h-auto sm:w-32 object-cover"
                      />
                    )}
                    <div className="p-3 flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-bold uppercase text-accent">
                        {linkPreview.domain}
                      </span>
                      <h4 className="text-xs font-semibold mt-1 text-text-primary truncate">
                        {linkPreview.title}
                      </h4>
                      <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5 leading-relaxed">
                        {linkPreview.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLinkPreview(null);
                      setLinkUrl(null);
                    }}
                    className="absolute right-2 top-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {fetchingPreview && (
                <div className="mt-3 flex items-center gap-2 text-xs text-text-muted justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  <span>Fetching link preview...</span>
                </div>
              )}

              {/* Actions & Settings Bar */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleAddMedia}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-accent cursor-pointer"
                    aria-label="Add media"
                    type="button"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </button>

                  {/* Visibility selector */}
                  <div className="flex items-center ml-2 border border-border rounded-lg bg-surface/50 px-2.5 py-1">
                    {visibility === "public" && <Globe className="h-3.5 w-3.5 text-text-secondary mr-1.5" />}
                    {visibility === "friends" && <Users className="h-3.5 w-3.5 text-text-secondary mr-1.5" />}
                    {visibility === "private" && <Lock className="h-3.5 w-3.5 text-text-secondary mr-1.5" />}
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                      className="bg-transparent text-xs text-text-secondary outline-none cursor-pointer"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {charCount > 0 && (
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-border"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${(charPercentage / 100) * 50.27} 50.27`}
                          className={
                            charPercentage > 90
                              ? "text-error"
                              : charPercentage > 75
                              ? "text-warning"
                              : "text-accent"
                          }
                        />
                      </svg>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isPending || isUploading || (!content.trim() && mediaFiles.length === 0)}
                    className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPending || isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
