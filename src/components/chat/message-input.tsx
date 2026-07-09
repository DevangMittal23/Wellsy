"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { EmojiPicker } from "./emoji-picker";
import { GifPicker } from "./gif-picker";
import { VoiceRecorder } from "./voice-recorder";
import { MediaPreview } from "./media-preview";
import { useUpload } from "@/hooks/use-upload";
import { TYPING_DEBOUNCE_MS } from "@/lib/constants";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface MessageInputProps {
  onSendMessage: (data: {
    content?: string;
    type?: string;
    media_url?: string | null;
    media_metadata?: Record<string, unknown> | null;
    gif_url?: string | null;
  }) => Promise<any>;
  onTyping: (isTyping: boolean) => void;
  conversationId: string;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  conversationId,
}: MessageInputProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  
  const { uploadFile, isUploading, progress } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Broadcaster of typing indications on text change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, TYPING_DEBOUNCE_MS);
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedFile && !sending) return;
    if (!user) return;

    setSending(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType = "text";
      let metadata: any = null;

      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}_msg.${ext}`;
        const isImage = selectedFile.type.startsWith("image/");
        const isVideo = selectedFile.type.startsWith("video/");
        
        mediaType = isImage ? "image" : isVideo ? "video" : "file";
        metadata = {
          filename: selectedFile.name,
          size: selectedFile.size,
        };

        // Upload attachment using Private storage bucket "message-media"
        const uploadedUrl = await uploadFile("message-media", fileName, selectedFile);
        if (uploadedUrl) {
          mediaUrl = uploadedUrl;
        } else {
          throw new Error("Failed to upload attachment");
        }
      }

      const res = await onSendMessage({
        content: text.trim() || undefined,
        type: mediaType,
        media_url: mediaUrl,
        media_metadata: metadata,
      });

      if (res && res.error) {
        throw new Error(res.error);
      }

      setText("");
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    setSending(true);
    try {
      const res = await onSendMessage({
        type: "gif",
        gif_url: gifUrl,
      });
      if (res && res.error) {
        throw new Error(res.error);
      }
      toast.success("GIF sent");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send GIF");
    } finally {
      setSending(false);
    }
  };

  const handleSendVoiceNote = async (blob: Blob, duration: number) => {
    if (!user) return;
    setSending(true);
    try {
      const fileName = `${user.id}/${Date.now()}_voice.webm`;
      
      // Upload voice note using Private message-media bucket
      const uploadedUrl = await uploadFile("message-media", fileName, new File([blob], fileName, { type: blob.type || "audio/webm" }));
      if (uploadedUrl) {
        const res = await onSendMessage({
          type: "audio",
          media_url: uploadedUrl,
          media_metadata: { duration },
        });
        if (res && res.error) {
          throw new Error(res.error);
        }
        toast.success("Voice note sent");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send voice note");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="relative border-t border-border bg-background-secondary/80 backdrop-blur-md px-4 py-3 shrink-0">
      {/* File Previews */}
      {selectedFile && (
        <MediaPreview file={selectedFile} onClear={() => setSelectedFile(null)} />
      )}

      {/* Uploading progress bar */}
      {isUploading && (
        <div className="absolute bottom-full left-0 right-0 h-1 bg-border overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Attachment Pin */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-accent transition-colors cursor-pointer focus:outline-none"
          title="Attach file"
          disabled={sending || isUploading}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Emojis, GIFs & Audio shortcuts */}
        <EmojiPicker onSelect={(emoji) => setText((prev) => prev + emoji)} />
        <GifPicker onSelect={handleSendGif} />
        <VoiceRecorder onSend={handleSendVoiceNote} />

        {/* Text Input field */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyPress}
            disabled={sending || isUploading}
            className="w-full rounded-xl border border-border/50 bg-surface/50 py-2.5 px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-accent/60 focus:bg-surface focus:shadow-glow"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || isUploading || (!text.trim() && !selectedFile)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          {sending || isUploading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Send className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </div>
  );
}
