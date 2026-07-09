"use client";

import { useState, useRef, useTransition } from "react";
import { ImagePlus, X, Send, Loader2 } from "lucide-react";
import { createStory } from "@/actions/stories";
import { useUpload } from "@/hooks/use-upload";
import { useUIStore } from "@/stores/ui-store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function StoryCreate() {
  const { user } = useAuth();
  const { closeModal } = useUIStore();
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { uploadFile, isUploading, progress } = useUpload();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file.");
      return;
    }

    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = () => {
    if (!mediaFile || !user) return;

    startTransition(async () => {
      try {
        const ext = mediaFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}_story.${ext}`;
        const isVideo = mediaFile.type.startsWith("video/");

        // Upload media file using storage bucket "post-media" for stories too
        const url = await uploadFile("post-media", fileName, mediaFile);

        if (!url) {
          throw new Error("Failed to upload media");
        }

        const res = await createStory({
          media_url: url,
          media_type: isVideo ? "video" : "image",
          caption: caption.trim() || null,
        });

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Story posted successfully! It will expire in 24 hours.");
          handleRemoveMedia();
          setCaption("");
          closeModal();
          // Reload page to reflect changes
          window.location.reload();
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to post story.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Create Story</h3>
        <button
          onClick={closeModal}
          className="rounded-full hover:bg-surface-hover p-1 text-text-secondary cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-accent hover:bg-surface/20 rounded-xl h-64 cursor-pointer transition-colors"
        >
          <ImagePlus className="h-10 w-10 text-text-muted mb-2" />
          <span className="text-sm font-semibold text-text-secondary">
            Select Photo or Video
          </span>
          <span className="text-xs text-text-muted mt-1">
            Max file size: 50MB
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleMediaSelect}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black h-64 flex items-center justify-center">
          {mediaFile?.type.startsWith("video/") ? (
            <video
              src={previewUrl}
              className="max-h-full max-w-full object-contain"
              controls
              muted
            />
          ) : (
            <img
              src={previewUrl}
              alt="Story Preview"
              className="max-h-full max-w-full object-contain"
            />
          )}
          <button
            onClick={handleRemoveMedia}
            className="absolute right-3 top-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isUploading && (
        <div className="bg-surface border border-border p-2.5 rounded-xl">
          <div className="flex justify-between items-center text-xs text-text-muted mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-accent h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
          Caption (Optional)
        </label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 200))}
          placeholder="Add a caption..."
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
        />
        <div className="text-[10px] text-text-muted text-right mt-1.5">
          {caption.length}/200
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button variant="secondary" onClick={closeModal} disabled={isPending || isUploading}>
          Cancel
        </Button>
        <Button
          variant="glow"
          onClick={handleSubmit}
          disabled={!mediaFile || isPending || isUploading}
        >
          {isPending || isUploading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              Posting...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Send className="h-4 w-4" />
              Post Story
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
