"use client";

import { X, FileText, Image } from "lucide-react";

interface MediaPreviewProps {
  file: File;
  onClear: () => void;
}

export function MediaPreview({ file, onClear }: MediaPreviewProps) {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  
  const previewUrl = (isImage || isVideo) ? URL.createObjectURL(file) : null;

  return (
    <div className="absolute bottom-full left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border px-4 py-2.5 flex items-center justify-between z-10">
      <div className="flex items-center gap-3 min-w-0">
        {previewUrl ? (
          isVideo ? (
            <video
              src={previewUrl}
              className="h-12 w-12 rounded object-cover bg-black"
              muted
            />
          ) : (
            <img
              src={previewUrl}
              alt="Attachment Preview"
              className="h-12 w-12 rounded object-cover"
            />
          )
        ) : (
          <div className="h-12 w-12 rounded bg-surface-hover flex items-center justify-center border border-border">
            <FileText className="h-5 w-5 text-text-muted" />
          </div>
        )}
        <div className="min-w-0 flex flex-col">
          <span className="text-xs font-semibold text-text-primary truncate">
            {file.name}
          </span>
          <span className="text-[10px] text-text-muted">
            {Math.round((file.size / 1024) * 10) / 10} KB
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          onClear();
        }}
        className="rounded-full bg-surface-hover/80 hover:bg-surface-hover p-1 text-text-secondary cursor-pointer"
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
