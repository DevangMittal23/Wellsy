"use client";

import { useState, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Send, Loader2 } from "lucide-react";
import { createPost } from "@/actions/post-actions";
import { useFeedStore } from "@/stores/feed-store";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

const MAX_CHARS = 2000;

export function PostCreate() {
  const { user } = useAuth();
  const { prependPost } = useFeedStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const charPercentage = (charCount / MAX_CHARS) * 100;

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 4) return;

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setMediaFiles((prev) => [...prev, ...files]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim() && mediaFiles.length === 0) return;

    const formData = new FormData();
    formData.set("content", content);
    formData.set("post_type", mediaFiles.length > 0 ? "image" : "text");

    startTransition(async () => {
      const result = await createPost(formData);
      if (result.post) {
        prependPost(result.post);
        setContent("");
        setMediaFiles([]);
        setMediaPreviews([]);
        setIsExpanded(false);
      }
    });
  };

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden mb-6"
    >
      <div className="p-5">
        {/* Collapsed state - click to expand */}
        <div className="flex gap-3">
          <div className="shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent ring-2 ring-border">
                {user ? getInitials(user.display_name) : "?"}
              </div>
            )}
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value.slice(0, MAX_CHARS));
                if (!isExpanded) setIsExpanded(true);
              }}
              onFocus={() => setIsExpanded(true)}
              placeholder="What's on your mind?"
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
                  {mediaPreviews.map((src, index) => (
                    <div
                      key={src}
                      className="relative overflow-hidden rounded-lg"
                    >
                      <img
                        src={src}
                        alt={`Upload preview ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                        aria-label="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions bar */}
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
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-accent"
                    aria-label="Add media"
                    type="button"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Character counter */}
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
                      {charCount > MAX_CHARS * 0.9 && (
                        <span
                          className={`text-xs font-medium ${
                            charCount >= MAX_CHARS
                              ? "text-error"
                              : "text-warning"
                          }`}
                        >
                          {MAX_CHARS - charCount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Post button */}
                  <button
                    onClick={handleSubmit}
                    disabled={
                      isPending ||
                      (!content.trim() && mediaFiles.length === 0)
                    }
                    className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
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
