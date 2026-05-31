"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { uploadAvatar } from "@/actions/profile-actions";
import { getInitials, cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentUrl: string | null;
  displayName: string;
  onUploaded: (url: string) => void;
}

export function AvatarUpload({
  currentUrl,
  displayName,
  onUploaded,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5MB");
        return;
      }

      setError(null);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.set("avatar", file);
        const result = await uploadAvatar(formData);

        if (result.error) {
          setError(result.error);
          setPreviewUrl(currentUrl);
        } else if (result.url) {
          onUploaded(result.url);
        }
      } catch {
        setError("Upload failed. Please try again.");
        setPreviewUrl(currentUrl);
      } finally {
        setIsUploading(false);
      }
    },
    [currentUrl, onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative cursor-pointer rounded-full transition-all duration-200",
          isDragging && "scale-105"
        )}
      >
        {/* Avatar circle */}
        <div
          className={cn(
            "relative h-28 w-28 overflow-hidden rounded-full ring-4 transition-all duration-200",
            isDragging
              ? "ring-accent/60 shadow-glow-strong"
              : "ring-border group-hover:ring-accent/40"
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-accent-muted text-2xl font-bold text-accent">
              {getInitials(displayName)}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        {/* Drag overlay indicator */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-dashed border-accent bg-accent/10"
            >
              <Upload className="h-6 w-6 text-accent" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit badge */}
        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-accent text-white shadow-lg transition-transform group-hover:scale-110">
          <Camera className="h-3.5 w-3.5" />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so the same file can be selected again
          e.target.value = "";
        }}
      />

      <p className="text-xs text-text-muted">
        Click or drag to upload • Max 5MB
      </p>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-error"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
