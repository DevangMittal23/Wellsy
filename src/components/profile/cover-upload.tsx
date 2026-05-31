"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, Upload, ImageIcon } from "lucide-react";
import { uploadCover } from "@/actions/profile-actions";
import { cn } from "@/lib/utils";

interface CoverUploadProps {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

export function CoverUpload({ currentUrl, onUploaded }: CoverUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Cover image must be under 10MB");
        return;
      }

      setError(null);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.set("cover", file);
        const result = await uploadCover(formData);

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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">
        Cover Image
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative h-36 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200",
          isDragging
            ? "border-accent bg-accent/5 scale-[1.01]"
            : "border-border hover:border-accent/50"
        )}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Cover preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, hsl(263 70% 30%), hsl(290 65% 25%), hsl(240 30% 15%))",
            }}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <>
              <Camera className="mb-1 h-6 w-6 text-white" />
              <span className="text-xs font-medium text-white/80">
                Change cover
              </span>
            </>
          )}
        </div>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-accent/20 backdrop-blur-sm"
            >
              <Upload className="mb-1 h-6 w-6 text-accent" />
              <span className="text-xs font-medium text-accent">
                Drop to upload
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-all group-hover:bg-accent/80 group-hover:text-white">
          <ImageIcon className="h-3 w-3" />
          {previewUrl ? "Change" : "Upload"}
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
          e.target.value = "";
        }}
      />

      <p className="text-[11px] text-text-muted">
        Recommended: 1500×500px • Max 10MB
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
